const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const utilities = require("../../lib/utilities")


const adminController = {}


adminController.getPendingDeliveries= ("/get-pending-deliveries", async (req, res)=>{
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


adminController.getSinglependingDelivery = ('/get-single-pending-delivery', async (req, res)=>{
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


adminController.getCounts = ('/get-counts', async (req, res)=>{
    
    try{ 
        const pendingDeliveryCount = await database.db.collection(database.collection.pendingDeliveries).countDocuments()
        const usersCount = await database.db.collection(database.collection.users).countDocuments({deleted : { $exists : false }})
        const tradersCount = await database.db.collection(database.collection.traders).countDocuments({deleted : { $exists : false }})
        const buyersCount = await database.db.collection(database.collection.buyers).countDocuments({deleted : { $exists : false }})
        const shopsCount = await database.db.collection(database.collection.shops).countDocuments({deleted : { $exists : false }})
        const productsCount = await database.db.collection(database.collection.products).countDocuments({deleted : { $exists : false }})

        const countObj = {pendingDeliveryCount, usersCount, tradersCount, buyersCount, shopsCount, productsCount}
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

adminController.getPendingWithdrawals = ('/get-pending-withdrawals', async (req, res)=>{
   
    const set = parseInt(req.query.set)
    const pendingWithdrawalsCount = await database.db.collection(database.collection.pendingWithdrawals).countDocuments()
    const limit = 5
    try{
        //get all pending witdrawals from the collection
        if(set >= 0 && (set * limit < pendingWithdrawalsCount)){
            const pendingWithdrawals = await database.db.collection(database.collection.pendingWithdrawals).find().skip(set*limit).limit(limit).toArray()

            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingWithdrawals}, true)
            return
        }
        else{
            utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending withdrawals"}, true)
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


adminController.confirmWithdrawal = ('/confirm-withdrawal', async (req, res)=>{
   
    const pendingWithdrawalID = ObjectId(req.query.pendingWithdrawalID)
    try{
        //get pending withdrawal Object
        const pendingWithdrawalObj = await database.findOne({_id: pendingWithdrawalID}, database.collection.pendingWithdrawals, ["amount", "trader"], 1)

        if(pendingWithdrawalObj){
            //subtract amount from trader account balance
            await database.db.collection(database.collection.traders).updateOne({_id: pendingWithdrawalObj.trader._id}, {$inc: {accountBalance: -pendingWithdrawalObj.amount}}) 
            //delete pending withdrawal
            await database.deleteOne({_id: pendingWithdrawalID}, database.collection.pendingWithdrawals)

            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "sucess"}, true)
            return
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this pending withdrawal ID does not exist"}, true)
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

adminController.getNotifications = ("/get-notifications", async (req, res)=>{
   
    let set = req.query.set


    try{
        set = parseInt(set)
        const notificationCount = await database.db.collection(database.collection.adminNotifications).countDocuments()
        const limit = 5

        if(set >= 0 && (set * limit < notificationCount)){
            let notifications = await database.db.collection(database.collection.adminNotifications).aggregate([
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

adminController.viewNotification = ('/view-notification', async (req, res)=>{
    
    //extract payload from body
    const notificationID = ObjectId(req.query.notificationID)

    try{
        //check if notification exist
        let notificationObj = await database.db.collection(database.collection.adminNotifications).aggregate([
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


module.exports = adminController