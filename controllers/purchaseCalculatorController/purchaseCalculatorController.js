const {ObjectId}  = require('mongodb')
const database = require("../../lib/database")

const utilities = require("../../lib/utilities")
const {islandPrice, mainLandPrice, paymentGatewayMaxThreshold, paymentGatewayLv1Threshold, maxThresholdFee, lv0ThresholdFee, lv1ThresholdFee, small, medium, large, xlFactor} = require("../../lib/variables")

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
            let weight = 0
            
            let buyerDetails = payload.pop()
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
                        if(product.quantity > 0 && product.quantity <= parseInt(productObj.stock)){
                            

                            //make a purchase object and fill it up
                            const purchase = {}
                            purchase.product = productObj
                            purchase.quantity = product.quantity
                            purchase.trader = productObj.owner.primaryID
                            purchase.purchasePrice = parseInt(productObj.price) * product.quantity
                            total += purchase.purchasePrice
                            weight += parseFloat(productObj.weight) * product.quantity
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

            let logisticsFee;
            if(weight >= 0 && weight <=2){
                if(buyerDetails.location.toLowerCase() == "island"){
                    logisticsFee = islandPrice + small;
                }
                else if(buyerDetails.location.toLowerCase() == "mainland"){
                    logisticsFee = mainLandPrice + small;
                }
                else{
                    logisticsFee = 0;
                }
            }

            else if(weight >= 2.1 && weight <=7){
                if(buyerDetails.location.toLowerCase() == "island"){
                    logisticsFee = islandPrice + medium;
                }
                else if(buyerDetails.location.toLowerCase() == "mainland"){
                    logisticsFee = mainLandPrice + medium;
                }
                else{
                    logisticsFee = 0;
                }
            }

            else if(weight >= 7.1 && weight <=10){
                if(buyerDetails.location.toLowerCase() == "island"){
                    logisticsFee = islandPrice + large;
                }
                else if(buyerDetails.location.toLowerCase() == "mainland"){
                    logisticsFee = mainLandPrice + large;
                }
                else{
                    logisticsFee = 0;
                }
            }

            else if(weight > 10){
                if(buyerDetails.location.toLowerCase() == "island"){
                    logisticsFee = islandPrice + large + (weight * xlFactor);
                }
                else if(buyerDetails.location.toLowerCase() == "mainland"){
                    logisticsFee = mainLandPrice + large + (weight * xlFactor);
                }
                else{
                    logisticsFee = 0;
                }
            }
            else{
                //send response   
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, {statusCode: 400, msg: "invalid weight"}, true)
                return
            }
            

            
            total += logisticsFee
            let paymentGatewayFee;
            if(total >= paymentGatewayMaxThreshold){
                paymentGatewayFee = maxThresholdFee 
            }
            else{
                if(total >= paymentGatewayLv1Threshold){
                    paymentGatewayFee = lv1ThresholdFee(total)
                }
                else{
                    paymentGatewayFee = lv0ThresholdFee(total)
                }
            }
            //let paymentGatewayFee = total >= 126667 ? 2000 :  parseFloat(((3/100) * total).toFixed(2))
            total += paymentGatewayFee

            const purchaseDetails = {logisticsFee, paymentGatewayFee, total, purchases: purchases}
            
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