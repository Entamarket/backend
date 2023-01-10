const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const notificationController = require("../notificationController/notificationController")
const PendingDelivery = require("../../models/pendingDelivery")
const utilities = require("../../lib/utilities")

const checkoutController = {}


checkoutController.checkout = ('/get-checkout', async (req, res)=>{
    
    //extract decoded token
    const decodedToken = req.decodedToken;
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    const payload = JSON.parse(req.body)
    try{
        //check if payload is an array
        if(Array.isArray(payload)){
            const purchases = []
            const responsePurchases = []
            const logisticsPurchases = []
            const traderspurchaseCopies = []
        
            //loop through the array and validate each product
            for(let product of payload){
                if(utilities.checkoutValidator(product, ["productID", "quantity"]).isValid){
                    //check if the product is real and if it is real, get the product 
                    //const productObj = await database.findOne({_id: ObjectId(product.productID)})
                    let productObj = await database.db.collection(database.collection.products).aggregate([
                        {$match: {_id: ObjectId(product.productID)}},
                        {$lookup: {from: "users", localField: "owner", foreignField: "primaryID", as: "owner"}},
                        {$unwind: "$owner"}
                    ]).toArray()

                    productObj = productObj[0]

                    if(productObj){
                        //check if the stock of this product is greater than or equal to the payload quantity
                        if(product.quantity > 0 && product.quantity <= parseInt(productObj.stock)){
                            //update the stock of product
                            let updatedProductStock = (parseInt(productObj.stock) - product.quantity) + ""

                            await database.updateOne({_id: productObj._id}, database.collection.products, {stock: updatedProductStock})

                            //make a purchase object and fill it up
                            const purchase = {}
                            purchase.product = productObj._id
                            purchase.quantity = product.quantity
                            purchase.trader = productObj.owner.primaryID
                            purchases.push(purchase)

                            //make a response purchase copy object and fill it up
                            const responsePurchaseCopy = {}
                            const responseProduct = {...productObj}
                            delete responseProduct.owner
                            responsePurchaseCopy.product = responseProduct
                            responsePurchaseCopy.quantity = product.quantity
                            responsePurchaseCopy.trader = productObj.owner
                            responsePurchases.push(responsePurchaseCopy)

                            //make a logistics purchase copy object and fill it up
                            const logisticsPurchaseCopy = {}
                            logisticsPurchaseCopy.product = productObj._id
                            logisticsPurchaseCopy.quantity = product.quantity
                            logisticsPurchaseCopy.trader = productObj.owner.primaryID
                            logisticsPurchases.push(logisticsPurchaseCopy)

                            //make a traders purchase copy object and fill it up
                            const traderPurchaseCopy = {}
                            traderPurchaseCopy.product = productObj._id
                            traderPurchaseCopy.quantity = product.quantity
                            traderPurchaseCopy.buyer = ObjectId(decodedToken.userID)
                            traderPurchaseCopy.trader = productObj.owner.primaryID
                            traderspurchaseCopies.push(traderPurchaseCopy)

                        }
                        else{
                            //send response   
                            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `the quantity of productID: ${product.productID} should be greater than zero and less than or equal to the stock`}, true)
                            return
                        } 
                    }
                    else{
                        //send response   
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `productID: ${product.productID} does not exist in database`}, true)
                        return
                    }
  
                }
                else{
                    //send response   
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errorObj: utilities.checkoutValidator(product, ["productID", "noOfItems"])}, true)
                    return

                }

            }
        
        
            const purchaseDetails = {buyer: ObjectId(decodedToken.userID), purchases: purchases}
            //store in pending deliveries
            const checkoutObj = await new PendingDelivery(purchaseDetails).save()

            //add checkout id to trader purchase copy and send notifications to traders
            for(let item of traderspurchaseCopies){
                
                item.checkoutID = checkoutObj.insertedId
                   
                //send notification to traders
                await notificationController.send("purchase", item, ObjectId(decodedToken.userID), item.trader)
            }

            //add checkoutID and buyer to logistics notification
            const logisticsNotification = {checkoutID: checkoutObj.insertedId, buyer: ObjectId(decodedToken.userID),  purchases: logisticsPurchases}
            
            
            //send notification to logistics
            const logisticsID = ObjectId("63bb57e030ecce63a6685040")
            await notificationController.send("purchase-for-logistics", logisticsNotification, ObjectId(decodedToken.userID), logisticsID)
                
            //add checkoutID to response
            const purchaseDetailsForResponse = {checkoutID: checkoutObj.insertedId, purchases: responsePurchases}

            //send response
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, checkoutDetails: purchaseDetailsForResponse}, true)
        }
        else{
            //send response   
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "payload must be an array"}, true)
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