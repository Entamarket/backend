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


notificationController.getMore = ('/get-more-notifications', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let set = req.query.set

    try{
        page = parseInt(page)
        const productCount = await database.db.collection('products').countDocuments()
        const limit = 20

        if(page && page >= 0 && (page * limit < productCount)){
            products = await database.db.collection('products').find().skip(page * limit).limit(limit).toArray()
        }
        else{
            products = await database.db.collection('products').find().limit(limit).toArray() 

        }

        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, products: products}, true)
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
})
module.exports = notificationController