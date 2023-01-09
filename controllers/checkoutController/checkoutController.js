const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const notificationController = require("../notificationController/notificationController")
const PendingDelivery = require("../../models/pendingDelivery")
const utilities = require("../../lib/utilities")

const checkoutController = {}


checkoutController.getCheckout = ('/get-checkout', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    try{
        //get buyer details
        const buyerDetails = await database.findOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users)
        //get cart
        let cart = await database.db.collection(database.collection.carts).aggregate([
            {$match: {owner: ObjectId(decodedToken.userID)}},
            {$unwind: "$products"}, 
            {$lookup: {from: "products", localField: "products.productID", foreignField: "_id", as: "products.product"}},
            {$unwind: "$products.product"},
            {$lookup: {from: "users", localField: "products.product.owner", foreignField: "primaryID", as: "products.product.owner"}},
            {$unwind: "$products.product.owner"},
            {$unset: "products.productID"},
            {$replaceWith: {
                $setField: {
                    field: "product",
                    input: "$products",
                    value: "$products.product"
                }
            }}
        ]).toArray()


        //check if cart is empty 
        if(cart && cart.length > 0){

            //check if all products are in stock
            for(let purch of cart){
                if(parseInt(purch.product.stock) < purch.noOfItems)
                    return utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this product is out of stock", product: purch.product}, true)  
            }
            const purchases = []
            const responsePurchases = []
            const logisticsPurchases = []
            
            //loop through the cart and process the purchase
            for(let item of cart){
                const checkoutPurchaseCopy = {}
                const logisticsPurchaseCopy = {}
                const responsePurchaseCopy = {}
            
                //fillup purchase object
                checkoutPurchaseCopy.product = item.product._id
                checkoutPurchaseCopy.noOfItems = item.noOfItems
                checkoutPurchaseCopy.trader = item.product.owner.primaryID
                
                purchases.push(checkoutPurchaseCopy)
                
                //update stock
                let updatedStock = parseInt(item.product.stock) - item.noOfItems
                updatedStock = updatedStock + ""
                await database.updateOne({_id: item.product._id}, database.collection.products, {stock: updatedStock})

                //fill up logistics purchase copy
                logisticsPurchaseCopy.product = item.product._id
                logisticsPurchaseCopy.noOfItems = item.noOfItems
                logisticsPurchaseCopy.trader = item.product.owner.primaryID
                logisticsPurchases.push(logisticsPurchaseCopy)

                //fill up responsePurchaseCopy
                const responseProductObj = {...item.product}
                delete responseProductObj.owner
                responsePurchaseCopy.product = responseProductObj
                responsePurchaseCopy.noOfItems = item.noOfItems
                responsePurchaseCopy.trader = item.product.owner
                responsePurchases.push(responsePurchaseCopy)
             
            }
            
            const purchaseDetails = {buyer: ObjectId(decodedToken.userID), purchases: purchases}

            //store in pending deliveries
            const checkoutObj = await new PendingDelivery(purchaseDetails).save()

            //send notifications to traders
            for(let item of cart){
                const traderPurchaseCopy = {}
            
                //fillup purchase object
                traderPurchaseCopy.product = item.product._id
                traderPurchaseCopy.noOfItems = item.noOfItems
                traderPurchaseCopy.buyer = ObjectId(decodedToken.userID)
                traderPurchaseCopy.checkoutID = checkoutObj.insertedId
                traderPurchaseCopy.trader = item.product.owner.primaryID
                
                //send notification to traders
                await notificationController.send("purchase", traderPurchaseCopy, ObjectId(decodedToken.userID), item.product.owner.primaryID)

            }
            
            //add checkoutID and buyer to logistics notification
            const logisticsNotification = {checkoutID: checkoutObj.insertedId, buyer: ObjectId(decodedToken.userID),  purchases: logisticsPurchases}

            //send notification to logistics
            const logisticsID = ObjectId("63bb57e030ecce63a6685040")
            await notificationController.send("purchase", logisticsNotification, ObjectId(decodedToken.userID), logisticsID)

            //add checkoutID to response
            const purchaseDetailsForResponse = {checkoutID: checkoutObj.insertedId, purchases: responsePurchases}

            //clear cart
            await database.updateOne({owner: ObjectId(decodedToken.userID)}, database.collection.carts, {products: []})

            //send response
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, checkoutDetails: purchaseDetailsForResponse}, true)

        }
        else{
            //send response   
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "empty cart"}, true)
            return
        }
   
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})


module.exports = checkoutController