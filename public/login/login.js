const API = 'http://localhost:3000/api';

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const message = document.getElementById('message');
    message.classList.remove('visible');
    message.innerText = '';

    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok) {
            // 🔁 Resetuj preloader po zalogowaniu
            sessionStorage.removeItem('hasSeenLoader');

            // Przechowuj nazwę użytkownika (jeśli potrzebne)
            localStorage.setItem('loggedInUser', username);

            // Przekieruj na stronę główną z preloaderem
            window.location.href = '../index.html';
        } else {
            message.style.color = 'red';
            message.innerText = data.message || 'Błąd logowania';
            message.classList.add('visible');
        }
    } catch (err) {
        console.error(err);
        message.style.color = 'red';
        message.innerText = 'Nie można połączyć się z serwerem';
        message.classList.add('visible');
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('roleSelect').value;
    const gender = document.getElementById('registerGender').value;

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const message = document.getElementById('message');
    message.innerText = '';
    message.classList.remove('visible');

    try {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, gender }),
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok) {
            message.style.color = 'green';
            message.innerText = "✅ Rejestracja zakończona sukcesem!";
            message.classList.add('visible');
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            setTimeout(() => message.classList.remove('visible'), 4000);
        } else {
            message.style.color = 'red';
            message.innerText = data.message || 'Błąd rejestracji';
            message.classList.add('visible');
        }
    } catch (err) {
        console.error(err);
        message.style.color = 'red';
        message.innerText = 'Nie można połączyć się z serwerem';
        message.classList.add('visible');
    }
}
