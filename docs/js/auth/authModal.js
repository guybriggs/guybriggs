import { $ } from "../utils/dom.js";
import { state } from "../state/sessionState.js";
import { setLoggedInUI } from "./authUI.js";
import { hardHideMenu, dropdownEls } from "../ui/dropdowns.js";

/* =========================
        AUTH MODAL (LOGIN + SIGNUP)
========================== */
const authOverlay = $("authOverlay");
const authCloseBtn = $("authCloseBtn");
const authModal = authOverlay ? authOverlay.querySelector(".ui.modal") : null;

const authTitle = $("authTitle");
const authSubtitle = $("authSubtitle");
const authStepper = $("authStepper");
const authContent = $("authContent");
const authActions = $("authActions");


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

  // SHOW overlay + modal (Semantic + Tailwind)
  if (authOverlay) {
    authOverlay.classList.add("open", "active");
    authOverlay.classList.remove("hidden");
    authOverlay.setAttribute("aria-hidden", "false");
  }
  if (authModal) {
    authModal.classList.remove("hidden");
    authModal.classList.add("active");
  }

  document.body.style.overflow = "hidden";

  renderAuth();
  setTimeout(() => authPrimaryBtn?.focus(), 0);
}

function closeAuth() {
  if (authOverlay) {
    authOverlay.classList.remove("open", "active");
    authOverlay.classList.add("hidden");
    authOverlay.setAttribute("aria-hidden", "true");
  }
  if (authModal) {
    authModal.classList.remove("active");
    authModal.classList.add("hidden");
  }

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
  if (!authStepper) return;

  // No stepper for login
  if (state.mode === "login") {
    authStepper.innerHTML = "";
    authStepper.style.display = "none";
    return;
  }

  authStepper.style.display = "";

  const flow = getFlow();
  const activeIndex = state.step;

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
  // Visually, we don't show a title/subtitle in this design
  if (authTitle) authTitle.textContent = "";
  if (authSubtitle) authSubtitle.textContent = "";

  // Hide the bottom Semantic actions row for login
  if (authActions) authActions.style.display = "none";

  if (!authContent) return;

  authContent.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className =
      "w-full max-w-[420px] mx-auto flex flex-col items-stretch gap-3 py-8";

  // Helper to create the top social buttons
  function socialButton(iconClasses, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "w-full flex items-center justify-center gap-3 rounded-full " +
      "bg-slate-100 text-slate-700 font-semibold py-3 px-6 " +
      "shadow-[0_2px_6px_rgba(15,23,42,0.15)]";

    const icon = document.createElement("i");
    icon.className = iconClasses + " text-slate-500";
    btn.appendChild(icon);

    const span = document.createElement("span");
    span.textContent = label;
    btn.appendChild(span);

    return btn;
  }

  // Social / SSO buttons
  wrapper.appendChild(
    socialButton("fa-solid fa-phone", "Continue with Phone Number")
  );
  wrapper.appendChild(
    socialButton("fa-brands fa-google", "Continue with Google")
  );
  wrapper.appendChild(
    socialButton("fa-brands fa-apple", "Continue with Apple")
  );

  // Email input
  const emailWrap = document.createElement("div");
  emailWrap.className = "mt-4";
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.placeholder = "Enter email here";
  emailInput.value = state.data.loginEmail || "";
  emailInput.className =
    "w-full rounded-full border border-slate-200 px-6 py-3 " +
    "text-[15px] placeholder-slate-400 " +
    "shadow-[0_2px_6px_rgba(15,23,42,0.08)] " +
    "focus:outline-none focus:ring-2 focus:ring-[#58cc02]/60 focus:border-[#58cc02]/60";
  emailInput.autocomplete = "email";
  emailInput.addEventListener("input", (e) => {
    state.data.loginEmail = e.target.value;
  });
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") nextStep();
  });
  emailWrap.appendChild(emailInput);
  wrapper.appendChild(emailWrap);

  // Password input
  const passwordWrap = document.createElement("div");
  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Enter password here";
  passwordInput.value = state.data.loginPassword || "";
  passwordInput.className =
    "w-full rounded-full border border-slate-200 px-6 py-3 " +
    "text-[15px] placeholder-slate-400 " +
    "shadow-[0_2px_6px_rgba(15,23,42,0.08)] " +
    "focus:outline-none focus:ring-2 focus:ring-[#58cc02]/60 focus:border-[#58cc02]/60 mt-3";
  passwordInput.autocomplete = "current-password";
  passwordInput.addEventListener("input", (e) => {
    state.data.loginPassword = e.target.value;
  });
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") nextStep();
  });
  passwordWrap.appendChild(passwordInput);
  wrapper.appendChild(passwordWrap);

  // Green LOGIN button
  const loginBtn = document.createElement("button");
  loginBtn.type = "button";
  loginBtn.textContent = "LOGIN";
  loginBtn.className =
    "mt-4 w-full rounded-full bg-[#58cc02] text-white " +
    "font-extrabold uppercase tracking-[0.08em] py-3 " +
    "shadow-[0_8px_20px_rgba(0,0,0,0.25)]";
  loginBtn.addEventListener("click", () => nextStep());
  wrapper.appendChild(loginBtn);

  // "OR Click here to Sign Up"
  const footer = document.createElement("div");
  footer.className = "mt-6 text-center text-slate-400 text-sm";
  const orText = document.createElement("span");
  orText.textContent = "OR ";
  const signupLink = document.createElement("button");
  signupLink.type = "button";
  signupLink.className = "text-slate-500 underline font-semibold";
  signupLink.textContent = "Click here to Sign Up";
  signupLink.addEventListener("click", () => openAuth("signup"));

  footer.appendChild(orText);
  footer.appendChild(signupLink);
  wrapper.appendChild(footer);

  authContent.appendChild(wrapper);
}


function renderSignupStep(def) {
  if (authTitle) authTitle.textContent = "Create account";
  if (authSubtitle) authSubtitle.textContent = "Prototype flow";

  // Show the bottom actions row again for the multi-step signup flow
  if (authActions) authActions.style.display = "";

  const form = document.createElement("div");
  form.className = "ui form";

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
