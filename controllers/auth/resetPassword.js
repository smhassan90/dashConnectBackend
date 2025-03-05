import { INTERNALERROR, NOTALLOWED, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import UserModel from "../../models/User.js";
import bcrypt from "bcrypt"
export const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.status(NOTALLOWED).json({
        message: responseMessages.REQUIRED_EMAIL_PASSWORD_CONFIRM,
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(NOTALLOWED).json({
        message: responseMessages.INVALID_USER,
        error: true,
        success: false,
      });
    }

    if (password !== confirmPassword) {
      return res.status(NOTALLOWED).json({
        message: responseMessages.PASSWORD_NOT_MATCH,
        error: true,
        success: false,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password, salt);
    const updatePassword = await UserModel.findOneAndUpdate(user._id,{
        password: hashpassword
    })

    return res.status(OK).json({
      message: responseMessages.PASSWORD_UPDATED,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(INTERNALERROR).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
