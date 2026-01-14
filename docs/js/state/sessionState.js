/* =========================
        PROTOTYPE SESSION STATE (NO PERSISTENCE)
========================== */
export const state = {
  isLoggedIn: false,
  user: {
    fullName: "Stu Dent",
    displayName: "@thegoatedlearner",
    email: "stuthedude@edu.nsw.au",
    avatarUrl: "img/avatar.png"
  },

  // modal flow state
  mode: "login", // "login" | "signup"
  step: 0,
  method: "email", // "email" | "otp"
  data: {
    loginEmail: "stuthedude@edu.nsw.au",
    loginPassword: "password123",
    email: "",
    password: "",
    name: "",
    otp: ""
  }
};
