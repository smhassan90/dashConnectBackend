import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
    employeeName: {
        type: String,
        required: true,
    },
    level:{
        type:Number,
        enum:[1,2,3,4,5],
        required: true,
    },
    quota:{
        type:Number,
        default:100
    },
    quotaUtilize:{
        type:Number,
        default:0
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
},
    {
        timestamps: true,
    },
);

const employeeModel = mongoose.model("Employee", employeeSchema);
export default employeeModel;
