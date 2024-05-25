//const fs = require('fs')
//const path = require('path')
const {ObjectId}  = require('mongodb')

const utilities = require('../../lib/utilities')
const database = require('../../lib/database')
const email = require('../../lib/email')
const PendingWithdrawal = require("../../models/pendingWithdrawal")
const notification = require("../notificationController/notificationController")

const traderControllerDashboard = {}

traderControllerDashboard.home = ('/dashboard', async (req, res)=>{
  
  // extract decoded token
  const decodedToken = req.decodedToken
  
  try{
    //extract trader object
    let traderObj = await database.db.collection(database.collection.traders).aggregate([
      {$match: {$and:[{_id: ObjectId(decodedToken.userID)}, {deleted : { $exists : false }}]}}, 
      {$lookup: {from: database.collection.shops, localField: "shops", foreignField: "_id", as: "shops"}},
      {$project: {password: 0}}
    ]).toArray()

    traderObj = traderObj[0]
    if(traderObj){
      //traderObj._id = traderObj._id.toString()
      traderObj.accountBalance = traderObj.accountBalance.toString()

      //get notifications
      const notifications = await notification.get(traderObj._id)

      //CHECK IF TRADE HAS VERIFIED DOCS
      const verificationDocs = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.traderVerificationDocs)
    
      if(verificationDocs){
        traderObj.confirmedTrader = verificationDocs.verified
      }
      else{
        traderObj.confirmedTrader = null
      }

      traderObj.notifications = notifications
  
      //Get new token and send
      const newToken =  utilities.jwt('sign', {userID: traderObj._id.toString(), tokenFor: "trader"})
      utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, traderData: traderObj, entamarketToken: newToken}, true )
    }
    else{
      //create token 
      const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
      return
    }
  
  }
  catch(err){
    console.log(err)
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
  
})

traderControllerDashboard.updateProfile = ('/update-profile', async(req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken
  //create token 
  const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  let payload = JSON.parse(req.body)
  try{
    //Check if the data sent is valid
    if(utilities.traderProfileUpdateValidator(payload, ['firstName', 'lastName', 'username', 'phoneNumber', "bankDetails"]).isValid){

      //remove all white spaces from user data if any
      if(payload.bankDetails){
        let bankDetails = payload.bankDetails
        delete payload.bankDetails
        payload = utilities.trimmer(payload)
        bankDetails = utilities.trimmer(bankDetails)
        payload.bankDetails = bankDetails
      }
      else{payload = utilities.trimmer(payload)}
      
      //get trader object
      const traderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, ['firstName', 'lastName', 'username', 'phoneNumber'], 1)

      //check if email, username and phone number of the payload are the same with the trader object, if they are the same, leave them like that but if they are different make sure that they are unique
      const errorArray = []
      
      if(errorArray.length < 1 && payload.phoneNumber !== traderObj.phoneNumber){
        // check if this phone number is unique
        const searchResult = await database.checkForExistingData(payload.phoneNumber, 'phoneNumber')
        if(searchResult.doesUserDetailExist) errorArray.push(searchResult)
      }

      if(errorArray.length < 1 && payload.username !== traderObj.username){
        // check if this username is unique
        const searchResult = await database.checkForExistingData(payload.username, 'username')
        if(!(searchResult.doesUserDetailExist)){
          //update the username of all shops owned by this trader
          await database.db.collection(database.collection.shops).updateMany(
            {owner: ObjectId(decodedToken.userID)},
            [
              {
                $set: {
                  username: {
                    $replaceOne: {
                      input: "$username", find: traderObj.username, replacement: payload.username
                    }
                  }
                }
              }
            ]
          )

        } 
        else{
          errorArray.push(searchResult)
        }
      }

      
      if(errorArray.length < 1){
        //update the trader profile
        await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, payload)
        //update user profile
        let userPayload = payload
        if(userPayload.bankDetails && Object.keys(userPayload).length > 1){
          delete userPayload.bankDetails
          await database.updateOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users, userPayload)
        }
        
        if(!userPayload.bankDetails && Object.keys(userPayload).length >1){
          await database.updateOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users, userPayload)

        }


        //send token
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )

      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This ${errorArray[0].userDetail} already exists`, entamarketToken: newToken}, true )
        return
      }
    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errorObj: utilities.traderProfileUpdateValidator(payload, ['firstName', 'lastName', 'username', 'phoneNumber', "bankDetails"]), entamarketToken: newToken}, true )
      return
    }

  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
})

traderControllerDashboard.updateEmail = ('/update-email', async (req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken
  //create token 
  const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  let payload = JSON.parse(req.body)

  try{
    
    //check if email is in emailList
    const emailDoc = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.emailList)
    if(!emailDoc){
      utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: `You need to subscribe to our email services to recieve OTP`, entamarketToken: newToken}, true )
      return 
    }

    //Check if the data sent is valid
    if(utilities.validator(payload, ['email', 'password']).isValid){

      //remove all white spaces from user data if any
      payload = utilities.trimmer(payload)

      //hash the password
      payload.password = utilities.dataHasher(payload.password)

      //get trader object
      const traderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, ['firstName', 'lastName', 'password'], 1)

      //check if the payload password matches the password from the trader object
      if(payload.password === traderObj.password){

        //check if email is unique
        const searchResult = await database.checkForExistingData(payload.email, 'email')
        if(!(searchResult.doesUserDetailExist)){
          //add create otp
          const newOtp = utilities.otpMaker()

          //delete a userID if it exist in the pendingUsersUpdates
          await database.deleteOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates)

          //add user to pendingUsersUpdates collection
          await database.insertOne({userID: ObjectId(decodedToken.userID), createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'email', value: payload.email}}, database.collection.pendingUsersUpdates)
        
          //send the new otp to the new email
          await email.subSend('entamarketltd@gmail.com', payload.email, `hello ${traderObj.firstName} ${traderObj.lastName}, please verify your email with this OTP: ${newOtp}`, "OTP Verification", decodedToken.userID)

          //send token
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )

        } 
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This email already exists`, entamarketToken: newToken}, true )
          return
        }

      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid password`, entamarketToken: newToken}, true )
        return
      }

    

    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid data`, entamarketToken: newToken}, true )
      return
    }

  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }

})

