const crypto = require('crypto')
const {ObjectId}  = require('mongodb')
const jwt = require('jsonwebtoken') 
const database = require("./database")
const {islandPrice, mainLandPrice, paymentGatewayMaxThreshold, paymentGatewayLv1Threshold, maxThresholdFee, lv0ThresholdFee, lv1ThresholdFee, small, medium, large, xlFactor} = require("./variables")
require('dotenv').config()

const utilities = {}

utilities.isJSON = (data)=>{
    
    try{
        JSON.parse(data)
        return true
    }
    catch{
        return false
    }
}

utilities.setResponseData = (res, status, headers, data, isJSON)=>{
    res.status(status)
    const headerKeys = Object.keys(headers)
    for(key of headerKeys){
        res.set(key, headers[key])
    }

    if(isJSON){
        res.json(data)
    }
    else{res.send(data)}

    return res.end()
}

utilities.validator = (data, expectedData)=>{

    const emailRegex = /^[a-zA-Z0-9\+\.]+@[a-zA-Z]+\.[a-z]+$/
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9-_]+$/
    const passwordRegex = /^[^\s]{8,15}$/
    const phoneRegex = /^\d{11}$/
   
    for(const i of expectedData){

        if(data[i] && typeof data[i].trim?.() == 'string'){

            if((i == 'password' || i == 'newPassword') && !passwordRegex.test(data[i].trim())){
            
                return {
                    isValid: false,
                    errorField: 'password',
                    msg: 'wrong password format, make sure your password is 8 to 15 characters long and contains no spaces'
                }
            }
            if(i == 'email' && !emailRegex.test(data[i].trim())){
      
                return {
                    isValid: false,
                    errorField: 'email',
                    msg: 'wrong email format, make sure you used a valid email'
                }
                
            }
            if(i == 'username' && !usernameRegex.test(data[i].trim())){
                
                return {
                    isValid: false,
                    errorField: 'username',
                    msg: 'wrong username format, make sure your username starts with an alphabet and must not include any special symbols apart from "-" and "_"'
                }
            }
            if(i == 'phoneNumber' && !phoneRegex.test(data[i].trim())){
                return {
                    isValid: false,
                    errorField: 'phoneNumber',
                    msg: 'wrong phoneNumber format, make sure your phone number is 11 digits long without spaces'
                }
            }

        }
        else{
            return {
                isValid: false,
                errorField: i,
                msg: `wrong ${i} format, make sure that ${i} field is not empty and it is a string`
            }
        }
    }

    return {
        isValid: true,
        errorField: null,
    }

}

utilities.signupValidator = (data, expectedData)=>{
    const emailRegex = /^[a-zA-Z0-9\+\.]+@[a-zA-Z]+\.[a-z]+$/
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9-_]+$/
    const passwordRegex = /^[^\s]{8,15}$/
    const phoneRegex = /^\+\d{1,3}-\d{4,13}$/

    const dataKeys = Object.keys(data)
    
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i === "firstName" && (typeof data[i] !== "string" || data[i].trim().length < 1)){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i === "lastName" && (typeof data[i] !== "string" || data[i].trim().length < 1 )){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i === "email" && (typeof data[i] !== "string" || !emailRegex.test(data[i].trim()))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be in valid email format`
                }
            }

            if(i === "username" && (typeof data[i] !== "string" || !usernameRegex.test(data[i].trim()))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `wrong username format, make sure your username starts with an alphabet and must not include any special symbols apart from "-" and "_"`
                }
            }

            if(i === "phoneNumber" && (typeof data[i] !== "string" || !phoneRegex.test(data[i].trim()))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be in valid phone number format`
                }
            }

            if(i === "password" && (typeof data[i] !== "string" || !passwordRegex.test(data[i].trim()))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `wrong password format, make sure your password is 8 to 15 characters long and contains no spaces`
                }
            }
        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }
}


utilities.reactionValidator = (data, expectedData)=>{
    for(const i of expectedData){
        if(data[i] === null || typeof data[i].trim?.() == 'string'){
            if(data[i] === null || data[i].trim?.() === "like" || data[i].trim?.() === "dislike"){
                return {
                    isValid: true,
                    errorField: null,
                }

            }
            else{
                return {
                    isValid: false,
                    errorField: i,
                    msg: `wrong ${i} value, make sure that ${i} value is either "like", "dislike" or null`
                }

            }
        }
        return {
            isValid: false,
            errorField: i,
            msg: `wrong ${i} format, make sure that ${i} field is not empty and it is a string or null`
        }

    }

}

