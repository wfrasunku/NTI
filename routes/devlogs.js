const express = require('express');
const Devlog = require('../models/devlog');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Folder na devlogi
const devlogStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/devlogs'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const uploadDevlogs = multer({ storage: devlogStorage });

// Pobierz wszystkie devlogi (od najnowszego)
router.get('/devlogs', async (req, res) => {
  try {
    const devlogs = await Devlog.find()
      .populate('author', 'username _id')
      .populate('comments.author', 'username _id')
      .sort({ createdAt: -1 });

    res.json(devlogs);
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Dodaj devlog (tylko admin)
// Dodaj devlog (tylko admin) z miniaturką i zdjęciami
router.post(
  '/devlogs',
  uploadDevlogs.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Tylko administrator może dodawać devlogi' });
      }

      const author = await User.findOne({ username: req.session.user.username });

      const thumbnailPath = req.files['thumbnail']
        ? '/uploads/devlogs/' + req.files['thumbnail'][0].filename
        : undefined;

      const imagesPaths = req.files['images']
        ? req.files['images'].map(f => '/uploads/devlogs/' + f.filename)
        : [];

      const devlog = new Devlog({
        title: req.body.title,
        content: req.body.content,
        thumbnail: thumbnailPath,
        images: imagesPaths,
        author: author._id
      });

      await devlog.save();

      const fullDevlog = await Devlog.findById(devlog._id)
        .populate('comments.author', 'username _id'); // autor devloga niepotrzebny na froncie

      res.status(201).json(fullDevlog);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Błąd tworzenia devloga' });
    }
  }
);

// Usuń devlog (tylko admin)
router.delete('/devlogs/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Tylko administrator może usuwać devlogi' });
  }

  await Devlog.findByIdAndDelete(req.params.id);
  res.json({ message: 'Devlog usunięty' });
});

// Dodaj komentarz
router.post('/devlogs/:id/comments', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Nie zalogowany' });

  const devlog = await Devlog.findById(req.params.id);
  if (!devlog) return res.status(404).json({ message: 'Devlog nie istnieje' });

  const user = await User.findOne({ username: req.session.user.username });
  devlog.comments.push({ author: user._id, content: req.body.content });
  await devlog.save();

  const fullDevlog = await Devlog.findById(devlog._id)
    .populate('author', 'username _id')
    .populate('comments.author', 'username _id');

  res.json(fullDevlog);
});

// Usuń komentarz (admin lub autor)
router.delete('/devlogs/:devlogId/comments/:commentId', async (req, res) => {
  const devlog = await Devlog.findById(req.params.devlogId).populate('comments.author');
  if (!devlog) return res.status(404).json({ message: 'Devlog nie istnieje' });

  const comment = devlog.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Komentarz nie istnieje' });

  if (req.session.user.username !== comment.author.username && req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  comment.remove();
  await devlog.save();
  res.json(devlog);
});

module.exports = router;
