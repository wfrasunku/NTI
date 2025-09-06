document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('loggedInUser');

    if (!username) {
        window.location.href = '../login/login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/user/${username}`);
        const data = await response.json();

        if (!response.ok) {
            document.body.innerHTML = `<h2 style="color:red;">${data.message}</h2>`;
            return;
        }

        console.log("Dane u?ytkownika:", data);

        document.getElementById('profile-username').innerText = data.username || 'Brak nazwy';
        document.getElementById('creation-date').innerText = new Date(data.createdAt).toLocaleDateString('pl-PL') || 'brak';
        document.getElementById('profile-description').innerText = data.description || 'Brak opisu';
        document.getElementById('profile-gender').innerText = data.gender === 'female' ? 'Kobieta' : 'M??czyzna';

        const defaultImage = data.gender === 'female'
            ? '../images/default-female.png'
            : '../images/default-male.png';

        const imageToShow = data.profileImage?.trim()
            ? data.profileImage
            : defaultImage;

        document.getElementById('profile-image').src = imageToShow;

    } catch (err) {
        console.error(err);
        document.body.innerHTML = `<h2 style="color:red;">B??d ?adowania danych</h2>`;
    }
});
