import { yo } from "../login/login.js";

(async function() {
  try {
    await yo();
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "../login/login.html";
    }
  }
})();
