import mongoose from 'mongoose'

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  Status: {
    type: Number,
    default: 1,
  },
},{
  timestamps:true
});

const companyModel = mongoose.model("Company", companySchema);
export default companyModel
