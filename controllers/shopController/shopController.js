const {ObjectId}  = require('mongodb')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')
const Shop = require('../../models/shop')

const shopController = {}

shopController.createShop = ('/create-shop', async (req, res)=>{
    //Extract decoded token
    const decodedToken = req.decodedToken

    let newShopID;
    try{

        //Extract payload from body
        const payload = JSON.parse(req.body)

        //create newToken
        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})

        //Check if data in body is valid
        if(utilities.createShopValidator(payload, ["name", "shopAddress"]).isValid){

            //CHECK IF TRADER HAS VERIFIED DOCUMENTS
            const verificationDocs = await database.findOne({owner: ObjectId(decodedToken.userID)}, database.collection.traderVerificationDocs)
            if(!verificationDocs){
                utilities.setResponseData(res, 401, {'content-type': 'application/json'}, {statusCode: 401, msg: `Please verify your account by uploading a picture of your ID card and utility bill`, entamarketToken: newToken}, true )
                return
            }

            if(!verificationDocs.verified){
                utilities.setResponseData(res, 401, {'content-type': 'application/json'}, {statusCode: 401, msg: `Your verification is pending please be patient`, entamarketToken: newToken}, true )
                return
            }

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
                newShopID = savedShop.insertedId.toString()

                //update owners shopArray
                await database.db.collection(database.collection.traders).updateOne({_id: payload.owner}, {$addToSet: {shops: savedShop.insertedId}})
                 

                //get shop object
                const shopObj = await database.findOne({_id: savedShop.insertedId}, database.collection.shops)


                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, shopData: shopObj, entamarketToken: newToken}, true )
            }
            else{
               
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
        //delete shop from data base
        await database.deleteOne({_id: ObjectId(newShopID)}, database.collection.shops)

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
        if(utilities.validator(payload, ["name", "shopAddress", "shopID"]).isValid){
            //check if shop belongs to the trader
            const shopObj = await database.findOne({$and: [{_id: ObjectId(shopID)}, {deleted : { $exists : false }}]}, database.collection.shops, ['owner', 'name', 'username'], 1)
            if(shopObj?.owner.toString() == decodedToken.userID){
                
                //check if shop name is similar to payload name
                if(shopObj.name !== payload.name){
                    //update the username
                    payload.name = payload.name.replace(/\s/g, '_')
                    rest.username = shopObj.username.replace(/[\w-]+(?=\/)/, payload.name)

                    //check if username already exists
                    const doesUsernameExist = await database.findOne({username: rest.username}, database.collection.shops, ['_id'], 1)

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
            //Remove ID from trader shop array
            await database.db.collection(database.collection.traders).updateOne({_id: ObjectId(decodedToken.userID)}, {$pull: {shops: ObjectId(shopID)}})

            //delete all products in the shop

            await database.updateMany({shopID: ObjectId(shopID)}, database.collection.products, {deleted: true})
            
            //delete the shop
            await database.updateOne({_id: ObjectId(shopID)}, database.collection.shops, {deleted: true})
        
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

shopController.getShop = ('/get-shop', async (req, res)=>{
    //extract decoded token shopID and make a new token
    const decodedToken = req.decodedToken
    const shopID = req.query.shopID
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})

    try{
        // get shop object
        //const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops)
        let shopObj = await database.db.collection(database.collection.shops).aggregate([
            {$match: {$and:[{_id: ObjectId(shopID)}, {deleted : { $exists : false }}]}}, 
            {$lookup: {from: database.collection.products, localField: "products", foreignField: "_id", as: "products"}}
        ]).toArray()

        shopObj = shopObj[0]

        //check if trader owns the shop
        if(shopObj && shopObj.owner.toString() === decodedToken.userID){
            //send the shop object with all the products
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, shopData: shopObj, entamarketToken: newToken}, true)
        }
        else{
            //send newToken
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this shop doesn't belong to trader or this shop doesn't exist`, entamarketToken: newToken}, true )
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



shopController.addToFavouriteShops = ('/add-to-favourite-shops', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken

    //create newToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

    //Extract payload from body
    const payload = JSON.parse(req.body)
    const shopID = payload.shopID
           
    try{
        //Check if data in body is valid
        if(utilities.validator(payload, ["shopID"]).isValid){

            //check if shop exists
            const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops, ['_id', 'name', 'username'], 1)

            if(shopObj){
                //add shop to favourite shop array of user
                await database.db.collection(decodedToken.tokenFor + 's').updateOne({_id: ObjectId(decodedToken.userID)}, {$addToSet: {favouriteShops: ObjectId(shopID)}})
                
                //send token
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, shopData: shopObj, entamarketToken: newToken}, true)
            }
            else{
                
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this shop doesn't exist`, entamarketToken: newToken}, true )
                return
            }  
        }
        else{
            // send token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data, all data should be in string format', entamarketToken: newToken}, true )
            return
        }
    }
    catch(err){
        console.log(err) 
        //send newToken
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }

})


shopController.removeFromFavouriteShops = ('/remove-from-favourite-shops', async (req, res)=>{

    //Extract decoded token
    const decodedToken = req.decodedToken

    //create newToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

    //Extract shopID from query-param
    const shopID = req.query.shopID
           
    try{
        //Check if data in body is valid
        if(utilities.validator({shopID: shopID}, ["shopID"]).isValid){

            //check if shop exists
            const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops, ['_id'], 1)

            if(shopObj){
                //remove shop from favourite shop array of user
                await database.db.collection(decodedToken.tokenFor + 's').updateOne({_id: ObjectId(decodedToken.userID)}, {$pull: {favouriteShops: ObjectId(shopID)}})

                //send token
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: 'sucess', entamarketToken: newToken}, true)
            }
            else{
                
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this shop doesn't exist`, entamarketToken: newToken}, true )
                return
            }  
        }
        else{
            // send token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'Invalid data, all data should be in string format', entamarketToken: newToken}, true )
            return
        }
    }
    catch(err){
        console.log(err) 
        //send newToken
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }

})

shopController.getShopUnauth = ('/get-shop-unauth', async (req, res)=>{
    const shopID = req.query.shopID
    try{
        //check if product exists
        const shopObj = await database.findOne({$and: [{_id: ObjectId(shopID)}, {deleted : { $exists : false }}]}, database.collection.shops)

        if(shopObj){
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, shopData: shopObj}, true)

        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this shop does not exist"}, true) 
        }
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    }
    
})



shopController.getShopProfile = ('/shop', async (req, res)=>{

    try{
        //extract shop username
        const path = req.path;
        const shopUsername = path.substring(6)

        //get shop  
        let shopObj = await database.db.collection(database.collection.shops).aggregate([
            {$match: {$and: [{username: shopUsername}, {deleted : { $exists : false }}]}},
            {$lookup: {from: database.collection.users, localField: "owner", foreignField: "primaryID", as: "owner"}},
            {$unwind: "$owner"}, 
            {$lookup: {from: database.collection.products, localField: "products", foreignField: "_id", as: "products"}}
        ]).toArray()

        if(shopObj.length > 0){
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, shopData: shopObj[0]}, true)
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "shop username does not exist"}, true)
        }

    }
    catch(err){
        console.log(err)   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})

module.exports = shopController
