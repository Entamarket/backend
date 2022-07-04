const {MongoClient} = require('mongodb');
const express = require('express')
const router = express.Router()
require('dotenv').config()

class Database{
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
            //this.db = client.db(this.name)
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
            const errorMsg = {msg: 'Unable to connect to database'}
            
            throw errorMsg   
        }
    }
    
}

const database = new Database()

module.exports = {
    database: database,
    router: router
}