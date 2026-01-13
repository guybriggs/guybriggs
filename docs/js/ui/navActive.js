import { $ } from "../utils/dom.js";

/* =========================
        NAV ACTIVE STATE (optional)
========================== */
export function initNavActive() {
  const navMenu = $("navMenu");
  if (!navMenu) return;

  const current = document.body.getAttribute("data-page") || "";
  if (!current) return;

  const links = Array.from(navMenu.querySelectorAll("[data-page-link]"));
  links.forEach((a) => {
    if (a.getAttribute("data-page-link") === current) {
      a.classList.add("is-active");
    }
  });
}
