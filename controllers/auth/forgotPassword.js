import {INTERNALERROR, NOTALLOWED, OK } from "../../constant/httpStatus.js"
import { responseMessages } from "../../constant/responseMessages.js"
import UserModel from "../../models/User.js"
import { sendEmail } from "../../config/sendEmail.js"
import { generateOtp } from "../../utils/generateOtp.js"
import forgotPasswordTemplate from "../../utils/forgotPasswordTemplate.js"

export const forgotPassword = async(req,res) =>{
    try {
        const {email } = req.body

        const user = await UserModel.findOne({email})

        if(!user){
            return res.status(NOTALLOWED).json({
                message : responseMessages.INVALID_USER,
                error : true,
                success : false
            })
        }


        const otp = generateOtp()
        const expiryDate = new Date(Date.now() + 60 * 60 * 1000);

        const forgotPassword = await UserModel.findByIdAndUpdate(user._id,{
            token:otp,
            forgot_password_expiry: new Date(expiryDate).toISOString()
        })
        await sendEmail({
            sendTo:email,
            subject:"Forgot Password",
            html: forgotPasswordTemplate({
                name: user.firstName,
                otp: otp
            })
        })
        return res.status(OK).json({
            message:responseMessages.CHECK_EMAIL,
            error:false,
            success:true,
        })

    } catch (error) {
        console.log(error)
        return res.status(INTERNALERROR).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}