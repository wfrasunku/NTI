const mongoose = require('mongoose');

// Schemat komentarza
const CommentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Schemat posta
const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    type: {
        type: String,
        enum: ['Asking for help', 'Feature Idea', 'Bug report', 'Just talking'],
        default: 'Just talking'
    },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    comments: [CommentSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
