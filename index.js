const express = require('express')

const router = require('./routes/router')

const utilities = require('./lib/utilities')
const database = require('./lib/database')

const app = express()

const port = process.env.PORT || 3000


app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization')
    module.exports = res
    next()
})

app.use((req, res, next)=>{
    let buffer = ''
    let exceededDataLimit = false
    req.on('data', (dataStream)=>{

        if(Buffer.byteLength(dataStream, 'utf8') > Math.pow(2, 24)){
            exceededDataLimit = true
        }
        buffer += dataStream
    })

    req.on('end', ()=>{
        if(!exceededDataLimit){
            req.body = buffer
            next()  
        }
        else{
            utilities.setResponseData(res, 400, {'content-type': 'text/plain'}, 'Data sent is too large', false )
            
        }
        
    })
})

app.use(router)


database.connect(()=>{
    app.listen(port)
    console.log('connected to server')
})