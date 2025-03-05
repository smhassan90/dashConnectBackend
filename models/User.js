import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: "owner",
    },
    companyName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    token: {
      type: String,
      default: "",
    },
    forgot_password_expiry: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
