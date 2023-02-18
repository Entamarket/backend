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


email.sendOtp = async (sender, receiver, subject, message, otp)=>{
    try{
        const msg = {
            to: receiver, // Change to your recipient
            from: sender, // Change to your verified sender
            subject: subject,
            text: message,
            html: `
            <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Template For Otp</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        
        
            <style>
        
                *{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                 body{
                   font-family: 'Montserrat', sans-serif;
                   background-color: #eee;
                 }
                 .email__container{
                    width: 50%;
                    margin: 50px auto;
                    background-color: #fff;
                   
                 }
                 .mailcon{
                     padding: 20px ;    
                 }
                 .header img{
                    width: 130px;
                 }
                 .email__otp-box{
                    width: 80%;
                    margin: 10px auto;
                    background-color: #f5d6f3;
                    padding: 15px;
                 }
                 .email__body{
                    margin: 30px 0;
                    text-align: center;
                 }
                 .email__body h2 {
                    width: 80%;
                    margin: 20px auto;
                    font-size: 18px;
                 }
                 .email__otp-box span {
                    font-weight: 600;
                    color: #81007f;
                    font-size: 20px;
                 }
                 .email__footer{
                    text-align: center;
                    padding: 20px;
                    background-color: #81007f;
                    color: #eee;
                    font-size: 14px;
                 }
        
             
            </style>
        </head>
        <body>
        
            <div class="email__container">
                <div class="mailcon">
                     <div class="header">
                    <a href="https://entamarket.com/"><img src="https://firebasestorage.googleapis.com/v0/b/vleem-3dc91.appspot.com/o/logo.svg?alt=media&token=446e390f-5fd9-4962-9878-a3b1c13bf748" alt="email__logo"></a>
                </div>
        
                <div class="email__body">
                    <h2>${message}</h2>
        
                    <div class="email__otp-box">
                        <span>${otp}</span>
                    </div>
                </div>
                </div>
        
                <div class="email__footer">
                   <span> &copy; Entamarket Limited 2023 </span>
                </div>
            </div>
          
            
        </body>
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

email.sendCustomerSupport = async (sender, receiver, subject, message)=>{
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