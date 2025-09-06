// ================== PARALLAX ==================
const layers = [
    { el: document.getElementById("layer-back"), intensity: 50 },
    { el: document.getElementById("layer-front"), intensity: 100 },
    { el: document.getElementById("layer-objects"), intensity: 100 }
];

document.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    layers.forEach(layer => {
        const moveX = -x * 3 * layer.intensity;
        const moveY = -y * 1.5 * layer.intensity;
        layer.el.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
    });
});

// ================== TOOLTIP + KLIKALNE LINKI ==================
const tooltip = document.getElementById("tooltip");
let tooltipTimeout;

document.querySelectorAll(".hover-object").forEach(obj => {
    obj.addEventListener("mouseenter", (e) => {
        const message = obj.dataset.message || "Brak opisu";

        tooltipTimeout = setTimeout(() => {
            tooltip.textContent = message;
            tooltip.style.display = "block";
            tooltip.style.opacity = "1";
            tooltip.style.left = e.clientX + 15 + "px";
            tooltip.style.top = e.clientY + 15 + "px";
        }, 500);
    });

    obj.addEventListener("mousemove", (e) => {
        if (tooltip.style.display === "block") {
            tooltip.style.left = e.clientX + 15 + "px";
            tooltip.style.top = e.clientY + 15 + "px";
        }
    });

    obj.addEventListener("mouseleave", () => {
        clearTimeout(tooltipTimeout);
        tooltip.style.opacity = "0";
        tooltip.style.display = "none";
    });

    obj.addEventListener("click", () => {
        const link = obj.dataset.link;
        if (link) window.location.href = link;
    });
});

// ================== PRELOADER (tylko raz) ==================
window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");

    if (localStorage.getItem("hasSeenLoader")) {
        preloader.style.display = "none";
        return;
    }

    const progress = document.getElementById("progress");
    let load = 0;
    const interval = setInterval(() => {
        load += 2;
        progress.style.width = load + "%";

        if (load >= 100) {
            clearInterval(interval);
            preloader.classList.add("fade-out");

            setTimeout(() => {
                preloader.style.display = "none";
            }, 1500);

            localStorage.setItem("hasSeenLoader", "true");
        }
    }, 50);
});

// ================== OBS?UGA LOGOWANIA + SIDEBAR ==================
window.addEventListener('DOMContentLoaded', () => {
    const userInfo = document.getElementById('user-info');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    const userList = document.getElementById('user-list');

    const user = localStorage.getItem('loggedInUser');

    if (user) {
        // ?? Zalogowany: poka? info i przycisk wylogowania
        userInfo.innerHTML = `
      <a href="/account/account.html" id="profile-link">Witaj, ${user}</a>
      <button id="logoutBtn">Wyloguj</button>
    `;

        // Obs?uga wylogowania
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('hasSeenLoader');
            window.location.href = '../index.html';
        });

        // ?? Poka? sidebar
        toggleSidebarBtn.classList.remove('hidden');

        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
        });

        // ?? Pobierz list? u?ytkowników
        fetch('http://localhost:3000/api/users')
            .then(res => res.json())
            .then(users => {
                // ?? Najpierw admini
                const sortedUsers = users.sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return a.username.localeCompare(b.username); // alfabetycznie
                });

                sortedUsers.forEach(u => {
                    const li = document.createElement('li');
                    const isAdmin = u.role === 'admin';

                    li.innerHTML = `
        <a href="/account/account.html?user=${u.username}" class="${isAdmin ? 'admin-user' : ''}">
          ${u.username}
        </a>
      `;
                    userList.appendChild(li);
                });
            })
            .catch(err => {
                console.error('B??d ?adowania u?ytkowników:', err);
            });

    } else {
        // ? Niezalogowany
        userInfo.innerHTML = `Nie jeste? zalogowany — <a href="login/login.html">Log in</a>`;
    }
});
