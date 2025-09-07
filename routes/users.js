const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const User = require('../models/user');

const router = express.Router();

// Multer zdjęcia profilowego
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/profiles'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
});

const uploadProfile = multer({ storage: profileStorage });

// Rejestracja
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, gender } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Użytkownik już istnieje!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const profileImage = gender === 'female' ? '/images/default-female.png' : '/images/default-male.png';

        const user = new User({ username, password: hashedPassword, role, gender, profileImage, description: 'Brak opisu', createdAt: new Date() });
        await user.save();
        res.status(201).json({ message: 'Rejestracja zakończona sukcesem!' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Logowanie
router.post('/login', async (req, res) => {
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
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Błąd wylogowania' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Wylogowano' });
    });
});

// Aktualny użytkownik
router.get('/currentUser', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Nie zalogowany' });
    res.json(req.session.user);
});

// Pobranie użytkownika
router.get('/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password -__v');
        if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Edycja użytkownika
router.put('/user/:username', uploadProfile.single('profileImage'), async (req, res) => {
    try {
        const { username, description, gender } = req.body;
        const currentUsername = req.params.username;
        const update = { username, description, gender };

        if (req.file) {
            update.profileImage = `/uploads/profiles/${req.file.filename}`;
        }

        const updatedUser = await User.findOneAndUpdate(
            { username: currentUsername },
            update,
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Lista użytkowników
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username role profileImage');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Usuwanie użytkownika
router.delete('/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        await User.deleteOne({ username: req.params.username });
        res.json({ message: 'Użytkownik usunięty' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;
