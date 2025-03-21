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
    // level: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Level",
    //   required: true,
    //   default:1
    // },
    level: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 1,
      required: true,
    },
    quota: {
      type: Number,
      default: 100
    },
    quotaUtilize: {
      type: Number,
      default: 0
    },
    company: {
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
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
