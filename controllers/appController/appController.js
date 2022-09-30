const database = require('../../lib/database')
const utilities = require('../../lib/utilities')

const appController = {}

appController.search = ('search', async(req, res)=>{

    try{
        const element = req.query.element
        const value = req.query.value
        //check what element is being searched for
        if(element == 'shop'){

            const result = await database.db.collection(database.collection.shops).aggregate([
                {$match: {username:{$regex:`^${value}`, $options: 'i'}}}, 
                {$project: {_id: 1, name: 1, username: 1}},
                {$limit: 5}
            ]).toArray()

            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, element: result}, true )
        }
        else if(element == 'trader'){
            const result = await database.db.collection(database.collection.traders).aggregate([
                {$match: {$or:[{username:{$regex:`^${value}`, $options: 'i'}}, {firstName:{$regex:`^${value}`, $options: 'i'}}]}}, 
                {$project: {_id: 1, firstName: 1, lastName: 1, username: 1}},
                {$limit: 5}
            ]).toArray()
        
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, element: result}, true )
        }
        else{
           const result = await database.db.collection(database.collection.products).find({name:{$regex:`^${value}`}}).limit(5).toArray()
            utilities.setResponseData(res, 200, {'content-type': 'application/json'}, {statusCode: 200, element: result}, true )
        }
    }
    catch(err){
        console.log(err)
        utilities.setResponseData(res, 500, {'content-type': 'application/json'}, {statusCode: 500, msg: 'Something went wrong with server'}, true )
        return
      }

})

module.exports = appController;