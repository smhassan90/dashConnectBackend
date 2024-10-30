const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
    storyName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    integrations: {
        type: String,
        required: true,
    },
    complementaryDatasets: {
        type: String,
        required: true,
    },
    storyCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userDetails: {
      // Ensure this is defined correctly
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      companyName: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Story", storySchema);

