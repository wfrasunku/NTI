const express = require('express');
const Post = require('../models/post');
const User = require('../models/user');

const router = express.Router();

// Pobranie wszystkich postów
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username _id')
            .populate('comments.author', 'username _id')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Dodanie postu
router.post('/posts', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Nie zalogowany' });

    const user = await User.findOne({ username: req.session.user.username });
    const post = new Post({ author: user._id, content: req.body.content });
    await post.save();

    const fullPost = await Post.findById(post._id)
        .populate('author', 'username _id')
        .populate('comments.author', 'username _id');
    res.json(fullPost);
});

// Edycja postu
router.put('/posts/:id', async (req, res) => {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    if (req.session.user.username !== post.author.username && req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Brak uprawnień' });
    }

    post.content = req.body.content;
    await post.save();
    res.json(post);
});

// Usuwanie postu
router.delete('/posts/:id', async (req, res) => {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    if (req.session.user.username !== post.author.username && req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Brak uprawnień' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post usunięty' });
});

// Dodanie komentarza
router.post('/posts/:id/comments', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Nie zalogowany' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    const user = await User.findOne({ username: req.session.user.username });
    post.comments.push({ author: user._id, content: req.body.content });
    await post.save();

    const fullPost = await Post.findById(post._id)
        .populate('author', 'username _id')
        .populate('comments.author', 'username _id');
    res.json(fullPost);
});

// Edycja komentarza
router.put('/posts/:postId/comments/:commentId', async (req, res) => {
    const post = await Post.findById(req.params.postId).populate('comments.author');
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Komentarz nie istnieje' });

    if (req.session.user.username !== comment.author.username && req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Brak uprawnień' });
    }

    comment.content = req.body.content;
    await post.save();
    res.json(post);
});

// Usuwanie komentarza
router.delete('/posts/:postId/comments/:commentId', async (req, res) => {
    const post = await Post.findById(req.params.postId).populate('comments.author');
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Komentarz nie istnieje' });

    if (req.session.user.username !== comment.author.username && req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Brak uprawnień' });
    }

    comment.remove();
    await post.save();
    res.json(post);
});

// Lubię/Nie lubię post
router.post('/posts/:id/like', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    post.likes = (post.likes || 0) + 1;
    await post.save();
    res.json(post);
});

router.post('/posts/:id/dislike', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    post.dislikes = (post.dislikes || 0) + 1;
    await post.save();
    res.json(post);
});

module.exports = router;
