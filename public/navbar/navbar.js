document.addEventListener("DOMContentLoaded", async () => {
  const navbarContainer = document.getElementById("navbar-container");
  if (!navbarContainer) return;

  // Załaduj HTML navbara
  const html = await fetch("/navbar/navbar.html").then(r => r.text());
  navbarContainer.innerHTML = html;

  // Dodaj CSS jeśli jeszcze nie ma
  if (!document.querySelector("link[href='/navbar/navbar.css']")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/navbar/navbar.css";
    document.head.appendChild(link);
  }

  // Obsługa userów
  const userInfo = document.getElementById('user-info');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const sidebar = document.getElementById('sidebar');
  const userList = document.getElementById('user-list');

  try {
    const res = await fetch('/api/currentUser', { credentials: 'include' });
    if (res.ok) {
      const currentUser = await res.json();
      const userDataRes = await fetch(`/api/user/${currentUser.username}`, { credentials: 'include' });
      const userData = await userDataRes.json();

      const imgSrc = userData.profileImage || '/images/default-profile.png';
      userInfo.innerHTML = `
        <a href="/account/account.html" id="profile-link">
          <img src="${imgSrc}" class="user-icon" />
          ${userData.username}
        </a>
        <button id="logoutBtn">Wyloguj</button>
      `;

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST', credentials: 'include' });

            // 🔁 Resetuj preloader dla nowej sesji
            sessionStorage.removeItem('hasSeenLoader');

            // Przejdź na stronę główną, gdzie preloader się pojawi
            window.location.href = '/index.html';
        });
    } else {
      userInfo.innerHTML = `Nie jesteś zalogowany → <a href="/login/login.html">Log in</a>`;
    }

    toggleSidebarBtn.classList.remove('hidden');
    toggleSidebarBtn.addEventListener('click', () => sidebar.classList.toggle('hidden'));

    const usersRes = await fetch('/api/users', { credentials: 'include' });
    const users = await usersRes.json();

    const sortedUsers = users.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return a.username.localeCompare(b.username);
    });

    sortedUsers.forEach(u => {
      const li = document.createElement('li');
      const isAdmin = u.role === 'admin';
      const imgSrc = u.profileImage || '/images/default-profile.png';
      li.innerHTML = `
        <a href="/account/account.html?user=${u.username}" class="${isAdmin ? 'admin-user' : ''}">
          <img src="${imgSrc}" alt="img" class="user-icon">
          ${u.username}
        </a>
      `;
      userList.appendChild(li);
    });

  } catch (err) {
    console.error('Błąd ładowania użytkownika:', err);
    userInfo.innerHTML = `Nie jesteś zalogowany → <a href="/login/login.html">Log in</a>`;
  }
});
