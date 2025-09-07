const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const User = require('./models/User');
const Post = require('./models/Post');

const app = express();

// ================== KONFIGURACJA ==================
app.use(cors({
    origin: 'http://localhost:5500', // frontend
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Połączenie z MongoDB
mongoose.connect('mongodb://localhost:27017/loginApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Połączono z MongoDB"))
  .catch(err => console.error("❌ Błąd MongoDB:", err));

// Sesje
app.use(session({
    secret: 'RadoslawBednarskiSuperSecretKeyForNowoczesneTechnologieInformatyczneThatNowoneWillGuess', 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/loginApp' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Multer do uploadu zdjęć
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});
const upload = multer({ storage });

// ================== UŻYTKOWNICY ==================

// Rejestracja
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, role, gender } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Użytkownik już istnieje!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const profileImage = gender === 'female' ? '/images/default-female.png' : '/images/default-male.png';

        const user = new User({
            username,
            password: hashedPassword,
            role,
            gender,
            profileImage,
            description: 'Brak opisu',
            createdAt: new Date()
        });
        await user.save();
        res.status(201).json({ message: 'Rejestracja zakończona sukcesem!' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Logowanie
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Nieprawidłowy login lub hasło' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Nieprawidłowy login lub hasło' });

        req.session.user = { username: user.username, role: user.role };
        res.json({ message: 'Zalogowano', username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Wylogowanie
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Błąd wylogowania' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Wylogowano' });
    });
});

// Aktualny użytkownik
app.get('/api/currentUser', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Nie zalogowany' });
    res.json(req.session.user);
});

// Pobranie jednego użytkownika
app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password -__v');
        if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Edycja użytkownika
app.put('/api/user/:username', upload.single('profileImage'), async (req, res) => {
    try {
        const { username, description, gender } = req.body;
        const currentUsername = req.params.username;
        const update = { username, description, gender };
        if (req.file) update.profileImage = `/uploads/${req.file.filename}`;

        const updatedUser = await User.findOneAndUpdate({ username: currentUsername }, update, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Lista użytkowników
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username role profileImage');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Usuwanie użytkownika
app.delete('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        await User.deleteOne({ username: req.params.username });
        res.json({ message: 'Użytkownik usunięty' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// ================== FORUM ==================

// Pobranie wszystkich postów
app.get('/api/posts', async (req, res) => {
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
app.post('/api/posts', async (req, res) => {
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
app.put('/api/posts/:id', async (req, res) => {
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
app.delete('/api/posts/:id', async (req, res) => {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    if (req.session.user.username !== post.author.username && req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Brak uprawnień' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post usunięty' });
});

// Dodanie komentarza
app.post('/api/posts/:id/comments', async (req, res) => {
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
app.put('/api/posts/:postId/comments/:commentId', async (req, res) => {
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
app.delete('/api/posts/:postId/comments/:commentId', async (req, res) => {
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
app.post('/api/posts/:id/like', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    post.likes = (post.likes || 0) + 1;
    await post.save();
    res.json(post);
});

app.post('/api/posts/:id/dislike', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie istnieje' });

    post.dislikes = (post.dislikes || 0) + 1;
    await post.save();
    res.json(post);
});

// ================== URUCHOMIENIE ==================
app.listen(3000, () => console.log('🚀 Serwer działa na http://localhost:3000'));
