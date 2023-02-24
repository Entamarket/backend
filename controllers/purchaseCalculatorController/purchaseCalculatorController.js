const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const utilities = require("../../lib/utilities")

const purchaseCalculatorController = {}

purchaseCalculatorController.calculatePurchase = ('/calculate-purchase', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    const payload = JSON.parse(req.body)

    try{

        //check if payload is an array
        if(Array.isArray(payload)){
            const purchases = []
            let total = 0
        
            //loop through the array and validate each product
            for(let product of payload){
                if(utilities.checkoutValidator(product, ["productID", "quantity"]).isValid){
                    //check if the product is real and if it is real, get the product 
                    //const productObj = await database.findOne({_id: ObjectId(product.productID)})
                    let productObj = await database.db.collection(database.collection.products).aggregate([
                        {$match: {_id: ObjectId(product.productID)}},
                        {$lookup: {from: "users", localField: "owner", foreignField: "primaryID", as: "owner"}},
                        {$unwind: "$owner"}
                    ]).toArray()

                    productObj = productObj[0]

                    if(productObj){
                        //check if the stock of this product is greater than or equal to the payload quantity
                        if(product.quantity > 0 && product.quantity <= productObj.stock){
                            

                            //make a purchase object and fill it up
                            const purchase = {}
                            purchase.product = productObj
                            purchase.quantity = product.quantity
                            purchase.trader = productObj.owner.primaryID
                            purchase.purchasePrice = productObj.price * product.quantity
                            total += purchase.purchasePrice
                            purchases.push(purchase)

                        }
                        else{
                            //send response   
                            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `the quantity of productID: ${product.productID} should be greater than zero and less than or equal to the stock`}, true)
                            return
                        } 
                    }
                    else{
                        //send response   
                        utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: `productID: ${product.productID} does not exist in database`}, true)
                        return
                    }
  
                }
                else{
                    //send response   
                    utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, errorObj: utilities.checkoutValidator(product, ["productID", "noOfItems"])}, true)
                    return

                }

            }

            const logisticsFee = 1500
           
            let paymentGatewayFee = parseFloat(((1.4/100) * total).toFixed(2))
            let maintenanceFee = parseFloat(((1.1/100) * total).toFixed(2))
            
           total += (logisticsFee + paymentGatewayFee + maintenanceFee)

            const purchaseDetails = {logisticsFee, paymentGatewayFee, maintenanceFee, total, purchases: purchases}
            
            //send response   
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, purchaseDetails}, true)
            return

        }
        else{
            //send response   
            utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "payload must be an array"}, true)
            return
        }

    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server"}, true)
        return
    }
})

module.exports = purchaseCalculatorController