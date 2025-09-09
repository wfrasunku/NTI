document.addEventListener("DOMContentLoaded", () => {
    const faqContainer = document.getElementById("faq-container");
    const form = document.getElementById("faq-form");
    const questionInput = document.getElementById("question");
    const answerInput = document.getElementById("answer");
    const adminPanel = document.getElementById("admin-panel");

    const loggedInUser = localStorage.getItem("loggedInUser");
    const isAdmin = loggedInUser === "admin"; // prosta symulacja

    if (isAdmin) adminPanel.classList.remove("hidden");

    function renderFaqs(faqs) {
        faqContainer.innerHTML = "";
        faqs.forEach((faq, index) => {
            const item = document.createElement("div");
            item.classList.add("faq-item");
            item.innerHTML = `
        <h3>${faq.question}</h3>
        <p>${faq.answer}</p>
        ${isAdmin ? `<button class="edit-btn" data-index="${index}">✏️ Edytuj</button>` : ""}
      `;
            faqContainer.appendChild(item);
        });

        if (isAdmin) {
            document.querySelectorAll(".edit-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const index = e.target.dataset.index;
                    fetch("/api/faq")
                        .then((res) => res.json())
                        .then((faqs) => {
                            const faq = faqs[index];
                            questionInput.value = faq.question;
                            answerInput.value = faq.answer;
                            form.dataset.editIndex = index;
                        });
                });
            });
        }
    }

    fetch("/api/faq")
        .then((res) => res.json())
        .then(renderFaqs)
        .catch((err) => console.error("Błąd ładowania FAQ:", err));

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();
        const index = form.dataset.editIndex;

        fetch("/api/faq", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question, answer, index: index ? parseInt(index) : undefined }),
        })
            .then((res) => res.json())
            .then(() => {
                form.reset();
                delete form.dataset.editIndex;
                return fetch("/api/faq");
            })
            .then((res) => res.json())
            .then(renderFaqs);
    });
});
