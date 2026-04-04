// genealogie.js (FINAL - AUTO SYNC READY)

function openFamily(family) {
  localStorage.setItem("selectedFamily", family.slug);
  window.location.href = "arborele-satului.html";
}

// Exemplu: atașează la carduri (dacă nu ai deja)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".family-card").forEach(card => {
    const slug = card.getAttribute("data-slug");
    if (!slug) return;

    card.onclick = () => openFamily({ slug });
  });
});
