const fs = require('fs')
const path = require('path')
const {ObjectId}  = require('mongodb')
const pdfGenerator = require("../../lib/pdf")

const utilities = require('../../lib/utilities')
const database = require('../../lib/database')
const email = require('../../lib/email')

const buyerControllerDashboard = {}

buyerControllerDashboard.home = ('/dashboard', async (req, res)=>{
  
  // extract decoded token
  const decodedToken = req.decodedToken
  //Get new token
  const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  
  try{
    //extract buyer object
    let buyerObj = await database.db.collection(database.collection.buyers).aggregate([
      {$match: {$and:[{_id: ObjectId(decodedToken.userID)}, {deleted : { $exists : false }}]}}, 
      {$lookup: {from: database.collection.shops, localField: "favouriteShops", foreignField: "_id", as: "favouriteShops"}},
      {$project: {password: 0}}
    ]).toArray()

    //{_id: ObjectId(decodedToken.userID)}
    buyerObj = buyerObj[0]
    if(buyerObj){
      buyerObj._id = buyerObj._id.toString()

      //send token and buyer data
      utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, buyerData: buyerObj, entamarketToken: newToken}, true )
    }
    else{
      //send token 
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
      return
    }
  
  }
  catch(err){
    console.log(err)
    //send token 
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
  
})


