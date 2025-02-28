
import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import UserModel from "../../models/User.js";
import { uploadImageCloudinary } from "../../utils/uploadImageCloudinary.js";

export const uploadImage = async (req, res) => {
  try {
    const userId = req.userId
    const image = req.file;

    const uplaod = await uploadImageCloudinary(image);
    const uploadUser = await UserModel.findByIdAndUpdate({_id:userId},{
        profilePicture: uplaod.url
    })

    return res.status(OK).json({
      message: responseMessages.UPLOAD_AVATAR,
      error: false,
      success: true,
      data: {
        _id:userId,
        avatar:uplaod.url
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
