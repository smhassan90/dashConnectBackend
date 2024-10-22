const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        reuired : true
    },
    lastName: {
        type: String,
        reuired : true
    },
    email: {
        type: String,
        reuired : true,
        unique : true
    },
    companyName: {
        type: String,
        reuired : true,
        unique : true
    },
    password: {
        type: String,
        reuired : true
    }
});

module.exports = mongoose.model('User', userSchema);
