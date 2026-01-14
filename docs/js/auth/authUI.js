import { $ } from "../utils/dom.js";
import { state } from "../state/sessionState.js";
import { hardHideMenu, dropdownEls } from "../ui/dropdowns.js";
import { addEnvPrefix } from "../utils/addEnvPrefix.js";

/* =========================
        AUTH UI SWAP (NO PERSISTENCE)
========================== */
const authArea = $("authArea");
const userDropdown = $("userDropdown");
const headerAvatarImg = $("headerAvatarImg");

export function setLoggedInUI(isLoggedIn) {
  state.isLoggedIn = isLoggedIn;

  if (isLoggedIn) {
    authArea?.classList.add("hidden");
    userDropdown?.classList.remove("hidden");
    if (headerAvatarImg) headerAvatarImg.src = addEnvPrefix(state.user.avatarUrl);

    hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);
  } else {
    userDropdown?.classList.add("hidden");
    authArea?.classList.remove("hidden");
    hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);
  }
}

export function initAuthUI() {
  // always logged out on refresh (prototype reset)
  setLoggedInUI(false);
}
