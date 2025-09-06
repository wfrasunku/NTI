// Dostosuj URL je?li zmienisz port/backend
const API = 'http://localhost:3000/api';

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    const message = document.getElementById('message');

    if (response.ok) {
        // Zapisz u?ytkownika do localStorage
        localStorage.setItem('loggedInUser', username);

        // Przekieruj na stron? g?ówn?
        window.location.href = '../index.html'; // dostosuj ?cie?k? je?li potrzeba
    } else {
        message.style.color = 'red';
        message.innerText = data.message;
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
        message.style.color = 'green';
        message.innerText = data.message;
    } else {
        message.style.color = 'red';
        message.innerText = data.message;
    }
}

localStorage.setItem('loggedInUser', username);
