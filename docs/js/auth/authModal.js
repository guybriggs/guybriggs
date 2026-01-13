import { $ } from "../utils/dom.js";
import { state } from "../state/sessionState.js";
import { setLoggedInUI } from "./authUI.js";
import { hardHideMenu, dropdownEls } from "../ui/dropdowns.js";

/* =========================
        AUTH MODAL (LOGIN + SIGNUP)
========================== */
const authOverlay = $("authOverlay");
const authCloseBtn = $("authCloseBtn");

const authTitle = $("authTitle");
const authSubtitle = $("authSubtitle");
const authStepper = $("authStepper");
const authContent = $("authContent");

const authBackBtn = $("authBackBtn");
const authAltBtn = $("authAltBtn");
const authSecondaryBtn = $("authSecondaryBtn");
const authPrimaryBtn = $("authPrimaryBtn");

const btnLogin = $("btnLogin");
const btnSignup = $("btnSignup");

const flows = {
  login: [{ key: "credentials", label: "Login" }],
  signup: [
    { key: "welcome", label: "Welcome" },
    { key: "details", label: "Details" },
    { key: "verify", label: "Verify" },
    { key: "done", label: "Done" }
  ]
};

function getFlow() {
  return flows[state.mode];
}
function currentStepDef() {
  return getFlow()[state.step];
}

function openAuth(mode) {
  hardHideMenu(dropdownEls.navMenu, dropdownEls.navBrandBtn);
  hardHideMenu(dropdownEls.userMenu, dropdownEls.avatarBtn);

  state.mode = mode;
  state.step = 0;

  // prototype defaults on each modal open (still no persistence)
  if (mode === "login") {
    state.method = "email";
    state.data.loginEmail = state.user.email;
    state.data.loginPassword = "password123";
  } else {
    state.method = "email";
    state.data.email = "";
    state.data.password = "";
    state.data.name = "";
    state.data.otp = "";
  }

  authOverlay?.classList.add("open");
  authOverlay?.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderAuth();
  setTimeout(() => authPrimaryBtn?.focus(), 0);
}

function closeAuth() {
  authOverlay?.classList.remove("open");
  authOverlay?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setPrimary(text, kind) {
  if (!authPrimaryBtn) return;
  authPrimaryBtn.textContent = text;
  authPrimaryBtn.classList.remove("primary", "secondary", "pro");
  authPrimaryBtn.classList.add(kind || "primary");
}

function setSecondary(text, show) {
  if (!authSecondaryBtn) return;
  authSecondaryBtn.textContent = text || "Cancel";
  authSecondaryBtn.style.display = show === false ? "none" : "";
}

function setBack(show) {
  if (authBackBtn) authBackBtn.style.display = show ? "" : "none";
}
function setAlt(show, text) {
  if (!authAltBtn) return;
  authAltBtn.style.display = show ? "" : "none";
  if (text) authAltBtn.textContent = text;
}

function renderStepper() {
  const flow = getFlow();
  const activeIndex = state.step;
  if (!authStepper) return;

  authStepper.innerHTML = "";
  flow.forEach((s, idx) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = s.label;
    if (idx < activeIndex) chip.classList.add("done");
    if (idx === activeIndex) chip.classList.add("active");
    authStepper.appendChild(chip);
  });
}

function field(label, type, value, onInput, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = "field";

  const lab = document.createElement("label");
  lab.textContent = label;

  const input = document.createElement("input");
  input.type = type;
  input.value = value || "";
  if (opts.placeholder) input.placeholder = opts.placeholder;
  if (opts.autocomplete) input.autocomplete = opts.autocomplete;

  input.addEventListener("input", (e) => onInput(e.target.value));
  if (opts.onEnter) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") opts.onEnter();
    });
  }

  wrap.appendChild(lab);
  wrap.appendChild(input);
  return wrap;
}

function validateStep() {
  const def = currentStepDef();
  const d = state.data;
  if (!def) return true;

  if (state.mode === "login") {
    if (def.key === "credentials") return !!d.loginEmail.trim() && !!d.loginPassword.trim();
    return true;
  }

  if (def.key === "welcome") return true;
  if (def.key === "details") return !!d.name.trim() && !!d.email.trim();
  if (def.key === "verify") return state.method === "otp" ? !!d.otp.trim() : !!d.password.trim();
  return true;
}

function nextStep() {
  if (!validateStep()) {
    if (authSubtitle) {
      authSubtitle.textContent = "Please complete the fields to continue.";
      authSubtitle.style.color = "var(--flatify__color-red-dark)";
      setTimeout(() => {
        if (!authSubtitle) return;
        authSubtitle.style.color = "";
        authSubtitle.textContent = "Prototype flow";
      }, 900);
    }
    return;
  }

  if (state.mode === "login") {
    closeAuth();
    setLoggedInUI(true);
    return;
  }

  const flow = getFlow();
  if (state.step < flow.length - 1) state.step += 1;
  renderAuth();
}

function prevStep() {
  if (state.step > 0) state.step -= 1;
  renderAuth();
}

function switchMethod() {
  state.method = state.method === "email" ? "otp" : "email";
  renderAuth();
}

