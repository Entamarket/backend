const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")
const email = require('../../lib/email')
const CSDocument = require("../../models/csDocument")
const notification = require("../notificationController/notificationController")

const utilities = require("../../lib/utilities")

const customerSupportController = {}



customerSupportController.send = ('/send', async (req, res)=>{
    //get payload
    const payload = JSON.parse(req.body)
    const userID = ObjectId(req.decodedToken.userID)
    console.log(req.decodedToken)
    try{
        //validate payload
        if(utilities.costomerSupportValidator(payload, ["fullName", "email", "message"]).isValid){
            payload.user = userID
            payload.userAccountType = req.decodedToken.tokenFor 
            //send to customer care support collection
            await new CSDocument(payload).save()

            //send notification
            await notification.sendToAdmin("customer-support", payload, userID, "admin")


            //send email to admin
            let admins = await database.db.collection(database.collection.admins).find().toArray()

            for(let i of admins){
                console.log(i.email)
                await email.send(payload.email, i.email, payload.message, payload.fullName)
            }
            
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "success"}, true)
            return
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errObj: utilities.costomerSupportValidator(payload, ["fullName", "email", "message"])}, true)
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


customerSupportController.getAll = ('/get-all', async (req, res)=>{
    
    const set = parseInt(req.query.set)
    const csDocumentsCount = await database.db.collection(database.collection.CSDocuments).countDocuments()
    const limit = 5
    try{
        //get all pending witdrawals from the collection
        if(set >= 0 && (set * limit < csDocumentsCount)){
            const csDocuments = await database.db.collection(database.collection.CSDocuments).find().skip(set*limit).limit(limit).toArray()

            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, csDocuments}, true)
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


customerSupportController.getOne = ('/get-one', async (req, res)=>{
    
    const csID = ObjectId(req.query.csID)

    try{
        let csDocument = await database.findOne({_id: csID}, database.collection.CSDocuments)
            
        if(csDocument){
            //send document  
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, csData: csDocument}, true)
            return
        }
        else{
            //response   
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "document does not exist"}, true)
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


customerSupportController.close = ('/close', async (req, res)=>{
    
    const csID = ObjectId(req.query.csID)

    try{
        await database.deleteOne({_id: csID}, database.collection.CSDocuments)
              
        //send document  
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "success"}, true)
        return   

    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})

module.exports = customerSupportController