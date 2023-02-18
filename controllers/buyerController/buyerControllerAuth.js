const fs = require('fs')
const path = require('path')
const {ObjectId}  = require('mongodb')
const utilities = require('../../lib/utilities')
const database = require('../../lib/database')
const EmailDoc = require("../../models/emailDoc")
const Buyer = require('../../models/buyer')
const User = require("../../models/user")
const email = require('../../lib/email')
//const Cart = require('../../models/cart')


const buyerControllerAuth = {}

buyerControllerAuth.signup = ('/signup', async (req, res)=>{
  try{
    
    //parse incoming data
    let payload = JSON.parse(req.body)
    
    //check if parsed data is Valid
    if(utilities.validator(payload, ['firstName', 'lastName', 'email', 'username', 'phoneNumber', 'password']).isValid){
      //remove all white spaces from user data if any
      payload = utilities.trimmer(payload)

      //hash the password
      payload.password = utilities.dataHasher(payload.password)

      //Check if the user email phone number and password already exists in the pending buyers collection
      const overwritePendingBuyer = await database.db.collection(database.collection.pendingBuyers).findOne({$and: [
        {email: payload.email}, {phoneNumber: payload.phoneNumber}, {password: payload.password}
      ]})

      if(overwritePendingBuyer){
        await database.deleteOne({_id: overwritePendingBuyer._id}, database.collection.pendingBuyers)
      }

      //check if username, email or phone number exists in database
      const existingUser = await database.checkForExistingUser(payload)

      if(existingUser.constructor.name == 'Object' && !existingUser.doesUserDetailExist){

        //store payload in database(pendingTraders collection)
        const pendingBuyer = new Buyer(payload, true)
        const savedPendingBuyerObj = await pendingBuyer.save()

        //send an email to the trader for verification of phone number
        await email.sendOtp('entamarketltd@gmail.com', payload.email, "OTP Verification", `hello ${payload.firstName} ${payload.lastName}, please verify your email with this OTP:`, payload.otp)

        //Send JWT
        const token = utilities.jwt('sign', {userID: savedPendingBuyerObj.insertedId.toString(), tokenFor: "pendingBuyer"})

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


buyerControllerAuth.verifyOtp = ('/signup/account-verification', async (req, res)=>{
  // Extract decoded token
  const decodedToken = req.decodedToken
  
  try{ 
    // extract pendingBuyer Object
    const pendingBuyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.pendingBuyers)
    
    //parse the data
    const payload = JSON.parse(req.body)

    //check if OTP is in valid format
    if(utilities.validator(payload, ["otp"]).isValid){
      //check if the OTP from the database matches the OTP from the client
      if(pendingBuyerObj.otp == payload.otp){
        // transfer pending buyer from the pendingBuyers collection to buyers collection
        const {_id, createdAt, otp, ...rest} = pendingBuyerObj
        const buyer = new Buyer(rest, false)
        const savedBuyer = await buyer.save()

        //add part of buyers data to user collection
        await new User({firstName: rest.firstName, lastName: rest.lastName, username: rest.username, phoneNumber: rest.phoneNumber, email: rest.email, accountType: "buyer", primaryID: savedBuyer.insertedId}).save()

        //add trader to email list
        await new EmailDoc({owner: savedBuyer.insertedId}).save()

        //delete the data in pendingBuyers collection
        await database.deleteOne({_id: pendingBuyerObj._id}, database.collection.pendingBuyers)

        //Create folder in multimedia
        const dir = [__dirname, '..', '..', 'multimedia', 'buyers', savedBuyer.insertedId].join(path.sep)
        fs.mkdirSync(dir)

        //create cart
        //const cart = new Cart({owner: savedBuyer.insertedId})
        //await cart.save() 

        //send a new token
        const newToken = utilities.jwt('sign', {userID: savedBuyer.insertedId, tokenFor: "buyer"})
            
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

buyerControllerAuth.resendOtp = ('/signup/resend-otp', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //extract pending trader object
    const pendingBuyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.pendingBuyers, ["_id", "firstName", "lastName", "email"], 1)
    
    //Generate new OTP for trader
    const newOtp = utilities.otpMaker()

    //update the OTP in database by replacing it with the new OTP
    await database.updateOne({_id: pendingBuyerObj._id}, database.collection.pendingBuyers, {otp: newOtp})
      
    //send new OTP to email
    await email.sendOtp('entamarketltd@gmail.com', pendingBuyerObj.email, "OTP Verification", `hello ${pendingBuyerObj.firstName} ${pendingBuyerObj.lastName}, please verify your email with this OTP:`, newOtp)

    pendingBuyerObj._id = pendingBuyerObj._id.toString()

    //Get new token and send
    const newToken =  utilities.jwt('sign', {userID: pendingBuyerObj._id, tokenFor: decodedToken.tokenFor})

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


buyerControllerAuth.login = ('/login', async (req, res)=>{
  try{
    
    //Extract data
    let payload = JSON.parse(req.body)

    //check if data is valid
    if(utilities.validator(payload, ['id', 'password']).isValid){

      //remove white spaces from the data
      payload = utilities.trimmer(payload)

      //hash the password
      payload.password = utilities.dataHasher(payload.password)

      //Check if the ID exists in the database
      const buyerObj = await database.findOne({$or: [{email: payload.id}, {phoneNumber: payload.id}]}, database.collection.buyers, ['_id', 'password'], 1)

      if(buyerObj){
        buyerObj._id = buyerObj._id.toString()
        //check if the password from the client matches the password from the database
        if(payload.password === buyerObj.password){
          //create a token and send
          const token = utilities.jwt('sign', {userID: buyerObj._id, tokenFor: "buyer"})
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


buyerControllerAuth.getNewPassword = ('/get-new-password', async(req, res)=>{
  let payload = JSON.parse(req.body)
  try{
    //check if data is valid
    if(utilities.validator(payload, ['email', 'newPassword']).isValid){
      //remove all white spaces from user data if any
      payload = utilities.trimmer(payload)
      //hash pasword
      payload.newPassword = utilities.dataHasher(payload.newPassword)

      //get buyer object with email
      const buyerObj = await database.findOne({email: payload.email}, database.collection.buyers, ['_id', 'firstName', 'lastName'], 1)
      if(buyerObj){
        //create new otp
        const newOtp = utilities.otpMaker()

        //delete a userID if it exist in the pendingUsersUpdates
        await database.deleteOne({userID: buyerObj._id}, database.collection.pendingUsersUpdates)

        //insert buyer in the pendingUsersUpdates collection
        await database.insertOne({userID: buyerObj._id, createdAt: new Date(), otp: newOtp, dataToUpdate: {parameter: 'password', value: payload.newPassword}}, database.collection.pendingUsersUpdates)

        //send otp to buyer email
        await email.sendOtp('entamarketltd@gmail.com', payload.email, "OTP Verification", `hello ${buyerObj.firstName} ${buyerObj.lastName}, please verify your email with this OTP:`,  newOtp)

        //create a token and send
        const token = utilities.jwt('sign', {userID: buyerObj._id, tokenFor: "buyer"})
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



module.exports = buyerControllerAuth