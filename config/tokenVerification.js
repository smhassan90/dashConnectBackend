import { FORBIDDEN, INTERNALERROR, UNAUTHORIZED } from "../constant/httpStatus.js";
import jwt from "jsonwebtoken";
import { responseMessages } from "../constant/responseMessages.js";
export const auth = async (req, res, next) => {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(FORBIDDEN).json({
        message: responseMessages.PROVIDE_TOKEN,
        error: true,
        success: false,
      });
    }
    const decode = await jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res.status(UNAUTHORIZED).json({
        message: responseMessages.INVALID_TOKEN,
        error: true,
        success: false,
      });
    }
    req.userId = decode.id;
    next();
  } catch (error) {
    return res.status(INTERNALERROR).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
