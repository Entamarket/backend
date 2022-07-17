const utilities = require('./utilities')
const database = require('./database')
const middleware = {}

middleware.isJwtValid = async (req, res, next)=>{
  
    try{
        
        // Extract token
        const token = req.headers.authorization.split(' ')[1]

        // Check if the token is valid
        if(utilities.jwt('verify', token).isVerified){
            //check if token is blacklisted
            
            const isTokenBlacklisted = await database.findOne({token: token}, database.collection.tokenBlacklist, ["_id"])
            if(!isTokenBlacklisted){
                // add token in black list
                await database.insertOne({token: token, createdAt: new Date()}, database.collection.tokenBlacklist)
                next()
            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Unauthorized blacklist`}, true )
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

module.exports = middleware