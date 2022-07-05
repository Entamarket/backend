const utilities = require('../lib/utilities')
const database = require('../lib/database')
const Trader = require('../models/trader')
const email = require('../lib/email')

const traderControllers = {}

traderControllers.post = ('/signup', async (req, res, next)=>{

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
      try{
      
        const existingUser = await database.checkForExistingUser(trimmedData)

        if(existingUser.constructor.name == 'Object' && !existingUser.doesUserDetailExist){

          //store trimmed data in database(pendingTraders collection)
          const trader = new Trader(trimmedData, true)

          await trader.save()

          //send an email to the trader for verification
          await email.send("tradespace19@gmail.com", trimmedData.email, `hello ${trimmedData.firstName} ${trimmedData.lastName}, please verify your address by copying this OTP: ${trimmedData.otp}`, trimmedData.firstName)

          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {msg: `verification email sent`}, true)

        }
        else{
          utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {msg: `this ${existingUser.userDetail} already exists`}, true)
          return
        }

      }
      catch(err){
        console.log(err)
        
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {msg: "something went wrong with the server"}, true)
        return
      }
       
    }
    else{
      const errorObj = utilities.validator(parsedData, ['firstName', 'lastName', 'email', 'userName', 'phoneNumber', 'password'])

      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, errorObj, true)
    }
    
  }
  else{
    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {msg: 'Invalid data format, data should be in JSON form'}, true )
      
  }
    
})

module.exports = traderControllers