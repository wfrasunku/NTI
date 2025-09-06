const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    description: { type: String, default: 'Brak opisu' },
    profileImage: { type: String, default: '/images/default-profile.png' },
    createdAt: { type: Date, default: Date.now },
    gender: { type: String, enum: ['male', 'female'], required: true }

});

module.exports = mongoose.model('User', userSchema);