utilities.traderProfileUpdateValidator = (data, expectedData)=>{
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9-_]+$/
    const phoneRegex = /^\+\d{1,3}-\d{4,13}$/
    
    // check to see if we have the number of keys we are expecting
    const dataKeys = Object.keys(data)

    if(dataKeys.length === expectedData.length){
        for(const i of dataKeys){
            if(i === "firstName" || i === "lastName" || i === "username" || i === "phoneNumber"){
                if(i === "firstName" && typeof data[i].trim?.() !== 'string'){
                    return {
                        isValid: false,
                        errorField: i,
                        msg: `wrong ${i} format, make sure that ${i} field is not empty and it is a string`
                    }  
                }
                if(i === "lastName" && typeof data[i].trim?.() !== 'string'){
                    return {
                        isValid: false,
                        errorField: i,
                        msg: `wrong ${i} format, make sure that ${i} field is not empty and it is a string`
                    }
            
                }
                if(i === "username" && !usernameRegex.test(data[i].trim())){
                    return {
                        isValid: false,
                        errorField: i,
                        msg: `wrong username format, make sure your ${i} starts with an alphabet and must not include any special symbols apart from "-" and "_"`
                    }
            
                }
                if(i === "phoneNumber" && !phoneRegex.test(data[i].trim())){
                    return {
                        isValid: false,
                        errorField: i,
                        msg: 'wrong phoneNumber format, make sure your phone number is in international format'
                    }
                        
                }
                    
            }
            else{
                return {
                    isValid: false,
                    msg: `${i} is not a valid data property`
                }
            }    
                
        }
        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: 'incomplete data or excess data'
        }

    }
    
}



utilities.validateBankDetails = (data, expectedData)=>{
    
    const bankRegex = /^\d{10}$/
    const bankDetailKeys = Object.keys(data)
    if(bankDetailKeys.length !== expectedData.length){
        
        return {
            isValid: false,
            errorField: 'bankDetails',
            msg: 'incomplete bank details or excess bank details'
        } 
    }
    
    for(let b of bankDetailKeys){

        if(b !== "accountName" && b !== "accountNumber" && b !== "bankName" && b !== "bankCode" && b !== "bankType" && b !== "password"){
            
            return {
                isValid: false,
                msg: `${b} is not a recognized field`
            }
            
        }
        if(b === "accountName" && typeof data[b].trim?.() !== 'string'){
            return {
                isValid: false,
                errorField: b,
                msg: "make sure the account name is a string and it's not empty"
            }

        }
        if(b === "accountNumber" && !bankRegex.test(data[b].trim())){
            return {
                isValid: false,
                errorField: b,
                msg: "make sure the account number is a 10 digit string"
            }

        }
        if(b === "bankName" && typeof data[b].trim?.() !== 'string'){
            return {
                isValid: false,
                errorField: b,
                msg: "make sure the bank name is a string and it's not empty"
            }
        }
        if(b === "bankCode" && typeof data[b].trim?.() !== 'string'){
            return {
                isValid: false,
                errorField: b,
                msg: "make sure the bank code is a string and it's not empty"
            }
        }
        if(b === "bankType" && typeof data[b].trim?.() !== 'string'){
            return {
                isValid: false,
                errorField: b,
                msg: "make sure the bank code is a string and it's not empty"
            }
        }
        if(b === "password" && typeof data[b].trim?.() !== 'string'){
            return {
                isValid: false,
                errorField: b,
                msg: "make sure the password is a string and it's not empty"
            }
        }
              

    } 
    return {
        isValid: true,
        errorField: null,
        msg: "sucess"
    }     
    
}


utilities.buyerProfileUpdateValidator = (data, expectedData)=>{
    
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9-_]+$/
    const phoneRegex = /^\+\d{1,3}-\d{4,13}$/

    const dataKeys = Object.keys(data)
    
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i === "firstName" && (typeof data[i] !== "string" || data[i].trim().length < 1)){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i === "lastName" && (typeof data[i] !== "string" || data[i].trim().length < 1 )){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }


            if(i === "username" && (typeof data[i] !== "string" || !usernameRegex.test(data[i].trim()))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `wrong username format, make sure your username starts with an alphabet and must not include any special symbols apart from "-" and "_"`
                }
            }

            if(i === "phoneNumber" && (typeof data[i] !== "string" || !phoneRegex.test(data[i].trim()))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be in valid phone number format`
                }
            }

        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }
}

utilities.cartValidator = (data, expectedData)=>{
    if(Object.keys(data).length === expectedData.length){
        for(let i of Object.keys(data)){
            if(i === "productID" || i === "noOfItems"){
                if(i === "productID" && typeof data[i] !== "string"){
                    return {
                        isValid: false,
                        errorField: i,
                        msg: `${i} should be a string and it should not be empty`
                    }

                }
                else if(i === "noOfItems" && typeof data[i] !== "number"){
                    return {
                        isValid: false,
                        errorField: i,
                        msg: `${i} should be a number and it should not be empty`
                    }
                }

            }
            else{
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} is not a valid data field`
                }

            }
        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }
}

utilities.adminLoginVlidator = (data, expectedData)=>{
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9-_]+$/
    const dataKeys = Object.keys(data) 
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i === "username" && (typeof data[i] !== "string" || !usernameRegex.test(data[i].trim()))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i === "password" && (typeof data[i] !== "string" || data[i].trim().length < 1 )){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }
        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }
}

