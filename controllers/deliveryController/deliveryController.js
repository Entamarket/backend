const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const notificationController = require("../notificationController/notificationController")
const SoldProduct = require("../../models/soldProduct")
const utilities = require("../../lib/utilities")

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
        if(pendingDelivery){
            //check if user owns the delivery
            if(pendingDelivery[0].buyer.toString() === decodedToken.userID){
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
                    const purchase = {product: delivery.purchases.product._id, buyer: ObjectId(decodedToken.userID), trader: delivery.purchases.trader, price: delivery.purchases.product.price, quantity: delivery.purchases.quantity}
                    await new SoldProduct(purchase).save()
                }
                

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
        const pendingDeliveryCount = await database.db.collection(database.collection.pendingDeliveries).countDocuments({buyer: buyerID})
        const limit = 5

        if(typeof set === "number" && set >= 0 && (set * limit < pendingDeliveryCount)){
            pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).find({buyer: buyerID}).skip(set * limit).limit(limit).toArray()

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
            if(buyerID.toString() === pendingDelivery.buyer.toString()){
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