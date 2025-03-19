import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import employeeModel from "../../models/Employee.js";
import userModel from "../../models/User.js";

export const updateEmployeeQuota = async (req, res) => {
    try {
        const { employeeId } = req.params
        const { level, quota } = req.body;
        const userId = req.userId;
        const userLevel = req.level
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        const employee = await userModel.findById(employeeId);
        if (!employee) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.EMPLOYEE_NOT_FOUND,
            });
        }

        if (employee.company.toString() !== user.company.toString()) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.UNAUTHORIZED,
            });
        }
        const payload = {
            level: level || employee.level,
            quota: quota || employee.quota
        }
        const updatedEmployee = await userModel.findByIdAndUpdate(
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