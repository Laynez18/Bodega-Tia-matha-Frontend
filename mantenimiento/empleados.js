import { api, tieneCsrf, yo } from "../login/login.js";

const modal = document.getElementById("modalNuevoEmpleado");
const form = modal.querySelector("form");
const btnGuardar = modal.querySelector(".modal-footer .btn-primary");
const tbody = document.querySelector("#pane-empleados tbody");

// Cada catálogo: endpoint, select destino y nombres de campo posibles en el JSON.
const CATALOGOS = [
  {
    ruta: "/api/tipos-identidad",
    select: "empleado-tipo-doc",
    id: ["idTipoIdentidad", "id"],
    texto: ["nTipoIdentidad", "nombre"],
  },
  {
    ruta: "/api/cargos",
    select: "empleado-cargo",
    id: ["idCargo", "id"],
    texto: ["nCargo", "nombre"],
  },
  {
    ruta: "/api/contratos",
    select: "empleado-contrato",
    id: ["idContrato", "id"],
    texto: ["nContrato", "nombre"],
  },
];

const alerta = document.createElement("div");
alerta.className = "alert alert-danger d-none";
form.prepend(alerta);

function leer(obj, claves) {
  if (!obj) {
    return undefined;
  }
  const clave = claves.find((c) => obj[c] !== undefined && obj[c] !== null);
  return clave === undefined ? undefined : obj[clave];
}

// Acepta texto o un objeto anidado ({ nCargo: "..." }).
function aTexto(valor) {
  if (valor && typeof valor === "object") {
    return Object.values(valor).find((v) => typeof v === "string") || "";
  }
  return valor === undefined || valor === null ? "" : String(valor);
}

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

/* ---------- Catálogos de los selects ---------- */

function llenarSelect(select, items, catalogo) {
  const placeholder = select.querySelector('option[value=""]');
  select.replaceChildren(placeholder);
  items.forEach((item) => {
    const opcion = document.createElement("option");
    opcion.value = leer(item, catalogo.id);
    opcion.textContent = aTexto(leer(item, catalogo.texto));
    select.appendChild(opcion);
  });
}

async function cargarCatalogo(catalogo) {
  const select = document.getElementById(catalogo.select);
  try {
    const items = await api("GET", catalogo.ruta);
    llenarSelect(select, items || [], catalogo);
    return true;
  } catch (err) {
    if (!irALogin(err)) {
      console.error("No se pudo cargar " + catalogo.ruta, err.mensaje);
    }
    return false;
  }
}

let catalogosCargados = false;

async function cargarCatalogos() {
  if (catalogosCargados) {
    return;
  }
  const resultados = await Promise.all(CATALOGOS.map(cargarCatalogo));
  catalogosCargados = resultados.every(Boolean);
}

/* ---------- Listado ---------- */

