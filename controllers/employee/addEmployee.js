import { FORBIDDEN, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import companyModal from "../../models/Company.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";

export const addEmployee = async (req, res) => {
    try {
        const { employeeName, level } = req.body;
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        if (!employeeName || !level) {
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

        const employeePayload = {
            employeeName,
            level,
            companyId,
        };

        const newEmployee = new employeeModel(employeePayload);
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