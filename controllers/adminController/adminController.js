const fs = require('fs')
const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")
const path = require('path')
const utilities = require("../../lib/utilities")
const notificationController = require('../notificationController/notificationController')
const email = require('../../lib/email')
require('dotenv').config()
const {S3Client, ListObjectsV2Command, DeleteObjectsCommand} = require('@aws-sdk/client-s3');




const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

const adminController = {}


adminController.getPendingDeliveries= ("/get-pending-deliveries", async (req, res)=>{
    let set = req.query.set
    let pendingDelivery;

    try{
        //get all delivery 5 at a time for now but later make it 20
        set = parseInt(set)
        const pendingDeliveryCount = await database.db.collection(database.collection.pendingDeliveries).countDocuments()
        const limit = 5

        if(typeof set === "number" && set >= 0 && (set * limit < pendingDeliveryCount)){
            pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).find().skip(set * limit).limit(limit).toArray()

            if(pendingDelivery.length > 0 ){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingDeliveries: pendingDelivery}, true)
                return

            }
            else{
                //send response
                utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
                return
            }
        }
        else{
            //send response
            utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
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


adminController.getSinglependingDelivery = ('/get-single-pending-delivery', async (req, res)=>{
    const checkoutID = ObjectId(req.query.checkoutID)

    try{
        let pendingDelivery = await database.db.collection(database.collection.pendingDeliveries).aggregate([
            {$match: {_id: checkoutID}},
            {$unwind: "$purchases"},
            {$lookup: {from: "users", localField: "purchases.trader", foreignField: "primaryID", as: "purchases.trader"}},
            {$unwind: "$purchases.trader"},
            {$lookup: {from: "products", localField: "purchases.product", foreignField: "_id", as: "purchases.product"}},
            {$unwind: "$purchases.product"},
            {$group: {_id: "$_id", buyer: {$first: "$buyer"}, postedAt: {$first: "$postedAt"}, purchases: {$push: "$purchases"}}}

        ]).toArray()

        pendingDelivery = pendingDelivery[0]
        if(pendingDelivery){
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingDelivery}, true)
            return
        }
        else{
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


adminController.getCounts = ('/get-counts', async (req, res)=>{
    
    try{ 
        const pendingDeliveryCount = await database.db.collection(database.collection.pendingDeliveries).countDocuments()
        const usersCount = await database.db.collection(database.collection.users).countDocuments({deleted : { $exists : false }})
        const tradersCount = await database.db.collection(database.collection.traders).countDocuments({deleted : { $exists : false }})
        const buyersCount = await database.db.collection(database.collection.buyers).countDocuments({deleted : { $exists : false }})
        const shopsCount = await database.db.collection(database.collection.shops).countDocuments({deleted : { $exists : false }})
        const productsCount = await database.db.collection(database.collection.products).countDocuments({deleted : { $exists : false }})

        const countObj = {pendingDeliveryCount, usersCount, tradersCount, buyersCount, shopsCount, productsCount}
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, dataCount: countObj}, true)
        return
        
    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})

adminController.getPendingWithdrawals = ('/get-pending-withdrawals', async (req, res)=>{
   
    const set = parseInt(req.query.set)
    const pendingWithdrawalsCount = await database.db.collection(database.collection.pendingWithdrawals).countDocuments()
    const limit = 5
    try{
        //get all pending witdrawals from the collection
        if(set >= 0 && (set * limit < pendingWithdrawalsCount)){
            const pendingWithdrawals = await database.db.collection(database.collection.pendingWithdrawals).find().skip(set*limit).limit(limit).toArray()

            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, pendingWithdrawals}, true)
            return
        }
        else{
            utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending withdrawals"}, true)
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


adminController.confirmWithdrawal = ('/confirm-withdrawal', async (req, res)=>{
   
    const pendingWithdrawalID = ObjectId(req.query.pendingWithdrawalID)
    try{
        //get pending withdrawal Object
        const pendingWithdrawalObj = await database.findOne({_id: pendingWithdrawalID}, database.collection.pendingWithdrawals, ["amount", "trader"], 1)

        if(pendingWithdrawalObj){
            //subtract amount from trader account balance
            await database.db.collection(database.collection.traders).updateOne({_id: pendingWithdrawalObj.trader._id}, {$inc: {accountBalance: -pendingWithdrawalObj.amount}}) 
            //delete pending withdrawal
            await database.deleteOne({_id: pendingWithdrawalID}, database.collection.pendingWithdrawals)

            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "sucess"}, true)
            return
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this pending withdrawal ID does not exist"}, true)
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

adminController.getNotifications = ("/get-notifications", async (req, res)=>{
   
    let set = req.query.set


    try{
        set = parseInt(set)
        const notificationCount = await database.db.collection(database.collection.adminNotifications).countDocuments()
        const limit = 5

        if(set >= 0 && (set * limit < notificationCount)){
            let notifications = await database.db.collection(database.collection.adminNotifications).aggregate([
                {$match: {}},
                {$sort: {_id: -1}},
                {$skip: set * limit},
                {$limit: limit},
                {$lookup: {from: "users", localField: "from", foreignField: "primaryID", as: "from"}},
                {$unwind: "$from"}
                
            ]).toArray()

 
            return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, notifications: notifications}, true)
        }
        else{
            return utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more notifications"}, true) 

        }

        
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})

adminController.viewNotification = ('/view-notification', async (req, res)=>{
    
    //extract payload from query
    const notificationID = ObjectId(req.query.notificationID)

    try{
        //check if notification exist
        let notificationObj = await database.db.collection(database.collection.adminNotifications).aggregate([
            {$match: {_id: notificationID}},
            {$limit: 1},
            {$lookup: {from: "users", localField: "from", foreignField: "primaryID", as: "from"}},
            {$unwind: "$from"}
        ]).toArray()

        if(notificationObj){
            //change notification read recipt to true
            await database.updateOne({_id: notificationObj._id}, database.collection.adminNotifications, {read: true})
            return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, notification: notificationObj}, true)
        }
        else{
           return utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this product does not exist"}, true)
        }
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }


})



adminController.viewTraderVerificationDocs = ('/view-trader-verification-docs', async (req, res)=>{
    
    try{
        //GET ALL UNVERIFIED TRDER DOCUMENTS
        const unverifiedTraderDocs = await database.findMany({verified:false}, database.collection.traderVerificationDocs).toArray()
        

        return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, unverifiedTraderDocs}, true)
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }


})


adminController.TraderVerificationDocsVerdict = ('/trader-verification-docs-verdict', async (req, res)=>{
    
    try{
        //extract payload from body
        let payload = JSON.parse(req.body)
        const userId = req.decodedToken.userID
        
        //CHECK IF DOCUMENTS WHERE APPROVED OR REJECTED
        const traderVerificationDocs = await database.findOne({_id: ObjectId(payload.id)}, database.collection.traderVerificationDocs)
            const trader =  await database.findOne({primaryID: traderVerificationDocs.owner}, database.collection.users)
        if(payload.approved){
            //UPDATE VERIFICATION STATUS
            await database.updateOne({_id: ObjectId(payload.id)}, database.collection.traderVerificationDocs, {verified: true})

            //SEND NOTIFICATION TO NOTIFY TRADER THAT VERIFICATION DOCS WERE APPROVED

            notificationController.send("Verification Approval", {msg: `Dear ${trader.fistName} Your verification documents have been approved. you can now create shops`}, userId, trader.primaryID)

            //SEND EMAIL ALSO TO NOTIFY TRADER
            const msg = `Dear customer, the Entamarket team is pleased to inform you that your verification 
            documents were approved and so you can now create shops. thanks for choosing Entamarket. ☺`

            await email.sendToUsers("entamarketltd@gmail.com", trader.email, "Verification Verdict", msg)

            return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "successfully verified"}, true)
        }
        else{
            //SEND NOTIFICATION TO NOTIFY TRADER THAT VERIFICATION DOCS WERE Not APPROVED

            notificationController.send("Verification Verdict", {msg: `Dear ${trader.fistName} Your verification documents were not approved. please make sure that the documents are in good shape and the pictures are clear`}, userId, trader.primaryID)

            //SEND EMAIL ALSO TO NOTIFY TRADER
            const msg = `Dear customer, your verification documents were not approved. 
            Please make sure you provide the required documents which are a picture of your ID card and a picture of any of your shop utility bill. 
            Please make sure that these images and their contents are clear and visible. 
            Thanks for choosing Entamarket.`
            await email.sendToUsers("entamarketltd@gmail.com", trader.email, "Verification Verdict", msg)

            //delete images from s3 bucket

            
                
            // List objects with the specified prefix
            const listParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Prefix: `verDoc_${traderVerificationDocs.owner.toString()}`,
            };
            const listCommand = new ListObjectsV2Command(listParams);
            const listResponse = await s3.send(listCommand);
              
            if (listResponse.Contents.length === 0) {
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "No files documents found"}, true)
                return;
            }
              
            // Prepare delete parameters
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: {
                    Objects: listResponse.Contents.map((item) => ({ Key: item.Key })),
                },
            };
            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            const deleteResponse = await s3.send(deleteCommand);
              
            console.log('Deleted files:', deleteResponse.Deleted);
                
            

            //DELETE THE DOCUMENT/RECORD FROM DATABASE
            await database.deleteOne({_id: traderVerificationDocs._id}, database.collection.traderVerificationDocs)
            return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "successfully disaproved"}, true)

        }

        
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }


})


module.exports = adminController