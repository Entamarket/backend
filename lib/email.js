//const aws = require('aws-sdk')
const sgMail = require("@sendgrid/mail")
require('dotenv').config()

sgMail.setApiKey(process.env.SEND_GRID_API_KEY)

// const ses = new aws.SES({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_SES_REGION 
// })

const email = {}


email.send = async (sender, receiver, message, subject)=>{
    try{
        const msg = {
            to: receiver, // Change to your recipient
            from: sender, // Change to your verified sender
            subject: subject,
            text: message,
            html: `
                <div>
                    <p>${message}</p>
                </div>
            `,
        }

        return await sgMail.send(msg)

    }
    catch(err){
        throw err
    }
    
}

email.subSend = async (sender, receiver, message, subject, id)=>{
    try{
        const msg = {
            to: receiver, // Change to your recipient
            from: sender, // Change to your verified sender
            subject: subject,
            text: message,
            html: `
                <div>
                    <p>${message}</p>
                    <a href=https://entamarket.com/unsubscribe?email=${receiver}&id=${id}>unsubscribe</a>
                </div>
            `,
        }
        return await sgMail.send(msg)
        
    }
    catch(err){
        throw err
    }

}


module.exports = email



// email.send = (sender, receiver, message, subject)=>{
//     const params ={
//         Destination: {
//             ToAddresses: [receiver]
//         },
//         Message: {
//             Body:{
//                 Text: {
//                     Data: message
//                 }
//             },
//             Subject:{
//                 Data: subject
//             }
//         },
//         Source: sender
//     }
//     return ses.sendEmail(params).promise()

// }


// email.subSend = (sender, receiver, message, subject, id)=>{
//     const params ={
//         Destination: {
//             ToAddresses: [receiver]
//         },
//         Message: {
//             Body:{
//                 Html: {
//                     Data: `<html>
//                         <p>${message}</p>
//                         <a href=https://entamarket.com/unsubscribe?email=${receiver}&id=${id}>unsubscribe</a>
//                     </html>`
//                 }
//             },
//             Subject:{
//                 Data: subject
//             }
//         },
//         Source: sender
//     }
//     return ses.sendEmail(params).promise()

// }