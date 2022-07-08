const aws = require('aws-sdk')
require('dotenv').config()

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})

const sms = {}

sms.send = (phoneNumber, message)=>{
    const E164 = '+234' + phoneNumber.slice(1, phoneNumber.length)
    console.log(E164)

    const params = {
        Message: message,
        PhoneNumber: E164,
        MessageAttributes: {
            DefaultSenderID: {
                DataType: 'String',
                StringValue: 'TradeSpace'
            }  
        }
    }

    return new aws.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
}

module.exports = sms