import { INTERNALERROR, NOTFOUND, OK, UNAUTHORIZED } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";
import bcryptjs from "bcryptjs";
import { generateToken } from "../../utils/generateToken.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(NOTFOUND).send({
        status: false,
        error: true,
        message: responseMessages.USER_NOT_FOUND,
      });
    }
    const checkPassword = bcryptjs.compareSync(password, user.password);
    if (!checkPassword) {
      return res.status(UNAUTHORIZED).send({
        status: false,
        error: true,
        message: responseMessages.INVALID,
      });
    }
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
    const token = await generateToken(user);
    res.cookie("token", token, cookieOptions);
    return res.status(OK).send({
      status: true,
      error: false,
      message: responseMessages.LOGIN_SUCEESS,
      data: {
        ...user._doc,
        token,
      },
    });
  } catch (error) {
    return res.status(INTERNALERROR).send({
      status: false,
      error: true,
      message: error.message,
    });
  }
};
