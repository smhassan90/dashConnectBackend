import { FORBIDDEN, INTERNALERROR, OK } from "../../constant/httpStatus.js";
import bcrypt from "bcrypt";
import userModel from "../../models/User.js";
import { responseMessages } from "../../constant/responseMessages.js";
import companyModal from "../../models/Company.js";

export const signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      companyName,
      password,
      confirmPassword,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !companyName ||
      !password ||
      !confirmPassword
    ) {
      return res.status(FORBIDDEN).send({
        status: false,
        error: true,
        message: responseMessages.INVALID_FIELD,
      });
    }
    if (password !== confirmPassword) {
      return res.status(FORBIDDEN).send({
        status: false,
        error: true,
        message: responseMessages.PASSWORD_NOT_MATCH,
      });
    }
    const findEmail = await userModel.findOne({ email });
    if (findEmail) {
      return res.status(FORBIDDEN).send({
        status: false,
        error: true,
        message: responseMessages.USER_EXIST,
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password, salt);

    const findCompany = await companyModal.findOne({ companyName });
    if (findCompany) {
      return res.status(FORBIDDEN).send({
        status: false,
        error: true,
        message: responseMessages.ALREADY_EXIST,
      });
    }

    const companyPayload = {
      companyName,
    };

    const newCompany = new companyModal(companyPayload);
    const saveCompany = await newCompany.save();

    const userPayload = {
      firstName,
      lastName,
      email,
      password: hashpassword,
      companyName:newCompany._id,
    };

    const newUser = new userModel(userPayload);
    const saveUser = await newUser.save();

    return res.status(OK).send({
      status: true,
      error: false,
      message: responseMessages.USER_CREATED,
      data: saveUser,
    });
  } catch (error) {
    return res.status(INTERNALERROR).send({
      status: false,
      error: true,
      message: error.message,
    });
  }
};