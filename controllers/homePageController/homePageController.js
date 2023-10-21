const database = require('../../lib/database')
const utilities = require('../../lib/utilities')


const homePageController = {}


homePageController.home = ('/home-page', async (req, res)=>{
    //let page = req.query.page
    let products;
    
    try{
       // page = parseInt(page)
        // const productCount = await database.db.collection('products').countDocuments()
        // const limit = 21

        //if(page >= 0 && (page * limit < productCount)){
            products = await database.db.collection('products').find({deleted : { $exists : false }}).toArray()
           return  utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, products: products}, true)
       // }
        // else{
        //    return  utilities.setResponseData(res, 201, {'content-type': 'application/json'}, {statusCode: 201, msg: "no more products"}, true)
        // }
        // else if(page && page >= 0 && (page * limit >= productCount)){
        //     products = await database.db.collection('products').find().skip((page * limit) % productCount).limit(limit).toArray()
        // }
        // else{
        //     products = await database.db.collection('products').find().limit(limit).toArray() 

        // }
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
    
})

module.exports = homePageController