const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    clubId: { type: Number, required: true, unique: true, index: true },
    clubName: { type: String, required: true },
    searchName: { type: String, required: true, index: true },
    logoUrl: { type: String }
});

module.exports = mongoose.model('Team', teamSchema);