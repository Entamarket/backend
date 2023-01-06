const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const notificationController = require("../notificationController/notificationController")
const utilities = require("../../lib/utilities")

const deliveryController = {}


deliveryController.confirmDelivery = ('/confirm-delivery', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    //extract checkoutID
    const checkoutID = ObjectId(req.query.checkoutID)
    try{
         
        //Get the pendingDelivery object
        //let pendingDelivery = await database.findOne({_id: checkoutID}, database.collection.pendingDeliveries)

        let pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).aggregate([
            {$match: {_id: checkoutID}},
            {$unwind: "$purchases"},
            {$lookup: {from: "products", localField: "purchases.product", foreignField: "_id", as: "purchases.product"}},
            {$unwind: "$purchases.product"}
        ]).toArray()

        console.log(pendingDelivery)

        //check if delivery exists
        if(pendingDelivery){
            //check if user owns the delivery
            if(pendingDelivery[0].buyer.toString() === decodedToken.userID){
                //credit every traders account balance
                for(let delivery of pendingDelivery){
                    await database.db.collection(database.collection.traders).updateOne({_id: delivery.purchases.trader}, {$inc: {"accountBalance": parseInt(delivery.purchases.product.price) * delivery.purchases.noOfItems}})

                    //send traders delivery notification
                    const notificationObj = {
                        checkoutID: delivery._id,
                        trader: delivery.purchases.trader,
                        buyer: ObjectId(decodedToken.userID),
                        productID: delivery.purchases.product._id,
                        noOfItems: delivery.purchases.noOfItems,
                        moneyCredited: parseInt(delivery.purchases.product.price) * delivery.purchases.noOfItems 
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


module.exports = deliveryController