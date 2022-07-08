const aws = require('aws-sdk')
require('dotenv').config()

const ses = new aws.SES({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION 
})

const email = {}

email.send = (sender, receiver, message, name)=>{
    const params ={
        Destination: {
            ToAddresses: [receiver]
        },
        Message: {
            Body:{
                Text: {
                    Data: "From Contact: " + name + "\n" + message
                }
            },
            Subject:{
                Data: "Name: " + sender
            }
        },
        Source: sender
    }
    return ses.sendEmail(params).promise()

}

module.exports = email