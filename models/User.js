const mongoose = require("mongoose");

// User Schema
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
    company: {
      type: {
        companyName: {
          type: String,
        },
        updateDate: {
          type: Date,
          default: Date.now,
        },
        Status: {
          type: Number,
          default: 1,
        },
      },
      required: false, 
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("User", userSchema);
