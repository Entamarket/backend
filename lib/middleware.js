const {ObjectId}  = require('mongodb')
const fs = require('fs')
const utilities = require('./utilities')
const database = require('./database')
const multer = require('multer')
const path = require('path')
const express = require('express')
const router = express.Router()

const storage = multer.diskStorage({
    destination: async (req, file, cb)=>{
        const decodedToken = req.decodedToken
        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
        try{
            const userID = req.decodedToken.userID
            let shopID;    

            if(req.query.shopID) shopID = req.query.shopID
            else if (req.query.productID){
                const productObj = await database.findOne({_id: ObjectId(req.query.productID)}, database.collection.products, ['shopID'], 1)
                shopID = productObj.shopID.toString()
            }

            cb(null, path.join('multimedia', 'traders', userID, `shop-${shopID}`))

        }
        catch(err){
            utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: `Something went wrong with the server`, entamarketToken: newToken}, true )
            throw err
        }
        
        
    },

    filename: (req, file, cb)=>{
        let newName = new Date().getTime() + file.originalname
        newName = newName.normalize("NFD").replace(/[\u0300-\u036f()]/g, '')
        newName = newName.split(' ').join('_').toLowerCase()
        cb(null, newName) 
    }
}) 

const fileFilter = (req, file, cb)=>{
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
        cb(null, true)
    }
    else{
        cb({message: 'image format should be in jpeg, jpg or png'}, false)
        
    }
}

const upload = multer({
    storage: storage,
    limits: {fileSize: Math.pow(2, 20) * 6},
    fileFilter: fileFilter
}).array('images', 6)

const middleware = {}


middleware.bodyParser = (req, res, next)=>{
    let buffer = ''
    let exceededDataLimit = false
    req.on('data', (dataStream)=>{

        if(Buffer.byteLength(dataStream, 'utf8') > Math.pow(2, 24)){
            exceededDataLimit = true
        }
        buffer += dataStream
    })

    req.on('end', ()=>{
        if(!exceededDataLimit){
            req.body = buffer
            next()  
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg:'Data sent is too large'}, true )
            
        }
        
    })
}

// middleware.isJwtValid = async (req, res, next)=>{
  
//     try{
        
//         // Extract token
//         const token = req.headers.authorization?.split(' ')[1]

//         // Check if the token is valid
//         if(utilities.jwt('verify', token).isVerified){
//             //check if token is blacklisted
            
//             const isTokenBlacklisted = await database.findOne({token: token}, database.collection.tokenBlacklist, ["_id"], 1)
//             if(!isTokenBlacklisted){
//                 // add token in black list
//                 await database.insertOne({token: token, createdAt: new Date()}, database.collection.tokenBlacklist)
//                 next()
//             }
//             else{
//                 utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Unauthorized (BL)`}, true )
//             }
            
//         }
//         else{
//             utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Unauthorized`}, true )
//         }

//     }
//     catch(err){
//         utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: `Something went wrong with the server`}, true )
//         throw err
//     }
     
// }


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



middleware.isJwtValidNB = async (req, res, next)=>{
  
    try{
        
        // Extract token
        const token = req.headers.authorization?.split(' ')[1]

        // Check if the token is valid
        if(utilities.jwt('verify', token).isVerified){
            //check if token is blacklisted
            next()
              
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
    //extract decoded token
    const decodedToken = req.decodedToken

    if(utilities.isJSON(req.body)){
        next()
    }
    else{
        //check if there is token
        if(decodedToken){
            //create new token
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
            
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
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
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
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
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
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
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
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
            return
        }
    }
    else if(decodedToken.tokenFor == "logistics"){
        const buyerObj = await database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.logistics, ["_id"], 1)
    
        if(buyerObj){
            next()
        }
        else{
            //create token 
            const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
            return
        }
    }
    else{
        //create token 
        const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This user doesn't exist`, entamarketToken: newToken}, true )
        return

    }
}

middleware.uploads = router.post('/product/add-product', async (req, res, next)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    const shopID = req.query.shopID
    try{
        //check if the trader owns the shop
        
        const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops, ['owner'], 1)
        
        if(shopObj?.owner.toString() === decodedToken.userID){
            upload(req, res, (err)=>{
    
                if(err){
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: err.message, entamarketToken: newToken}, true )
                }
                else{
                
                    if(req.files.length > 0){
                        next()
                    }
                    else{
                        
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: 'no pictures added, make sure you add at least one picture of your product', entamarketToken: newToken}, true )
                    }
                    
                }
            })
        }
        else{
            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This shop doesn't belong to the trader`, entamarketToken: newToken}, true)
        }
        

    }
    catch(err){
        console.log(err)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: `Something went wrong with the server`, entamarketToken: newToken}, true )   
    }
    
})

