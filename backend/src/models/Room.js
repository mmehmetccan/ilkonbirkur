const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true },
  password: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    isReady: { type: Boolean, default: false },
    team: {
      squad: [{
        player_id: Number,
        short_name: String,
        age: Number,
        gender: String,
        club_name: String,
        league_name: String,
        nationality: String,
        player_positions: String,
        preffered_foot: String,
        height_cm: Number,
        weight_kg: Number,
        alt_position: [String],
        overall: Number,
        pace: Number,
        shooting: Number,
        passing: Number,
        dribbling: Number,
        defending: Number,
        physic: Number,
        player_face_url: String,
        assignedPosition: { type: String, required: false }
      }]
    },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 }
  }],
  formation: {
        type: Map,
        of: [String],
        default: {}

    },
  maxPlayers: { type: Number, required: true, min: 2, max: 8 },
  leagues: [{ type: String, required: true }],
  status: { type: String, enum: ['waiting', 'in_progress','drafting', 'finished', 'draft_finished'], default: 'waiting' },
  currentRound: { type: Number, default: 0 },
  matchesToPlay: [{
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    played: { type: Boolean, default: false },
    result: { type: Object, default: null }
  }],
  matches: { type: Array, default: [] },
  draft: {
    isDrafting: { type: Boolean, default: false },
    currentPick: { type: Number, default: 0 },
    playersToDraft: { type: Array, default: [] },
    lastPickTime: { type: Date, default: null }

  }
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
