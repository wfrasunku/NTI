document.addEventListener('DOMContentLoaded', async () => {
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const editBtn = document.getElementById('edit-profile-toggle');
    const cancelBtn = document.getElementById('cancel-edit');
    const saveMessage = document.getElementById('save-message');
    const imageInput = document.getElementById('edit-image');
    const deleteBtn = document.getElementById('delete-user-btn');
    const backBtn = document.querySelector('.back-button');

    let originalUsername = null;
    let loggedInUserRole = 'user';
    let originalImageSrc = '';

    // Pobranie zalogowanego użytkownika
    try {
        const res = await fetch('http://localhost:3000/api/currentUser', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            originalUsername = data.username;
            loggedInUserRole = data.role;
        } else {
            window.location.href = '../login/login.html';
            return;
        }
    } catch (err) {
        console.error(err);
        window.location.href = '../login/login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const viewedUsername = urlParams.get('user') || originalUsername;
    const isOwnProfile = viewedUsername === originalUsername;

    if (!isOwnProfile) {
        editBtn.style.display = 'none';
        editMode.classList.add('hidden');
    }

    async function loadUserData(username) {
        const response = await fetch(`http://localhost:3000/api/user/${username}`, { credentials: 'include' });
        const data = await response.json();

        if (!response.ok) {
            document.body.innerHTML = `<h2 style="color:red;">${data.message}</h2>`;
            return;
        }

        document.getElementById('profile-username').innerText = data.username;
        document.getElementById('creation-date').innerText = new Date(data.createdAt).toLocaleDateString('pl-PL');
        document.getElementById('profile-description').innerText = data.description || 'Brak opisu';
        document.getElementById('profile-gender').innerText = data.gender === 'female' ? 'Kobieta' : 'Mężczyzna';

        const defaultImage = data.gender === 'female' ? '../images/default-female.png' : '../images/default-male.png';
        const imageToShow = data.profileImage?.trim() ? data.profileImage : defaultImage;
        document.getElementById('profile-image').src = imageToShow;
        originalImageSrc = imageToShow;

        if (isOwnProfile) {
            document.getElementById('edit-username').value = data.username;
            document.getElementById('edit-gender').value = data.gender;
            document.getElementById('edit-description').value = data.description || '';
        }
    }

    async function loadUserPosts(username) {
        try {
            const res = await fetch(`http://localhost:3000/api/posts?author=${username}`, { credentials: 'include' });
            if (!res.ok) return;

            const userPosts = await res.json();
            const postsContainer = document.getElementById('user-posts');
            postsContainer.innerHTML = '';

            userPosts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'user-post';

                // Nagłówek posta
                const header = document.createElement('div');
                header.className = 'post-header';
                header.innerHTML = `<a href="/account/account.html?user=${post.author.username}">${post.author.username}</a>
                                <span>[${post.type}] • ${new Date(post.createdAt).toLocaleString()}</span>`;
                postDiv.appendChild(header);

                // Treść
                const content = document.createElement('div');
                content.className = 'post-content';
                content.textContent = post.content;
                postDiv.appendChild(content);

                // Obrazy
                if (post.images && post.images.length > 0) {
                    const imagesDiv = document.createElement('div');
                    imagesDiv.className = 'post-images';

                    post.images.forEach((imgPath, index) => {
                        const img = document.createElement('img');
                        img.src = imgPath;
                        img.style.width = '100px';
                        img.style.margin = '5px';
                        img.style.borderRadius = '5px';
                        img.style.cursor = 'pointer';

                        // Otwórz galerię po kliknięciu
                        img.addEventListener('click', () => {
                            openImageGallery(post.images, index);
                        });

                        imagesDiv.appendChild(img);
                    });

                    postDiv.appendChild(imagesDiv);
                }

                postsContainer.appendChild(postDiv);
            });
        } catch (err) {
            console.error(err);
        }
    }

    await loadUserData(viewedUsername);
    await loadUserPosts(viewedUsername);

    document.getElementById('user-posts-header').innerText = isOwnProfile ? 'Moje posty' : 'Posty użytkownika';

    // ===== Galeria zdjęć =====
    function openImageGallery(images, startIndex = 0) {
        const modal = document.createElement('div');
        modal.className = 'img-modal';
        Object.assign(modal.style, {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 20000
        });

        let idx = startIndex;
        const imgEl = document.createElement('img');
        imgEl.src = images[idx];
        imgEl.style.maxWidth = '90%';
        imgEl.style.maxHeight = '90%';
        imgEl.style.borderRadius = '8px';
        modal.appendChild(imgEl);

        // Poprzednie
        const prev = document.createElement('button');
        prev.textContent = '<';
        Object.assign(prev.style, { position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' });
        prev.addEventListener('click', e => {
            e.stopPropagation();
            idx = (idx - 1 + images.length) % images.length;
            imgEl.src = images[idx];
        });
        modal.appendChild(prev);

        // Następne
        const next = document.createElement('button');
        next.textContent = '>';
        Object.assign(next.style, { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' });
        next.addEventListener('click', e => {
            e.stopPropagation();
            idx = (idx + 1) % images.length;
            imgEl.src = images[idx];
        });
        modal.appendChild(next);

        modal.addEventListener('click', () => document.body.removeChild(modal));
        document.body.appendChild(modal);
    }


    // Obsługa powrotu
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (history.length > 1) history.back();
            else window.location.href = '/index.html';
        });
    }

    // Obsługa edycji
    if (isOwnProfile) {
        editBtn.addEventListener('click', () => {
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
        });

        cancelBtn.addEventListener('click', () => {
            editMode.classList.add('hidden');
            viewMode.classList.remove('hidden');
            document.getElementById('profile-image').src = originalImageSrc;
            imageInput.value = '';
        });

        imageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => document.getElementById('profile-image').src = e.target.result;
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('edit-mode').addEventListener('submit', async e => {
            e.preventDefault();
            const newUsername = document.getElementById('edit-username').value;
            const gender = document.getElementById('edit-gender').value;
            const description = document.getElementById('edit-description').value;
            const file = imageInput.files[0];

            const formData = new FormData();
            formData.append('username', newUsername);
            formData.append('gender', gender);
            formData.append('description', description);
            if (file) formData.append('profileImage', file);

            try {
                const response = await fetch(`http://localhost:3000/api/user/${originalUsername}`, {
                    method: 'PUT',
                    body: formData,
                    credentials: 'include'
                });
                const result = await response.json();

                if (response.ok) {
                    saveMessage.innerText = '✅ Zmiany zapisane!';
                    saveMessage.style.color = 'green';
                    await loadUserData(result.username);
                    editMode.classList.add('hidden');
                    viewMode.classList.remove('hidden');
                } else {
                    saveMessage.innerText = '❌ Błąd: ' + result.message;
                    saveMessage.style.color = 'red';
                }
            } catch (err) {
                console.error(err);
                saveMessage.innerText = '❌ Błąd połączenia z serwerem';
                saveMessage.style.color = 'red';
            }

            saveMessage.classList.remove('hidden');
            setTimeout(() => saveMessage.classList.add('hidden'), 4000);
        });
    }

    // Usuwanie konta
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const confirmed = confirm("Czy na pewno chcesz usunąć swoje konto?");
            if (!confirmed) return;
            try {
                const res = await fetch(`http://localhost:3000/api/user/${originalUsername}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (res.ok) {
                    alert("Twoje konto zostało usunięte.");
                    window.location.href = "/index.html";
                } else {
                    const err = await res.json();
                    alert("Błąd: " + err.message);
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
});
