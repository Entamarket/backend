
const utilities = require("../../lib/utilities")


const purchaseCalculatorController = {}


purchaseCalculatorController.calculatePurchase = ('/calculate-purchase', async (req, res)=>{
    //extract decoded token
    const decodedToken = req.decodedToken;
    const payload = JSON.parse(req.body)

    try{

        //check if payload is an array
        if(Array.isArray(payload)){
            const calculatedData = await utilities.purchaseCalc(payload)

            if(calculatedData.statusCode === 200){
                utilities.setResponseData(res, 200, {'content-type': 'application/json'}, calculatedData, true)
                return
            }
            else if(calculatedData.statusCode === 400){
                utilities.setResponseData(res, 400, {'content-type': 'application/json'}, calculatedData, true)
                return
            }
            else{
                utilities.setResponseData(res, 500, {'content-type': 'application/json'}, calculatedData, true)
                return
            }
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