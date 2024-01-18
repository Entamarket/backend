const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const notificationController = require("../notificationController/notificationController")
const SoldProduct = require("../../models/soldProduct")
const BoughtProduct = require("../../models/boughtProduct")
const utilities = require("../../lib/utilities")
const {islandPrice, mainLandPrice, paymentGatewayMaxThreshold, paymentGatewayLv1Threshold, maxThresholdFee, lv0ThresholdFee, lv1ThresholdFee, small, medium, large, xlFactor} = require("../../lib/variables")

const deliveryController = {}


deliveryController.confirmDelivery = ('/confirm-delivery', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    //extract checkoutID
    const checkoutID = ObjectId(req.query.checkoutID)
    try{
         
        //Get the pendingDelivery object

        let pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).aggregate([
            {$match: {_id: checkoutID}},
            {$unwind: "$purchases"},
            {$lookup: {from: "products", localField: "purchases.product", foreignField: "_id", as: "purchases.product"}},
            {$unwind: "$purchases.product"}
        ]).toArray()

        
        //check if delivery exists
        if(pendingDelivery && pendingDelivery.length > 0){
            //check if user owns the delivery
            if(pendingDelivery[0].buyer.id.toString() === decodedToken.userID){
                const boughtProducts = {checkoutID: checkoutID, products: [], totalProductsPrice: 0}
                let weight = 0
                
                //credit every traders account balance
                for(let delivery of pendingDelivery){
                    await database.db.collection(database.collection.traders).updateOne({_id: delivery.purchases.trader}, {$inc: {"accountBalance": parseInt(delivery.purchases.product.price) * delivery.purchases.quantity}})

                    //send traders delivery notification
                    const notificationObj = {
                        checkoutID: delivery._id,
                        trader: delivery.purchases.trader,
                        buyer: ObjectId(decodedToken.userID),
                        productID: delivery.purchases.product._id,
                        quantity: delivery.purchases.quantity,
                        moneyCredited: parseInt(delivery.purchases.product.price) * delivery.purchases.quantity 
                    }

                    await notificationController.send("delivery", notificationObj, notificationObj.buyer, notificationObj.trader)

                    //send products to sold products  collection
                    const shopData = await database.findOne({_id: delivery.purchases.product.shopID}, database.collection.shops, ["name", "shopAddress"], 1)
                    const purchase = {checkoutID: checkoutID, product: delivery.purchases.product, shop: shopData, buyer: delivery.buyer, trader: delivery.purchases.trader, price: delivery.purchases.product.price, quantity: delivery.purchases.quantity}
                    await new SoldProduct(purchase).save()

                    //make bought product data
                    const traderData = await database.findOne({primaryID: delivery.purchases.trader}, database.collection.users, ["deleted"], 0)
                    boughtProducts.products.push({product: delivery.purchases.product,  trader: traderData, shop: shopData, price: delivery.purchases.product.price, quantity: delivery.purchases.quantity, totalProductPrice: delivery.purchases.quantity * parseInt(delivery.purchases.product.price)})

                    //add weigth
                    weight += parseFloat(delivery.purchases.product.weight) * delivery.purchases.quantity
                
                }
                boughtProducts.buyer = pendingDelivery[0].buyer
                //calculate total products price
                for(let price of boughtProducts.products){
                    boughtProducts.totalProductsPrice += price.totalProductPrice
                }
            
                //Calculate logistics price

                if(weight >= 0 && weight <=2){
                    if(boughtProducts.buyer.location.toLowerCase() == "island"){
                        boughtProducts.logisticsFee = islandPrice + small;
                    }
                    else if(boughtProducts.buyer.location.toLowerCase() == "mainland"){
                        boughtProducts.logisticsFee = mainLandPrice + small;
                    }
                    else{
                        //send response   
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid location"}, true)
                        return
                    }
                }
    
                else if(weight >= 2.1 && weight <=7){
                    if(boughtProducts.buyer.location.toLowerCase() == "island"){
                        boughtProducts.logisticsFee = islandPrice + medium;
                    }
                    else if(boughtProducts.buyer.location.toLowerCase() == "mainland"){
                        boughtProducts.logisticsFee = mainLandPrice + medium;
                    }
                    else{
                        //send response   
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid location"}, true)
                        return
                    }
                }
    
                else if(weight >= 7.1 && weight <=10){
                    if(boughtProducts.buyer.location.toLowerCase() == "island"){
                        boughtProducts.logisticsFee = islandPrice + large;
                    }
                    else if(boughtProducts.buyer.location.toLowerCase() == "mainland"){
                        boughtProducts.logisticsFee = mainLandPrice + large;
                    }
                    else{
                        //send response   
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid location"}, true)
                        return
                    }
                }
    
                else if(weight > 10){
                    if(boughtProducts.buyer.location.toLowerCase() == "island"){
                        boughtProducts.logisticsFee = islandPrice + large + (weight * xlFactor);
                    }
                    else if(boughtProducts.buyer.location.toLowerCase() == "mainland"){
                        boughtProducts.logisticsFee = mainLandPrice + large + (weight * xlFactor);
                    }
                    else{
                        //send response   
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid location"}, true)
                        return
                    }
                }
                else{
                    //send response   
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid weight"}, true)
                    return
                }
                
                boughtProducts.total = boughtProducts.totalProductsPrice + boughtProducts.logisticsFee

                if(boughtProducts.total >= paymentGatewayMaxThreshold){
                    boughtProducts.paymentGatewayFee = maxThresholdFee 
                }
                else{
                    if(boughtProducts.total >= paymentGatewayLv1Threshold){
                        boughtProducts.paymentGatewayFee = lv1ThresholdFee(boughtProducts.total)
                    }
                    else{
                        boughtProducts.paymentGatewayFee = lv0ThresholdFee(boughtProducts.total)
                    }
                }
                boughtProducts.total += boughtProducts.paymentGatewayFee
                await new BoughtProduct(boughtProducts).save()

                //delete pending delivery
                await database.deleteOne({_id: pendingDelivery[0]._id}, database.collection.pendingDeliveries)

                //delete trader pending delivery
                await database.deleteMany({checkoutID: checkoutID}, database.collection.pendingTradersDeliveries)

                //send response
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "confirmation sucessful"}, true)
                return

            }
            else{
                //response   
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this user does not own this delivery"}, true)
                return

            }
        }
        else{
            //response   
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this delivery does not exist"}, true)
            return
        }

    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})

