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

/* ================== TOOLTIP + LINKI ================== */
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

/* ================== PRELOADER ================== */
window.addEventListener("load", () => {
    let preloader = document.getElementById("preloader");

    // Sprawd?, czy loader ju? by? pokazany
    if (localStorage.getItem("hasSeenLoader")) {
        preloader.style.display = "none";
        return;
    }

    let progress = document.getElementById("progress");
    let load = 0;
    let interval = setInterval(() => {
        load += 2;
        progress.style.width = load + "%";

        if (load >= 100) {
            clearInterval(interval);
            preloader.classList.add("fade-out");

            setTimeout(() => {
                preloader.style.display = "none";
            }, 1500);

            // Zapisz w localStorage ?e loader ju? by?
            localStorage.setItem("hasSeenLoader", "true");
        }
    }, 50);
});

window.addEventListener('DOMContentLoaded', () => {
    const userInfo = document.getElementById('user-info');

    const user = localStorage.getItem('loggedInUser');

    if (user) {
        userInfo.innerHTML = `Witaj, ${user} <button id="logoutBtn">Wyloguj</button>`;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('hasSeenLoader'); // ? reset loadera
            window.location.href = '../index.html';
        });
    } else {
        userInfo.innerHTML = `Nie jeste? zalogowany — <a href="login/login.html">Log in</a>`;
    }
});
