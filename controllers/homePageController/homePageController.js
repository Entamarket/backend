const database = require('../../lib/database')
const utilities = require('../../lib/utilities')


const homePageController = {}


homePageController.home = ('/home-page', async (req, res)=>{
    let page = req.query.page
    let products;
    
    try{
        page = parseInt(page)
        const productCount = await database.db.collection('products').countDocuments()
        const limit = 20

        if(page && page >= 0 && (page * limit < productCount)){
            products = await database.db.collection('products').find().skip(page * limit).limit(limit).toArray()
        }
        else{
            products = await database.db.collection('products').find().limit(limit).toArray() 

        }

        utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, products: products}, true)
        
    }
    catch(err){
        console.log(err) 
        //send new Token   
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: "something went wrong with the server", entamarketToken: newToken}, true)
        return
    }
    
})

module.exports = homePageController