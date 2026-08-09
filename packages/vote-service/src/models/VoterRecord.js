const mongoose = require('mongoose');

const VoterRecordSchema = new mongoose.Schema({
    pollId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    voterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    votedPositions: [{
        type: String,
    }],
}, {
    timestamps: true,
});

// Prevent same voter from having multiple voter records for the same poll
VoterRecordSchema.index({ pollId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('VoterRecord', VoterRecordSchema, 'voter_records');
