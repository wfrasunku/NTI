const API = 'http://localhost:3000/api';

let currentUser = null;
let devlogs = [];

// Inicjalizacja
async function initDevlog() {
  try {
    const userRes = await fetch(`${API}/currentUser`, { credentials: 'include' });
    if (userRes.ok) currentUser = await userRes.json();

    const logsRes = await fetch(`${API}/devlogs`, { credentials: 'include' });
    if (logsRes.ok) devlogs = await logsRes.json();

    renderUserBar();
    renderDevlogs();

    // Widoczność sekcji "Dodaj devlog"
    const newSection = document.getElementById('new-devlog-section');
    if (newSection) {
      if (currentUser && currentUser.role === 'admin') {
        newSection.classList.remove('hidden');
        document.getElementById('add-devlog-btn').addEventListener('click', addDevlog);
      } else {
        newSection.classList.add('hidden');
      }
    }
  } catch (err) {
    console.error(err);
    alert("Nie można połączyć się z serwerem.");
  }
}

// Pasek użytkownika
function renderUserBar() {
  const userInfo = document.getElementById('user-info');
  if (!userInfo) return;

  if (currentUser) {
    userInfo.innerHTML = `
      Zalogowano jako: <b>${currentUser.username}</b> (${currentUser.role})
      <button id="logoutBtn">Wyloguj</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' });
      window.location.href = '../index.html';
    });
  } else {
    userInfo.innerHTML = `Nie jesteś zalogowany. <a href="../login/login.html">Zaloguj się</a>`;
  }
}

// Render devlogów
function renderDevlogs() {
  const container = document.getElementById('devlogs-container');
  container.innerHTML = '';

  if (!devlogs.length) {
    container.innerHTML = '<p>Brak devlogów.</p>';
    return;
  }

  devlogs.forEach(log => {
    const div = document.createElement('div');
    div.className = 'devlog';
    
    // Miniaturka + tytuł i data
    div.innerHTML = `
      <div class="devlog-header">
        ${log.thumbnail ? `<img class="thumbnail" src="${log.thumbnail}" alt="miniaturka">` : ''}
        <div class="title-date">
          <h3>${log.title}</h3>
          <div class="meta">${new Date(log.createdAt).toLocaleString()}</div>
        </div>
      </div>
    `;

    div.addEventListener('click', () => openDevlogModal(log));

    container.appendChild(div);
  });
}

// Modal devloga
function openDevlogModal(log) {
  // Tworzymy overlay
  const overlay = document.createElement('div');
  overlay.className = 'devlog-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'devlog-modal';
  
  modal.innerHTML = `
    <button class="close-modal">✖</button>
    <h2>${log.title}</h2>
    <div class="meta">${new Date(log.createdAt).toLocaleString()}</div>
    <p>${log.content}</p>
    ${log.images && log.images.length ? `<div class="devlog-images">${log.images.map(url => `<img src="${url}">`).join('')}</div>` : ''}
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.querySelector('.close-modal').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// Dodawanie devloga (admin)
async function addDevlog() {
  const title = document.getElementById('devlog-title').value.trim();
  const content = document.getElementById('devlog-content').value.trim();
  const files = document.getElementById('devlog-images').files;

  if (!title || !content) {
    alert('Podaj tytuł i treść devloga.');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);

  // Pliki: pierwszy jako miniaturka, reszta jako images
  if (files.length) formData.append('thumbnail', files[0]);
  for (let i = 1; i < files.length; i++) formData.append('images', files[i]);

  const res = await fetch(`${API}/devlogs`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (res.ok) {
    devlogs = await (await fetch(`${API}/devlogs`, { credentials: 'include' })).json();
    renderDevlogs();
    document.getElementById('devlog-title').value = '';
    document.getElementById('devlog-content').value = '';
    document.getElementById('devlog-images').value = '';
  } else {
    const err = await res.json();
    alert(err.message || 'Błąd');
  }
}

initDevlog();
