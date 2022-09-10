const fs = require('fs')
const path = require('path')
const {ObjectId}  = require('mongodb')
const utilities = require('../../lib/utilities')
const database = require('../../lib/database')
const Buyer = require('../../models/buyer')
const email = require('../../lib/email')


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
        await database.deleteOne({_id: checker._id}, database.collection.pendingBuyers)
      }

      //check if username, email or phone number exists in database
      const existingUser = await database.checkForExistingUser(payload)

      if(existingUser.constructor.name == 'Object' && !existingUser.doesUserDetailExist){

        //store payload in database(pendingTraders collection)
        const pendingBuyer = new Buyer(payload, true)
        const savedPendingBuyerObj = await pendingBuyer.save()

        //send an email to the trader for verification of phone number
        await email.send('entamarketltd@gmail.com', payload.email, `hello ${payload.firstName} ${payload.lastName}, please verify your email with this OTP: ${payload.otp}`, payload.firstName)

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



module.exports = buyerControllerAuth