const express = require('express');
const Post = require('../models/post');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer do zdjęć postów
const postStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/posts'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
});

const uploadPosts = multer({ storage: postStorage });

// Pobranie wszystkich postów
router.get('/posts', async (req, res) => {
    try {
        const authorUsername = req.query.author;
        let filter = {};
        if (authorUsername) {
            const user = await User.findOne({ username: authorUsername });
            if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
            filter.author = user._id;
        }

        const posts = await Post.find(filter)
            .populate('author', 'username _id')
            .populate('comments.author', 'username _id')
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});


// Dodanie postu
router.post('/posts', uploadPosts.array('images', 10), async (req, res) => {
    try {
        const { title, content, type } = req.body;

        if (!req.session.user) return res.status(401).json({ message: 'Nie zalogowany' });

        const author = await User.findOne({ username: req.session.user.username });
        if (!author) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });

        const images = req.files ? req.files.map(f => '/uploads/posts/' + f.filename) : [];

        const post = new Post({
            title,
            content,
            type,
            author: author._id,
            images,
            createdAt: new Date()
        });

        await post.save();
        const fullPost = await Post.findById(post._id)
            .populate('author', 'username _id')
            .populate('comments.author', 'username _id');

        res.status(201).json(fullPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd tworzenia posta' });
    }
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

// Like post
router.post('/posts/:id/like', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    post.likes = (post.likes || 0) + 1;
    await post.save();
    res.json(post);
});

// Dislike post
router.post('/posts/:id/dislike', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    post.dislikes = (post.dislikes || 0) + 1;
    await post.save();
    res.json(post);
});

module.exports = router;
