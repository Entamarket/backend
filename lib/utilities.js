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
            if(i == 'reaction' && !(data[i] === 'up' || data[i] === 'down')){
                console.log(data[i])
                return {
                    isValid: false,
                    errorField: 'reaction',
                    msg: 'invalid reaction value'
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