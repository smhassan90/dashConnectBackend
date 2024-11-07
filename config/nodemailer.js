const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: "xunainali4@gmail.com",
      pass: process.env.ACC_PASSWORD,
    },
  });
  
  // async..await is not allowed in global scope, must use a wrapper
  async function main(email,token) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: 'xunainali4@gmail.com', // sender address
      to: email, // list of receivers
      subject: "reset password", // Subject line
      text: "reset password", // plain text body
      html: "<a href='http://localhost:3000/api/user/resetPassword?token="+token+"'>click reset password</a>", // html body
    });
  
    console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
  }
  
  main().catch(console.error);
  
  module.exports = main