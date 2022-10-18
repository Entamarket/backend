const {ObjectId}  = require('mongodb')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')

const cartController = {}

cartController.updateCart = ('/update-cart', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken

    //create newToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

    //Extract payload from body
    const payload = JSON.parse(req.body)
    console.log(payload)
    console.log(payload.products)
           
    try{
        //Check if data in body is valid
        if(Array.isArray(payload.products)){

            //add cart
            await database.updateOne({owner: ObjectId(decodedToken.userID)}, database.collection.carts, {products: payload.products})

            //get cart object
            const cartObj = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.carts)

            // send token
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj, entamarketToken: newToken}, true )
            return
        }
        else{
            // send token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data, make sure data is an array', entamarketToken: newToken}, true )
            return
        }
    }
    catch(err){
        console.log(err) 
        //send newToken
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }

})


cartController.getCart = ('/get-cart', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken

    //create newToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

           
    try{
        
        //get cart object
        const cartObj = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.carts)

        // send token
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj, entamarketToken: newToken}, true )
        return
        
    }
    catch(err){
        console.log(err) 
        //send newToken
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }

})

module.exports = cartController