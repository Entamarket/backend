const {ObjectId}  = require('mongodb')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')
const Comment = require('../../models/comment')


const commentController = {}

commentController.addComment = ('/add-comment', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    try{
        //extract payload
        const payload = JSON.parse(req.body)
        //check if the data is valid
        if(utilities.validator(payload, ['text', 'productID']).isValid){
            
            //convert productID to an objectID
            payload.productID = ObjectId(payload.productID)

            //add owner of comment
            payload.owner = ObjectId(decodedToken.userID)

            //check if product exists
            const productObj = await database.findOne({_id: payload.productID}, database.collection.products, ['_id'], 1)

            if(productObj){
                //store the comment
                const savedComment = await new Comment (payload).save()

                // update product comments array
                await database.db.collection(database.collection.products).updateOne({_id: payload.productID}, {$addToSet: {comments: savedComment.insertedId}})

                //get comment data
                let commentObj = await database.db.collection(database.collection.comments).aggregate([
                    {$match: {_id: savedComment.insertedId}}, 
                    {$lookup: {from: decodedToken.tokenFor +'s', localField: "owner", foreignField: "_id", as: "owner"}}
                ]).toArray()

                commentObj = commentObj[0]
                commentObj.owner = commentObj.owner[0]
                const owner = {}
                for(data in commentObj.owner){
                    if(data === '_id'|| data === 'firstName' || data === 'lastName' || data === 'username')
                    owner[data] = commentObj.owner[data] 
                }

                commentObj.owner = owner
               // const commentObj = await database.findOne({_id: savedComment.insertedId}, database.collection.comments)

                //send new token
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, commentData: commentObj, entamarketToken: newToken}, true)
    
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


commentController.updateComment = ('/update-comment', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let commentID = req.query.commentID
    try{
        //extract payload
        const payload = JSON.parse(req.body)
        //check if the data is valid
        if(utilities.validator(payload, ['text']).isValid){
            
            //convert commentID to an objectID
            commentID = ObjectId(commentID)

            //check if the user owns the comment
            const commentObj = await database.findOne({_id: commentID}, database.collection.comments)

            if(commentObj?.owner.toString() === decodedToken.userID.toString()){

                // update comment
                await database.updateOne({_id: commentID}, database.collection.comments, payload)

                let  updatedCommentObj = await database.db.collection(database.collection.comments).aggregate([
                    {$match: {_id: commentID}}, 
                    {$lookup: {from: decodedToken.tokenFor +'s', localField: "owner", foreignField: "_id", as: "owner"}}
                ]).toArray()

                updatedCommentObj = updatedCommentObj[0]
                updatedCommentObj.owner = updatedCommentObj.owner[0]
                const owner = {}
                for(data in updatedCommentObj.owner){
                    if(data === '_id'|| data === 'firstName' || data === 'lastName' || data === 'username')
                    owner[data] = updatedCommentObj.owner[data] 
                }

                updatedCommentObj.owner = owner

                //const updatedCommentObj = await database.findOne({_id: commentID}, database.collection.comments)

                //send new token
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, commentData: updatedCommentObj, entamarketToken: newToken}, true)

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


commentController.deleteComment = ('/delete-comment', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    let commentID = req.query.commentID
    try{
            
        //convert commentID to an objectID
        commentID = ObjectId(commentID)

        //check if the user owns the comment
        const commentObj = await database.findOne({_id: commentID}, database.collection.comments, ['_id', 'productID', 'owner'], 1)
        console.log(commentObj)
        if(commentObj?.owner.toString() === decodedToken.userID){

            // delete comment
            await database.deleteOne({_id: commentID},  database.collection.comments)

            //remove comment from comment array in product
            await database.db.collection(database.collection.products).updateOne({_id: commentObj.productID}, {$pull:{comments: commentID}})

            //send new token
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: 'success', entamarketToken: newToken}, true)

        }
        else{
            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't own this comment`, entamarketToken: newToken}, true)  
        }
      
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
    
})


module.exports = commentController