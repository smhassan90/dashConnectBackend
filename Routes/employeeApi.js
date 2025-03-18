import express from "express";
import { addEmployee } from "../controllers/employee/addEmployee.js";
import { deleteEmployee } from "../controllers/employee/deleteEmployee.js";
import { updateEmployee } from "../controllers/employee/updateEmployee.js";
import { auth } from "../config/tokenVerification.js";
import { getEmployee } from "../controllers/employee/getEmployee.js";
import { getSingleEmployee } from "../controllers/employee/getSingleEmployee.js";
const employeeRouter = express.Router();

employeeRouter.post('/addEmployee',auth,addEmployee)
employeeRouter.delete('/deleteEmployee/:employeeId',auth,deleteEmployee)
employeeRouter.put('/updateEmployee/:employeeId',auth,updateEmployee)
employeeRouter.get('/getEmployee',auth,getEmployee)
employeeRouter.get('/getEmployee/:employeeId',auth,getSingleEmployee)

export default employeeRouter;
