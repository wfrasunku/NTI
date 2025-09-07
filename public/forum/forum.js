const API = 'http://localhost:3000/api';

let currentUser = null;
let posts = [];

// ====== Inicjalizacja forum ======
async function initForum() {
    try {
        // Pobierz zalogowanego użytkownika
        const userRes = await fetch(`${API}/currentUser`);
        if (userRes.ok) currentUser = await userRes.json();

        // Pobierz wszystkie posty
        const postsRes = await fetch(`${API}/posts`);
        if (postsRes.ok) posts = await postsRes.json();

        renderUserBar();
        renderUserList();
        renderPosts();

        if (currentUser) {
            document.getElementById('new-post-section').classList.remove('hidden');
            document.getElementById('add-post-btn').addEventListener('click', addPost);

            const toggleBtn = document.getElementById('toggle-sidebar');
            toggleBtn.classList.remove('hidden');
            toggleBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('hidden');
            });
        }

    } catch (err) {
        console.error(err);
        alert("Nie można połączyć się z serwerem.");
    }
}

// ====== Pasek użytkownika ======
function renderUserBar() {
    const userInfo = document.getElementById('user-info');
    if (currentUser) {
        userInfo.innerHTML = `
            Zalogowano jako: <b>${currentUser.username}</b> (${currentUser.role})
            <button id="logoutBtn">Wyloguj</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await fetch(`${API}/logout`, { method: 'POST' });
            localStorage.removeItem('loggedInUser');
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
        const res = await fetch(`${API}/users`);
        if (!res.ok) return;
        const users = await res.json();

        const userList = document.getElementById('user-list');
        userList.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="/account/account.html?user=${u.username}" class="${u.role==='admin'?'admin-user':''}">${u.username}</a>`;
            userList.appendChild(li);
        });
    } catch (err) {
        console.error(err);
    }
}

// ====== Dodawanie postu ======
async function addPost() {
    const content = document.getElementById('post-content').value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API}/posts`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({content})
        });
        if (res.ok) {
            posts = await (await fetch(`${API}/posts`)).json();
            document.getElementById('post-content').value = '';
            renderPosts();
        }
    } catch(err) { console.error(err); }
}

// ====== Renderowanie postów ======
function renderPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';

        // Nazwa autora jako link do jego profilu
        const authorLink = document.createElement('a');
        authorLink.href = `/account/account.html?user=${post.author.username}`;
        authorLink.textContent = post.author.username;
        authorLink.className = 'author-link';
        authorLink.style.fontWeight = 'bold';
        authorLink.style.marginRight = '5px';

        const contentSpan = document.createElement('span');
        contentSpan.textContent = `: ${post.content}`;

        const likesSpan = document.createElement('div');
        likesSpan.textContent = `Likes: ${post.likes || 0} | Dislikes: ${post.dislikes || 0}`;

        postDiv.appendChild(authorLink);
        postDiv.appendChild(contentSpan);
        postDiv.appendChild(likesSpan);

        const actions = document.createElement('div');
        actions.className = 'post-actions';

        if (currentUser) {
            actions.innerHTML += `<button onclick="likePost('${post._id}')">👍</button>`;
            actions.innerHTML += `<button onclick="dislikePost('${post._id}')">👎</button>`;
            actions.innerHTML += `<input id="comment-input-${post._id}" placeholder="Komentarz"> <button onclick="addComment('${post._id}')">Dodaj</button>`;

            if (currentUser._id === post.author._id) {
                actions.innerHTML += `<button onclick="editPost('${post._id}')">Edytuj post</button>`;
            }
            if (currentUser.role==='admin' || currentUser._id === post.author._id) {
                actions.innerHTML += `<button onclick="deletePost('${post._id}')">Usuń post</button>`;
            }
        }

        postDiv.appendChild(actions);

        // Komentarze
        post.comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';

            const commentAuthorLink = document.createElement('a');
            commentAuthorLink.href = `/account/account.html?user=${comment.author.username}`;
            commentAuthorLink.textContent = comment.author.username;
            commentAuthorLink.style.fontWeight = 'bold';
            commentAuthorLink.style.marginRight = '5px';

            const commentContent = document.createElement('span');
            commentContent.textContent = `: ${comment.content}`;

            commentDiv.appendChild(commentAuthorLink);
            commentDiv.appendChild(commentContent);

            if (currentUser) {
                if (currentUser._id === comment.author._id) {
                    commentDiv.innerHTML += ` <button onclick="editComment('${post._id}','${comment._id}')">Edytuj</button>`;
                }
                if (currentUser.role==='admin' || currentUser._id === comment.author._id) {
                    commentDiv.innerHTML += ` <button onclick="deleteComment('${post._id}','${comment._id}')">Usuń</button>`;
                }
            }

            postDiv.appendChild(commentDiv);
        });

        container.appendChild(postDiv);
    });
}


// ====== Akcje ======
async function deletePost(postId) {
    await fetch(`${API}/posts/${postId}`, { method:'DELETE' });
    posts = posts.filter(p=>p._id!==postId);
    renderPosts();
}

async function editPost(postId) {
    const newContent = prompt("Edytuj post:");
    if (!newContent) return;
    await fetch(`${API}/posts/${postId}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({content: newContent})
    });
    posts = await (await fetch(`${API}/posts`)).json();
    renderPosts();
}

async function addComment(postId) {
    const content = document.getElementById(`comment-input-${postId}`).value.trim();
    if (!content) return;
    await fetch(`${API}/posts/${postId}/comments`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({content})
    });
    posts = await (await fetch(`${API}/posts`)).json();
    renderPosts();
}

async function editComment(postId, commentId) {
    const newContent = prompt("Edytuj komentarz:");
    if (!newContent) return;
    await fetch(`${API}/posts/${postId}/comments/${commentId}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({content: newContent})
    });
    posts = await (await fetch(`${API}/posts`)).json();
    renderPosts();
}

async function deleteComment(postId, commentId) {
    await fetch(`${API}/posts/${postId}/comments/${commentId}`, { method:'DELETE' });
    posts = await (await fetch(`${API}/posts`)).json();
    renderPosts();
}

async function likePost(postId) {
    await fetch(`${API}/posts/${postId}/like`, { method:'POST' });
    posts = await (await fetch(`${API}/posts`)).json();
    renderPosts();
}

async function dislikePost(postId) {
    await fetch(`${API}/posts/${postId}/dislike`, { method:'POST' });
    posts = await (await fetch(`${API}/posts`)).json();
    renderPosts();
}

// ====== Start ======
initForum();
