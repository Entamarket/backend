const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")
const email = require('../../lib/email')

const utilities = require("../../lib/utilities")


const logisticsAuth = {}

logisticsAuth.login = ('/login', async (req, res)=>{
    //extract payload
    let payload = JSON.parse(req.body)

    try{
        //check if data is valid
        if(utilities.adminLoginVlidator(payload, ["username", "password"]).isValid){
            //remove white spaces
            payload = utilities.trimmer(payload)

            //hash the password
            payload.password = utilities.dataHasher(payload.password)

            //Check if the username exists
            const logisticsObj = await database.findOne({username: payload.username}, database.collection.logistics)

            if(logisticsObj){
                //check if the password from the client matches the password from the database
                if(payload.password === logisticsObj.password){
                    //send response
                    const token = utilities.jwt('sign', {userID: logisticsObj._id, tokenFor: "logistics"})
                    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: token}, true )
                }
                else{
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "wrong username or password"}, true )
                    return
                }

            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "wrong username or password"}, true )
                return
            }

        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errorData: utilities.adminLoginVlidator(payload, ["username", "password"])}, true )
            return
        }

    }
    catch(err){
        console.log(err)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
        return
    }
})



logisticsAuth.updatePassword = ('/update-password', async (req, res)=>{
    //get the decoded token
    const decodedToken = req.decodedToken
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let payload = JSON.parse(req.body)
    
    try{
      //Check if the data sent is valid
      if(utilities.validator(payload, ['oldPassword', 'newPassword']).isValid){
    
        //remove all white spaces from user data if any
        payload = utilities.trimmer(payload)
    
        //get logistics object
        const logisticsObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.logistics)
    
        //hash the old and new password
        payload.oldPassword = utilities.dataHasher(payload.oldPassword)
        payload.newPassword = utilities.dataHasher(payload.newPassword)
    
        //check if old password in payload matches the password in the trader object
        if(payload.oldPassword === logisticsObj.password){
          //create new otp
          const newOtp = utilities.otpMaker()
    
          //delete a userID if it exist in the pendingUsersUpdates
          await database.deleteOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates)
    
          //insert the logistics in the pendingUsersUpdates collection
          await database.insertOne({userID: ObjectId(decodedToken.userID), createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'password', value: payload.newPassword}}, database.collection.pendingUsersUpdates)
    
          //send new otp to email
          await email.sendOtp('entamarketltd@gmail.com', logisticsObj.email, "OTP Verification", `hello ${logisticsObj.username}, please verify your email with this OTP:`, newOtp)
    
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


logisticsAuth.verifyUpdateOtp = ('verify-update-otp', async (req, res)=>{
    //get the decoded token
    const decodedToken = req.decodedToken
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let payload = JSON.parse(req.body)
    
    try{
      //check if payload is valid
      if(utilities.validator(payload, ['otp']).isValid){
        //extrract data from the pendingUsersUpdates collection
        userObj = await database.findOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates, ['otp', 'dataToUpdate'], 1)
     
        //check if payload otp matches the otp in the userObj collection
        if(payload.otp === userObj.otp){
          //update the data of the logistics
          await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.logistics, {[userObj.dataToUpdate.parameter]: userObj.dataToUpdate.value})
    
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

logisticsAuth.updateEmail = ('/update-email', async (req, res)=>{
    //get the decoded token
    const decodedToken = req.decodedToken
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let payload = JSON.parse(req.body)
    
    try{
      //Check if the data sent is valid
      if(utilities.validator(payload, ['email', 'password']).isValid){
    
        //remove all white spaces from user data if any
        payload = utilities.trimmer(payload)
    
        //hash the password
        payload.password = utilities.dataHasher(payload.password)
    
        //get logistics object
        const logisticsObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.logistics)
    
        //check if the payload password matches the password from the trader object
        if(payload.password === logisticsObj.password){
            
          //add create otp
          const newOtp = utilities.otpMaker()
    
          //delete a userID if it exist in the pendingUsersUpdates
          await database.deleteOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates)
    
          //add user to pendingUsersUpdates collection
          await database.insertOne({userID: ObjectId(decodedToken.userID), createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'email', value: payload.email}}, database.collection.pendingUsersUpdates)
            
          //send the new otp to the new email
          await email.sendOtp('entamarketltd@gmail.com', payload.email, "OTP Verification", `hello ${logisticsObj.username}, please verify your email with this OTP:`, newOtp)
    
          //send token
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )
    
    
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


logisticsAuth.updateUsername = ('/update-username', async (req, res)=>{
    //get the decoded token
    const decodedToken = req.decodedToken
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let payload = JSON.parse(req.body)
    
    try{
      //Check if the data sent is valid
      if(utilities.validator(payload, ['username', 'password']).isValid){
    
        //remove all white spaces from user data if any
        payload = utilities.trimmer(payload)
    
        //hash the password
        payload.password = utilities.dataHasher(payload.password)
    
        //get logistics object
        const logisticsObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.logistics)
    
        //check if the payload password matches the password from the trader object
        if(payload.password === logisticsObj.password){
            
          //add create otp
          const newOtp = utilities.otpMaker()
    
          //delete a userID if it exist in the pendingUsersUpdates
          await database.deleteOne({userID: ObjectId(decodedToken.userID)}, database.collection.pendingUsersUpdates)
    
          //add user to pendingUsersUpdates collection
          await database.insertOne({userID: ObjectId(decodedToken.userID), createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'username', value: payload.username}}, database.collection.pendingUsersUpdates)
            
          //send the new otp to the new email
          await email.sendOtp('entamarketltd@gmail.com', logisticsObj.email, "OTP Verification", `hello ${logisticsObj.username}, please verify your email with this OTP:`,  newOtp)
    
          //send token
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )
    
    
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


module.exports = logisticsAuth