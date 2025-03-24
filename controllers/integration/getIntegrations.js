import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import companyModal from "../../models/Company.js";
export const getIntegration = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
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
        const findIntegration = await integrationModel.find({ companyId });
        if (!findIntegration) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_NOT_FOUND,
            });
        }
        const addData = await Promise.all(
            findIntegration.map((integration) => {
                return new Promise((resolve, reject) => {
                    if (integration.platformName == "mysql") {
                        resolve({
                            ...integration._doc,
                            details: "MySQL is an open-source relational database management system that stores and manages structured data efficiently.",
                            databaseName:"MySql"
                        });
                    }
                    if (integration.platformName == "oracle") {
                        resolve({
                            ...integration._doc,
                            details: "Oracle is a powerful relational database management system known for scalability, security, and enterprise-level performance.",
                            databaseName:"Oracle"
                        });
                    }
                    if (integration.platformName == "sqlserver") {
                        resolve({
                            ...integration._doc,
                            details: "SQL Server is a relational database management system by Microsoft, offering high performance, security, and scalability.",
                            databaseName:"SQL Server"
                        });
                    }
                    if (integration.platformName == "mongodb") {
                        resolve({
                            ...integration._doc,
                            details: "MongoDB is a NoSQL database that stores data in flexible JSON-like documents, ideal for scalable applications.",
                            databaseName:"MongoDb"
                        });
                    } else {
                        reject();
                    }
                });
            })
        );
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.GET_INTEGRATION,
            data: addData
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}