const utilities = require('./utilities')
const database = require('./database')
const {ObjectId}  = require('mongodb')

const middleware = {}

middleware.isJwtValid = async (req, res, next)=>{
  
    try{
        
        // Extract token
        const token = req.headers.authorization?.split(' ')[1]

        // Check if the token is valid
        if(utilities.jwt('verify', token).isVerified){
            //check if token is blacklisted
            
            const isTokenBlacklisted = await database.findOne({token: token}, database.collection.tokenBlacklist, ["_id"], 1)
            if(!isTokenBlacklisted){
                // add token in black list
                await database.insertOne({token: token, createdAt: new Date()}, database.collection.tokenBlacklist)
                next()
            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Unauthorized (BL)`}, true )
            }
            
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Unauthorized`}, true )
        }

    }
    catch(err){
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: `Something went wrong with the server`}, true )
        throw err
    }
     
}

middleware.isJSON = (req, res, next)=>{
    const token = req.headers.authorization?.split(' ')[1]

    if(utilities.isJSON(req.body)){
        next()
    }
    else{
        //check if there is token
        if(token){
            //decode token
            const decodedToken = utilities.jwt('verify', token).decodedToken
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid format, payload should be in JSON format`, entamarketToken: newToken}, true )
        }
        else{
          
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid format, payload should be in JSON format`}, true )
        }
    }
}

middleware.decodeToken = (req, res, next)=>{
    const token = req.headers.authorization.split(' ')[1]
    req.decodedToken = utilities.jwt('verify', token).decodedToken
    next()
}

middleware.isTokenIdValid = async (req, res, next)=>{
    // extract decoded token
    const decodedToken = req.decodedToken
    if(decodedToken.tokenFor == "pendingTrader"){
        const pendingTraderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.pendingTraders, ["_id"], 1)
        if(pendingTraderObj){
            next()
        }
        else{
            //create token 
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "pendingTrader"})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
            return
        }
    }
    else if(decodedToken.tokenFor == "trader"){
        const traderObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.traders, ["_id"], 1)
        if(traderObj){
            next()
        }
        else{
            //create token 
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "trader"})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
            return
        }
    }
    else if(decodedToken.tokenFor == "pendingBuyer"){
        const pendingBuyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.pendingBuyers, ["_id"], 1)
        if(pendingBuyerObj){
            next()
        }
        else{
            //create token 
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "pendingBuyer"})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
            return
        }
    }
    else if(decodedToken.tokenFor == "buyer"){
        const buyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.buyers, ["_id"], 1)
        if(buyerObj){
            next()
        }
        else{
            //create token 
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: "buyer"})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
            return
        }
    }
}



module.exports = middleware