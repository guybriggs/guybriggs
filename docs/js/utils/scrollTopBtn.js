export function initScrollTopBtn() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
