const API = 'http://localhost:3000/api';

let currentUser = null;
let posts = [];

let filterTitle = '';
let filterSort = 'newest';
let filterType = '';

// ====== Inicjalizacja forum ======
async function initForum() {
    try {
        const userRes = await fetch(`${API}/currentUser`, { credentials: 'include' });
        if (userRes.ok) currentUser = await userRes.json();

        const postsRes = await fetch(`${API}/posts`, { credentials: 'include' });
        if (postsRes.ok) posts = await postsRes.json();

        setupFilterListeners();
        renderUserBar();
        renderUserList();
        renderPosts();

        if (currentUser) {
            document.getElementById('new-post-section').classList.remove('hidden');
            document.getElementById('add-post-btn').addEventListener('click', addPost);

            const toggleBtn = document.getElementById('toggle-sidebar');
            if (toggleBtn) {
                toggleBtn.classList.remove('hidden');
                toggleBtn.addEventListener('click', () => {
                    document.getElementById('sidebar').classList.toggle('hidden');
                });
            }
        }

    } catch (err) {
        console.error(err);
        alert("Nie można połączyć się z serwerem.");
    }
}

// ====== Filtry ======
function setupFilterListeners() {
    const ft = document.getElementById('filter-title');
    const fs = document.getElementById('filter-sort');
    const ftype = document.getElementById('filter-type');
    const resetBtn = document.getElementById('filter-reset');

    // Filtr po nazwie
    if (ft) {
        ft.addEventListener('input', (e) => {
            filterTitle = e.target.value.trim().toLowerCase();
            renderPosts();
        });
    }

    // Sortowanie
    if (fs) {
        fs.addEventListener('change', (e) => {
            filterSort = e.target.value;
            renderPosts();
        });
    }

    // Filtr po typie
    if (ftype) {
        ftype.addEventListener('change', (e) => {
            filterType = e.target.value;
            renderPosts();
        });
    }

    // Reset filtrów
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (ft) ft.value = '';
            if (fs) fs.value = 'newest';
            if (ftype) ftype.value = '';
            filterTitle = '';
            filterSort = 'newest';
            filterType = '';
            renderPosts();
        });
    }
}

// ====== Pasek użytkownika ======
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

// ====== Lista użytkowników ======
async function renderUserList() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API}/users`, { credentials: 'include' });
        if (!res.ok) return;
        const users = await res.json();

        const userList = document.getElementById('user-list');
        userList.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="/account/account.html?user=${encodeURIComponent(u.username)}" class="${u.role === 'admin' ? 'admin-user' : ''}">${u.username}</a>`;
            userList.appendChild(li);
        });
    } catch (err) {
        console.error(err);
    }
}

