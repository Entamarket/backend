const {MongoClient} = require('mongodb');
const utilities = require('./utilities');
const express = require('express')
const router = express.Router()
require('dotenv').config()

let response;

router.use((req, res)=>{
    response = res
   
})



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
            console.log('connected to database')
            this.db = client.db(this.name)
            cb()
        })
        .catch(err=>{
             
            throw err
        })

    }
    getDatabase = ()=>{
        if(this.db){
            return this.db 
        }
        else{
            console.log('cant find database')
            const errorMsg = 'Unable to connect to database'

            utilities.setResponseData(response, 500, {'content-type': 'text/plain'}, errorMsg, false)
            throw errorMsg   
        }
    }
}

const mongo = new Mongo()

module.exports = {
    mongo: mongo,
    router: router
}