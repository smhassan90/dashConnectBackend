import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async ({ sendTo, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "osamahafeez0987@gmail.com",
        pass: process.env.ACC_PASSWORD,
      },
    });
    const mailOptions = {
      from: 'osamahafeez0987@gmail.com',
      to: sendTo,
      subject: subject,
      html: html,
    };
    await transporter.sendMail(mailOptions);
    return `ForgotPassword Token sent to ${sendTo} via email`;
  } catch (error) {
    console.log(error);
  }
};
