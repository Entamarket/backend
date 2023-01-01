const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")
const utilities = require("../../lib/utilities")
const userController = {}

userController.getUser = ("/get-user", async (req, res)=>{
    try{
        const decodedToken = req.decodedToken
        //get user data
        const userObj = await database.findOne({primaryID: ObjectId(decodedToken.userID)}, database.collection.users)

        if(userObj){
            //send response
            return utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, userData: userObj}, true)
        }
        else{
            //send response
            return utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this user does not exist"}, true)
        }

    }
    catch(err){
        console.log(err)
        return
    }
})

module.exports = userController