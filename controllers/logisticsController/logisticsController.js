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
        if(pendingDelivery && pendingDelivery.length > 0){

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

            //delete trader pending delivery
            await database.deleteMany({checkoutID: checkoutID}, database.collection.pendingTradersDeliveries)

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

logisticsController.getNotifications = ("/get-notifications", async (req, res)=>{
   
    let set = req.query.set

    try{
        set = parseInt(set)
        const notificationCount = await database.db.collection(database.collection.logisticsNotifications).countDocuments()
        const limit = 5

        if(set >= 0 && (set * limit < notificationCount)){
            let notifications = await database.db.collection(database.collection.logisticsNotifications).aggregate([
                {$match: {}},
                {$sort: {_id: -1}},
                {$skip: set * limit},
                {$limit: limit},
                {$lookup: {from: "users", localField: "from", foreignField: "primaryID", as: "from"}},
                {$unwind: "$from"}
                
            ]).toArray()

 
            return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, notifications: notifications}, true)
        }
        else{
            return utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more notifications"}, true) 

        }     
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})


logisticsController.viewNotification = ('/view-notification', async (req, res)=>{
    
    //extract payload from body
    const notificationID = ObjectId(req.query.notificationID)

    try{
        //check if notification exist
        let notificationObj = await database.db.collection(database.collection.logisticsNotifications).aggregate([
            {$match: {_id: notificationID}},
            {$limit: 1},
            {$lookup: {from: "users", localField: "from", foreignField: "primaryID", as: "from"}},
            {$unwind: "$from"}
        ]).toArray()

        if(notificationObj){
            //change notification read recipt to true
            await database.updateOne({_id: notificationObj._id}, database.collection.adminNotifications, {read: true})
            return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, notification: notificationObj}, true)
        }
        else{
           return utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this product does not exist"}, true)
        }
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }


})


module.exports = logisticsController