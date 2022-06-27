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
            
                return false
            }
            if(i == 'email' && !emailRegex.test(data[i].trim())){
                
                return false
            }
            if(i == 'userName' && !userNameRegex.test(data[i].trim())){
                
                return false
            }
            if(i == 'phoneNumber' && !phoneRegex.test(data[i].trim())){
                return false
            }

        }
        else{
            return false
        }
    }

    return true

}

utilities.trimmer = (data)=>{
    const trimmedData = {}

    for(i in data){
        trimmedData[i] = data[i].trim()
    }

    return trimmedData
}
module.exports = utilities