// models/Match.js
const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  result: {
    score: String,
    commentary: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Match", MatchSchema);
