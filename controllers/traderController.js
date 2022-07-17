const utilities = require('../lib/utilities')
const database = require('../lib/database')
const Trader = require('../models/trader')
const email = require('../lib/email')
const {ObjectId}  = require('mongodb')//.ObjectId

const traderController = {}

traderController.signup = ('/signup', async (req, res)=>{
  try{
    // check if incoming data is in JSON format
    if(utilities.isJSON(req.body)){
      //parse incoming data
      const parsedData = JSON.parse(req.body)
    
      //check if parsed data is Valid
      if(utilities.validator(parsedData, ['firstName', 'lastName', 'email', 'userName', 'phoneNumber', 'password']).isValid){
        //remove all white spaces from user data if any
        const trimmedData = utilities.trimmer(parsedData)

        //hash the password
        trimmedData.password = utilities.dataHasher(trimmedData.password)

        //check if userName, email or phone number exists in database
      
        const existingUser = await database.checkForExistingUser(trimmedData)

        if(existingUser.constructor.name == 'Object' && !existingUser.doesUserDetailExist){

          //store trimmed data in database(pendingTraders collection)
          const pendingTrader = new Trader(trimmedData, true)

          await pendingTrader.save()

          //send an sms to the trader for verification of phone number
          await email.send('entamarketltd@gmail.com', trimmedData.email, `hello ${trimmedData.firstName} ${trimmedData.lastName}, please verify your phone number with this OTP: ${trimmedData.otp}`, trimmedData.firstName)
      
          //Send JWT
          //fetch the user ID from the database
          const pendingTraderObj = await database.findOne('userName', trimmedData.userName, database.collection.pendingTraders, {projection: {_id: 1}})
 
          const token = utilities.jwt('sign', {userID: pendingTraderObj._id.toString()})

          //send token to client
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entaMarketToken: token}, true)

        }
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this ${existingUser.userDetail} already exists`}, true)
          return
        }
       
      }
      else{
        const errorObj = utilities.validator(parsedData, ['firstName', 'lastName', 'email', 'userName', 'phoneNumber', 'password'])
        errorObj.statusCode = 400
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, errorObj, true)
        return
      }
    
    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data format, data should be in JSON form'}, true )
        return
    }

  }
  catch(err){
    console.log(err)    
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    return
  }   
})

traderControllers.verifyOtp = ('/signup/account-verification', async (req, res)=>{
  
  try{
    // Extract token
    const token = req.headers.authorization.split(' ')[1] 
      
    // Check if the id from the token exists
    const decodedToken = utilities.jwt('verify', token).decodedToken

    const pendingTraderObj = await database.getDatabase().collection(database.collection.pendingTraders).findOne({_id: ObjectId(decodedToken.userID)})
    if(pendingTraderObj){

      //check if otp is in JSON format
      if(utilities.isJSON(req.body)){
        //parse the data
        const parsedData = JSON.parse(req.body)

        //check if the OTP from the database matches the OTP from the client
        if(pendingTraderObj.otp == parsedData.otp){
          // transfer transfer pending trader from the pendingTrader collection to trader collection
          const {_id, createdAt, otp, ...rest} = pendingTraderObj
          const trader = new Trader(rest, false)
          const savedTrader = await trader.save()
          //delete the data in pendingTraders collection
          await database.deleteOne('_id', pendingTraderObj._id, database.collection.pendingTraders)

          //send a new token
          const traderObj = await database.findOne('_id', savedTrader.insertedId, database.collection.traders, {projection: {_id: 1}})
          traderObj._id = traderObj._id.toString()
          const newToken = utilities.jwt('sign', {id: traderObj._id})
            
          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode:200, entaMarketToken: newToken}, true )
  
        }
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This OTP doesn't match the user`}, true )
          return
        }

      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid format, payload should be in JSON format`}, true )
        return
      }
    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`}, true )
      return
    }
       
  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
    return
  }
  
})

traderController

module.exports = traderController