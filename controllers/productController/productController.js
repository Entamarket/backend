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
            
            //add an array of image paths to the body of the product
            const imagePaths = []
            for(let image of req.files){
                image.path = image.path.split('\\').join('/')
                imagePaths.push(`https://www.entamarket-api.com/` + image.path)
            }

            // get shop category
            const shopObj = await database.findOne({_id: ObjectId(shopID)}, database.collection.shops, ['category'], 1)
            
            req.body.images = imagePaths
            req.body.owner = ObjectId(decodedToken.userID)
            req.body.shopID = ObjectId(shopID)
            req.body.category = shopObj.category

            //store the product
            const savedProduct = await new Product(req.body).save()

            // update shop products array
            await database.db.collection(database.collection.shops).updateOne({_id: ObjectId(shopID)}, {$addToSet: {products: savedProduct.insertedId}})

            //get product data
            const productObj = await database.findOne({_id: savedProduct.insertedId}, database.collection.products)

            //send new token
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, productData: productObj, entamarketToken: newToken}, true)

            
            
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

productController.updateProduct = ('/update-product', async(req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    
    try{
        //validate payload
        if(utilities.validator(req.body, ['name', 'price', 'description', 'stock']).isValid){
            // add the files array in the req if it is not empty
            if(req.files.length > 0){
                //add an array of image paths to the body of the product
                const imagePaths = []
                for(let image of req.files){
                    imagePaths.push(image.path)
                }

                req.body.images = imagePaths
            }
            //update product
            await database.updateOne({_id: ObjectId(req.query.productID)}, database.collection.products, req.body)

            //send new token
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true)

        }
        else{
            if(req.files.length > 0){
                //remove all the images stored
                for(let image of req.files){
                    await fs.promises.unlink(path.join(__dirname, '..', '..', image.path))
                }
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

productController.deleteProduct = ('/delete-product', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    const newToken = utilities.jwt('sign', {userID: decodedToken.userID, tokenFor: decodedToken.tokenFor})
    
    try{
        if(!(req.query.productID)) return utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `Invalid product ID`, entamarketToken: newToken}, true) 
        //check if product belong to the owner
        const productObj = await database.findOne({_id: ObjectId(req.query.productID)}, database.collection.products, ['images', 'owner', 'shopID'], 1)
        
        if(productObj?.owner.toString() === decodedToken.userID){
            //remove product from the product array in it's shop
            await database.db.collection(database.collection.shops).updateOne({_id: productObj.shopID}, {$pull:{products: productObj._id}})

            //remove product images from server
            for(let image of productObj.images){
                await fs.promises.unlink(path.join(__dirname, '..', '..', image))
            }

            //delete product from database
            await database.deleteOne({_id: productObj._id}, database.collection.products)

            //send new token
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, entamarketToken: newToken}, true)

        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `This product does not belong to this trader`, entamarketToken: newToken}, true)
        }

    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
    }
})

productController.getProduct = ('/get-product', async (req, res)=>{
    const productID = req.query.productID
    try{
        //check if product exists
        const productObj = await database.findOne({_id: ObjectId(productID)}, database.collection.products)

        if(productObj){
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, productData: productObj}, true)

        }
        else{
            utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 400, msg: "this product id does not exist"}, true) 
        }
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    }
    
})

module.exports = productController;