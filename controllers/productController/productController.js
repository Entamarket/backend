const path = require('path')
const fs = require('fs')
const {ObjectId}  = require('mongodb')
const Product = require('../../models/product')
const database = require('../../lib/database')
const utilities = require('../../lib/utilities')
const productController = {}

productController.addProduct = ('/add-product', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const shopID = req.query.shopID
    const newToken =  utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    try{
        //check if the data is valid
        if(utilities.validator(req.body, ['name', 'price', 'description', 'stock']).isValid){
            //check if the trader owns the shop
            const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops, ['owner'], 1)
            
            if(shopObj?.owner.toString() === decodedToken.userID){
                //add an array of image paths to the body of the product
                const imagePaths = []
                for(let image of req.files){
                    imagePaths.push(image.path)
                }

                req.body.images = imagePaths
                req.body.owner = ObjectId(decodedToken.userID)
                req.body.shopID = ObjectId(shopID)

                //store the product
                const savedProduct = await new Product(req.body).save()

                // update shop products array
                await database.db.collection(database.collection.shops).updateOne({_id: ObjectId(shopID)}, {$addToSet: {products: savedProduct.insertedId}})

                //get product data
                const productObj = await database.findOne({_id: savedProduct.insertedId}, database.collection.products)

                //send new token
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, productData: productObj, entamarketToken: newToken}, true)

            }else{
                //send new token
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This shop doesn't belong to the trader`, entamarketToken: newToken}, true)
            }
            
        }else{
            //remove all the images stored
            for(let image of req.files){
                await fs.promises.unlink(path.join(__dirname, '..', '..', image.path))
            }

            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid form data`, entamarketToken: newToken}, true)
            
        }
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
    

})

module.exports = productController;