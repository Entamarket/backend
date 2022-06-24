const utilities = require('../lib/utilities')

const traderControllers = {}


traderControllers.post = ('/signup', (req, res, next)=>{
   // check if incoming data is in JSON format
   if(utilities.isJSON(req.body)){
    //parse incoming data
    const parsedData = JSON.parse(req.body)
    
    //check if parsed data is Valid
    if(utilities.validator(parsedData, ['firstName', 'lastName', 'email', 'userName', 'password', 'bankName', 'accountName', 'accountName'])){
      //remove all white spaces from user data if any
      const trimmedData = utilities.trimmer(parsedData)
      console.log(trimmedData)

      //store trimmedData in pending trader collection
      
      
    }
    else{
      console.log('fail')
      utilities.setResponseData(res, 400, {'content-type': 'text/plain'}, 'Invalid data', false)
    }
    
   }
   else{
      utilities.setResponseData(res, 400, {'content-type': 'text/plain'}, 'Invalid data format, data should be in JSON form', false )
      
   }
    
})

module.exports = traderControllers