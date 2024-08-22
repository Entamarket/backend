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
            <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background-color: #eee;
      }
      .email__container {
        width: 95%;
        margin: 50px auto;
        background-color: #fff;
      }
      .mailcon {
        padding: 20px;
      }
      .header img {
        width: 220px;
      }
      .email__otp-box {
        margin: 10px auto;
        background-color: #f5d6f3;
        padding: 15px;
      }
      .email__body {
        margin: 30px 0;
        text-align: center;
      }
      .email__body h2 {
        margin: 20px auto;
        font-size: 18px;
      }
      .email__otp-box span {
        font-weight: 600;
        color: #81007f;
        font-size: 20px;
      }
      .email__footer {
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
          <img src="https://www.api.entamarket.com/logo" alt="logo" />
        </div>

        <div class="email__body">
          <h2>${message}</h2>

          <div class="email__otp-box">
            <span>${otp}</span>
          </div>
        </div>
      </div>

      <div class="email__footer">
        <span> &copy; Entamarket & Co Company 2024 </span>
      </div>
    </div>
  </body>
</html>
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
            <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background-color: #eee;
      }
      .email__container {
        width: 95%;
        margin: 50px auto;
        background-color: #fff;
      }
      .mailcon {
        padding: 20px;
      }
      .header img {
        width: 220px;
      }
      .email__otp-box {
        margin: 10px auto;
        background-color: #f5d6f3;
        padding: 15px;
      }
      .email__body {
        margin: 30px 0;
        text-align: center;
      }
      .email__body h2 {
        margin: 20px auto;
        font-size: 18px;
      }
      .email__otp-box span {
        font-weight: 600;
        color: #81007f;
        font-size: 20px;
      }
      .email__footer {
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
          <img src="https://www.api.entamarket.com/logo" alt="logo" />
        </div>

        <div class="email__body">
          <h2>
            ${message}
          </h2>
          <a href=https://entamarket.com/unsubscribe?email=${receiver}&id=${id}>unsubscribe</a>
        </div>
      </div>

      <div class="email__footer">
        <span> &copy; Entamarket & Co Company 2024 </span>
      </div>
    </div>
  </body>
</html>
                
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



email.sendToUsers = async (sender, receiver, subject, message)=>{
    try{
        const msg = {
            to: receiver, // Change to your recipient
            from: sender, // Change to your verified sender
            subject: subject,
            text: message,
            html: `
            <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background-color: #eee;
      }
      .email__container {
        width: 95%;
        margin: 50px auto;
        background-color: #fff;
      }
      .mailcon {
        padding: 20px;
      }
      .header img {
        width: 220px;
      }
      .email__otp-box {
        margin: 10px auto;
        background-color: #f5d6f3;
        padding: 15px;
      }
      .email__body {
        margin: 30px 0;
        text-align: center;
      }
      .email__body h2 {
        margin: 20px auto;
        font-size: 18px;
      }
      .email__otp-box span {
        font-weight: 600;
        color: #81007f;
        font-size: 20px;
      }
      .email__footer {
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
          <img src="https://www.api.entamarket.com/logo" alt="logo" />
        </div>

        <div class="email__body">
          <h2>
            ${message}
          </h2>
        </div>
      </div>

      <div class="email__footer">
        <span> &copy; Entamarket & Co Company 2024 </span>
      </div>
    </div>
  </body>
</html>     
            `,
        }
        return await sgMail.send(msg)
        
    }
    catch(err){
        throw err
    }

}


email.sendWithdrawalSummary = async (sender, receiver, subject, message)=>{
  try{
      const msg = {
          to: receiver, // Change to your recipient
          from: sender, // Change to your verified sender
          subject: subject,
          text: message,
          html: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background-color: #eee;
    }
    .email__container {
      width: 95%;
      margin: 50px auto;
      background-color: #fff;
    }
    .mailcon {
      padding: 20px;
    }
    .header img {
      width: 220px;
    }
    .email__otp-box {
      margin: 10px auto;
      background-color: #f5d6f3;
      padding: 15px;
    }
    .email__body {
      margin: 30px 0;
      text-align: center;
    }
    .email__body div {
      margin: 20px auto;
      font-size: 18px;
    }
      table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        th {
            background-color: #f2f2f2;
            text-align: left;
        }
    .email__otp-box span {
      font-weight: 600;
      color: #81007f;
      font-size: 20px;
    }
    .email__footer {
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
        <img src="https://www.api.entamarket.com/logo" alt="logo" />
      </div>

      <div class="email__body">
        <div>
          ${message}
        </div>
      </div>
    </div>

    <div class="email__footer">
      <span> &copy; Entamarket & Co Company 2024 </span>
    </div>
  </div>
</body>
</html>     
          `,
      }
      return await sgMail.send(msg)
      
  }
  catch(err){
      throw err
  }

}


email.withdrawalTemplate = (name, bankName, accNo, amount, ref)=>{
  return `<table>
        <tbody>
            <tr>
                <th>Name</th>
                <td>${name}</td>
            </tr>
            <tr>
                <th>Bank Name</th>
                <td>${bankName}</td>
            </tr>
            <tr>
                <th>Acc No</th>
                <td>${accNo}</td>
            </tr>
            <tr>
                <th>Amount</th>
                <td>${amount}</td>
            </tr>
            <tr>
                <th>Ref</th>
                <td>${ref}</td>
            </tr>
            <tr>
                <th>Date</th>
                <td>${new Date().toLocaleString()}</td>
            </tr>
        </tbody>
    </table>` 
}

module.exports = email



