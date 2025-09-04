// Importujemy bibliotekę express
const express = require("express");
const app = express();
const PORT = 3000;

// Middleware - obsługa plików statycznych (np. index.html, style.css)
app.use(express.static("public"));

// Prosta trasa API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Witaj w mojej prostej stronie w Node.js 🚀" });
});

// Start serwera
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
