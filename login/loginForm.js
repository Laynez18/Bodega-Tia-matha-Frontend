import { login } from "./login.js";

const form = document.getElementById("formLogin");
const inputUsuario = document.getElementById("usuario");
const inputClave = document.getElementById("contrasena");
const checkRecordar = document.getElementById("recordar");
const alerta = document.getElementById("alertaLogin");

const CLAVE_RECORDAR = "mm-usuario-recordado";

function limpiarAlerta() {
  if (!alerta) {
    return;
  }
  alerta.textContent = "";
  alerta.classList.add("d-none");
}

function mostrarAlerta(mensaje) {
  if (!alerta) {
    return;
  }
  alerta.textContent = mensaje;
  alerta.classList.remove("d-none");
}

function validarCredenciales(usuario, clave) {
  const errores = [];
  if (!usuario) {
    errores.push("El usuario es obligatorio.");
  }
  if (!clave) {
    errores.push("La contraseña es obligatoria.");
  }
  return errores;
}

function restaurarUsuario() {
  try {
    const guardado = localStorage.getItem(CLAVE_RECORDAR);
    if (guardado) {
      inputUsuario.value = guardado;
      checkRecordar.checked = true;
    }
  } catch (e) {}
}

function guardarUsuario(usuario, recordar) {
  try {
    if (recordar) {
      localStorage.setItem(CLAVE_RECORDAR, usuario);
    } else {
      localStorage.removeItem(CLAVE_RECORDAR);
    }
  } catch (e) {}
}

async function manejarEnvio(evento) {
  evento.preventDefault();
  limpiarAlerta();

  const usuario = inputUsuario.value.trim();
  const clave = inputClave.value.trim();

  const errores = validarCredenciales(usuario, clave);
  if (errores.length) {
    mostrarAlerta(errores.join(" "));
    return;
  }

  guardarUsuario(usuario, checkRecordar.checked);

  const boton = form.querySelector('button[type="submit"]');
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = "Ingresando...";

  try {
    const data = await login(usuario, clave);
    window.location.href = "../inicio/inicio.html";
  } catch (err) {
    mostrarAlerta(err.mensaje || "No se pudo iniciar sesión.");
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}

restaurarUsuario();
form.addEventListener("submit", manejarEnvio);
