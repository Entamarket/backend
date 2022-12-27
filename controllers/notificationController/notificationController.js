const Notification = require("../../models/notification")

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
module.exports = notificationController