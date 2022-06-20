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
    req.on('data', (dataStream)=>{
        buffer += dataStream
    })

    req.on('end', ()=>{
        req.body = buffer

        next()
    })
})

app.use(router)



app.listen(3000)