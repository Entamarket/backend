const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const Notification = require("../../models/notification")
const utilities = require("../../lib/utilities")

const notificationController = {}

notificationController.send = (type, notificationObj, from, to)=>{
    return new Promise(async(resolve)=>{
        try{
            notificationObj.type = type
            notificationObj.from = from
            notificationObj.to = to
            if(type === "comment") delete notificationObj.postedAt; //removed the addedAt property because there is already a notifiedOn property for the notification
            if(type === "reaction") delete notificationObj.reactedAt //removed the addedAt property because there is already a notifiedOn property for the notification
            delete notificationObj.owner //removes the owner key incase it is part of the notification object
            const savedNotification = await new Notification(notificationObj).save()
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
                {$limit: 5},
                {$sort: {_id: -1}}
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
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let set = req.query.set
    let notifications;

    try{
        set = parseInt(set)
        const notificationCount = await database.db.collection(database.collection.notifications).countDocuments({to: ObjectId(decodedToken.userID)})
        const limit = 10

        if(set >= 0 && (set * limit < notificationCount)){
            notifications = await database.db.collection(database.collection.notifications).find({to: ObjectId(decodedToken.userID)}).skip(set * limit).limit(limit).sort({_id: -1}).toArray()
        }
        else{
            return utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more notifications", entamarketToken: newToken}, true) 

        }

        return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, notifications: notifications, entamarketToken: newToken}, true)
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
})
module.exports = notificationController