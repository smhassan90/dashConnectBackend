import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import employeeModel from "../../models/Employee.js";
import userModel from "../../models/User.js";

export const updateEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params
        const { employeeName, level, quota } = req.body;
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.EMPLOYEE_NOT_FOUND,
            });
        }

        if (employee.companyId.toString() !== user.company.toString()) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.UNAUTHORIZED,
            });
        }

        const payload = {
            employeeName: employeeName || employee.employeeName,
            level: level || employee.level,
            quota: quota || employee.quota
        }

        const updatedEmployee = await employeeModel.findByIdAndUpdate(
            employeeId,
            { $set: payload },
            { new: true }
        );

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.EMPLOYEE_UPDATED,
            data: updatedEmployee,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};