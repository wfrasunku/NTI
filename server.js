const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');

const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const devlogRoutes = require('./routes/devlogs')

const fs = require('fs');
const faqPath = path.join(__dirname, 'public/data/faq.json');


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
        else if (file.fieldname === 'devlogImage') cb(null, 'public/uploads/devlogs/');
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
app.use('/api', devlogRoutes);

// ================== URUCHOMIENIE ==================
app.listen(3000, () => console.log('🚀 Serwer działa na http://localhost:3000'));


// ======== ŚCIEŻKA DO PLIKU FAQ.JSON ========
const faqFilePath = path.join(__dirname, "public", "faq", "faq.json");

// ======== POBIERANIE PYTAŃ ========
app.get("/api/faq", (req, res) => {
    fs.readFile(faqFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Błąd wczytywania FAQ:", err);
            return res.status(500).json({ error: "Nie udało się wczytać FAQ." });
        }

        try {
            const faqs = JSON.parse(data);
            res.json(faqs);
        } catch (e) {
            res.status(500).json({ error: "Błąd parsowania JSON." });
        }
    });
});

// ======== ZAPIS PYTAŃ (DODAWANIE / EDYCJA) ========
app.post("/api/faq", (req, res) => {
    const { question, answer, index } = req.body;

    if (!question || !answer) {
        return res.status(400).json({ error: "Brakuje pytania lub odpowiedzi." });
    }

    fs.readFile(faqFilePath, "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Nie można wczytać pliku FAQ." });

        let faqs;
        try {
            faqs = JSON.parse(data);
        } catch (e) {
            faqs = [];
        }

        if (typeof index === "number" && faqs[index]) {
            faqs[index] = { question, answer };
        } else {
            faqs.push({ question, answer });
        }

        fs.writeFile(faqFilePath, JSON.stringify(faqs, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Nie udało się zapisać FAQ." });
            res.json({ message: "FAQ zapisane." });
        });
    });
});
