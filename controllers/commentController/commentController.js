const {ObjectId}  = require('mongodb')
const fs = require('fs')
const path = require('path')
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
                const commentObj = await database.findOne({_id: savedComment.insertedId}, database.collection.comments)

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


module.exports = commentController