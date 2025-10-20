const mongoose = require('mongoose');


const appStatSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'global_stats',
        unique: true,
        required: true
    },
    totalSimulations: {
        type: Number,
        default: 0
    },
    totalPlayerAssignments: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AppStat', appStatSchema);