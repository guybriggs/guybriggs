// js/ui/headerAutoHide.js
export function initHeaderAutoHide() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const HIDE_AFTER_PX = 80;
  const SHOW_NEAR_TOP_PX = 50;

  let lastY = window.scrollY;
  let hidden = false;

  function setHidden(nextHidden) {
    if (hidden === nextHidden) return;
    hidden = nextHidden;
    header.classList.toggle("header--hidden", hidden);
  }

  function onScroll() {
    const y = window.scrollY;

    // show only near the top
    if (y <= SHOW_NEAR_TOP_PX) {
      setHidden(false);
      lastY = y;
      return;
    }

    // hide when scrolling down past threshold
    const scrollingDown = y > lastY;
    if (scrollingDown && y > HIDE_AFTER_PX) {
      setHidden(true);
    }

    // scrolling up does NOT show it
    lastY = y;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}
