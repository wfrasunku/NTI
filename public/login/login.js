// Dostosuj URL je?li zmienisz port/backend
const API = 'http://localhost:3000/api';

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const message = document.getElementById('message');
    message.classList.remove('visible');
    message.innerText = '';

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Zalogowano
            localStorage.setItem('loggedInUser', username);
            window.location.href = '../index.html';
        } else {
            // ? B??d logowania ? zawsze ustaw czerwony kolor
            message.style.color = 'red';
            message.innerText = data.message || 'B??d logowania';
            message.classList.add('visible');
        }

    } catch (error) {
        console.error('B??d:', error);
        message.style.color = 'red';
        message.innerText = 'Nie mo?na po??czy? z serwerem';
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
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, gender })

        });

        const data = await response.json();

        if (response.ok) {
            message.style.color = 'green';
            message.innerText = "? Uda?o si? zarejestrowa?! Mo?esz si? zalogowa?.";
            message.classList.add('visible');

            // poka? formularz logowania
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';

            // znikanie po 3s
            setTimeout(() => {
                message.classList.remove('visible');
                setTimeout(() => {
                    message.innerText = '';
                }, 1000);
            }, 3000);
        } else {
            message.style.color = 'red';
            message.innerText = data.message || 'B??d rejestracji';
            message.classList.add('visible');
        }

    } catch (error) {
        console.error('B??d:', error);
        message.style.color = 'red';
        message.innerText = 'Nie mo?na po??czy? z serwerem';
        message.classList.add('visible');
    }
}


localStorage.setItem('loggedInUser', username);
