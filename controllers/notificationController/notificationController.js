const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const Notification = require("../../models/notification")
const AdminNotification = require("../../models/adminNotification")
const logisticsNotification = require("../../models/logisticsNotification")
const utilities = require("../../lib/utilities")
const LogisticsNotification = require('../../models/logisticsNotification')

const notificationController = {}

notificationController.send = (type, notificationObj, from, to)=>{
    return new Promise(async(resolve)=>{
        try{
            
            notificationObj.type = type
            notificationObj.from = from
            notificationObj.to = to
            
            
            if(type === "comment"){
                delete notificationObj.postedAt; //removed the addedAt property because there is already a notifiedOn property for the notification
                delete notificationObj.owner //removes the owner key incase it is part of the notification object
            } 
            if(type === "reaction"){
                delete notificationObj.reactedAt //removed the addedAt property because there is already a notifiedOn property for the notification
                delete notificationObj.owner //removes the owner key incase it is part of the notification object
            } 
            if(type === "purchase"){
                notificationObj.productID = notificationObj.product
                delete notificationObj.product
                delete notificationObj.buyer
                delete notificationObj.trader
            }
            
            const savedNotification = await new Notification(notificationObj).save()
            return resolve(savedNotification)
        }
        catch(err){
            throw err

        }
    })  
}


notificationController.sendToAdmin = (type, notificationObj, from, to)=>{
    return new Promise(async(resolve)=>{
        try{
            
            notificationObj.type = type
            notificationObj.from = from
            notificationObj.to = to
            
            const savedNotification = await new AdminNotification(notificationObj).save()
            return resolve(savedNotification)
        }
        catch(err){
            throw err

        }
    })  
}

notificationController.sendToLogistics = (type, notificationObj, from, to)=>{
    return new Promise(async(resolve)=>{
        try{
            
            notificationObj.type = type
            notificationObj.from = from
            notificationObj.to = to
            
            const savedNotification = await new LogisticsNotification(notificationObj).save() //AdminNotification(notificationObj).save()
            return resolve(savedNotification)
        }
        catch(err){
            throw err

        }
    })  
}

notificationController.get = (userID)=>{
    return new Promise(async (resolve) => {
        try{
            const notifications = await database.db.collection(database.collection.notifications).aggregate([
                {$match: {to: userID}},
                {$sort: {_id: -1}}, 
                {$limit: 5},
               {$lookup: {from: "users", localField: "from", foreignField: "primaryID", as: "from"}},
               {$unwind: "$from"}
                
            ]).toArray()

            return resolve(notifications)
        }
        catch(err){
            throw err
        }  
    })  
}


notificationController.getMore = ('/get-more-notifications', async (req, res)=>{
    
    //extract decoded token
    const decodedToken = req.decodedToken;
    
    let set = req.query.set


    try{
        set = parseInt(set)
        const notificationCount = await database.db.collection(database.collection.notifications).countDocuments({to: ObjectId(decodedToken.userID)})
        const limit = 5

        if(set >= 0 && (set * limit < notificationCount)){
            let notifications = await database.db.collection(database.collection.notifications).aggregate([
                {$match: {to: ObjectId(decodedToken.userID)}},
                {$sort: {_id: -1}},
                {$skip: set * limit},
                {$limit: limit},
                {$lookup: {from: "users", localField: "from", foreignField: "primaryID", as: "from"}}
                
            ]).toArray()

            notifications.forEach((notification, index) =>{
                notifications[index].from = notifications[index].from[0]
            })
 
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


notificationController.getProductViaNotification = ('/get-product-via-notification', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    //extract payload from body
    const notificationID = ObjectId(req.query.notificationID)

    try{
        //check if notification exist
        let notificationObj = await database.db.collection(database.collection.notifications).aggregate([
            {$match: {_id: notificationID}},
            {$limit: 1},
            {$lookup: {from: "users", localField: "from", foreignField: "primaryID", as: "from"}},
            {$lookup: {from: "products", localField: "productID", foreignField: "_id", as: "product"}}
        ]).toArray()

        if(notificationObj){
            notificationObj = notificationObj[0]
            notificationObj.from = notificationObj.from[0]
            notificationObj.product = notificationObj.product[0]
            

            //change notification read recipt to true
            await database.updateOne({_id: notificationObj._id}, database.collection.notifications, {read: true})
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

module.exports = notificationController