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
            payload.productID = ObjectId(payload.productID)
            //Check if product exists in database
            const productObj = await database.findOne({_id: payload.productID}, database.collection.products, ["_id", "stock"], 1)
            if(productObj){
                //check if number of items added is < or = the stock
                if(payload.noOfItems > 0 && payload.noOfItems <= parseInt(productObj.stock)){

                    //check if product already exists in cart
                    let doesProdExist = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.carts, ["products"], 1) 
                    
                    for(obj of doesProdExist.products){
                        if(obj.productID.toString() == payload.productID){

                            // send token
                            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'This product already exists in cart'}, true )
                            return

                        }
                    }

                    //add product to cart uniqley
                    await database.db.collection(database.collection.carts).updateOne({owner: ObjectId(decodedToken.userID)}, {$addToSet: {products: payload}})

                    //get cart data
                    let cartObj = await database.db.collection(database.collection.carts).aggregate([
                        {$match: {owner: ObjectId(decodedToken.userID)}}, 
                        {$unwind: "$products"}, 
                        {$lookup: {from: "products", localField: "products.productID", foreignField: "_id", as: "products.product"}},
                        {$unset: "products.productID"},
                        {$replaceWith: {
                            $setField: {
                                field: "product",
                                input: "$products",
                                value: {$arrayElemAt: ["$products.product", 0]}
                            }
                        }}
                    ]).toArray()
                    //send response and token
                    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, cartData: cartObj}, true )
                    return
                    
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
            {$unwind: "$products"}, 
            {$lookup: {from: "products", localField: "products.productID", foreignField: "_id", as: "products.product"}},
            {$unset: "products.productID"},
            {$replaceWith: {
                $setField: {
                    field: "product",
                    input: "$products",
                    value: {$arrayElemAt: ["$products.product", 0]}
                }
            }}
        ]).toArray()


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
        await database.db.collection(database.collection.carts).updateOne({owner: ObjectId(decodedToken.userID)}, {$pull: {products: {productID: productID}}})

        //get cart object
        let cartObj = await database.db.collection(database.collection.carts).aggregate([
            {$match: {owner: ObjectId(decodedToken.userID)}}, 
            {$unwind: "$products"}, 
            {$lookup: {from: "products", localField: "products.productID", foreignField: "_id", as: "products.product"}},
            {$unset: "products.productID"},
            {$replaceWith: {
                $setField: {
                    field: "product",
                    input: "$products",
                    value: {$arrayElemAt: ["$products.product", 0]}
                }
            }}
        ]).toArray()


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