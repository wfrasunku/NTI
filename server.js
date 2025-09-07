const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');

const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const app = express();

// ================== KONFIGURACJA ==================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ================== SESJE ==================
app.use(session({
    secret: 'RadoslawBednarskiSuperSecretKeyForNowoczesneTechnologieInformatyczneThatNooneWillGuess2137',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/loginApp' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ================== MULTER ==================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'profileImage') cb(null, 'public/uploads/profile/');
        else if (file.fieldname === 'images') cb(null, 'public/uploads/posts/');
        else cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});
const upload = multer({ storage });

// ================== POŁĄCZENIE Z MONGODB ==================
mongoose.connect('mongodb://localhost:27017/loginApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Połączono z MongoDB"))
  .catch(err => console.error("❌ Błąd MongoDB:", err));

// ================== ROUTES ==================
app.use('/api', userRoutes);
app.use('/api', postRoutes);

// ================== URUCHOMIENIE ==================
app.listen(3000, () => console.log('🚀 Serwer działa na http://localhost:3000'));
