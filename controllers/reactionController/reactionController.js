const {ObjectId}  = require('mongodb')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')
const Reaction = require('../../models/reaction')
const Notification = require('../../models/notification')


const reactionController = {}

reactionController.addReaction = ('/add-reaction', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    try{
        
        //extract payload
        const payload = JSON.parse(req.body)
        //check if the data is valid
        if(utilities.validator(payload, ['reaction', 'productID']).isValid){
            
            //convert productID to an objectID
            payload.productID = ObjectId(payload.productID)

            //add owner of comment
            payload.owner = ObjectId(decodedToken.userID)

            //check if product exists
            const productObj = await database.findOne({_id: payload.productID}, database.collection.products, ['_id', 'owner'], 1)

            if(productObj){
                // check if the user has reacted before
                let hasUserReacted = await database.findOne({$and: [{productID: payload.productID}, {owner: payload.owner}]}, database.collection.reactions, ['_id'], 1)
                if(!hasUserReacted){
                    //store the comment
                    const savedReaction = await new Reaction(payload).save()

                    // update product reaction array
                    await database.db.collection(database.collection.products).updateOne({_id: payload.productID}, {$addToSet: {reactions: savedReaction.insertedId}})

                    //get reaction data

                    let reactionObj = await database.db.collection(database.collection.reactions).aggregate([
                        {$match: {_id: savedReaction.insertedId}}, 
                        {$lookup: {from: decodedToken.tokenFor +'s', localField: "owner", foreignField: "_id", as: "owner"}}
                    ]).toArray()

                    reactionObj = reactionObj[0]
                    reactionObj.owner = reactionObj.owner[0]
                    const owner = {}
                    for(data in reactionObj.owner){
                        if(data === '_id'|| data === 'firstName' || data === 'lastName' || data === 'username')
                        owner[data] = reactionObj.owner[data] 
                    }

                    reactionObj.owner = owner

                    //send notification
                    const notificationObj = {...reactionObj}
                    delete notificationObj.reactedAt //removed the addedAt property because there is already a notifiedOn property for the notification
                    notificationObj.type = 'reaction'
                    notificationObj.owner = productObj.owner

               await new Notification(notificationObj).save()

                    //send new token
                    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, reactionData: reactionObj, entamarketToken: newToken}, true)
    

                }
                else{
                    //send new token
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `You can only react once`, entamarketToken: newToken}, true)
                }
                
            }
            else{
                //send new token
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This product does not exist`, entamarketToken: newToken}, true)

            }
        }else{
            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid data`, entamarketToken: newToken}, true)  
        }
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
    
})


reactionController.updateReaction = ('/update-reaction', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let reactionID = req.query.reactionID
    try{
        //extract payload
        const payload = JSON.parse(req.body)
        //check if the data is valid
        if(utilities.validator(payload, ['reaction']).isValid){
            
            //convert reactionID from a string to an objectID
            reactionID = ObjectId(reactionID)

            //check if the user owns the reaction
            const reactionObj = await database.findOne({_id: reactionID}, database.collection.reactions)

            if(reactionObj?.owner.toString() === decodedToken.userID.toString()){

                // update reaction
                await database.updateOne({_id: reactionID}, database.collection.reactions, payload)

                let  updatedReactionObj = await database.db.collection(database.collection.reactions).aggregate([
                    {$match: {_id: reactionID}}, 
                    {$lookup: {from: decodedToken.tokenFor +'s', localField: "owner", foreignField: "_id", as: "owner"}}
                ]).toArray()

                updatedReactionObj = updatedReactionObj[0]
                updatedReactionObj.owner = updatedReactionObj.owner[0]
                const owner = {}
                for(data in updatedReactionObj.owner){
                    if(data === '_id'|| data === 'firstName' || data === 'lastName' || data === 'username')
                    owner[data] = updatedReactionObj.owner[data] 
                }

                updatedReactionObj.owner = owner

                //send new token
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, reactionData: updatedReactionObj, entamarketToken: newToken}, true)

            }
            else{
                //send new token
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't own this comment`, entamarketToken: newToken}, true)  
            }
  
        }else{
            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid data`, entamarketToken: newToken}, true)  
        }
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
    
})


reactionController.deleteReaction = ('/delete-reaction', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let reactionID = req.query.reactionID
    try{
            
        //convert reactionID to an objectID
        reactionID = ObjectId(reactionID)

        //check if the user owns the reaction
        const reactionObj = await database.findOne({_id: reactionID}, database.collection.reactions, ['_id', 'productID', 'owner'], 1)
        
        if(reactionObj?.owner.toString() === decodedToken.userID){

            // delete reaction
            await database.deleteOne({_id: reactionID},  database.collection.reactions)

            //remove reaction from reaction array in product
            await database.db.collection(database.collection.products).updateOne({_id: reactionObj.productID}, {$pull: {reactions: reactionID}})

            //send new token
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: 'success', entamarketToken: newToken}, true)

        }
        else{
            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't own this reaction`, entamarketToken: newToken}, true)  
        }
      
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
    
})

module.exports = reactionController