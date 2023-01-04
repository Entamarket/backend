const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const notificationController = require("../notificationController/notificationController")
const PendingDelivery = require("../../models/pendingDelivery")
const utilities = require("../../lib/utilities")

const checkoutController = {}


checkoutController.checkout = ('/get-checkout', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    const logisticsID = "1234abcd"
    try{
        //get cart
        let cart = await database.db.collection(database.collection.carts).aggregate([
            {$match: {owner: ObjectId(decodedToken.userID)}},
            {$lookup: {from: "products", localField: "products", foreignField: "_id", as: "products"}}
        ]).toArray()

        cart = cart[0]

        //const cart = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.)
        const purchases = []
        cart.products.forEach(async (product)=>{
            const purchase = {}
            //add buyerID
            purchase.product = product._id
            purchase.buyer = ObjectId(decodedToken.userID)
            purchase.trader = product.owner
            purchases.push(purchase)
            //store in pending deliveries
            await new PendingDelivery(purchase).save()
            //send notification to trader
            await notificationController.send("purchase", {...purchase}, ObjectId(decodedToken.userID), product.owner)

        })

        //send notification to logistics
        await notificationController.send("purchase", {purchases: purchases}, ObjectId(decodedToken.userID), logisticsID)
   
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
})


module.exports = checkoutController