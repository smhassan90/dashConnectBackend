import { NOTFOUND, OK, UNAUTHORIZED } from "../../constant/httpStatus.js";
import userModel from "../../models/User.js";
import bcrypt from "bcrypt";
import { responseMessages } from "../../constant/responseMessages.js";

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(NOTFOUND).send({
        status: false,
        error: true,
        message: responseMessages.USER_NOT_FOUND,
      });
    }

    const checkPassword = bcrypt.compareSync(oldPassword, user.password);

    if (!checkPassword) {
      return res.status(UNAUTHORIZED).send({
        status: false,
        error: true,
        message: responseMessages.INVALID,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(newPassword, salt);

    const newPasswordSave = await userModel.findByIdAndUpdate(
      { _id: userId },
      {
        password: hashpassword,
      }
    );
    return res.status(OK).send({
      status: true,
      error: false,
      message: responseMessages.PASSWORD_UPDATED
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