traderControllerDashboard.verifyUpdateOtp = ('verify-update-otp', async (req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken
  //create token 
  const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  let payload = JSON.parse(req.body)

  try{
    //check if payload is valid
    if(utilities.validator(payload, ['otp']).isValid){
      //extrract data from the pendingUsersUpdates collection
      const userObj = await database.findOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates, ['otp', 'dataToUpdate'], 1)
      if(userObj){
        //check if payload otp matches the otp in the userObj collection
        if(payload.otp === userObj.otp){
          //update the data of the trader
          await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, {[userObj.dataToUpdate.parameter]: userObj.dataToUpdate.value})
          //update user data
          if(userObj.dataToUpdate.parameter === "phoneNumber" || userObj.dataToUpdate.parameter === "email"){
            await database.updateOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users, {[userObj.dataToUpdate.parameter]: userObj.dataToUpdate.value}) 
          }

          //delete user from pendingUsersUpdates collection
          await database.deleteOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates)

          //send token
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )
        }
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This otp doesn't match the user`, entamarketToken: newToken}, true )
          return
        }

      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `user update record not available`, entamarketToken: newToken}, true )
        return
      }
      

    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid data`, entamarketToken: newToken}, true )
      return
    }
   
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }


})

traderControllerDashboard.updatePassword = ('/update-password', async (req, res)=>{

  //get the decoded token
  const decodedToken = req.decodedToken
  //create token 
  const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  let payload = JSON.parse(req.body)

  
  try{
    //check if email is in emailList
    const emailDoc = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.emailList)
    if(!emailDoc){
      utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: `You need to subscribe to our email services to recieve OTP`, entamarketToken: newToken}, true )
      return 
    }

    //Check if the data sent is valid
    if(utilities.validator(payload, ['oldPassword', 'newPassword']).isValid){

      //remove all white spaces from user data if any
      payload = utilities.trimmer(payload)

      //get trader object
      const traderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, ['password', 'email', 'firstName', 'lastName'], 1)

      //hash the old and new password
      payload.oldPassword = utilities.dataHasher(payload.oldPassword)
      payload.newPassword = utilities.dataHasher(payload.newPassword)

      //check if old password in payload matches the password in the trader object
      if(payload.oldPassword === traderObj.password){
        //create new otp
        const newOtp = utilities.otpMaker()

        //delete a userID if it exist in the pendingUsersUpdates
        await database.deleteOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates)

        //insert the trader in the pendingUsersUpdates collection
        await database.insertOne({userID: ObjectId(decodedToken.userID), createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'password', value: payload.newPassword}}, database.collection.pendingUsersUpdates)

        //sent new otp to email
        await email.subSend('entamarketltd@gmail.com', traderObj.email, `hello ${traderObj.firstName} ${traderObj.lastName}, please verify your email with this OTP: ${newOtp}`, "OTP Verification", decodedToken.userID)

        //send token
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )

      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Old password doesn't match the password of this trader`, entamarketToken: newToken}, true )
        return
      }

    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid data, make sure password is 8 characters long`, entamarketToken: newToken}, true )
      return
    }

  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }

})

traderControllerDashboard.getSalesHistory = ('get-sales-history', async (req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken

  try{
    let set = parseInt(req.query.set)
  
    const limit = 20
    //GET THE SALES HISTORY
    const salesHistory = await database.db.collection(database.collection.soldProducts).find({trader: ObjectId(decodedToken.userID)}).skip(set * limit).limit(limit).sort({_id: -1}).toArray()

    //SEND RESPONSE
    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, salesHistoryData: salesHistory}, true )
   
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
})


traderControllerDashboard.uploadVerificationDocs = ('upload-verification-docs', async (req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken

  try{
    //Create document for verification data
    const verificationData ={owner: ObjectId(decodedToken.userID), idCard: `https://www.entamarket-api.com/`+ req.files.idCard[0].path, utilityBill: `https://www.entamarket-api.com/` + req.files.utilityBill[0].path, verified: false}
    const traderData = await database.findOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users)
    verificationData.traderData = traderData
  
    await database.insertOne(verificationData, database.collection.traderVerificationDocs)

    //SEND RESPONSE
    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "success"}, true )
   
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
})



