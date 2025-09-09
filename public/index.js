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

// ================== PRELOADER ==================
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

// ================== LOGIN/PROFILE SWITCH ==================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/currentUser', { credentials: 'include' });
    if (res.ok) {
      const currentUser = await res.json();

      // Znajdź obiekt Drawer (Login)
      const loginObj = document.querySelector(
        ".hover-object[data-message='Login']"
      );

      if (loginObj) {
        loginObj.dataset.message = "Profile";
        loginObj.dataset.link = `/account/account.html?user=${currentUser.username}`;
      }
    }
  } catch (err) {
    console.error("Błąd sprawdzania użytkownika:", err);
  }
});

