const utilities = require('../lib/utilities')

const traderControllers = {}


traderControllers.post = ('/signup', (req, res, next)=>{
   // check if incoming data is in JSON format
   if(utilities.isJSON(req.body)){
    //parse incoming data

   }
   else{
        res.status(400)
        res.set('content-type', 'text/plain')
        res.send('Invalid data format, data should be in JSON form')
        res.end()
   }
    
})

module.exports = traderControllers