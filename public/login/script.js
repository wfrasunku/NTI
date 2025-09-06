// Dostosuj URL je?li zmienisz port/backend
const API = 'http://localhost:3000/api';

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const message = document.getElementById('message');
    message.classList.remove('visible');
    message.innerText = '';

    const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem('loggedInUser', username);
        window.location.href = '../index.html';
    } else {
        message.innerText = data.message;
        message.classList.add('visible');
    }
}



async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('roleSelect').value;

    const response = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();
    const message = document.getElementById('message');

    if (response.ok) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        message.style.color = 'green';
        message.innerText = "? Uda?o si? zarejestrowa?! Mo?esz si? zalogowa?.";
        message.classList.add('visible');

        // Poka? formularz logowania po rejestracji
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';

        // Zniknij komunikat po 3 sekundach widoczno?ci + 1 sekunda animacji
        setTimeout(() => {
            message.classList.remove('visible'); // animacja opacity 1s
            setTimeout(() => {
                message.innerText = ''; // po znikni?ciu czy?cimy tekst
            }, 1000);
        }, 3000);


    } else {
        message.style.color = 'red';
        message.innerText = data.message;
    }
}

localStorage.setItem('loggedInUser', username);
