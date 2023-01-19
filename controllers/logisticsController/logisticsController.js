const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")
const notificationController = require("../notificationController/notificationController")

const utilities = require("../../lib/utilities")


const logisticsController = {}

logisticsController.getCounts = ('/get-counts', async (req, res)=>{
    
    try{ 
        const pendingDeliveryCount = await database.db.collection(database.collection.pendingDeliveries).countDocuments()
        
        const countObj = {pendingDeliveryCount}
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, dataCount: countObj}, true)
        return
        
    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})


logisticsController.getPendingDeliveries= ("/get-pending-deliveries", async (req, res)=>{
    let set = req.query.set
    let pendingDelivery;

    try{
        //get all delivery 5 at a time for now but later make it 20
        set = parseInt(set)
        const pendingDeliveryCount = await database.db.collection(database.collection.pendingDeliveries).countDocuments()
        const limit = 5

        if(typeof set === "number" && set >= 0 && (set * limit < pendingDeliveryCount)){
            pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).find().skip(set * limit).limit(limit).toArray()

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

logisticsController.getSinglependingDelivery = ('/get-single-pending-delivery', async (req, res)=>{
    const checkoutID = ObjectId(req.query.checkoutID)

    try{
        let pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).aggregate([
            {$match: {_id: checkoutID}},
            {$lookup: {from: "users", localField: "buyer", foreignField: "primaryID", as: "buyer"}},
            {$unwind: "$buyer"},
            {$unwind: "$purchases"},
            {$lookup: {from: "users", localField: "purchases.trader", foreignField: "primaryID", as: "purchases.trader"}},
            {$unwind: "$purchases.trader"},
            {$lookup: {from: "products", localField: "purchases.product", foreignField: "_id", as: "purchases.product"}},
            {$unwind: "$purchases.product"},
            {$group: {_id: "$_id", buyer: {$first: "$buyer"}, postedAt: {$first: "$postedAt"}, purchases: {$push: "$purchases"}}}

        ]).toArray()

        pendingDelivery = pendingDelivery[0]
        if(pendingDelivery){
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingDelivery}, true)
            return
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


logisticsController.confirmDelivery = ('/confirm-delivery', async (req, res)=>{
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

           console.log(pendingDelivery)
            //return
            
            //credit every traders account balance
            for(let delivery of pendingDelivery){
                await database.db.collection(database.collection.traders).updateOne({_id: delivery.purchases.trader}, {$inc: {"accountBalance": parseInt(delivery.purchases.product.price) * delivery.purchases.quantity}})

                //send traders delivery notification
                const notificationObj = {
                    checkoutID: delivery._id,
                    trader: delivery.purchases.trader,
                    buyer: delivery.buyer,
                    productID: delivery.purchases.product,
                    quantity: delivery.purchases.quantity,
                    moneyCredited: parseInt(delivery.purchases.product.price) * delivery.purchases.quantity 
                }

                await notificationController.send("delivery", notificationObj, notificationObj.buyer, notificationObj.trader)
            }
            
            //delete pending delivery
            await database.deleteOne({_id: pendingDelivery[0]._id}, database.collection.pendingDeliveries)

            //send response
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "confirmation sucessful"}, true)
            return

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


module.exports = logisticsController