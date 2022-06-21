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

utilities.setResponseData = (status, headers, data)=>{
    
}

module.exports = utilities