import { api, tieneCsrf, yo } from "../login/login.js";

const tbody = document.querySelector("#pane-roles tbody");
const modal = document.getElementById("modalNuevoRol");
const form = modal.querySelector("form");
const btnGuardar = modal.querySelector(".modal-footer .btn-primary");
const titulo = document.getElementById("modalNuevoRolLabel");
const inputNombre = document.getElementById("rol-nombre");
const inputDescripcion = document.getElementById("rol-descripcion");
const selectNivel = document.getElementById("rol-nivel");

const alerta = document.createElement("div");
alerta.className = "alert alert-danger d-none";
form.prepend(alerta);

let roles = [];
let editando = null;

function mostrarError(mensaje) {
  alerta.textContent = mensaje;
  alerta.classList.remove("d-none");
}

function limpiarError() {
  alerta.textContent = "";
  alerta.classList.add("d-none");
}

function irALogin(err) {
  if (err.status === 401) {
    window.location.href = "../login/login.html";
    return true;
  }
  return false;
}

const TEXTO_NIVEL = { 1: "Superior", 2: "Operativo", 3: "Restringido" };

function celda(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

function celdaNivel(nivel) {
  const td = document.createElement("td");
  if (nivel === null || nivel === undefined) {
    return td;
  }
  const contenedor = document.createElement("div");
  contenedor.className = "d-flex flex-column gap-1";

  const badge = document.createElement("span");
  badge.className =
    "badge align-self-start " +
    (nivel === 1 ? "text-bg-primary" : "text-bg-secondary");
  badge.textContent = "Nivel " + nivel;

  const detalle = document.createElement("small");
  detalle.className = "text-muted";
  detalle.textContent = TEXTO_NIVEL[nivel] || "";

  contenedor.append(badge, detalle);
  td.appendChild(contenedor);
  return td;
}

function celdaAcciones(rol, activo) {
  const td = document.createElement("td");
  td.innerHTML =
    '<div class="d-flex gap-1">' +
    '<button class="btn btn-sm btn-outline-primary" title="Editar" data-accion="editar"><i class="bi bi-pencil"></i></button>' +
    (activo
      ? '<button class="btn btn-sm btn-outline-primary" title="Desactivar" data-accion="estado"><i class="bi bi-toggle-on"></i></button>'
      : '<button class="btn btn-sm btn-outline-secondary" title="Activar" data-accion="estado"><i class="bi bi-toggle-off opacity-50"></i></button>') +
    "</div>";
  td.querySelectorAll("button").forEach((b) => {
    b.dataset.id = rol.idRol;
  });
  return td;
}

function filaRol(rol) {
  const activo = rol.estado !== false && rol.estado !== "0";
  const tr = document.createElement("tr");
  if (!activo) {
    tr.classList.add("text-muted", "opacity-75");
  }
  const tdNombre = celda(rol.nRol);
  if (!activo) {
    const insignia = document.createElement("span");
    insignia.className = "badge text-bg-secondary ms-2";
    insignia.textContent = "Inactivo";
    tdNombre.appendChild(insignia);
  }
  tr.append(
    celda(rol.idRol),
    tdNombre,
    celda(rol.descripcion || ""),
    celdaNivel(rol.nivel),
    celdaAcciones(rol, activo),
  );
  return tr;
}

function filaMensaje(texto) {
  const tr = document.createElement("tr");
  const td = celda(texto);
  td.colSpan = 5;
  td.className = "text-center text-muted";
  tr.appendChild(td);
  return tr;
}

export async function listarRoles() {
  try {
    roles = (await api("GET", "/api/roles")) || [];
    if (!roles.length) {
      tbody.replaceChildren(filaMensaje("No hay roles registrados."));
      return;
    }
    tbody.replaceChildren(...roles.map(filaRol));
  } catch (err) {
    if (!irALogin(err)) {
      tbody.replaceChildren(filaMensaje(err.mensaje || "No se pudo cargar."));
    }
  }
}

function prepararModo() {
  limpiarError();
  titulo.textContent = editando ? "Editar Rol" : "Nuevo Rol";
  if (editando) {
    inputNombre.value = editando.nRol || "";
    inputDescripcion.value = editando.descripcion || "";
    selectNivel.value = editando.nivel;
  } else {
    selectNivel.value = "2";
  }
}

async function guardarRol() {
  limpiarError();
  const payload = {
    nRol: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim(),
    nivel: Number(selectNivel.value),
  };
  const errores = [];
  if (!payload.nRol || payload.nRol.length > 50) {
    errores.push("El nombre es obligatorio (máximo 50 caracteres).");
  }
  if (payload.descripcion.length > 100) {
    errores.push("La descripción admite máximo 100 caracteres.");
  }
  if (![1, 2, 3].includes(payload.nivel)) {
    errores.push("El nivel debe ser 1, 2 o 3.");
  }
  if (errores.length) {
    mostrarError(errores.join(" "));
    return;
  }

  btnGuardar.disabled = true;
  try {
    if (!tieneCsrf()) {
      await yo();
    }
    if (editando) {
      await api("PUT", "/api/roles/" + editando.idRol, payload);
    } else {
      await api("POST", "/api/roles", payload);
    }
    bootstrap.Modal.getInstance(modal).hide();
    await listarRoles();
  } catch (err) {
    if (!irALogin(err)) {
      mostrarError(err.mensaje || "No se pudo guardar el rol.");
    }
  } finally {
    btnGuardar.disabled = false;
  }
}

async function cambiarEstado(rol) {
  const activo = rol.estado !== false && rol.estado !== "0";
  const accion = activo ? "desactivar" : "reactivar";
  if (!window.confirm(`¿Desea ${accion} el rol "${rol.nRol}"?`)) {
    return;
  }
  try {
    if (!tieneCsrf()) {
      await yo();
    }
    await api("PATCH", `/api/roles/${rol.idRol}/estado`, {
      estado: activo ? "0" : "1",
    });
    await listarRoles();
  } catch (err) {
    if (!irALogin(err)) {
      window.alert(err.mensaje || `No se pudo ${accion} el rol.`);
    }
  }
}

modal.addEventListener("show.bs.modal", prepararModo);
modal.addEventListener("hidden.bs.modal", () => {
  editando = null;
  form.reset();
});
btnGuardar.addEventListener("click", guardarRol);

tbody.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) {
    return;
  }
  const rol = roles.find((r) => String(r.idRol) === boton.dataset.id);
  if (!rol) {
    return;
  }
  if (boton.dataset.accion === "editar") {
    editando = rol;
    bootstrap.Modal.getOrCreateInstance(modal).show();
  } else {
    cambiarEstado(rol);
  }
});

listarRoles();
