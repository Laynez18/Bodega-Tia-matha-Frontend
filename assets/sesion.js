import { API_BASE } from "./config.js";

const TIEMPO_INACTIVIDAD_MINUTOS = 15;
const URL_LOGIN = "../login/login.html";

let temporizador = null;
let eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];

export function cerrarSesion() {
  clearTimeout(temporizador);
  fetch(API_BASE + "/api/auth/logout", {
    method: "POST",
    credentials: "include",
  })
    .then(() => {})
    .catch(() => {})
    .finally(() => {
      localStorage.removeItem("mm-usuario-recordado");
      window.location.href = URL_LOGIN;
    });
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
