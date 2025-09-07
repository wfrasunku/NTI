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

    // Pobranie aktualnego zalogowanego użytkownika z serwera
    try {
        const res = await fetch('http://localhost:3000/api/currentUser', {
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            originalUsername = data.username;
            loggedInUserRole = data.role;
        } else {
            window.location.href = '../login/login.html';
            return;
        }
    } catch (err) {
        console.error('Błąd pobierania aktualnego użytkownika', err);
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

    // Funkcja pobierająca dane użytkownika
    async function loadUserData(username) {
        const response = await fetch(`http://localhost:3000/api/user/${username}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
            document.body.innerHTML = `<h2 style="color:red;">${data.message}</h2>`;
            return;
        }

        document.getElementById('profile-username').innerText = data.username;
        document.getElementById('creation-date').innerText = new Date(data.createdAt).toLocaleDateString('pl-PL');
        document.getElementById('profile-description').innerText = data.description || 'Brak opisu';
        document.getElementById('profile-gender').innerText = data.gender === 'female' ? 'Kobieta' : 'Mężczyzna';

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

    // Obsługa usuwania konta
    if (deleteBtn) {
        if (!isOwnProfile && loggedInUserRole === 'admin') {
            const res = await fetch(`http://localhost:3000/api/user/${viewedUsername}`, {
                credentials: 'include'
            });
            const targetData = await res.json();

            if (targetData.role !== 'admin') {
                deleteBtn.classList.remove('hidden');
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`Czy na pewno chcesz usunąć konto "${viewedUsername}"?`)) {
                        const delRes = await fetch(`http://localhost:3000/api/user/${viewedUsername}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });

                        if (delRes.ok) {
                            alert(`Użytkownik "${viewedUsername}" został usunięty.`);
                            window.location.href = '../index.html';
                        } else {
                            const err = await delRes.json();
                            alert('Błąd usuwania: ' + err.message);
                        }
                    }
                });
            }
        }

        if (isOwnProfile) {
            editBtn.addEventListener('click', () => {
                viewMode.classList.add('hidden');
                editMode.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
            });

            cancelBtn.addEventListener('click', () => {
                editMode.classList.add('hidden');
                viewMode.classList.remove('hidden');
                document.getElementById('profile-image').src = originalImageSrc;
                imageInput.value = '';
                deleteBtn.classList.add('hidden');
            });

            deleteBtn.addEventListener('click', async () => {
                const confirmed = confirm("Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.");
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
                        alert("Błąd podczas usuwania konta: " + err.message);
                    }
                } catch (error) {
                    alert("Błąd połączenia z serwerem.");
                    console.error(error);
                }
            });
        }
    }

    if (backBtn) {
    backBtn.addEventListener('click', (e) => {
        e.preventDefault(); // nie przeładowuje linku
        if (history.length > 1) {
            history.back(); // wraca do poprzedniej strony
        } else {
            window.location.href = '/index.html'; // jeśli brak historii, idzie na stronę główną
        }
    });
}

    // Tryb edycji
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
                    deleteBtn.classList.add('hidden');
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
});
