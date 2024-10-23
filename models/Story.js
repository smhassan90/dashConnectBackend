const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    integrations: {
        type: String,
        required: true
    },
    complementaryDatasets: {
        type: String,
        required: true
    },
    createdBy: { 
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('story', storySchema);
