import { ALREADYEXISTS, FORBIDDEN, INTERNALERROR, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import companyModal from "../../models/Company.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";
import levelModel from "../../models/level.js";
import bcrypt from "bcrypt";

export const addEmployee = async (req, res) => {
    try {
        const { firstName, lastName, email, password, level } = req.body;
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        if (!firstName || !lastName || !email || !password || !level) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.INVALID_FIELD,
            });
        }

        const companyId = user.company;
        const companyExists = await companyModal.findById(companyId);
        if (!companyExists) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.COMPANY_NOT_FOUND,
            });
        }
        if (level == 1) {
            return res.status(NOTALLOWED).send({
                success: false,
                error: true,
                message: responseMessages.PLEASE_CHOOSE_OTHER,
            });
        }
        const existingLevel = await levelModel.findOne({ companyId, levelNumber:level });
        if (!existingLevel) {
            return res.status(BADREQUEST).send({
                success: false,
                error: true,
                message: responseMessages.LEVEL_NOT_FOUND,
            });
        }
        const findEmail = await userModel.findOne({ email })
        if (findEmail) {
            return res.status(ALREADYEXISTS).send({
                success: false,
                error: true,
                message: responseMessages.EMAIL_FOUND,
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);
        const quota = level <= 3 ? 100 : 0
        const employeePayload = {
            firstName,
            lastName,
            email,
            password: hashpassword,
            level:existingLevel._id,
            quota,
            company: companyId
        };

        const newEmployee = new userModel(employeePayload);
        const savedEmployee = await newEmployee.save();

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.EMPLOYEE_CREATED,
            data: savedEmployee,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};