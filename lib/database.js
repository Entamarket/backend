const {MongoClient} = require('mongodb');

require('dotenv').config()

class Database{
    constructor(){
        this.name = 'Entamarket';
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
            const pendingTraders = this.db.collection(this.collection.pendingTraders)
            const traders = this.db.collection(this.collection.traders)
            const searchPendingTraders = pendingTraders.findOne({$or: [{userName: data.userName}, {email: data.email}, {phoneNumber: data.phoneNumber}]})
            const searchTraders = traders.findOne({$or: [{userName: data.userName}, {email: data.email}, {phoneNumber: data.phoneNumber}]})
           
            //send a promise to search all possible user and trader collection to see if the userName, email or phone number exists
            Promise.all([searchPendingTraders, searchTraders])
            .then(value=>{
                for(i of value){
                    if(i != null && i.userName == data.userName){
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: 'userName'
                        })
                    }

                    if(i != null && i.email == data.email){
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: 'email'
                        })
                    }

                    if(i != null && i.phoneNumber == data.phoneNumber){
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: 'phone number'
                        })
                    }
                }

                return resolve({
                    doesUserDetailExist: false 
                })
            })
            .catch(err=>{
                throw err
            }) 
        })
    }  
}

const database = new Database()

module.exports = database