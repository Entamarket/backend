const {ObjectId}  = require('mongodb')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')
const shopController = {}
const Shop = require('../../models/shop')

shopController.createShop = ('/create-shop', async (req, res)=>{
    try{
        //Extract decoded token
        const decodedToken = req.decodedToken

        //Extract payload from body
        const payload = JSON.parse(req.body)

        //Check if data in body is valid
        if(utilities.validator(payload, ["name", "category"]).isValid){

            //add shop owner details to payload
            payload.owner = ObjectId(decodedToken.userID)
            const ownerObj = await database.findOne({_id: payload.owner}, database.collection.traders, ['username'], 1)
            console.log(ownerObj)

            // Add the shop username
            payload.username = payload.name.replace(" ", "_") + "/" + ownerObj.username

            //save shop
            const savedShop = await new Shop(payload).save()

            //update owners shopArray
            await database.db.collection(database.collection.traders).updateOne({_id: payload.owner}, {$addToSet: {shops: savedShop.insertedId}})

            //create newToken
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})

            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )

        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data, all data should be in string format'}, true )
            return
        }
       
    }
    catch(err){
        console.log(err)    
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
    

})

module.exports = shopController