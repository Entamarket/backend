const utilities = require('../lib/utilities')
const Trader = require('../models/trader')
const email = require('../lib/email')

const traderControllers = {}

traderControllers.post = ('/signup', (req, res, next)=>{

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

      //store trimmedData in pending trader collection
      const trader = new Trader(trimmedData, true)
      trader.save()
      .then(msg=>{
        console.log(msg)
        
        //send an email to the trader for verification
        email.send("tradespace19@gmail.com", trimmedData.email, `hello ${trimmedData.firstName} ${trimmedData.lastName}, please verify your address by copying this OTP: 3324`, trimmedData.firstName)
        .then(value=>{

          utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {msg: 'success'}, true)

        })
        .catch(err=>{

          try{
            throw 'unable to send email, try again with a verified email'
          }
          catch(err){
            console.log(err)

            utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {msg: err}, true)
          }
          
        })
        
      })
      .catch(err=>{
        console.log(err)
        try{
          throw 'unable to save data'
        }
        catch(err){
          console.log(err)
          utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {msg: err}, true)

        }
        
      })
       
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