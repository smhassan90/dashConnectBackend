import { INTERNALERROR, NOTALLOWED, OK } from "../../constant/httpStatus.js"
import { responseMessages } from "../../constant/responseMessages.js"
import UserModel from "../../models/User.js"
import { sendEmail } from "../../config/sendEmail.js"
import { generateOtp } from "../../utils/generateOtp.js"
import forgotPasswordTemplate from "../../utils/forgotPasswordTemplate.js"

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params
        const { firstName, lastName } = req.body

        const user = await UserModel.findById(id).populate({
            path: "level",
            select: "displayName levelNumber companyId"
          })

        if (!user) {
            return res.status(NOTALLOWED).json({
                message: responseMessages.INVALID_USER,
                error: true,
                success: false
            })
        }

        const updateUser = await UserModel.findByIdAndUpdate(id, {
            firstName,
            lastName
        }, { new: true })
        return res.status(OK).json({
            message: responseMessages.UPDATE_USER_SUCCESS,
            error: false,
            success: true,
            data: {
                ...updateUser._doc,
                level:undefined
            }
        })

    } catch (error) {
        console.log(error)
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}