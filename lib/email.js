const aws = require('aws-sdk')
require('dotenv').config()

const ses = new aws.SES({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_SES_REGION 
})

const email = {}

// email.send = (sender, receiver, message, subject)=>{
//     const params ={
//         Destination: {
//             ToAddresses: [receiver]
//         },
//         Message: {
//             Body:{
//                 Text: {
//                     Data: "From Contact: " + name + "\n" + message
//                 }
//             },
//             Subject:{
//                 Data: "Name: " + sender
//             }
//         },
//         Source: sender
//     }
//     return ses.sendEmail(params).promise()

// }


email.send = (sender, receiver, message, subject)=>{
    const params ={
        Destination: {
            ToAddresses: [receiver]
        },
        Message: {
            Body:{
                Text: {
                    Data: message
                }
            },
            Subject:{
                Data: subject
            }
        },
        Source: sender
    }
    return ses.sendEmail(params).promise()

}


email.subSend = (sender, receiver, message, subject, id)=>{
    const params ={
        Destination: {
            ToAddresses: [receiver]
        },
        Message: {
            Body:{
                Html: {
                    Data: `<html>
                        <p>${message}</p>
                        <a href=https://entamarket.com/unsubscribe?email=${receiver}&id=${id}>unsubscribe</a>
                    </html>`
                }
            },
            Subject:{
                Data: subject
            }
        },
        Source: sender
    }
    return ses.sendEmail(params).promise()

}


module.exports = email

