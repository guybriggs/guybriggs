import { $ } from "../utils/dom.js";
import { state } from "../state/sessionState.js";
import { hardHideMenu, closeMenu, dropdownEls } from "../ui/dropdowns.js";
import { setLoggedInUI } from "../auth/authUI.js";
import { addEnvPrefix } from "../utils/addEnvPrefix.js";

/* =========================
        PROFILE MODAL
========================== */
const profileOverlay = $("profileOverlay");
const profileCloseBtn = $("profileCloseBtn");
const profileFooterClose = $("profileFooterClose");
const profileBody = $("profileBody");
const avatarOverlay = $("avatarOverlay");
const avatarCloseBtn = $("avatarCloseBtn");
const avatarModal = avatarOverlay ? avatarOverlay.querySelector(".ui.modal") : null;

function openProfileModal() {
  hardHideMenu(dropdownEls.navMenu, dropdownEls.navBrandBtn);
  hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);

  const u = state.user;

  if (profileBody) {
    profileBody.innerHTML = `
      <div class="profile-header">
        <img class="profile-avatar" src="${addEnvPrefix(u.avatarUrl)}" alt="Profile avatar" />
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

function openAvatarModal() {
  hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);

  if (avatarOverlay) {
    avatarOverlay.classList.add("open", "active");
    avatarOverlay.classList.remove("hidden");
    avatarOverlay.setAttribute("aria-hidden", "false");
  }
  if (avatarModal) {
    avatarModal.classList.remove("hidden");
    avatarModal.classList.add("active");
  }

  document.body.style.overflow = "hidden";

  initAvatarCustomizer(); // ✅ bind clicks
  setTimeout(() => avatarCloseBtn?.focus(), 0);
}

function closeAvatarModal() {
  if (avatarOverlay) {
    avatarOverlay.classList.remove("open", "active");
    avatarOverlay.classList.add("hidden");
    avatarOverlay.setAttribute("aria-hidden", "true");
  }
  if (avatarModal) {
    avatarModal.classList.remove("active");
    avatarModal.classList.add("hidden");
  }
  document.body.style.overflow = "";
}

function initAvatarCustomizer() {
    // bind once per page load
    if (avatarOverlay?.dataset.bound === "1") return;
    if (!avatarOverlay) return;
    avatarOverlay.dataset.bound = "1";

    const previewImg = $("avatarPreviewImg");
    const saveBtn = $("avatarSaveBtn");

    const tiles = Array.from(avatarOverlay.querySelectorAll(".avatar-tile"));

    const customView = $("avatarCustomizerView");
    const purchaseView = $("avatarPurchaseView");

    const purchaseTitle = $("purchaseTitle");
    const purchasePriceBtn = $("purchasePriceBtn"); // (still used to display price on purchase screen)
    const purchaseBackBtn = $("purchaseBackBtn");

    let pendingPurchase = null; // { title, price }

    function showPurchase({ title, price }) {
      customView?.classList.add("hidden");
      purchaseView?.classList.remove("hidden");

      if (purchaseTitle) purchaseTitle.textContent = title || "Purchase New Accessory";
      if (purchasePriceBtn) purchasePriceBtn.textContent = `$${price}`;
    }

    function showCustomizer() {
      purchaseView?.classList.add("hidden");
      customView?.classList.remove("hidden");

      pendingPurchase = null; // ✅ reset purchase state when going back
      if (saveBtn) saveBtn.textContent = "SAVE";
    }

    purchaseBackBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showCustomizer();
    });

    function setSelectedTile(activeBtn) {
      tiles.forEach((b) => b.classList.remove("ring-2", "ring-blue-400", "ring-offset-2"));
      activeBtn.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
    }

    function setSaveLabel(text) {
      if (!saveBtn) return;
      saveBtn.textContent = text;
    }

    // ✅ Tile click behaviour
    tiles.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isLocked = btn.dataset.locked === "true";
        const price = btn.dataset.price;
        const name = btn.dataset.itemName || "Accessory";

        setSelectedTile(btn);

        if (isLocked && price) {
          // ✅ allow click, but DON'T switch screens yet
          pendingPurchase = { title: `Purchase New Accessory: ${name}`, price };

          // ✅ change green button (in customiser) to Buy $X
          setSaveLabel(`Buy $${price}`);
          return;
        }

        // ✅ normal item: apply filter to LEFT avatar
        const filter = btn.dataset.avatarFilter;
        if (previewImg && filter) previewImg.style.filter = filter;

        // ✅ normal item clears any pending purchase + resets button label
        pendingPurchase = null;
        setSaveLabel("SAVE");
      });
    });

    // ✅ Clicking the GREEN button now switches to purchase screen (only when it says Buy $X)
    saveBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const label = (saveBtn.textContent || "").trim();

      if (label.startsWith("Buy $")) {
        if (!pendingPurchase) return;
        showPurchase(pendingPurchase);
        return;
      }

      // normal save flow placeholder
      alert("Pretend save avatar");
    });
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

      if (action === "edit-avatar") {
        closeMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);
        openAvatarModal();
        return;
      }

      if (action === "manage-courses") {
        closeMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);
        window.location.href = addEnvPrefix("educators/");
        return;
      }

      if (action === "signout") {
        setLoggedInUI(false);
        hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);
        window.location.href = addEnvPrefix("");
        return;
      }
    });
  });

  avatarCloseBtn?.addEventListener("click", closeAvatarModal);

  avatarOverlay?.addEventListener("click", (e) => {
    if (e.target === avatarOverlay) closeAvatarModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAvatarModal();
  });
}
