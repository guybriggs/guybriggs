/* =========================
        PAGE-SPECIFIC HOOKS
========================== */
export function initFreeplay() {
  const playBtn = document.getElementById("playBtn");
  if (!playBtn) return;
  playBtn.addEventListener("click", () => alert("Play Game clicked"));
}
