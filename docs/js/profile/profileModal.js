import { $ } from "../utils/dom.js";
import { state } from "../state/sessionState.js";
import { hardHideMenu, closeMenu, dropdownEls } from "../ui/dropdowns.js";
import { setLoggedInUI } from "../auth/authUI.js";

/* =========================
        PROFILE MODAL
========================== */
const profileOverlay = $("profileOverlay");
const profileCloseBtn = $("profileCloseBtn");
const profileFooterClose = $("profileFooterClose");
const profileBody = $("profileBody");

function openProfileModal() {
  hardHideMenu(dropdownEls.navMenu, dropdownEls.navBrandBtn);
  hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);

  const u = state.user;

  if (profileBody) {
    profileBody.innerHTML = `
      <div class="profile-header">
        <img class="profile-avatar" src="${u.avatarUrl}" alt="Profile avatar" />
        <div class="profile-names">
          <div class="profile-fullname" title="${u.fullName}">${u.fullName}</div>
          <div class="profile-displayname" title="${u.displayName}">${u.displayName}</div>
        </div>
      </div>

      <div class="profile-row">
        <div class="kv">
          <div class="k">Email</div>
          <div class="v">${u.email}</div>
        </div>
      </div>

      <div class="profile-row profile-actions" style="margin-top: 14px;">
        <button class="ui button secondary" id="btnCustomizeAvatar" type="button">Customise avatar</button>
        <button class="ui button secondary" id="btnResetPassword" type="button">Reset password</button>
        <button class="ui button pro" id="btnPurchasePro" type="button">Purchase “Pro-conomics”</button>
      </div>
    `;
  }

  $("btnCustomizeAvatar")?.addEventListener("click", () => alert("Customise avatar clicked"));
  $("btnResetPassword")?.addEventListener("click", () => alert("Reset password clicked"));
  $("btnPurchasePro")?.addEventListener("click", () => alert("Purchase Pro-conomics clicked"));

  profileOverlay?.classList.add("open");
  profileOverlay?.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => profileCloseBtn?.focus(), 0);
}

function closeProfileModal() {
  profileOverlay?.classList.remove("open");
  profileOverlay?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

export function initProfileModal() {
  profileCloseBtn?.addEventListener("click", closeProfileModal);
  profileFooterClose?.addEventListener("click", closeProfileModal);

  profileOverlay?.addEventListener("click", (e) => {
    if (e.target === profileOverlay) closeProfileModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProfileModal();
  });

  const userMenu = dropdownEls.userMenu;
  if (!userMenu) return;

  const userItems = Array.from(userMenu.querySelectorAll("[data-user-action]"));
  userItems.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const action = btn.dataset.userAction;

      if (action === "profile") {
        closeMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);
        openProfileModal();
        return;
      }

      if (action === "signout") {
        setLoggedInUI(false);
        hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);
        window.location.href = "/";
      }
    });
  });
}
