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
        if(utilities.addProductValidator(req.body, ['name', 'price', 'description', 'stock', "category"]).isValid){

            //add an array of image paths to the body of the product
            const imagePaths = []
            for(let image of req.files){
                imagePaths.push(`https://www.entamarket-api.com/` + image.path)
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
            //remove all the images stored
            for(let image of req.files){
                await fs.promises.unlink(path.join(__dirname, '..', '..', image.path))
            }

            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errorObj: utilities.addProductValidator(req.body, ['name', 'price', 'description', 'stock', "category"]), entamarketToken: newToken}, true)
            return
            
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
        if(utilities.addProductValidator(req.body, ['name', 'price', 'description', 'stock', "category"]).isValid){
            // add the files array in the req if it is not empty
            if(req.files.length > 0){
                //add an array of image paths to the body of the product
                const imagePaths = []
                for(let image of req.files){
                    imagePaths.push(`https://www.entamarket-api.com/` + image.path)
                }

                req.body.images = imagePaths
            }
            else{
                delete req.body.images
            }

            //update product
            await database.updateOne({$and:[{_id: ObjectId(req.query.productID)}, {deleted : { $exists : false }}]}, database.collection.products, req.body)
            //get updated product
            const updatedProduct = await database.findOne({_id: ObjectId(req.query.productID)}, database.collection.products)

            //send new token
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, updatedProductData: updatedProduct, entamarketToken: newToken}, true)

        }
        else{
            if(req.files.length > 0){
                //remove all the images stored
                for(let image of req.files){
                    await fs.promises.unlink(path.join(__dirname, '..', '..', image.path))
                }
            }

            //send new token
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: utilities.addProductValidator(req.body, ['name', 'price', 'description', 'stock', "category"]).msg, entamarketToken: newToken}, true)
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
            // for(let image of productObj.images){
            //     image = image.replace('https://www.entamarket-api.com/', '')
            //     await fs.promises.unlink(path.join(__dirname, '..', '..', image))
            // }

            //delete product from database
            await database.updateOne({_id: productObj._id}, database.collection.products, {deleted: true})

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
        let productObj = await database.db.collection(database.collection.products).aggregate([
            {$match: {_id: ObjectId(productID)}},
            {$lookup: {from: "users", localField: "owner", foreignField: "primaryID", as: "owner"}},
            {$unwind: "$owner"},
            {$lookup: {from: "shops", localField: "shopID", foreignField: "_id", as: "shop"}},
            {$unwind: "$shop"}
        ]).toArray()

        if(!productObj[0]?.deleted){
            productObj = productObj[0]
            const shop = {name: productObj.shop.name, username: productObj.shop.username, shopAddress: productObj.shop.shopAddress}
            productObj.shop = shop
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, productData: productObj}, true)

        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this product id does not exist"}, true) 
        }
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    }
    
})



productController.getAllTradersProducts = ('/get-all-traders-products', async (req, res)=>{
    const decodedToken = req.decodedToken;
    const traderID = ObjectId(decodedToken.userID)
    try{

        let products = await database.db.collection(database.collection.products).find({$and:[{owner: traderID}, {deleted : { $exists : false }}]}).sort({_id: -1}).toArray()


        if(products){
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, products}, true)

        }
        else{
            utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 400, msg: "No products available"}, true) 
        }
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
    }
    
})

module.exports = productController;