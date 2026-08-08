const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        membershipId: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member',
        },
        used: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// TTL index — MongoDB will auto-delete expired+used invites after 7 days
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Invite', inviteSchema);
