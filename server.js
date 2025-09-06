const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/loginApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Połączono z MongoDB"))
    .catch(err => console.error("❌ Błąd MongoDB:", err));

// Rejestracja
app.post('/api/register', async (req, res) => {
    const { username, password, role, gender } = req.body;
    const existingUser = await User.findOne({ username });

    if (existingUser) {
        return res.status(400).json({ message: 'Użytkownik już istnieje!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = gender === 'female'
        ? '/images/default-female.png'
        : '/images/default-male.png';

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
});

// Logowanie
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).json({ message: 'Nieprawidłowy login lub hasło' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Nieprawidłowy login lub hasło' });
    }

    res.json({ message: `Zalogowano jako ${user.role}`, role: user.role });
});

app.listen(3000, () => {
    console.log("🚀 Serwer działa na http://localhost:3000");
});

app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password -__v');
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});