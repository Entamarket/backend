const fs = require('fs')
const path = require('path')
const utilities = require('../../lib/utilities')
const database = require('../../lib/database')
const {ObjectId}  = require('mongodb')

const traderControllerDashboard = {}

traderControllerDashboard.home = ('/dashboard', async (req, res)=>{
  
  // extract decoded token
  const decodedToken = req.decodedToken
  
  try{
    //extract trader object
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
      const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
      return
    }
  
  }
  catch(err){
    console.log(err)
    //create token 
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
  
})

/*traderControllerDashboard.updateProfile = ('/update-profile', async(req, res)=>{
  //get the decoded token
  const decodedToken = req.decodedToken
  //create token 
  const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
  let payload = JSON.parse(req.body)
  try{
    //Check if the data sent is valid
    if(utilities.validator(payload, ['firstName', 'lastName', 'username', 'email', 'phoneNumber']).isValid){

      //remove all white spaces from user data if any
      payload = utilities.trimmer(payload)

      //get trader object
      const traderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, ['firstName', 'lastName', 'username', 'email', 'phoneNumber'], 1)

      //check if email, username and phone number of the payload are the same with the trader object, if they are the same, leave them like that but if they are different make sure that they are unique
      const errorArray = []
      if(payload.username !== traderObj.username){
        // check if this username is unique
        const searchResult = await database.checkForExistingData(payload.username, 'username')
        if(!(searchResult.doesUserDetailExist)){
          //update the username of all shops owned by this trader
          await database.db.collection(database.collection.shops).updateMany(
            {owner: ObjectId(decodedToken.userID)},
            [
              {
                $set: {
                  username: {
                    $replaceOne: {
                      input: "$username", find: traderObj.username, replacement: payload.username
                    }
                  }
                }
              }
            ]
          )

        } 
        else{
          errorArray.push(searchResult)
        }
      }
      
      if(errorArray.length < 1 && payload.email !== traderObj.email){
        // check if this email is unique
        const searchResult = await database.checkForExistingData(payload.email, 'email')
        if(searchResult.doesUserDetailExist) errorArray.push(searchResult)
      }

      if(errorArray.length < 1 && payload.phoneNumber !== traderObj.phoneNumber){
        // check if this phone number is unique
        const searchResult = await database.checkForExistingData(payload.phoneNumber, 'phoneNumber')
        if(searchResult.doesUserDetailExist) errorArray.push(searchResult)
      }
      
      if(errorArray.length < 1){
        //update the trader profile
        await database.updateOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, payload)

        //send token
        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true )

      }
      else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This ${errorArray[0].userDetail}`, entamarketToken: newToken}, true )
        return
      }
    }
    else{
      utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid data`, entamarketToken: newToken}, true )
      return
    }

  }
  catch(err){
    console.log(err)
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server', entamarketToken: newToken}, true )
    return
  }
})*/

traderControllerDashboard.deleteAccount = ('/delete-account', async (req, res)=>{
  //extract decoded token
  const decodedToken = req.decodedToken
  try{
    //delete all shops owned by the trader
    await database.deleteMany({owner: ObjectId(decodedToken.userID)}, database.collection.shops)

    //delete all products owned by the trader
    await database.deleteMany({owner: ObjectId(decodedToken.userID)}, database.collection.products)
    //delete trader multimedia folder
    const dir = [__dirname, '..', '..', 'multimedia', 'traders', decodedToken.userID.toString()].join(path.sep)
    await fs.promises.rmdir(dir, {recursive: true})
    
    //delete the account
    await database.deleteOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders)

    //response
    utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, msg: "sucess"}, true)

  }
  catch(err){
    console.log(err) 
    //create newToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})   
    utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
    return
  }
})

module.exports = traderControllerDashboard