function renderLoginStep(def) {
  if (authTitle) authTitle.textContent = "Log in";
  if (authSubtitle) authSubtitle.textContent = "Prefilled — just hit Sign in.";

  const form = document.createElement("div");
  form.className = "form";

  form.appendChild(
    field("Email", "email", state.data.loginEmail, (v) => (state.data.loginEmail = v), {
      placeholder: "name@example.com",
      autocomplete: "email",
      onEnter: nextStep
    })
  );

  form.appendChild(
    field("Password", "password", state.data.loginPassword, (v) => (state.data.loginPassword = v), {
      placeholder: "••••••••",
      autocomplete: "current-password",
      onEnter: nextStep
    })
  );

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Prototype only — no real auth.";
  form.appendChild(hint);

  if (authContent) {
    authContent.innerHTML = "";
    authContent.appendChild(form);
  }

  setBack(false);
  setAlt(false);
  setSecondary("Cancel", true);
  setPrimary("Sign in", "primary");
}

function renderSignupStep(def) {
  if (authTitle) authTitle.textContent = "Create account";
  if (authSubtitle) authSubtitle.textContent = "Prototype flow";

  const form = document.createElement("div");
  form.className = "form";

  if (def.key === "welcome") {
    const box = document.createElement("div");
    box.className = "centered";
    box.innerHTML = `
      <div style="font-weight: 900; font-size: 16px; margin-bottom: 8px;">Welcome!</div>
      <div class="muted">You’ll enter details, verify, and finish setup.</div>
    `;
    form.appendChild(box);
  }

  if (def.key === "details") {
    form.appendChild(
      field("Name", "text", state.data.name, (v) => (state.data.name = v), {
        placeholder: "Your name",
        autocomplete: "name",
        onEnter: nextStep
      })
    );

    form.appendChild(
      field("Email", "email", state.data.email, (v) => (state.data.email = v), {
        placeholder: "name@example.com",
        autocomplete: "email",
        onEnter: nextStep
      })
    );

    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "Next you’ll verify your account.";
    form.appendChild(hint);
  }

  if (def.key === "verify") {
    if (state.method === "otp") {
      if (authSubtitle) authSubtitle.textContent = "We sent you a code. Enter it to verify.";
      form.appendChild(
        field("Verification code", "text", state.data.otp, (v) => (state.data.otp = v.replace(/\D/g, "").slice(0, 6)), {
          placeholder: "123456",
          autocomplete: "one-time-code",
          onEnter: nextStep
        })
      );
    } else {
      if (authSubtitle) authSubtitle.textContent = "Set a password to secure your account.";
      form.appendChild(
        field("Password", "password", state.data.password, (v) => (state.data.password = v), {
          placeholder: "Create a password",
          autocomplete: "new-password",
          onEnter: nextStep
        })
      );
    }

    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = state.method === "otp" ? "Prototype code: type any 6 digits." : "Prototype password: type anything.";
    form.appendChild(hint);
  }

  if (def.key === "done") {
    const box = document.createElement("div");
    box.className = "centered";
    box.innerHTML = `
      <div class="big-check">🎉</div>
      <div style="font-weight: 900; font-size: 16px; margin-bottom: 6px;">Account created</div>
      <div class="muted">You’re all set (prototype).</div>
    `;
    form.appendChild(box);
  }

  if (authContent) {
    authContent.innerHTML = "";
    authContent.appendChild(form);
  }

  setBack(state.step > 0);
  setSecondary("Cancel", true);

  if (def.key === "welcome") {
    setBack(false);
    setPrimary("Get started", "primary");
    setAlt(false);
  } else if (def.key === "details") {
    setPrimary("Continue", "primary");
    setAlt(false);
  } else if (def.key === "verify") {
    setPrimary(state.method === "otp" ? "Verify account" : "Create account", "primary");
    setAlt(true, state.method === "otp" ? "Set password instead" : "Verify with code");
  } else if (def.key === "done") {
    setBack(false);
    setAlt(false);
    setSecondary("Close", true);
    setPrimary("Go to Course", "secondary");
  }
}

function renderAuth() {
  renderStepper();
  const def = currentStepDef();
  if (state.mode === "login") renderLoginStep(def);
  else renderSignupStep(def);
}

export function initAuthModal() {
  if (btnLogin) btnLogin.addEventListener("click", () => openAuth("login"));
  if (btnSignup) btnSignup.addEventListener("click", () => openAuth("signup"));

  if (authCloseBtn) authCloseBtn.addEventListener("click", closeAuth);
  if (authSecondaryBtn) authSecondaryBtn.addEventListener("click", closeAuth);

  if (authOverlay) {
    authOverlay.addEventListener("click", (e) => {
      if (e.target === authOverlay) closeAuth();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuth();
  });

  if (authPrimaryBtn) {
    authPrimaryBtn.addEventListener("click", () => {
      const def = currentStepDef();
      if (state.mode === "signup" && def && def.key === "done") {
        closeAuth();
        window.location.href = "/course/";
        return;
      }
      nextStep();
    });
  }

  if (authBackBtn) authBackBtn.addEventListener("click", prevStep);

  if (authAltBtn) {
    authAltBtn.addEventListener("click", () => {
      const def = currentStepDef();
      if (!def) return;
      if (state.mode === "signup" && def.key === "verify") switchMethod();
    });
  }
}