utilities.checkoutValidator = (data, expectedData)=>{
    const dataKeys = Object.keys(data) 
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i && i === "productID" && typeof data[i] !== "string" ){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i && i === "quantity" && typeof data[i] !== "number"){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a number and it should not be empty`
                }
            }
        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }

}


utilities.createShopValidator = (data, expectedData)=>{
    const dataKeys = Object.keys(data) 
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i && i === "name" && typeof data[i] !== "string" ){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i && i === "shopAddress" && typeof data[i] !== "string"){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a number and it should not be empty`
                }
            }
        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }

}


utilities.addProductValidator = (data, expectedData)=>{
    
    const priceRegex = /^\d*$/
    const stockRegex = /^\d*$/
    const weightRegex = /(^\d+\.\d+$)|(^\d+$)/
    const dataKeys = Object.keys(data) 
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i && i === "name" && typeof data[i] !== "string" ){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i && i === "price" && (typeof data[i] !== "string" || !priceRegex.test(data[i]))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }
            if(i && i === "description" && typeof data[i] !== "string" ){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }
            if(i && i === "stock" && (typeof data[i] !== "string" || !stockRegex.test(data[i]))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }
            if(i && i === "category" && typeof data[i] !== "string"){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }
            if(i && i === "weight" && (typeof data[i] !== "string" || !weightRegex.test(data[i]))){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string of integer or decimals`
                }
            }
        }
        

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }

}


utilities.confirmBankDetailsValidator = (data, expectedData)=>{
    const dataKeys = Object.keys(data) 
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i && i === "amount" && typeof data[i] !== "number" ){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a number greater than zero and it should not be empty`
                }
            }

        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }

}


utilities.costomerSupportValidator = (data, expectedData)=>{
    const emailRegex = /^[a-zA-Z0-9\+\.]+@[a-zA-Z]+\.[a-z]+$/
    const dataKeys = Object.keys(data) 
    if(dataKeys.length === expectedData.length){
        for(let i of dataKeys){
            if(i && i === "fullName" && typeof data[i] !== "string" ){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

            if(i && i === "email" && typeof data[i] !== "string" && !emailRegex.test(data[i].trim())){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a valid email in string form and it should not be empty`
                }
            }

            if(i && i === "message" && typeof data[i] !== "string"){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }

        }

        return{
            isValid: true,
            errorField: null,
        }

    }
    else{
        return {
            isValid: false,
            msg: `incomplete data or unrequired data detected`
        }
    }

}

utilities.trimmer = (data)=>{
    const trimmedData = {}

    for(i in data){
        trimmedData[i] = data[i].trim()
    }

    return trimmedData
}

utilities.dataHasher = (data)=>{
    if(typeof data == "string" && data.length > 0){

        return crypto.createHmac("sha256", process.env.HASH_STRING).update(data).digest('hex')
    }
    return false
}

utilities.otpMaker = ()=>{
    let otp = ''
    const max = 9
    const min = 0
    for(i = 0; i < 4; i++){
       otp += Math.floor(Math.random() * (max - min + 1)) + min
    }
    return otp   
}

utilities.jwt = (operation, data)=>{
    if(operation == 'sign'){
        return jwt.sign(data, process.env.JWT_KEY, {expiresIn: '1h'} )
    }
    if(operation == 'verify'){
        return jwt.verify(data, process.env.JWT_KEY, (err, payload)=>{
            if(err){
                return {isVerified: false}
            }
        
            return {isVerified: true, decodedToken: payload}
        })
    }  
}


utilities.verifyPayment = async (payload) => {
    try {
    
        const ref = payload[payload.length-1].ref
        
        const purchase = await utilities.purchaseCalc(payload)
        if(purchase.statusCode != 200){
            return null
        }
        
        const response = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        const paystackRes = await response.json();
        
        if (paystackRes.status && paystackRes.data.status === 'success' && purchase.purchaseDetails.total >= paystackRes.data.amount/100) {
            return paystackRes.data;
        } else {
            // Payment failed or is incomplete
            return null;
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return null
    }
};

utilities.purchaseCalc = async(payload)=>{
    try{

        //check if payload is an array
        
        const purchases = []
        let total = 0
        let weight = 0
            
        let buyerDetails = payload.pop()
        //loop through the array and validate each product
        for(let product of payload){
            if(utilities.checkoutValidator(product, ["productID", "quantity"]).isValid){
                //check if the product is real and if it is real, get the product 
                    
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
                        weight += productObj.weight * product.quantity
                        purchases.push(purchase)

                    }
                    else{
                        return {statusCode: 400, msg: `the quantity of productID: ${product.productID} should be greater than zero and less than or equal to the stock`}
                    } 
                }
                else{
                    return {statusCode: 400, msg: `productID: ${product.productID} does not exist in database`}
                }
  
            }
            else{
                return {statusCode: 400, msg: utilities.checkoutValidator(product, ["productID", "noOfItems"]).msg}

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
            return {statusCode: 400, msg: "invalid weight"}
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
        
        total += paymentGatewayFee

        const purchaseDetails = {logisticsFee, paymentGatewayFee, total, purchases: purchases}
            
        return {statusCode: 200, purchaseDetails}

    }
    catch(err){
        console.log(err) 
        return {statusCode: 500, msg: "something went wrong with the server"}
    }
}



module.exports = utilities