deliveryController.getPendingDeliveries = ('/get-pending-deliveries', async (req, res)=>{
    const decodedToken = req.decodedToken
    const buyerID = ObjectId(decodedToken.userID)
    let set = req.query.set
    let pendingDelivery;

    try{
        //get all delivery 5 at a time for now but later make it 20
        set = parseInt(set)
        const pendingDeliveryCount = await database.db.collection(database.collection.pendingDeliveries).countDocuments({"buyer.id": buyerID})
        const limit = 5

        if(typeof set === "number" && set >= 0 && (set * limit < pendingDeliveryCount)){
            pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).find({"buyer.id": buyerID}).skip(set * limit).limit(limit).toArray()
        
            if(pendingDelivery.length > 0 ){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingDeliveries: pendingDelivery}, true)
                return
            }
            else{
                //send response
                utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
                return
            }
        }
        else{
            //send response
            utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
            return
        }
        
    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})


deliveryController.getSinglependingDelivery = ('/get-single-pending-delivery', async (req, res)=>{
    const decodedToken = req.decodedToken
    const buyerID = ObjectId(decodedToken.userID)
    const checkoutID = ObjectId(req.query.checkoutID)

    try{
        let pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).aggregate([
            {$match: {_id: checkoutID}},
            {$unwind: "$purchases"},
            {$lookup: {from: "users", localField: "purchases.trader", foreignField: "primaryID", as: "purchases.trader"}},
            {$unwind: "$purchases.trader"},
            {$lookup: {from: "products", localField: "purchases.product", foreignField: "_id", as: "purchases.product"}},
            {$unwind: "$purchases.product"},
            {$group: {_id: "$_id", buyer: {$first: "$buyer"}, postedAt: {$first: "$postedAt"}, purchases: {$push: "$purchases"}}}

        ]).toArray()

        pendingDelivery = pendingDelivery[0]
        if(pendingDelivery){
            
            //check if buyer owns this delivery
            if(buyerID.toString() === pendingDelivery.buyer.id.toString()){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingDelivery}, true)
                return
            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "This buyer does not own this delivery"}, true)
                return
            }
            
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this delivery does not exist"}, true)
            return
        }   

    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})


deliveryController.getTraderPendingDeliveries = ('/get-trader-pending-deliveries', async (req, res)=>{
    const decodedToken = req.decodedToken
    const traderID = ObjectId(decodedToken.userID)
    let set = req.query.set
    let pendingTraderDeliveries;
    try{

        //get all delivery 5 at a time for now but later make it 20
        set = parseInt(set)
        const pendingTraderDeliveriesCount = await database.db.collection(database.collection.pendingTradersDeliveries).countDocuments({trader: traderID})
        const limit = 5

        if(typeof set === "number" && set >= 0 && (set * limit < pendingTraderDeliveriesCount)){
            pendingTraderDeliveries = await database.db.collection(database.collection.pendingTradersDeliveries).find({trader: traderID}).skip(set * limit).limit(limit).toArray()

            if(pendingTraderDeliveries.length > 0 ){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingDeliveries: pendingTraderDeliveries}, true)
                return
            }
            else{
                //send response
                utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
                return
            }
        }
        else{
            //send response
            utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
            return
        }

    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})




deliveryController.getSingleTraderPendingDelivery = ('/get-single-trader-pending-delivery', async (req, res)=>{
    const decodedToken = req.decodedToken
    const traderID = ObjectId(decodedToken.userID)
    const deliveryID = ObjectId(req.query.deliveryID)

    try{
        let pendingDelivery = await database.db.collection(database.collection.pendingTradersDeliveries).aggregate([
            {$match: {_id: deliveryID}},
            {$lookup: {from: "products", localField: "product", foreignField: "_id", as: "product"}},
            {$unwind: "$product"}

        ]).toArray()

        pendingDelivery = pendingDelivery[0]
        if(pendingDelivery){
            
            //check if trader owns this delivery
            if(traderID.toString() === pendingDelivery.trader.toString()){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingDelivery}, true)
                return
            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "This trader does not own this pending product"}, true)
                return
            }
            
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this pending product delivery does not exist"}, true)
            return
        }   

    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})


module.exports = deliveryController