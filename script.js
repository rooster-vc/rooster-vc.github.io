document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    alert("Rooster-VC v0.1.0\n\nThis is a V0 build. There is no binary.\n\nYou have been awakened. That is the product.");
  });
});