document.addEventListener('DOMContentLoaded', () => {
    // Pobieranie
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => {
        window.location.href = '../download/LochMess_1_0_0.zip';
    });

    // Powi?kszanie obrazków
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const closeBtn = document.querySelector(".close");

    document.querySelectorAll('.topImages').forEach(img => {
        img.addEventListener('click', () => {
            modal.style.display = "block";
            modalImg.src = img.src;
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = "none";
    });

    // Zamknij po klikni?ciu w t?o
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});
