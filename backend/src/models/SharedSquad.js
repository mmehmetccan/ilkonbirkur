const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const sharedSquadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    squad: { type: Array, required: true },
    formation: { type: String, required: true },

    squadImageUrl: { type: String },


    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, required: true },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('SharedSquad', sharedSquadSchema);