// ====== Dodawanie postu ======
async function addPost() {
    const title = document.getElementById('post-title')?.value.trim() || '';
    const content = document.getElementById('post-content').value.trim();
    const type = document.getElementById('post-type').value;
    const files = document.getElementById('post-images').files;

    if (!title || !content) {
        alert('Podaj tytuł i treść posta.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('type', type);

    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    try {
        const res = await fetch(`${API}/posts`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        if (res.ok) {
            posts = await (await fetch(`${API}/posts`, { credentials: 'include' })).json();
            document.getElementById('post-title') && (document.getElementById('post-title').value = '');
            document.getElementById('post-content').value = '';
            document.getElementById('post-images').value = '';
            renderPosts();
        } else {
            const err = await res.json();
            alert('Błąd tworzenia posta: ' + (err.message || res.statusText));
        }
    } catch (err) { console.error(err); alert('Błąd połączenia'); }
}

// ====== APLIKUJ FILTRY I SORTOWANIE ======
function applyFiltersAndSort(originalPosts) {
    let arr = Array.isArray(originalPosts) ? [...originalPosts] : [];

    // Filtr po tytule
    if (filterTitle) {
        arr = arr.filter(p => {
            const title = (p.title || '').toString().toLowerCase();
            return title.includes(filterTitle);
        });
    }

    // Sortowanie
    arr.sort((a, b) => {
        const ta = new Date(a.createdAt).getTime() || 0;
        const tb = new Date(b.createdAt).getTime() || 0;

        if (filterSort === 'newest') return tb - ta;
        if (filterSort === 'oldest') return ta - tb;

        if (filterSort === 'most-liked') {
            const la = a.likes || 0;
            const lb = b.likes || 0;
            if (lb !== la) return lb - la;
            return tb - ta; // tie-break: newest first
        }
        if (filterSort === 'most-disliked') {
            const da = a.dislikes || 0;
            const db = b.dislikes || 0;
            if (db !== da) return db - da;
            return tb - ta;
        }
        return tb - ta;
    });

    // Filtr po typie
    if (filterType) {
        arr = arr.filter(p => (p.type || '') === filterType);
    }

    return arr;
}

// ====== Renderowanie postów ======
function renderPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = applyFiltersAndSort(posts);

    if (filtered.length === 0) {
        container.innerHTML = '<p>Brak postów pasujących do filtrów.</p>';
        return;
    }

    filtered.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';

        // Meta
        const meta = document.createElement('div');
        meta.className = 'post-meta';
        const authorLink = document.createElement('a');
        const authorName = post.author?.username || 'nieznany';
        authorLink.href = `/account/account.html?user=${encodeURIComponent(authorName)}`;
        authorLink.textContent = authorName;
        authorLink.style.fontWeight = 'bold';
        meta.appendChild(authorLink);

        const typeSpan = document.createElement('span');
        typeSpan.textContent = ` [${post.type || 'Just talking'}]`;
        typeSpan.style.marginLeft = '6px';
        meta.appendChild(typeSpan);

        const dateSpan = document.createElement('span');
        dateSpan.textContent = ` • ${new Date(post.createdAt).toLocaleString()}`;
        dateSpan.style.color = '#666';
        dateSpan.style.marginLeft = '8px';
        meta.appendChild(dateSpan);

        postDiv.appendChild(meta);

        // Tytuł
        if (post.title) {
            const titleEl = document.createElement('h3');
            titleEl.textContent = post.title;
            postDiv.appendChild(titleEl);
        }

        // Treść
        const contentDiv = document.createElement('div');
        contentDiv.textContent = post.content;
        contentDiv.className = 'post-content';
        postDiv.appendChild(contentDiv);

        // Zdjęcia
        if (post.images && post.images.length) {
            const imgsWrap = document.createElement('div');
            imgsWrap.className = 'post-images';
            post.images.forEach((p, idx) => {
                const img = document.createElement('img');
                img.src = p;
                img.alt = post.title || 'post image';
                img.style.width = '120px';
                img.style.margin = '6px';
                img.style.cursor = 'pointer';
                img.dataset.index = idx;

                img.addEventListener('click', () => openImageGallery(post.images, idx));
                imgsWrap.appendChild(img);
            });
            postDiv.appendChild(imgsWrap);
        }

        // Likes / Dislikes
        const stats = document.createElement('div');
        stats.className = 'post-stats';
        stats.textContent = `Likes: ${post.likes || 0}  •  Dislikes: ${post.dislikes || 0}`;
        postDiv.appendChild(stats);

        const actions = document.createElement('div');
        actions.className = 'post-actions';
        if (currentUser) {
            actions.innerHTML += `<button onclick="likePost('${post._id}')">👍</button>`;
            actions.innerHTML += `<button onclick="dislikePost('${post._id}')">👎</button>`;
            actions.innerHTML += `<input id="comment-input-${post._id}" placeholder="Komentarz"> <button onclick="addComment('${post._id}')">Dodaj</button>`;
            if (currentUser._id === post.author?._id) {
                actions.innerHTML += `<button onclick="editPost('${post._id}')">Edytuj post</button>`;
            }
            if (currentUser.role === 'admin' || currentUser._id === post.author?._id) {
                actions.innerHTML += `<button onclick="deletePost('${post._id}')">Usuń post</button>`;
            }
        }
        postDiv.appendChild(actions);

        // Komentarze
        if (Array.isArray(post.comments)) {
            post.comments.forEach(comment => {
                const c = document.createElement('div');
                c.className = 'comment';
                c.innerHTML = `<b><a href="/account/account.html?user=${encodeURIComponent(comment.author?.username||'')}" style="font-weight:bold">${comment.author?.username||'?'}</a>:</b> ${comment.content}`;
                if (currentUser) {
                    if (currentUser._id === comment.author?._id) {
                        c.innerHTML += ` <button onclick="editComment('${post._id}','${comment._id}')">Edytuj</button>`;
                    }
                    if (currentUser.role === 'admin' || currentUser._id === comment.author?._id) {
                        c.innerHTML += ` <button onclick="deleteComment('${post._id}','${comment._id}')">Usuń</button>`;
                    }
                }
                postDiv.appendChild(c);
            });
        }

        container.appendChild(postDiv);
    });
}

// Galeria zdjęć
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

    // prev/next
    const prev = document.createElement('button');
    prev.textContent = '<';
    Object.assign(prev.style, { position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px' });
    prev.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx - 1 + images.length) % images.length; imgEl.src = images[idx]; });
    modal.appendChild(prev);

    const next = document.createElement('button');
    next.textContent = '>';
    Object.assign(next.style, { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px' });
    next.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx + 1) % images.length; imgEl.src = images[idx]; });
    modal.appendChild(next);

    modal.addEventListener('click', () => document.body.removeChild(modal));
    document.body.appendChild(modal);
}

// ====== Akcje postów / komentarzy ======
async function deletePost(postId) {
    await fetch(`${API}/posts/${postId}`, { method: 'DELETE', credentials: 'include' });
    posts = posts.filter(p => p._id !== postId);
    renderPosts();
}

async function editPost(postId) {
    const newContent = prompt("Edytuj post:");
    if (!newContent) return;
    await fetch(`${API}/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
        credentials: 'include'
    });
    posts = await (await fetch(`${API}/posts`, { credentials: 'include' })).json();
    renderPosts();
}

async function addComment(postId) {
    const contentEl = document.getElementById(`comment-input-${postId}`);
    if (!contentEl) return;
    const content = contentEl.value.trim();
    if (!content) return;
    await fetch(`${API}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
    });
    posts = await (await fetch(`${API}/posts`, { credentials: 'include' })).json();
    renderPosts();
}

async function editComment(postId, commentId) {
    const newContent = prompt("Edytuj komentarz:");
    if (!newContent) return;
    await fetch(`${API}/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
        credentials: 'include'
    });
    posts = await (await fetch(`${API}/posts`, { credentials: 'include' })).json();
    renderPosts();
}

async function deleteComment(postId, commentId) {
    await fetch(`${API}/posts/${postId}/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
    posts = await (await fetch(`${API}/posts`, { credentials: 'include' })).json();
    renderPosts();
}

async function likePost(postId) {
    await fetch(`${API}/posts/${postId}/like`, { method: 'POST', credentials: 'include' });
    posts = await (await fetch(`${API}/posts`, { credentials: 'include' })).json();
    renderPosts();
}

async function dislikePost(postId) {
    await fetch(`${API}/posts/${postId}/dislike`, { method: 'POST', credentials: 'include' });
    posts = await (await fetch(`${API}/posts`, { credentials: 'include' })).json();
    renderPosts();
}

// ====== Start ======
initForum();
