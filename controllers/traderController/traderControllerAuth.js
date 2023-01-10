const fs = require('fs')
const path = require('path')
const {ObjectId}  = require('mongodb')
const utilities = require('../../lib/utilities')
const database = require('../../lib/database')
const Trader = require('../../models/trader')
const User = require("../../models/user")
const email = require('../../lib/email')
const Cart = require("../../models/cart")


const traderControllerAuth = {}

traderControllerAuth.signup = ('/signup', async (req, res)=>{
  try{
    
    //parse incoming data
    let payload = JSON.parse(req.body)
    
    //check if payload data is Valid
    if(utilities.validator(payload, ['firstName', 'lastName', 'email', 'username', 'phoneNumber', 'password']).isValid){
      //remove all white spaces from user data if any
      payload = utilities.trimmer(payload)

      //hash the password
      payload.password = utilities.dataHasher(payload.password)

      //check if username, email or phone number exists in database
      
      const existingUser = await database.checkForExistingUser(payload)

      if(existingUser.constructor.name == 'Object' && !existingUser.doesUserDetailExist){

        //store trimmed data in database(pendingTraders collection)
        const pendingTrader = new Trader(payload, true)

        const savedPendingTraderObj = await pendingTrader.save()

        //send an email to the trader for verification of phone number
        await email.send('entamarketltd@gmail.com', payload.email, `hello ${payload.firstName} ${payload.lastName}, please verify your email with this OTP: ${payload.otp}`, payload.firstName)

        //Send JWT
        //fetch the user ID from the database
        const token = utilities.jwt('sign', {userID: savedPendingTraderObj.insertedId.toString(), tokenFor: "pendingTrader"})

        //send token to client
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: token}, true)
      
      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this ${existingUser.userDetail} already exists`}, true)
        return
      }
       
    }
    else{
      const errorObj = utilities.validator(payload, ['firstName', 'lastName', 'email', 'username', 'phoneNumber', 'password'])
      errorObj.statusCode = 400
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, errorObj, true)
      return
    }

  }
  catch(err){
    console.log(err)    
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    return
  }   
})

traderControllerAuth.verifyOtp = ('/signup/account-verification', async (req, res)=>{
  // Extract decoded token
  const decodedToken = req.decodedToken
  
  try{ 
    // extract pendingTrader Object
    const pendingTraderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.pendingTraders)
    
    //parse the data
    const payload = JSON.parse(req.body)

    //check if OTP is in valid format
    if(utilities.validator(payload, ["otp"]).isValid){
      //check if the OTP from the database matches the OTP from the client
      if(pendingTraderObj.otp == payload.otp){
        // transfer transfer pending trader from the pendingTrader collection to trader collection
        const {_id, createdAt, otp, ...rest} = pendingTraderObj
        const trader = new Trader(rest, false)
        const savedTrader = await trader.save()

        //add part of trader data to user collection
        await new User({firstName: rest.firstName, lastName: rest.lastName, username: rest.username, phoneNumber: rest.phoneNumber, email: rest.email, accountType: "trader", primaryID: savedTrader.insertedId}).save()

        //delete the data in pendingTraders collection
        await database.deleteOne({_id: pendingTraderObj._id}, database.collection.pendingTraders)

        //Create folder in multimedia
        const dir = [__dirname, '..', '..', 'multimedia', 'traders', savedTrader.insertedId].join(path.sep) 
        fs.mkdirSync(dir)

        //create cart
        const cart = new Cart({owner: savedTrader.insertedId})
        await cart.save()

        //send a new token
        const newToken = utilities.jwt('sign', {userID: savedTrader.insertedId, tokenFor: "trader"})
            
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode:200, entamarketToken: newToken}, true )
  
      }
      else{
        //create token 
        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This OTP doesn't match the user`, entamarketToken: newToken}, true )
        return
      }
    }
    else{
      //create token 
      const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `OTP should be a string`, entamarketToken: newToken}, true )
      return
    }     
  }
  catch(err){
    console.log(err)
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
  
})

