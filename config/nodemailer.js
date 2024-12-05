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

// Function to send reset password email
async function sendPasswordResetEmail(email, token) {
  try {
    const info = await transporter.sendMail({
      from: 'xunainali4@gmail.com', // sender address
      to: email, // list of receivers
      subject: "Reset Your Password", // Subject line
      text: `Token: ${token}\nPlease click the link below to reset your password`, // plain text body
      html: `
        <h4><strong>Token:</strong> ${token}</h4>
        <h4><a href='http://localhost:3000/api/user/resetPassword'>Click here to change your password</a></h4>
      `, // html body
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = sendPasswordResetEmail;

