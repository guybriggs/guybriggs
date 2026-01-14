import { $ } from "../utils/dom.js";

/* =========================
        DROPDOWNS (ONE OPEN AT A TIME)
========================== */
const navDropdown = $("navDropdown");
const navBrandBtn = $("navBrandBtn");
const navMenu = $("navMenu");

const userDropdown = $("userDropdown");
const avatarBtn = $("avatarBtn");
const userMenu = $("userMenu");

function isMenuOpen(menuEl) {
  return menuEl.classList.contains("flatify-dropdown-show");
}

export function hardHideMenu(menuEl, triggerBtn) {
  if (!menuEl) return;

  // ✅ never hide the main tabs bar
  if (menuEl.id === "navMenu") return;

  menuEl.classList.remove("flatify-dropdown-show", "flatify-dropdown-will-be-hidden");
  menuEl.style.display = "none";
  if (triggerBtn) triggerBtn.setAttribute("aria-expanded", "false");
}

export function closeMenu(menuEl, triggerBtn) {
  if (!menuEl || !isMenuOpen(menuEl)) return;

  // ✅ never close the main tabs bar
  if (menuEl.id === "navMenu") return;

  menuEl.classList.remove("flatify-dropdown-show");
  menuEl.classList.add("flatify-dropdown-will-be-hidden");
  if (triggerBtn) triggerBtn.setAttribute("aria-expanded", "false");

  const hideMs = 200;
  window.setTimeout(() => {
    menuEl.classList.remove("flatify-dropdown-will-be-hidden");
    menuEl.style.display = "none";
  }, hideMs);
}

export function openMenu(menuEl, triggerBtn) {
  if (!menuEl) return;

  if (menuEl !== navMenu) hardHideMenu(navMenu, navBrandBtn);
  if (menuEl !== userMenu) hardHideMenu(userMenu, avatarBtn);

  menuEl.style.display = "block";
  menuEl.classList.remove("flatify-dropdown-will-be-hidden");
  menuEl.classList.add("flatify-dropdown-show");
  if (triggerBtn) triggerBtn.setAttribute("aria-expanded", "true");
}

export function toggleMenu(menuEl, triggerBtn) {
  if (!menuEl) return;
  if (isMenuOpen(menuEl)) closeMenu(menuEl, triggerBtn);
  else openMenu(menuEl, triggerBtn);
}

export function initDropdowns() {
  if (navBrandBtn && navMenu) {
    navBrandBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu(navMenu, navBrandBtn);
    });
  }

  if (avatarBtn && userMenu) {
    avatarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu(userMenu, avatarBtn);
    });
  }

  /* Outside click closes menus */
  document.addEventListener("click", (e) => {
    if (navDropdown && navMenu && navBrandBtn && !navDropdown.contains(e.target)) {
      closeMenu(navMenu, navBrandBtn);
    }
    if (userDropdown && userMenu && avatarBtn && !userDropdown.contains(e.target)) {
      closeMenu(userMenu, avatarBtn);
    }
  });

  /* ESC closes menus; modals have their own ESC handlers */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (navMenu) closeMenu(navMenu, navBrandBtn);
      if (userMenu) closeMenu(userMenu, avatarBtn);
    }
  });
}

export const dropdownEls = {
  navDropdown,
  navBrandBtn,
  navMenu,
  userDropdown,
  avatarBtn,
  userMenu
};
