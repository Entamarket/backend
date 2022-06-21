const express = require('express')

const router = require('./routes/router')

const app = express()


app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization')
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
        console.log(exceededDataLimit)
        if(!exceededDataLimit){
            req.body = buffer
            next()  
        }
        else{
            res.status(400)
            res.set('content-type', 'text/plain')
            res.send('Data sent is too large')
            res.end()
            
        }
        
    })
})

app.use(router)



app.listen(3000)


