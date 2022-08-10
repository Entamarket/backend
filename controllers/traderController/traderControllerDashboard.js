//const fs = require('fs')
//const path = require('path')
const utilities = require('../../lib/utilities')
const database = require('../../lib/database')
const {ObjectId}  = require('mongodb')

const traderControllerDashboard = {}

traderControllerDashboard.home = ('/dashboard', async (req, res)=>{
  //extract the jwt
  const token = req.headers.authorization.split(' ')[1]
  //decode jwt
  const decodedToken = utilities.jwt('verify', token).decodedToken
  
  try{
    // Check if the id from the token exists
      
    let traderObj = await database.db.collection(database.collection.traders).aggregate([
      {$match: {_id: ObjectId(decodedToken.userID)}}, 
      {$lookup: {from: database.collection.shops, localField: "shops", foreignField: "_id", as: "shops"}},
      {$project: {password: 0}}
    ]).toArray()

    traderObj = traderObj[0]
    if(traderObj){
      traderObj._id = traderObj._id.toString()
      traderObj.accountBalance = traderObj.accountBalance.toString()
  
      //Get new token and send
      const newToken =  utilities.jwt('sign', {userID: traderObj._id, tokenFor: "trader"})
      utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, traderData: traderObj, entamarketToken: newToken}, true )
    }
    else{
      //create token 
      const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
      return
    }
  
  }
  catch(err){
    console.log(err)
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
  
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
  
})

traderControllerDashboard.deleteAccount = ('/delete-account', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //delete all shops owned by the trader
    await database.deleteMany({owner: ObjectId(decodedToken.userID)}, database.collection.shops)

    //delete trader multimedia folder
    //const dir = [__dirname, '..', '..', 'multimedia', 'traders', decodedToken.userID.toString()].join(path.sep)
    //await fs.promises.rmdir(dir, {recursive: true})
    
    //delete the account
    await database.deleteOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders)

    //response
    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "sucess"}, true)

  }
  catch(err){
    console.log(err) 
    //create newToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})   
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
    return
}
})

module.exports = traderControllerDashboard