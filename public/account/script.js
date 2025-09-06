document.addEventListener('DOMContentLoaded', async () => {
    const originalUsername = localStorage.getItem('loggedInUser');
    const urlParams = new URLSearchParams(window.location.search);
    const viewedUsername = urlParams.get('user') || originalUsername;

    let originalImageSrc = '';
    const isOwnProfile = viewedUsername === originalUsername;

    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const editBtn = document.getElementById('edit-profile-toggle');
    const cancelBtn = document.getElementById('cancel-edit');
    const saveMessage = document.getElementById('save-message');
    const imageInput = document.getElementById('edit-image');

    if (!originalUsername) {
        window.location.href = '../login/login.html';
        return;
    }

    // Je?li ogl?damy cudzy profil, ukryj edycj?
    if (!isOwnProfile) {
        editBtn.style.display = 'none';
        editMode.classList.add('hidden');
    }

    async function loadUserData(username) {
        const response = await fetch(`http://localhost:3000/api/user/${username}`);
        const data = await response.json();

        if (!response.ok) {
            document.body.innerHTML = `<h2 style="color:red;">${data.message}</h2>`;
            return;
        }

        document.getElementById('profile-username').innerText = data.username;
        document.getElementById('creation-date').innerText = new Date(data.createdAt).toLocaleDateString('pl-PL');
        document.getElementById('profile-description').innerText = data.description || 'Brak opisu';
        document.getElementById('profile-gender').innerText = data.gender === 'female' ? 'Kobieta' : 'M??czyzna';

        const defaultImage = data.gender === 'female'
            ? '../images/default-female.png'
            : '../images/default-male.png';

        const imageToShow = data.profileImage?.trim() ? data.profileImage : defaultImage;
        document.getElementById('profile-image').src = imageToShow;
        originalImageSrc = imageToShow;

        if (isOwnProfile) {
            document.getElementById('edit-username').value = data.username;
            document.getElementById('edit-gender').value = data.gender;
            document.getElementById('edit-description').value = data.description || '';
        }
    }

    await loadUserData(viewedUsername);

    const deleteBtn = document.getElementById('delete-user-btn');

    if (!isOwnProfile && originalUsername && viewedUsername) {
        // Sprawd?, czy zalogowany to admin
        const res = await fetch(`http://localhost:3000/api/user/${originalUsername}`);
        const loggedInData = await res.json();

        const targetRes = await fetch(`http://localhost:3000/api/user/${viewedUsername}`);
        const targetData = await targetRes.json();

        if (loggedInData.role === 'admin' && targetData.role !== 'admin') {
            deleteBtn.classList.remove('hidden');
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Czy na pewno chcesz usun?? konto "${viewedUsername}"?`)) {
                    const delRes = await fetch(`http://localhost:3000/api/user/${viewedUsername}`, {
                        method: 'DELETE'
                    });

                    if (delRes.ok) {
                        alert(`U?ytkownik "${viewedUsername}" zosta? usuni?ty.`);
                        window.location.href = '../index.html';
                    } else {
                        const err = await delRes.json();
                        alert('B??d usuwania: ' + err.message);
                    }
                }
            });
        }
    }


    if (!isOwnProfile) return;

    // Tryb edycji - tylko dla w?a?ciciela
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
            reader.onload = function (e) {
                document.getElementById('profile-image').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('edit-mode').addEventListener('submit', async (e) => {
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
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('loggedInUser', result.username);
                saveMessage.innerText = '? Zmiany zapisane!';
                saveMessage.style.color = 'green';
                await loadUserData(result.username);
                editMode.classList.add('hidden');
                viewMode.classList.remove('hidden');
            } else {
                saveMessage.innerText = '? B??d: ' + result.message;
                saveMessage.style.color = 'red';
            }
        } catch (err) {
            console.error(err);
            saveMessage.innerText = '? B??d po??czenia z serwerem';
            saveMessage.style.color = 'red';
        }

        saveMessage.classList.remove('hidden');
        setTimeout(() => saveMessage.classList.add('hidden'), 4000);
    });
});
