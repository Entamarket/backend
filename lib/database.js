const {MongoClient} = require('mongodb');

require('dotenv').config()

class Database{
    constructor(){
        this.name = 'Entamarket';
        this.uri = process.env.DATABASE_URI
        this.collection = {
            traders: 'traders',
            pendingTraders: 'pendingTraders',
            tokenBlacklist: 'tokenBlacklist',
            shops: 'shops',
            products: 'products',
            pendingUsersUpdates: 'pendingUsersUpdates'
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
            const searchPendingTraders = pendingTraders.findOne({$or: [{username: data.username}, {email: data.email}, {phoneNumber: data.phoneNumber}]})
            const searchTraders = traders.findOne({$or: [{username: data.username}, {email: data.email}, {phoneNumber: data.phoneNumber}]})
           
            //send a promise to search all possible user and trader collection to see if the username, email or phone number exists
            Promise.all([searchPendingTraders, searchTraders])
            .then(value=>{
                for(i of value){
                    if(i != null && i.username == data.username){
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: 'username'
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

    checkForExistingData = (data, parameter)=>{
        return new Promise((resolve)=>{

            //extract all possible buyer and trader collection
            const pendingTraders = this.db.collection(this.collection.pendingTraders)
            const traders = this.db.collection(this.collection.traders)
            const searchPendingTraders = pendingTraders.findOne({[parameter]: data})
            const searchTraders = traders.findOne({[parameter]: data})

            //send a promise to search all possible buyer and trader collection to see if the data exists
            Promise.all([searchTraders, searchPendingTraders])
            .then(value=>{
                for(i of value){
                    if(i != null){
                        return resolve({
                            doesUserDetailExist: true,
                            userDetail: parameter
                        })
                    }
                }

                return resolve({
                    doesUserDetailExist: false 
                })

            })

        })
    }

    findOne = (query, collectionName, projection = null, operation = null) =>{
        if(!projection){
            return this.getDatabase().collection(collectionName).findOne(query)
        }
        else{
            const project = {}
            for(const item of projection){
                project[item] = operation
            }
            return this.getDatabase().collection(collectionName).findOne(query, {projection: project})
        }
    }
    deleteOne = (query, collectionName)=>{
        return this.getDatabase().collection(collectionName).deleteOne(query)
    }
    deleteMany = (query, collectionName)=>{
        return this.getDatabase().collection(collectionName).deleteMany(query)
    }
    insertOne = (data, collectionName)=>{
        return this.getDatabase().collection(collectionName).insertOne(data)
    }
    updateOne = (query, collectionName, data)=>{
        return this.getDatabase().collection(collectionName).updateOne(query, {$set: data})

    } 
}

const database = new Database()

module.exports = database