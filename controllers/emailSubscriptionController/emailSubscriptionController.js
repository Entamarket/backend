const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const utilities = require("../../lib/utilities")
const EmailDoc = require("../../models/emailDoc")

const emailSubscriptionController = {}



emailSubscriptionController.unsubscribe = ('/unsubscribe', async (req, res)=>{
    const email = req.query.email
    const id = req.query.id

    try{
        //check if email and id match
        let emailDoc = await database.db.collection(database.collection.emailList).aggregate([
            {$match: {owner: ObjectId(id)}},
            {$lookup: {from: "users", localField: "owner", foreignField: "primaryID", as: "owner"}},
            {$unwind: "$owner"}
        ]).toArray()
        

        if(emailDoc){
            emailDoc = emailDoc[0]
            console.log(emailDoc)
            console.log(email)
            
            //compare the emails
            if(emailDoc.owner.email == email){
                //delete emailDoc from email list
                database.deleteOne({owner: ObjectId(id)}, database.collection.emailList)

                //send response
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: `You have successfully unsubscribed from our mailing list`}, true )
                return
            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This email does not exist in our mailing list`}, true )
                return
            }

        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This email does not exist in our mailing list`}, true )
            return
        }

    }
    catch(err){
        console.log(err)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
        return
    }

    
    
})


emailSubscriptionController.subscribe = ('/subscribe', async (req, res)=>{
    const decodedToken = req.decodedToken

    try{
        await new EmailDoc({owner: ObjectId(decodedToken.userID)}).save()

        //send response
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: `You have successfully subscribed to our email list`}, true )
        return
    }
    catch(err){
        console.log(err)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
        return
    }
    
})

module.exports = emailSubscriptionController