traderControllerDashboard.deleteAccount = ('/delete-account', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //delete all shops owned by the trader
    await database.updateMany({owner: ObjectId(decodedToken.userID)}, database.collection.shops, {deleted: true})

    //delete all products owned by the trader
    await database.updateMany({owner: ObjectId(decodedToken.userID)}, database.collection.products, {deleted: true})
    //delete trader multimedia folder
    //const dir = [__dirname, '..', '..', 'multimedia', 'traders', decodedToken.userID.toString()].join(path.sep)
    //await fs.promises.rmdir(dir, {recursive: true})
    
    //delete all notifications to trader
    await database.deleteMany({$or: [{to: ObjectId(decodedToken.userID)}, {from: ObjectId(decodedToken.userID)}]}, database.collection.notifications)
    //delete trader cart
    //await database.deleteOne({owner: ObjectId(decodedToken.userID)}, database.collection.carts)
    //delete all comments
    await database.deleteMany({owner: ObjectId(decodedToken.userID)}, database.collection.comments)
    //delete all reactions
    await database.deleteMany({owner: ObjectId(decodedToken.userID)}, database.collection.reactions)
    //delete the account from users collection
    await database.updateOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users, {deleted: true})
    //delete account from mail list
    await database.deleteOne({owner: ObjectId(decodedToken.userID)}, database.collection.emailList)
    //delete the account from traders collection
    await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, {deleted: true})

    //response
    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "sucess"}, true)

  }
  catch(err){
    console.log(err) 
    //create newToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})   
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
    return
  }
})

traderControllerDashboard.requestWithdrawal = ('/request-withdrawal', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //get trader object
    const traderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, ["bankDetails"], 1)

    //check if bank details exist
    if(traderObj.bankDetails){
      //send bank details for confirmation
      utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, bankDetails: traderObj.bankDetails}, true)
      return

    }
    else{
      utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "trader has no bank details"}, true)
      return
    }
  }
  catch(err){
    console.log(err)    
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    return
  }
})


traderControllerDashboard.confirmBankDetails = ('/confirm-bank-details', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  const payload = JSON.parse(req.body)
  
  try{
    //validate payload
    if(utilities.confirmBankDetailsValidator(payload, ["amount"]).isValid){
      //get trader object
      const traderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, ["bankDetails", "accountBalance", "firstName", "lastName", "phoneNumber", "email"], 1)

      //check if bank details exist
      if(traderObj.bankDetails){
        //check if account balance is less than or equal to amount to withdraw
        if(traderObj.accountBalance > 0 && traderObj.accountBalance >= payload.amount){
          //check if the user has a pending withdrawal and if the ammount in the pending withdrawal is more than his account balance
          const pendingWithdrawals = await database.db.collection(database.collection.pendingWithdrawals).find({"trader._id": ObjectId(decodedToken.userID)}).toArray()
           
          if(pendingWithdrawals.length > 0){
            let totalPendingWithdrawalAmount = 0
            for(let i of pendingWithdrawals){
              totalPendingWithdrawalAmount += i.amount
            }
            const availableBalance = traderObj.accountBalance - totalPendingWithdrawalAmount

            if(availableBalance < payload.amount){
              utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "insufficient available balance"}, true)
              return
            }
          }

          // create admin notification Object
          const notificationObj ={
            amount: payload.amount,
            bankDetails: traderObj.bankDetails
          }
          //send notification to admin
          await notification.sendToAdmin("withdrawal", notificationObj, ObjectId(decodedToken.userID), "admin")

          //send data to pending withdrawal collection
          const trader = {...traderObj}
          //delete trader.bankDetails
          delete notificationObj.bankDetails
          const pendingWithdrawalObj = {...notificationObj, trader: trader}
          delete pendingWithdrawalObj.from
          delete pendingWithdrawalObj.to
          delete pendingWithdrawalObj.read
          delete pendingWithdrawalObj.type
          await new PendingWithdrawal(pendingWithdrawalObj).save()

          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "withdrawal request sent, you will recieve your money within 12 hours"}, true)
          return
        }
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "insufficient balance"}, true)
          return
        }
        
      }
      else{
        utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "trader has no bank details"}, true)
        return
      }

    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errorObj: utilities.confirmBankDetailsValidator(payload, ["amount"])}, true)
      return
    }
    
  }
  catch(err){
    console.log(err)    
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    return
  }
})

module.exports = traderControllerDashboard