const {MongoClient} = require('mongodb');
const utilities = require('./utilities');
require('dotenv').config()


class Mongo{
    constructor(){
        this.name = 'TradeSpace';
        this.uri = process.env.DATABASE_URI
        this.collection = {
            traders: 'traders',
            pendingTraders: 'pendingTraders'
        };
        this.db;
    }
    connect = (cb)=>{
        const client = new MongoClient(this.uri)
        client.connect()
        .then(()=>{
            this.db = client.db(this.name)
            console.log('connected')
            cb()
        })
        .catch(err=>{

            console.log(err)
            
            // throw err
        })

    }
    getDatabase = ()=>{
        if(this.db){
            return this.db 
        }
        else{
            console.log('cant find database')
            const res = (require('../index'))
            const errorMsg = 'Unable to connect to database'

            utilities.setResponseData(res, 500, {'content-type': 'text/plain'}, errorMsg, false)
            throw errorMsg
        }
    }
}

const mongo = new Mongo()

module.exports = mongo