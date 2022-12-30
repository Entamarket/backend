const {ObjectId}  = require('mongodb')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')

const cartController = {}

cartController.updateCart = ('/update-cart', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken

    //create newToken
    //const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

    //Extract payload from body
    const payload = JSON.parse(req.body)
           
    try{
        //Check if product exists in database
        const productObj = await database.findOne({_id: ObjectId(payload.productID)}, database.collection.products, ["_id"], 1)
        if(productObj){
            //add product to cart uniqley
            const updatedCartInfo = await database.db.collection(database.collection.carts).updateOne({owner: ObjectId(decodedToken.userID)}, {$addToSet: {products: ObjectId(payload.productID)}})

            //check if product was already present
            if(updatedCartInfo.modifiedCount === 1){
                //get cart object
                let cartObj = await database.db.collection(database.collection.carts).aggregate([
                    {$match: {owner: ObjectId(decodedToken.userID)}}, 
                    {$lookup: {from: "products", localField: "products", foreignField: "_id", as: "products"}}
                ]).toArray()

                cartObj = cartObj[0]

                //send response and token
                //utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj, entamarketToken: newToken}, true )
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj}, true )
                return

            }
            else{
                // send token
                //utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This product already exists in cart', entamarketToken: newToken}, true )
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This product already exists in cart'}, true )
                return
            }

        }
        else{
            // send token
           // utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This product does not exist', entamarketToken: newToken}, true )
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This product does not exist'}, true )
            return
        }
        
    }
    catch(err){
        console.log(err) 
        //send newToken
        //utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})


cartController.getCart = ('/get-cart', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken
    //create newToken
    //const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
       
    try{  
        //get cart object
        let cartObj = await database.db.collection(database.collection.carts).aggregate([
            {$match: {owner: ObjectId(decodedToken.userID)}}, 
            {$lookup: {from: "products", localField: "products", foreignField: "_id", as: "products"}}
        ]).toArray()

        cartObj = cartObj[0]

        // send token
        //utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj, entamarketToken: newToken}, true )
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj}, true )
        return
        
    }
    catch(err){
        console.log(err) 
        //send newToken
        //utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})

cartController.deleteCart = ('/delete-cart-item', async (req, res)=>{
    //Extract decoded token
    const decodedToken = req.decodedToken
    //create newToken
    //const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    //extract payload
    const productID = ObjectId(req.query.productID)

    try{
        //delete product from cart
        await database.db.collection(database.collection.carts).updateOne({owner: ObjectId(decodedToken.userID)}, {$pull: {products: productID}})

        //get cart object
        let cartObj = await database.db.collection(database.collection.carts).aggregate([
            {$match: {owner: ObjectId(decodedToken.userID)}}, 
            {$lookup: {from: "products", localField: "products", foreignField: "_id", as: "products"}}
        ]).toArray()

        cartObj = cartObj[0]

        // send token
        //utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj, entamarketToken: newToken}, true )
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj}, true )
        return

    }
    catch(err){
        console.log(err) 
        //send newToken
        //utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})


module.exports = cartController