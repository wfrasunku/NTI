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

    renderDevlogs();

    // Widoczność przycisku "Dodaj devlog"
    const adminBtn = document.getElementById('admin-add-btn');
    if (currentUser && currentUser.role === 'admin') {
      adminBtn.classList.remove('hidden');
      document.getElementById('open-add-devlog').addEventListener('click', () => {
        document.getElementById('add-devlog-modal').classList.remove('hidden');
      });
    } else {
      adminBtn.classList.add('hidden');
    }

    // Obsługa zamykania modala dodawania
    document.getElementById('close-add-devlog').addEventListener('click', () => {
      document.getElementById('add-devlog-modal').classList.add('hidden');
    });

    // Obsługa przycisku "Dodaj devlog"
    document.getElementById('add-devlog-btn').addEventListener('click', addDevlog);

  } catch (err) {
    console.error(err);
    alert("Nie można połączyć się z serwerem.");
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

    div.innerHTML = `
      <div class="devlog-header">
        ${log.thumbnail ? `<img class="thumbnail" src="${log.thumbnail}" alt="miniaturka">` : ''}
        <div class="title-date">
          <h3>${log.title}</h3>
          <div class="meta">${new Date(log.createdAt).toLocaleString()}</div>
        </div>
        ${currentUser && currentUser.role === 'admin'
        ? `<img src="/images/forum/delete.png" class="delete-devlog-btn" data-id="${log._id}" alt="Usuń">`
        : ''}
      </div>
    `;

    // Kliknięcie w całość otwiera modal
    div.addEventListener('click', (e) => {
      // jeśli kliknięto "usuń", to nie otwieraj modala
      if (e.target.classList.contains('delete-devlog-btn')) return;
      openDevlogModal(log);
    });

    container.appendChild(div);
  });

  // Podpinanie obsługi "usuń"
  document.querySelectorAll('.delete-devlog-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // żeby nie otwierało modala
      const id = btn.dataset.id;
      if (confirm('Na pewno chcesz usunąć tego devloga?')) {
        await deleteDevlog(id);
      }
    });
  });
}


// Modal devloga
function openDevlogModal(log) {
  const overlay = document.createElement('div');
  overlay.className = 'devlog-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'devlog-modal';

  modal.innerHTML = `
    <button class="close-modal">✖</button>
    <div class="devlog-main">
      <div class="devlog-left">
        <h2>${log.title}</h2>
        <div class="meta">${new Date(log.createdAt).toLocaleString()}</div>
        <p>${log.content}</p>
      </div>
      <div class="devlog-right">
        ${log.images && log.images.length ? log.images.map((url, i) => `<img src="${url}" data-index="${i}" class="devlog-img">`).join('') : ''}
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Zamknięcie
  overlay.querySelector('.close-modal').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // Obsługa kliknięcia na zdjęcia
  if (log.images && log.images.length) {
    modal.querySelectorAll('.devlog-img').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(img.dataset.index, 10);
        openImageGallery(log.images, index);
      });
    });
  }
}

// Dodawanie devloga (admin)
async function addDevlog() {
  const title = document.getElementById('devlog-title').value.trim();
  const content = document.getElementById('devlog-content').value.trim();
  const thumbnailInput = document.getElementById('devlog-thumbnail');
  const files = document.getElementById('devlog-images').files;

  if (!title || !content) {
    alert('Podaj tytuł i treść devloga.');
    return;
  }

  // Wymuszenie miniaturki
  if (!thumbnailInput.files || !thumbnailInput.files[0]) {
    alert('Musisz dodać miniaturkę devloga.');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('thumbnail', thumbnailInput.files[0]); // obowiązkowa miniaturka

  // Dodanie dodatkowych zdjęć (jeśli są)
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  const res = await fetch(`${API}/devlogs`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (res.ok) {
    devlogs = await (await fetch(`${API}/devlogs`, { credentials: 'include' })).json();
    renderDevlogs();

    // Wyczyść pola
    document.getElementById('devlog-title').value = '';
    document.getElementById('devlog-content').value = '';
    document.getElementById('devlog-thumbnail').value = '';
    document.getElementById('devlog-images').value = '';

    // Zamknij modal po dodaniu devloga
    const modal = document.getElementById('add-devlog-modal');
    if (modal) modal.classList.add('hidden');
  } else {
    const err = await res.json();
    alert(err.message || 'Błąd');
  }

}

// Usuwanie devloga (admin)
async function deleteDevlog(id) {
  try {
    const res = await fetch(`${API}/devlogs/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (res.ok) {
      devlogs = devlogs.filter(d => d._id !== id);
      renderDevlogs();
    } else {
      const err = await res.json();
      alert(err.message || 'Błąd przy usuwaniu');
    }
  } catch (err) {
    console.error(err);
    alert('Nie udało się usunąć devloga.');
  }
}

// Galeria zdjęć fullscreen
function openImageGallery(images, startIndex = 0) {
  const modal = document.createElement('div');
  modal.className = 'img-modal';
  Object.assign(modal.style, {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000
  });

  let idx = startIndex;
  const imgEl = document.createElement('img');
  imgEl.src = images[idx];
  imgEl.style.maxWidth = '90%';
  imgEl.style.maxHeight = '90%';
  modal.appendChild(imgEl);

  // przyciski
  const prev = document.createElement('button');
  prev.textContent = '<';
  Object.assign(prev.style, { position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', background: 'none', color: 'white', border: 'none', cursor: 'pointer' });
  prev.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx - 1 + images.length) % images.length; imgEl.src = images[idx]; });
  modal.appendChild(prev);

  const next = document.createElement('button');
  next.textContent = '>';
  Object.assign(next.style, { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', background: 'none', color: 'white', border: 'none', cursor: 'pointer' });
  next.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx + 1) % images.length; imgEl.src = images[idx]; });
  modal.appendChild(next);

  modal.addEventListener('click', () => document.body.removeChild(modal));
  document.body.appendChild(modal);
}

initDevlog();
