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
            const errorMsg = {msg: 'Unable to connect to database'}
            
            throw errorMsg   
        }
    }
    checkForExistingUser = (data)=>{

        return new Promise((resolve) => {

            //extract all possible user and trader collections
            const pendingTraders = this.db.collection('pendingTraders')
            const pendingTradersKeys = {
                userName: pendingTraders.findOne({userName: data.userName}),
                email: pendingTraders.findOne({email: data.email}),
                phoneNumber: pendingTraders.findOne({phoneNumber: data.phoneNumber})
            }
            Promise.all([pendingTradersKeys.userName, pendingTradersKeys.email, pendingTradersKeys.phoneNumber])
            .then(value=>{

                for(let i = 0; i < value.length; i++){
                    if(value[i] != null && (i == 0 || i == 3 || i == 6 || i == 9)){
                        
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: 'userName'
                        })
                    }
                    if(value[i] != null && (i == 1 || i == 4 || i == 7 || i == 10)){
                        
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: 'email'
                        }) 
                    }
                    if(value[i] != null && (i == 2 || i == 5 || i == 8 || i == 11)){
                       
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: 'phoneNumber'
                        })
                    }
      
                }

                return resolve({
                    doesUserDetailExist: false 
                }) 
      
            })
            .catch(err=>{
                console.log('hii')
                throw err
            }) 
        })

      

    }
    
}

const database = new Database()

module.exports = database