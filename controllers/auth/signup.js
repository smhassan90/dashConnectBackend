import { FORBIDDEN, INTERNALERROR, OK } from "../../constant/httpStatus.js";
import bcrypt from "bcrypt";
import userModel from "../../models/User.js";
import { responseMessages } from "../../constant/responseMessages.js";
import companyModal from "../../models/Company.js";
import levelModel from "../../models/level.js"
export const signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      company,
      password,
      confirmPassword,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !company ||
      !password ||
      !confirmPassword
    ) {
      return res.status(FORBIDDEN).send({
        success: false,
        error: true,
        message: responseMessages.INVALID_FIELD,
      });
    }
    if (password !== confirmPassword) {
      return res.status(FORBIDDEN).send({
        success: false,
        error: true,
        message: responseMessages.PASSWORD_NOT_MATCH,
      });
    }
    const findEmail = await userModel.findOne({ email });
    if (findEmail) {
      return res.status(FORBIDDEN).send({
        success: false,
        error: true,
        message: responseMessages.USER_EXIST,
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password, salt);

    const findCompany = await companyModal.findOne({ companyName:company });
    if (findCompany) {
      return res.status(FORBIDDEN).send({
        success: false,
        error: true,
        message: responseMessages.COMPANY_EXIST,
      });
    }
    const companyPayload = {
      companyName: company,
    };
    const newCompany = new companyModal(companyPayload);
    const saveCompany = await newCompany.save();
    const levelPayload = {
      displayName: "Owner",
      levelNumber:1,
      companyId:newCompany._id
    };
    const newLevel = new levelModel(levelPayload);
    const saveLevel = await newLevel.save();
    const userPayload = {
      firstName,
      lastName,
      email,
      password: hashpassword,
      level:newLevel._id,
      company:newCompany._id,
    };

    const newUser = new userModel(userPayload);
    const saveUser = await newUser.save();

    return res.status(OK).send({
      success: true,
      error: false,
      message: responseMessages.USER_CREATED,
      data: saveUser,
    });
  } catch (error) {
    return res.status(INTERNALERROR).send({
      success: false,
      error: true,
      message: error.message,
    });
  }
};