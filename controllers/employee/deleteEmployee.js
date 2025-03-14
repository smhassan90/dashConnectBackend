import { FORBIDDEN, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import employeeModel from "../../models/Employee.js";
import userModel from "../../models/User.js";

export const deleteEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
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

        await employeeModel.findByIdAndDelete(employeeId);

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.EMPLOYEE_DELETED,
        });
    } catch (error) {
        console.log(error)
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};