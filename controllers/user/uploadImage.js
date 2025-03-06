import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import UserModel from "../../models/User.js";

export const uploadImage = async (req, res) => {
  try {
    const userId = req.userId
    const image = req.file;
    
    const imagePath = req.file.path;
    const uploadUser = await UserModel.findByIdAndUpdate({_id:userId},{
        profilePicture: imagePath
    })

    return res.status(OK).json({
      message: responseMessages.UPLOAD_AVATAR,
      error: false,
      success: true,
      data: {
        _id:userId,
        avatar:imagePath
      },
    });
  } catch (error) {
    return res.status(INTERNALERROR).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};