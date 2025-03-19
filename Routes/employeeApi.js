import express from "express";
import { addEmployee } from "../controllers/employee/addEmployee.js";
import { deleteEmployee } from "../controllers/employee/deleteEmployee.js";
import { updateEmployee } from "../controllers/employee/updateEmployee.js";
import { auth, topLevelAuth } from "../config/tokenVerification.js";
import { getEmployee } from "../controllers/employee/getEmployee.js";
import { getSingleEmployee } from "../controllers/employee/getSingleEmployee.js";
import { updateEmployeeQuota } from "../controllers/employee/updateEmployeeQuota.js";
const employeeRouter = express.Router();

employeeRouter.post('/addEmployee',topLevelAuth,addEmployee)
employeeRouter.delete('/deleteEmployee/:employeeId',topLevelAuth,deleteEmployee)
employeeRouter.put('/updateEmployeeQuota/:employeeId',topLevelAuth,updateEmployeeQuota)
employeeRouter.put('/updateEmployee/:employeeId',auth,updateEmployee)
employeeRouter.get('/getEmployee',topLevelAuth,getEmployee)
employeeRouter.get('/getEmployee/:employeeId',auth,getSingleEmployee)

export default employeeRouter;
