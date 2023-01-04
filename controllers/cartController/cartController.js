const {ObjectId}  = require('mongodb')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')

const cartController = {}

cartController.updateCart = ('/update-cart', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken

    //Extract payload from body
    const payload = JSON.parse(req.body)
           
    try{
        //validate payload
        if(utilities.cartValidator(payload, ["productID", "noOfItems"]).isValid){
            //Check if product exists in database
            const productObj = await database.findOne({_id: ObjectId(payload.productID)}, database.collection.products, ["_id", "stock"], 1)
            if(productObj){
                //check if number of items added is < or = the stock
                if(payload.noOfItems > 0 && payload.noOfItems <= parseInt(productObj.stock)){
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
                        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj}, true )
                        return
                    }
                    else{
                        // send token
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This product already exists in cart'}, true )
                        return
                    }
                }
                else{
                    // send token
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `number of items should be greater than 0 and less than or equal to amount in stock`}, true )
                    return
                }
            }
            else{
                // send token
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This product does not exist'}, true )
                return
            }
        }
        else{
            // send token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errorObj: utilities.cartValidator(payload, ["productID", "noOfItems"]).msg}, true )
            return
        }  
    }
    catch(err){
        console.log(err) 
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})


cartController.getCart = ('/get-cart', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken
       
    try{  
        //get cart object
        let cartObj = await database.db.collection(database.collection.carts).aggregate([
            {$match: {owner: ObjectId(decodedToken.userID)}}, 
            {$lookup: {from: "products", localField: "products", foreignField: "_id", as: "products"}}
        ]).toArray()

        cartObj = cartObj[0]

        // send response
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj}, true )
        return
        
    }
    catch(err){
        console.log(err) 
        //send response
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})

cartController.deleteCart = ('/delete-cart-item', async (req, res)=>{
    //Extract decoded token
    const decodedToken = req.decodedToken
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

        //send response
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj}, true )
        return

    }
    catch(err){
        console.log(err) 
        //send response
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})


module.exports = cartController