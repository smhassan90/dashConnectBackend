import {INTERNALERROR, NOTALLOWED, OK } from "../../constant/httpStatus.js"
import { responseMessages } from "../../constant/responseMessages.js"
import UserModel from "../../models/User.js"

export const forgotPasswordTokenVerify = async(req,res) =>{
    try {
        const {email , otp } = req.body
        if(!email || !otp){
            return res.status(NOTALLOWED).json({
                message : responseMessages.INVALID_FIELD,
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({email})
        if(!user){
            return res.status(NOTALLOWED).json({
                message : responseMessages.INVALID_USER,
                error : true,
                success : false
            })
        }

        const currentTime = new Date().toISOString()
        if(new Date(user.forgot_password_expiry) < currentTime){
            return res.status(NOTALLOWED).json({
                message : responseMessages.OTP_EXPIRED,
                error : true,
                success : false
            })
        }

        if(user.token !== otp){
            return res.status(NOTALLOWED).json({
                message : responseMessages.OTP_INVALID,
                error : true,
                success : false
            })
        }

        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            token:"",
            forgot_password_expiry:""
        })
        return res.status(OK).json({
            message:responseMessages.OTP_SUCCESSFULLY,
            error:false,
            success:true,
        })

    } catch (error) {
        return res.status(INTERNALERROR).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}