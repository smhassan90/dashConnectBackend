import { FORBIDDEN, OK } from "../../constant/httpStatus.js";
import bcryptjs from "bcryptjs";
import Company from "../../models/Company.js";
import User from "../../models/User.js";
import { responseMessages } from "../../constant/responseMessages.js";

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

    const findEmail = await User.findOne({ email });
    if (findEmail) {
      return res.status(FORBIDDEN).send({
        status: false,
        error: true,
        message: responseMessages.USER_EXIST,
      });
    }
    const salt = await bcryptjs.genSalt(10);
    const hashpassword = await bcryptjs.hash(password, salt);

    const findCompany = await Company.find({ companyName });
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

    const newCompany = new Company(companyPayload);
    const saveCompany = await newCompany.save();

    const userPayload = {
      firstName,
      lastName,
      email,
      password: hashpassword,
      newCompany,
    };

    const newUser = new User(userPayload);
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
