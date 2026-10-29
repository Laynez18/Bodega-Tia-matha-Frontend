import { yo } from "../login/login.js";

(async function() {
  try {
    await yo();
  } catch (err) {
    if (err.status === 401 || err.status === 0) {
      window.location.href = "../login/login.html";
    } else {
      console.error("Error verificando sesion:", err);
    }
  }
})();
