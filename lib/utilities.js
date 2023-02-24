const crypto = require('crypto')
const jwt = require('jsonwebtoken') 
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
    if(data.bankDetails && Object.keys(data).length > 1){
        // check to see if we have the number of keys we are expecting
        const dataKeys = Object.keys(data)

        if(dataKeys.length === expectedData.length){
            for(const i of dataKeys){
                if(i === "firstName" || i === "lastName" || i === "username" || i === "phoneNumber" || i === "bankDetails"){
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
                            msg: 'wrong phoneNumber format, make sure your phone number is 11 digits long without spaces'
                        }
                        
                    }
                    if(i === "bankDetails"){
                        const bankRegex = /^\d{10}$/
                        const bankDetailKeys = Object.keys(data.bankDetails)
                        if(bankDetailKeys.length === 3){
                    
                            for(let b of bankDetailKeys){
                                if(b === "accountName" || b === "accountNumber" || b === "bankName"){
                                    if(b === "accountName" && typeof data.bankDetails[b].trim?.() !== 'string'){
                                        return {
                                            isValid: false,
                                            errorField: b,
                                            msg: "make sure the account name is a string and it's not empty"
                                        }
    
                                    }
                                    if(b === "accountNumber" && !bankRegex.test(data.bankDetails[b].trim())){
                                        return {
                                            isValid: false,
                                            errorField: b,
                                            msg: "make sure the account number is a 10 digit string"
                                        }
    
                                    }
                                    if(b === "bankName" && typeof data.bankDetails[b].trim?.() !== 'string'){
                                        return {
                                            isValid: false,
                                            errorField: b,
                                            msg: "make sure the bank name is a string and it's not empty"
                                        }
    
                                    }
                                }
                                else{
                                    return {
                                        isValid: false,
                                        msg: `${b} is not a recognized field`
                                    }
                                }
                                

                            }

                        }
                        else{
                            return {
                                isValid: false,
                                errorField: 'bankDetails',
                                msg: 'incomplete bank details or excess bank details'
                            }

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
    else if(data.bankDetails && Object.keys(data).length === 1){
        const bankRegex = /^\d{10}$/
        const bankDetailKeys = Object.keys(data.bankDetails)
        if(bankDetailKeys.length === 3){
            for(let b of bankDetailKeys){
                if(b === "accountName" || b === "accountNumber" || b === "bankName"){
                    
                    if(b === "accountName" && typeof data.bankDetails[b].trim?.() !== 'string'){
                        return {
                            isValid: false,
                            errorField: b,
                            msg: "make sure the account name is a string and it's not empty"
                        }

                    }
                    if(b === "accountNumber" && !bankRegex.test(data.bankDetails[b].trim())){
                        return {
                            isValid: false,
                            errorField: b,
                            msg: "make sure the account number is a 10 digit string"
                        }

                    }
                    if(b === "bankName" && typeof data.bankDetails[b].trim?.() !== 'string'){
                        return {
                            isValid: false,
                            errorField: b,
                            msg: "make sure the bank name is a string and it's not empty"
                        }

                    }
                }
                else{
                    return {
                        isValid: false,
                        msg: `${b} is not a recognized field`
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
                errorField: 'bankDetails',
                msg: 'incomplete bank details or excess bank details'
            }

        }

    }
    else if(!data.bankDetails && Object.keys(data).length === 4){
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9-_]+$/
        const phoneRegex = /^\d{11}$/
        const dataKeys = Object.keys(data)
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
                        msg: 'wrong phoneNumber format, make sure your phone number is 11 digits long without spaces'
                    }
                    
                }
            }
            else{
                return {
                    isValid: false,
                    msg: `${b} is not a recognized field`
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
            msg: `required data is incomplete`
        }
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
    //const priceRegex = /^\d*$/
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

            if(i && i === "price" && typeof data[i] !== "number"){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a number and it should not be empty`
                }
            }
            if(i && i === "description" && typeof data[i] !== "string" ){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }
            if(i && i === "stock" && typeof data[i] !== "number"){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a number and it should not be empty`
                }
            }
            if(i && i === "category" && typeof data[i] !== "string"){
                return {
                    isValid: false,
                    errorField: i,
                    msg: `${i} should be a string and it should not be empty`
                }
            }
        }
        
        if(data.price > 500000){
            return {
                isValid: false,
                errorField: "price",
                msg: `price should be less than or equal to 500,000`
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


module.exports = utilities