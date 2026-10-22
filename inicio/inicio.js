import { yo } from "../login/login.js";

(async function() {
  try {
    const datos = await yo();
    console.log("Sesión activa:", datos);
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "../login/login.html";
    } else {
      console.error("Error verificando sesión:", err.mensaje || err);
    }
  }
})();
