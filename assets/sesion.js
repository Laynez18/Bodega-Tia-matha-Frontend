import { logout } from "./login.js";

const TIEMPO_INACTIVIDAD_MINUTOS = 15;
const URL_LOGIN = "../login/login.html";

let temporizador = null;
let eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];

export async function cerrarSesion() {
  clearTimeout(temporizador);
  try {
    await logout();
  } catch (e) {
    // ignorar error de red al cerrar sesión
  } finally {
    localStorage.removeItem("mm-usuario-recordado");
    window.location.href = URL_LOGIN;
  }
}

function resetearTemporizador() {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    cerrarSesion();
  }, TIEMPO_INACTIVIDAD_MINUTOS * 60 * 1000);
}

window.cerrarSesion = cerrarSesion;

const rutaActual = window.location.pathname;
if (!rutaActual.includes("/login/login.html")) {
  iniciarControlInactividad();
}

export function iniciarControlInactividad() {
  resetearTemporizador();
  eventos.forEach((ev) => {
    window.addEventListener(ev, resetearTemporizador, true);
  });
}
