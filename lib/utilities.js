const crypto = require('crypto')
//const database = require('../lib/database').database

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
   
    for(i of expectedData){

        const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-z]+$/
        const userNameRegex = /^[a-zA-Z][a-zA-Z0-9-_]+$/
        const passwordRegex = /^[^\s]{8,15}$/
        const phoneRegex = /^\d{11}$/
        
        if(data[i] && typeof data[i].trim() == 'string'){

            if(i == 'password' && !passwordRegex.test(data[i].trim())){
            
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
            if(i == 'userName' && !userNameRegex.test(data[i].trim())){
                
                return {
                    isValid: false,
                    errorField: 'userName',
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

utilities.trimmer = (data)=>{
    const trimmedData = {}

    for(i in data){
        trimmedData[i] = data[i].trim()
    }

    return trimmedData
}

utilities.dataHasher = (data)=>{
    const hashString = `impo$$i6leToHack73`
    if(typeof data == "string" && data.length > 0){

        return crypto.createHmac("sha256", hashString).update(data).digest('hex')
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

// utilities.doesUserExist = (data)=>{
//     const db = database.getDatabase()
//     const collections = ['pendingTraders']
//     const uniqueData = ['userName', 'email', 'phoneNumber']

//     //extract all possible user and trader collections
//     const pendingTraders = db.collection('pendingTraders')
//     const pendingTradersKeys = {
//         userName: pendingTraders.findOne({userName: data.userName}),
//         email: pendingTraders.findOne({email: data.email}),
//         phoneNumber: pendingTraders.findOne({phoneNumber: data.phoneNumber})
//     }

//     return Promise.all([pendingTradersKeys.userName, pendingTradersKeys.email, pendingTradersKeys.phoneNumber])

// }
module.exports = utilities