function celda(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

function filaEmpleado(e, indice) {
  const persona = e.persona || e;
  const tr = document.createElement("tr");

  const nombre =
    leer(e, ["nombreCompleto"]) ||
    [
      leer(persona, ["nombre"]),
      leer(persona, ["apPaterno"]),
      leer(persona, ["apMaterno"]),
    ]
      .filter(Boolean)
      .join(" ");

  tr.appendChild(celda(leer(e, ["idEmpleado", "id"]) ?? indice + 1));
  tr.appendChild(celda(aTexto(leer(persona, ["nDocumento"]))));
  tr.appendChild(celda(nombre));
  tr.appendChild(celda(aTexto(leer(e, ["cargo", "nCargo"]))));
  tr.appendChild(celda(aTexto(leer(e, ["turno"]))));
  tr.appendChild(celda(aTexto(leer(persona, ["celular"]))));

  const tdEstado = document.createElement("td");
  const badge = document.createElement("span");
  const activo = leer(e, ["estado"]) !== "0";
  badge.className =
    "badge " + (activo ? "text-bg-success" : "text-bg-secondary");
  badge.textContent = activo ? "Activo" : "Inactivo";
  tdEstado.appendChild(badge);
  tr.appendChild(tdEstado);

  const tdAcciones = document.createElement("td");
  tdAcciones.innerHTML =
    '<div class="d-flex gap-1">' +
    '<button class="btn btn-outline-primary btn-sm"><i class="bi bi-pencil"></i></button>' +
    '<button class="btn btn-outline-primary btn-sm" title="Desactivar"><i class="bi bi-toggle-on"></i></button>' +
    "</div>";
  tr.appendChild(tdAcciones);
  return tr;
}

function filaMensaje(texto) {
  const tr = document.createElement("tr");
  const td = celda(texto);
  td.colSpan = 8;
  td.className = "text-center text-muted";
  tr.appendChild(td);
  return tr;
}

async function listarEmpleados() {
  try {
    const empleados = await api("GET", "/api/empleados");
    if (!empleados || !empleados.length) {
      tbody.replaceChildren(filaMensaje("No hay empleados registrados."));
      return;
    }
    tbody.replaceChildren(...empleados.map(filaEmpleado));
  } catch (err) {
    if (!irALogin(err)) {
      tbody.replaceChildren(filaMensaje(err.mensaje || "No se pudo cargar."));
    }
  }
}

/* ---------- Alta ---------- */

function valor(id) {
  return document.getElementById(id).value.trim();
}

function textoONulo(id) {
  return valor(id) || null;
}

function numeroONulo(id) {
  const v = valor(id);
  return v === "" ? null : Number(v);
}

function armarPayload() {
  return {
    persona: {
      idDistrito: numeroONulo("empleado-distrito"),
      idTipoIdentidad: numeroONulo("empleado-tipo-doc"),
      nDocumento: valor("empleado-documento"),
      nombre: valor("empleado-nombre"),
      apPaterno: textoONulo("empleado-ap-paterno"),
      apMaterno: textoONulo("empleado-ap-materno"),
      fNacimiento: textoONulo("empleado-nacimiento"),
      email: textoONulo("empleado-email"),
      celular: textoONulo("empleado-celular"),
      genero: textoONulo("empleado-genero"),
      direccion: textoONulo("empleado-direccion"),
    },
    idContrato: numeroONulo("empleado-contrato"),
    idCargo: numeroONulo("empleado-cargo"),
    salario: numeroONulo("empleado-salario"),
    turno: textoONulo("empleado-turno"),
    fondoPension: textoONulo("empleado-fondo-pension"),
    nHps: textoONulo("empleado-hps"),
    essalud: textoONulo("empleado-essalud"),
  };
}

function validar(payload) {
  const errores = [];
  if (!payload.persona.idTipoIdentidad) {
    errores.push("El tipo de documento es obligatorio.");
  }
  if (!payload.persona.nDocumento) {
    errores.push("El número de documento es obligatorio.");
  }
  if (!payload.persona.nombre) {
    errores.push("Los nombres son obligatorios.");
  }
  return errores;
}

async function guardarEmpleado() {
  limpiarError();
  const payload = armarPayload();
  const errores = validar(payload);
  if (errores.length) {
    mostrarError(errores.join(" "));
    return;
  }

  btnGuardar.disabled = true;
  try {
    if (!tieneCsrf()) {
      await yo();
    }
    await api("POST", "/api/empleados", payload);
    form.reset();
    bootstrap.Modal.getInstance(modal).hide();
    await listarEmpleados();
  } catch (err) {
    if (!irALogin(err)) {
      mostrarError(err.mensaje || "No se pudo guardar el empleado.");
    }
  } finally {
    btnGuardar.disabled = false;
  }
}

modal.addEventListener("show.bs.modal", () => {
  limpiarError();
  cargarCatalogos();
});
btnGuardar.addEventListener("click", guardarEmpleado);

listarEmpleados();
