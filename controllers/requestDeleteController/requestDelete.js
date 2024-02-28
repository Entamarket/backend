const database = require("../../lib/database");
const utilities = require("../../lib/utilities");

const requestDeleteAccount = {}

requestDeleteAccount.deleteAccount = ('/request-account-delete', async (req, res)=>{
    //extract payload
    let payload = JSON.parse(req.body)

    try{
        //check if user exist
    const user = await database.findOne({$and:[{email: payload.email}, {deleted : { $exists : false }}]}, payload.accountType, ["_id", "password"], 1)
        if(user){
            // check if password matches
            payload.password = utilities.dataHasher(payload.password)
            if(payload.password == user.password){

                if(payload.accountType.toLowerCase() == "traders"){
                    //delete all shops owned by the trader
                    await database.updateMany({owner: user._id}, database.collection.shops, {deleted: true})
        
                    //delete all products owned by the trader
                    await database.updateMany({owner: user._id}, database.collection.products, {deleted: true})
                    
              
                    //delete all notifications to trader
                    await database.deleteMany({$or: [{to: user._id}, {from: user._id}]}, database.collection.notifications)
        
                    //delete the account from traders collection
                    await database.updateOne({_id: user._id}, database.collection.traders, {deleted: true})

                }
                else if(payload.accountType.toLowerCase() == "buyers"){

                    //delete all notifications to trader
                    await database.deleteMany({$or: [{to: user._id}, {from: user._id}]}, database.collection.notifications)
                    //delete account from buyers collection
                    await database.updateOne({_id: user._id}, database.collection.buyers, {deleted: true})

                }
                else{
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid accountType"}, true)
                    return
                }
            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid username or password"}, true)
                return
            }
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid username or password"}, true)
            return
        }
        
      
      //delete all comments
      await database.deleteMany({owner: user._id}, database.collection.comments)
      //delete all reactions
      await database.deleteMany({owner: user._id}, database.collection.reactions)
      //delete the account from users collection
      await database.updateOne({primaryID: user._id}, database.collection.users, {deleted: true})
      //delete account from mail list
      await database.deleteOne({owner: user._id}, database.collection.emailList)
      
  
      //response
      utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "sucess"}, true)
  
    }
    catch(err){
      console.log(err)  
      utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
      return
    }
})

module.exports = requestDeleteAccount