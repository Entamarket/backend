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

            // Add the shop username
            payload.username = payload.name.replace(/\s/g, "_") + "/" + ownerObj.username

            //Check if shop username exists
            const doesUsernameExist = await database.findOne({username: payload.username}, database.collection.shops, ['_id'], 1)
            if(!doesUsernameExist){
                //save shop
                const savedShop = await new Shop(payload).save()

                //update owners shopArray
                await database.db.collection(database.collection.traders).updateOne({_id: payload.owner}, {$addToSet: {shops: savedShop.insertedId}})

                //get shop object
                const shopObj = await database.findOne({_id: savedShop.insertedId}, database.collection.shops)

                //create newToken
                const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})

                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, shopData: shopObj, entamarketToken: newToken}, true )
            }
            else{
                //create newToken
                const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `You have a shop with this name already, try giving your new shop a name you haven't given any other shop`, entamarketToken: newToken}, true )
                return
            }
            
        }
        else{
            //create newToken
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data, all data should be in string format', entamarketToken: newToken}, true )
            return
        }
       
    }
    catch(err){
        console.log(err) 
        //create newToken
        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
})

shopController.updateShop = ('/update-shop', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken

    //Extract payload from body
    const payload = JSON.parse(req.body)
    const {shopID, ...rest} = payload
           
    try{
        //Check if data in body is valid
        if(utilities.validator(payload, ["name", "category", "shopID"]).isValid){
            //check if shop belongs to the trader
            const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops, ['owner', 'name', 'username'], 1)
            if(shopObj?.owner.toString() == decodedToken.userID){
                
                //check if shop name is similar to payload name
                if(shopObj.name !== payload.name){
                    //update the username
                    payload.name = payload.name.replace(/\s/g, '_')
                    rest.username = shopObj.username.replace(/[\w-]+(?=\/)/, payload.name)

                    //check if username already exists
                    const doesUsernameExist = await database.findOne({username: rest.username}, database.collection.shops, ['_id'], 1)
                    console.log(doesUsernameExist)

                    if(!doesUsernameExist){
                        //update the shop
                        await database.updateOne({_id: ObjectId(shopID)}, database.collection.shops, rest)
                        //create newToken
                        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
                        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true)
                    }
                    else{
                        //create newToken
                        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `You have a shop with this name already, try giving your new shop a name you haven't given any other shop`, entamarketToken: newToken}, true)

                    }
                    
                }
                else{
                    //update shop
                    await database.updateOne({_id: ObjectId(shopID)}, database.collection.shops, rest)
                    //create newToken
                    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
                    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true)
                }
                
            }
            else{
                //create newToken
                const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this shop doesn't belong to trader`, entamarketToken: newToken}, true )
                return
            }  
        }
        else{
            //create newToken
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data, all data should be in string format', entamarketToken: newToken}, true )
            return
        }
    }
    catch(err){
        console.log(err) 
        //create newToken
        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }

})

shopController.deleteShop = ('/delete-shop', async (req, res)=>{
    //Extract decoded token
    const decodedToken = req.decodedToken

    try{
        //get shopID from query param
        const shopID = req.query.shopID

        //check if shop belongs to the trader
        const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops, ['owner'], 1)
    
        if(shopObj?.owner?.toString() == decodedToken.userID){
            //delete the shop
            await database.deleteOne({_id: ObjectId(shopID)}, database.collection.shops)
        
            //create newToken
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true)
        }
        else{
            //create newToken
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this shop doesn't belong to trader`, entamarketToken: newToken}, true )
            return
        }  

    }
    catch(err){
        console.log(err) 
        //create newToken
        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }

    
})

module.exports = shopController