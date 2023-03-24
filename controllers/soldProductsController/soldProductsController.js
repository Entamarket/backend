const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")
const utilities = require("../../lib/utilities")

const soldProductsController = {}


soldProductsController.getSoldProducts = ('/get-sold-products', async (req, res)=>{
    const decodedToken = req.decodedToken
    const traderID = ObjectId(decodedToken.userID)
    let set = req.query.set

    try{
        //get all sold products 5 at a time for now but later make it 20
        set = parseInt(set)
        const soldProductsCount = await database.db.collection(database.collection.soldProducts).countDocuments({trader: traderID})
        const limit = 5

        if(typeof set === "number" && set >= 0 && (set * limit < soldProductsCount)){
            let soldProducts = await database.db.collection(database.collection.soldProducts).find({trader: traderID}).sort({_id: -1}).skip(set * limit).limit(limit).toArray()

            if(soldProducts.length > 0 ){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, soldProducts}, true)
                return
            }
            else{
                //send response
                utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
                return
            }
        }
        else{
            //send response
            utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more pending deliveries"}, true)
            return
        }
        
    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }

})



soldProductsController.getSingleSoldProduct = ('/get-single-sold-product', async (req, res)=>{
    const decodedToken = req.decodedToken
    const traderID = ObjectId(decodedToken.userID)
    const soldProductID = ObjectId(req.query.soldProductID)

    try{
        let soldProduct = await database.db.collection(database.collection.soldProducts).aggregate([
            {$match: {_id: soldProductID}},
            {$lookup: {from: "users", localField: "buyer", foreignField: "primaryID", as: "buyer"}},
            {$unwind: "$buyer"},
            {$lookup: {from: "products", localField: "product", foreignField: "_id", as: "product"}},
            {$unwind: "$product"}

        ]).toArray()

        soldProduct = soldProduct[0]
        if(soldProduct){
            
            //check if trader owns this delivery
            if(traderID.toString() === soldProduct.trader.toString()){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, soldProduct}, true)
                return
            }
            else{
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "This trader does not own this sold-product"}, true)
                return
            }
            
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "this sold-product data does not exist"}, true)
            return
        }   

    }
    catch(err){
        console.log(err) 
        //response   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})



module.exports = soldProductsController