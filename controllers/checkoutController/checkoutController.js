const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const Notification = require("../../models/notification")
const utilities = require("../../lib/utilities")

const checkoutController = {}


checkoutController.checkout = ('/checkout', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    
    try{
        //get cart
        
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
})


module.exports = checkoutController