buyerControllerDashboard.updateProfile = ('/update-profile', async(req, res)=>{
    //get the decoded token
    const decodedToken = req.decodedToken
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let payload = JSON.parse(req.body)
    try{
      //Check if the data sent is valid
      if(utilities.buyerProfileUpdateValidator(payload, ['firstName', 'lastName', 'username', 'phoneNumber']).isValid){
  
        //remove all white spaces from user data if any
        payload = utilities.trimmer(payload)
  
        //get buyer object
        const buyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.buyers, ['firstName', 'lastName', 'username', 'phoneNumber'], 1)
  
        //check if email, username and phone number of the payload are the same with the buyer object, if they are the same, leave them like that but if they are different make sure that they are unique
        const errorArray = []
        if(payload.username !== buyerObj.username){
          // check if this username is unique
          const searchResult = await database.checkForExistingData(payload.username, 'username')
          if(searchResult.doesUserDetailExist) errorArray.push(searchResult)
        }
  
        if(errorArray.length < 1 && payload.phoneNumber !== buyerObj.phoneNumber){
          // check if this phone number is unique
          const searchResult = await database.checkForExistingData(payload.phoneNumber, 'phoneNumber')
          if(searchResult.doesUserDetailExist) errorArray.push(searchResult)
        }
        
        if(errorArray.length < 1){
          //update the buyer profile
          await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.buyers, payload)
          //update user profile
          let userPayload = payload
          delete userPayload.phoneNumber
          await database.updateOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users, userPayload)
  
          //send token
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )
  
        }
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This ${errorArray[0].userDetail} already exists`, entamarketToken: newToken}, true )
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

buyerControllerDashboard.updateEmail = ('/update-email', async (req, res)=>{
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
  
      //get buyer object
      const buyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.buyers, ['firstName', 'lastName', 'password'], 1)
  
      //check if the payload password matches the password from the buyer object
      if(payload.password === buyerObj.password){
  
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
          await email.subSend('entamarketltd@gmail.com', payload.email, `hello ${buyerObj.firstName} ${buyerObj.lastName}, please verify your email with this OTP: ${newOtp}`, "OTP Verification", decodedToken.userID)
  
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


buyerControllerDashboard.updatePassword = ('/update-password', async (req, res)=>{
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
      const buyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.buyers, ['password', 'email', 'firstName', 'lastName'], 1)

      //hash the old and new password
      payload.oldPassword = utilities.dataHasher(payload.oldPassword)
      payload.newPassword = utilities.dataHasher(payload.newPassword)

      //check if old password in payload matches the password in the buyer object
      if(payload.oldPassword === buyerObj.password){
        //create new otp
        const newOtp = utilities.otpMaker()

        //delete a userID if it exist in the pendingUsersUpdates
        await database.deleteOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates)

        //insert the buyer in the pendingUsersUpdates collection
        await database.insertOne({userID: ObjectId(decodedToken.userID), createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'password', value: payload.newPassword}}, database.collection.pendingUsersUpdates)

        //sent new otp to email
        await email.subSend('entamarketltd@gmail.com', buyerObj.email, `hello ${buyerObj.firstName} ${buyerObj.lastName}, please verify your email with this OTP: ${newOtp}`, "OTP Verification", decodedToken.userID)

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


buyerControllerDashboard.verifyUpdateOtp = ('verify-update-otp', async (req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken
  //create token 
  const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  let payload = JSON.parse(req.body)

  try{
    //check if payload is valid
    if(utilities.validator(payload, ['otp']).isValid){
      //extract data from the pendingUsersUpdates collection
      const userObj = await database.findOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates, ['otp', 'dataToUpdate'], 1)
 
      //check if payload otp matches the otp in the userObj collection
      if(payload.otp === userObj.otp){
        //update the data of the buyer
        await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.buyers, {[userObj.dataToUpdate.parameter]: userObj.dataToUpdate.value})

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



buyerControllerDashboard.getPurchaseHistory = ('get-purchase-history', async (req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken

  try{
    let set = parseInt(req.query.set)
  
    const limit = 20
    //GET THE USER HISTORY
    const purchaseHistory = await database.db.collection(database.collection.boughtProducts).find({"buyer.id": ObjectId(decodedToken.userID)}).skip(set * limit).limit(limit).sort({_id: -1}).toArray()

    //SEND RESPONSE
    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, purchaseHistoryData: purchaseHistory}, true )
   
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
})



buyerControllerDashboard.getReceipt = ('get-receipt', async (req, res)=>{
  
  try{
    //get the decoded token
    const decodedToken = req.decodedToken
    const purchaseId = req.query.id
    
    //CHECK IF USER OWNS THIS PURCHSE
    const purchase = await database.findOne({_id: ObjectId(purchaseId)}, database.collection.boughtProducts)
    
    if(decodedToken.userID == purchase.buyer.id.toString()){

      const receiptData = {checkoutID: purchase.checkoutID,  buyerName: `${purchase.buyer.firstName} ${purchase.buyer.lastName}`, products: []}
    
      for(let prod of purchase.products){
        const productData = {}
        productData.productName = prod.product.lastName
        productData.productPrice = prod.product.price
        productData.quantity = prod.quantity
        productData.totalproductPrice = prod.totalProductPrice
        productData.shop = prod.shop
        productData.trader = prod.trader

        receiptData.products.push(productData)
      }

      receiptData.totalProductsPrice = purchase.totalProductsPrice
      receiptData.logisticsFee = purchase.logisticsFee
      receiptData.paymentGatewayFee = purchase.paymentGatewayFee
      receiptData.total = purchase.total
      receiptData.date = purchase.date

      
      const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment;filename=invoice.pdf`,
      });

      pdfGenerator((chunk)=> stream.write(chunk) , ()=> stream.end(),  receiptData)
     
      return


    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This purchase does not belong to user'}, true )
      return
    }
    
    
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
})



buyerControllerDashboard.deleteAccount = ('/delete-account', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //delete buyer multimedia folder
    //const dir = [__dirname, '..', '..', 'multimedia', 'buyers', decodedToken.userID.toString()].join(path.sep)
   // await fs.promises.rmdir(dir, {recursive: true})

    //delete all notifications to trader
    await database.deleteMany({$or: [{to: ObjectId(decodedToken.userID)}, {from: ObjectId(decodedToken.userID)}]}, database.collection.notifications)
    //delete buyer cart
    //await database.deleteOne({owner: ObjectId(decodedToken.userID)}, database.collection.carts)
    //delete all comments
    await database.deleteMany({owner: ObjectId(decodedToken.userID)}, database.collection.comments)
    //delete all reactions
    await database.deleteMany({owner: ObjectId(decodedToken.userID)}, database.collection.reactions)
    //delete account from users collection
    await database.updateOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users, {deleted: true})
    //delete account from email list
    await database.deleteOne({owner: ObjectId(decodedToken.userID)}, database.collection.emailList)
    //delete account from buyers collection
    await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.buyers, {deleted: true})
   

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

module.exports = buyerControllerDashboard