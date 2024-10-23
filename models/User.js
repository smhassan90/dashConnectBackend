const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true  // Corrected here
    },
    lastName: {
        type: String,
        required: true  // Corrected here
    },
    email: {
        type: String,
        required: true,  // Corrected here
        unique: true
    },
    companyName: {
        type: String,
        required: true,  // Corrected here
        unique: true
    },
    password: {
        type: String,
        required: true  // Corrected here
    }
});

module.exports = mongoose.model('User', userSchema);
