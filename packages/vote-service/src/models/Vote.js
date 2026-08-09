const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
    pollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll',
        required: true,
    },
    positionName: {
        type: String,
        required: true,
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    castedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index to quickly aggregate votes by poll and position
VoteSchema.index({ pollId: 1, positionName: 1 });

module.exports = mongoose.model('Vote', VoteSchema);
