document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => {
        // Mo?esz tu poda? dok?adny link do pliku do pobrania
        window.location.href = '../download/LochMess_1_0_0.zip';
    });
});
