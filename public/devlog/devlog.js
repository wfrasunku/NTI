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

    // 🔒 widoczność sekcji "Dodaj devlog"
    const newSection = document.getElementById('new-devlog-section');
    if (newSection) {
      if (currentUser && currentUser.role === 'admin') {
        newSection.classList.remove('hidden');
        document.getElementById('add-devlog-btn').addEventListener('click', addDevlog);
      } else {
        newSection.classList.add('hidden'); // ukryj dla nie-adminów
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

    // Meta
    const meta = document.createElement('div');
    meta.innerHTML = `<b>${log.author?.username || 'admin'}</b> • ${new Date(log.createdAt).toLocaleString()}`;
    div.appendChild(meta);

    // Tytuł
    const title = document.createElement('h3');
    title.textContent = log.title;
    div.appendChild(title);

    // Treść
    const content = document.createElement('p');
    content.textContent = log.content;
    div.appendChild(content);

    // Zdjęcia
    if (log.images && log.images.length) {
      const imgsWrap = document.createElement('div');
      log.images.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '120px';
        img.style.margin = '6px';
        imgsWrap.appendChild(img);
      });
      div.appendChild(imgsWrap);
    }

    // Admin akcje
    if (currentUser?.role === 'admin') {
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Usuń devlog';
      delBtn.onclick = () => deleteDevlog(log._id);
      div.appendChild(delBtn);
    }

    // Komentarze
    if (Array.isArray(log.comments)) {
      log.comments.forEach(c => {
        const com = document.createElement('div');
        com.className = 'comment';
        com.innerHTML = `<b>${c.author?.username || '?'}</b>: ${c.content}`;
        div.appendChild(com);
      });
    }

    if (currentUser) {
      div.innerHTML += `<input id="comment-input-${log._id}" placeholder="Komentarz"> 
        <button onclick="addComment('${log._id}')">Dodaj</button>`;
    }

    container.appendChild(div);
  });
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
  for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

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

// Usuwanie devloga
async function deleteDevlog(id) {
  await fetch(`${API}/devlogs/${id}`, { method: 'DELETE', credentials: 'include' });
  devlogs = devlogs.filter(d => d._id !== id);
  renderDevlogs();
}

// Dodawanie komentarza
async function addComment(devlogId) {
  const input = document.getElementById(`comment-input-${devlogId}`);
  if (!input || !input.value.trim()) return;

  await fetch(`${API}/devlogs/${devlogId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: input.value.trim() }),
    credentials: 'include'
  });

  devlogs = await (await fetch(`${API}/devlogs`, { credentials: 'include' })).json();
  renderDevlogs();
}

initDevlog();