middleware.multimedia = (req, res, next)=>{
    
    const mediaPath = req.path
    const regex = /(?<=\.)[a-zA-Z]+$/
    const contentType = 'image/' + mediaPath.match(regex)[0]
    //read file
    fs.readFile(path.join(__dirname, '..', 'multimedia', 'traders', mediaPath), (err, data)=>{
        if(!err && data){
            utilities.setResponseData(res, 200, {'content-type': contentType}, data, false)

        }
        else{
            utilities.setResponseData(res, 404, {'content-type': 'application/json'}, {statusCode: 404, msg: 'file not found'}, true )
        }
    })
}

middleware.updateUploads = router.put ('/product/update-product', async(req, res, next)=>{
    //ectract decoded token
    const decodedToken = req.decodedToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    try{
        //check if trader owns shop and product and check if product is an item in the shop
        const productObj = await database.findOne({_id: ObjectId(req.query.productID)}, database.collection.products, ['owner', 'shopID', 'images'], 1)
        
        if(decodedToken.userID ===  productObj?.owner.toString()){
            upload(req, res, async(err)=>{
                if(err){
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: err.message, entamarketToken: newToken}, true )
                }
                else{
                    next()
                    // if(req.files.length > 0){
                    //     // delete all old pictures of the product 
                    //     for(let image of productObj.images){
                    //         image = image.replace("https://www.entamarket-api.com/", "")
                    //         await fs.promises.unlink(path.join(__dirname, '..', image))
                    //     }
                    //     next()
                    // }
                    // else{
                    //     next()
                    // }
                
                }
            })
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `this trader doesn't own this shop or product or this product doesn't belong to this shop`, entamarketToken: newToken}, true )
        }

    }
    catch(err){
        console.log(err)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: `Something went wrong with the server`, entamarketToken: newToken}, true )   
    }
    
    
})

middleware.isTrader = async(req, res, next)=>{
    //ectract decoded token
    const decodedToken = req.decodedToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

    if(decodedToken.tokenFor === 'trader'){
        next()
    }
    else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Only traders can perform this task`, entamarketToken: newToken}, true ) 
    }

}

middleware.isAdmin = async(req, res, next)=>{
    //ectract decoded token
    const decodedToken = req.decodedToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})

    if(decodedToken.tokenFor === 'admin'){
        //check if admin id is valis
        const adminObj = database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.admins)
        if(adminObj){
            next()
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `invalid ID`, entamarketToken: newToken}, true ) 
        }
    }
    else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `You are not authorised to perform this task`, entamarketToken: newToken}, true ) 
    }
}


middleware.isLogistics = async(req, res, next)=>{
    //ectract decoded token
    const decodedToken = req.decodedToken
    

    if(decodedToken.tokenFor === 'logistics'){
        //check if admin id is valid
        const logisticsObj = database.findOne({_id: ObjectId(decodedToken.userID)}, database.collection.logistics)
        if(logisticsObj){
            next()
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `invalid ID`}, true ) 
        }
    }
    else{
        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `You are not authorised to perform this task`}, true ) 
    }
}



module.exports = middleware