traderControllerAuth.resendOtp = ('/signup/resend-otp', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //extract pending trader object
    const pendingTraderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.pendingTraders, ["_id", "firstName", "lastName", "email"], 1)
    
    //Generate new OTP for trader
    const newOtp = utilities.otpMaker()

    //update the OTP in database by replacing it with the new OTP
    await database.updateOne({_id: pendingTraderObj._id}, database.collection.pendingTraders, {otp: newOtp})
      
    //send new OTP to email
    await email.send('entamarketltd@gmail.com', pendingTraderObj.email, `hello ${pendingTraderObj.firstName} ${pendingTraderObj.lastName}, please verify your email with this OTP: ${newOtp}`, pendingTraderObj.firstName)

    pendingTraderObj._id = pendingTraderObj._id.toString()

    //Get new token and send
    const newToken =  utilities.jwt('sign', {userID: pendingTraderObj._id, tokenFor: "pendingTrader"})

    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )

  }
  catch(err){
    console.log(err)
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
})



traderControllerAuth.login = ('/login', async (req, res)=>{
  try{
    
    //Extract data
    const traderLoginData = JSON.parse(req.body)

    //check if data is valid
    if(utilities.validator(traderLoginData, ['id', 'password']).isValid){

      //remove white spaces from the data
      const trimmedLoginData = utilities.trimmer(traderLoginData)

      //hash the password
      trimmedLoginData.password = utilities.dataHasher(trimmedLoginData.password)

      //Check if the ID exists in the database
      const traderObj = await database.findOne({$or: [{email: trimmedLoginData.id}, {phoneNumber: trimmedLoginData.id}]}, database.collection.traders, ['_id', 'password'], 1)

      if(traderObj){
        traderObj._id = traderObj._id.toString()
        //check if the password from the client matches the password from the database
        if(trimmedLoginData.password === traderObj.password){
          //create a token and send
          const token = utilities.jwt('sign', {userID: traderObj._id, tokenFor: "trader"})
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: token}, true )
        }
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid user ID or password'}, true )
          return
        }
      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid user ID or password'}, true )
        return
      }
    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid user ID or password'}, true )
      return
    } 
    
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
})

traderControllerAuth.getNewPassword = ('/get-new-password', async(req, res)=>{
  let payload = JSON.parse(req.body)
  try{
    //check if data is valid
    if(utilities.validator(payload, ['email', 'newPassword']).isValid){
      //remove all white spaces from user data if any
      payload = utilities.trimmer(payload)
      //hash pasword
      payload.newPassword = utilities.dataHasher(payload.newPassword)

      //get trader object with email
      const traderObj = await database.findOne({email: payload.email}, database.collection.traders, ['_id', 'firstName', 'lastName'], 1)
      if(traderObj){
        //create new otp
        const newOtp = utilities.otpMaker()

        //delete a userID if it exist in the pendingUsersUpdates
        await database.deleteOne({userID: traderObj._id}, database.collection.pendingUsersUpdates)

        //insert trader in the pendingUsersUpdates collection
        await database.insertOne({userID: traderObj._id, createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'password', value: payload.newPassword}}, database.collection.pendingUsersUpdates)

        //send otp to trader email
        await email.send('entamarketltd@gmail.com', payload.email, `hello ${traderObj.firstName} ${traderObj.lastName}, please verify your email with this OTP: ${newOtp}`, traderObj.firstName)

        //create a token and send
        const token = utilities.jwt('sign', {userID: traderObj._id, tokenFor: "trader"})
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: token}, true )
      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This email does not exist in database'}, true )
        return
      }

    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data, make sure email is valid and password is at least 8 characters'}, true )
      return
    }
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
})

traderControllerAuth.deletePendingTraderAccount = ('/pending-trader/delete', async(req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //delete pending trader
    await database.deleteOne({_id: ObjectId(decodedToken.userID)}, database.collection.pendingTraders)

    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: 'Success'}, true )

  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
})

module.exports = traderControllerAuth