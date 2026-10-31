import { api, tieneCsrf, yo } from "../login/login.js";

const modal = document.getElementById("modalNuevoEmpleado");
const form = modal.querySelector("form");
const btnGuardar = modal.querySelector(".modal-footer .btn-primary");
const btnConstatarDni = document.getElementById("btnConstatarDni");
const tbody = document.getElementById("tbody-empleados");
const titulo = document.getElementById("modalNuevoEmpleadoLabel");

const CATALOGOS = [
  { ruta: "/api/tipos-identidad", select: "empleado-tipo-doc", id: ["idTipoIdentidad", "id"], texto: ["nTipoIdentidad", "nombre"] },
  { ruta: "/api/cargos", select: "empleado-cargo", id: ["idCargo", "id"], texto: ["nCargo", "nombre"] },
  { ruta: "/api/contratos", select: "empleado-contrato", id: ["idContrato", "id"], texto: ["nContrato", "nombre"] },
];

const alerta = document.createElement("div");
alerta.className = "alert alert-danger d-none";
form.prepend(alerta);

function leer(obj, claves) {
  if (!obj) return undefined;
  const clave = claves.find((c) => obj[c] !== undefined && obj[c] !== null);
  return clave === undefined ? undefined : obj[clave];
}

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
  if (err.status === 401) { window.location.href = "../login/login.html"; return true; }
  return false;
}

function llenarSelect(select, items, catalogo) {
  const placeholder = select.querySelector('option[value=""]');
  select.replaceChildren(placeholder);
  let tieneOpciones = false;
  items.forEach((item) => {
    const opcion = document.createElement("option");
    opcion.value = leer(item, catalogo.id);
    opcion.textContent = aTexto(leer(item, catalogo.texto));
    select.appendChild(opcion);
    tieneOpciones = true;
  });
  // Fallback por defecto si el backend no devolvió opciones
  if (!tieneOpciones) {
    if (catalogo.select === "empleado-tipo-doc") {
      [{ id: 1, texto: "DNI" }, { id: 2, texto: "Carnet de Extranjería" }, { id: 3, texto: "Pasaporte" }].forEach((o) => {
        const opcion = document.createElement("option");
        opcion.value = o.id;
        opcion.textContent = o.texto;
        select.appendChild(opcion);
      });
    } else if (catalogo.select === "empleado-distrito") {
      ["ICA", "PARCONA", "LA TINGUINA", "SUBTANJALLA", "PUEBLO NUEVO"].forEach((nombre, i) => {
        const opcion = document.createElement("option");
        opcion.value = i + 1;
        opcion.textContent = nombre;
        select.appendChild(opcion);
      });
    } else if (catalogo.select === "empleado-cargo") {
      ["ADMINISTRADOR", "CAJERO", "ALMACENERO"].forEach((nombre, i) => {
        const opcion = document.createElement("option");
        opcion.value = i + 1;
        opcion.textContent = nombre;
        select.appendChild(opcion);
      });
    } else if (catalogo.select === "empleado-contrato") {
      ["PLAZO FIJO", "PLAZO INDETERMINADO", "POR HORAS"].forEach((nombre, i) => {
        const opcion = document.createElement("option");
        opcion.value = i + 1;
        opcion.textContent = nombre;
        select.appendChild(opcion);
      });
    }
  }
}

async function cargarCatalogo(catalogo) {
  const select = document.getElementById(catalogo.select);
  try {
    const items = await api("GET", catalogo.ruta);
    llenarSelect(select, items || [], catalogo);
    return true;
  } catch (err) {
    if (!irALogin(err)) console.error("No se pudo cargar " + catalogo.ruta, err.mensaje);
    return false;
  }
}

let catalogosCargados = false;
let editando = null;

async function cargarCatalogos() {
  if (catalogosCargados) return;
  const resultados = await Promise.all(CATALOGOS.map(cargarCatalogo));
  catalogosCargados = resultados.every(Boolean);
}

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
    [leer(persona, ["nombre"]), leer(persona, ["apPaterno"]), leer(persona, ["apMaterno"])].filter(Boolean).join(" ");

  const idEmp = leer(e, ["idEmpleado", "id"]);
  const activo = leer(e, ["estado"]) !== "0";

  tr.appendChild(celda(idEmp ?? indice + 1));
  tr.appendChild(celda(aTexto(leer(persona, ["nDocumento"]))));
  tr.appendChild(celda(nombre));
  tr.appendChild(celda(aTexto(leer(e, ["cargo", "nCargo"]))));
  tr.appendChild(celda(aTexto(leer(e, ["turno"]))));
  tr.appendChild(celda(aTexto(leer(persona, ["celular"]))));

  const tdEstado = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "badge " + (activo ? "text-bg-success" : "text-bg-secondary");
  badge.textContent = activo ? "Activo" : "Inactivo";
  tdEstado.appendChild(badge);
  tr.appendChild(tdEstado);

  const tdAcciones = document.createElement("td");
  tdAcciones.innerHTML =
    '<div class="d-flex gap-1">' +
    '<button class="btn btn-outline-primary btn-sm" data-accion="editar" data-id="' + idEmp + '"><i class="bi bi-pencil"></i></button>' +
    (activo
      ? '<button class="btn btn-outline-primary btn-sm" data-accion="desactivar" data-id="' + idEmp + '" title="Desactivar"><i class="bi bi-toggle-on"></i></button>'
      : '<button class="btn btn-outline-secondary btn-sm" data-accion="activar" data-id="' + idEmp + '" title="Activar" disabled><i class="bi bi-toggle-off opacity-50"></i></button>') +
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
    if (!irALogin(err)) tbody.replaceChildren(filaMensaje(err.mensaje || "No se pudo cargar."));
  }
}

function valor(id) { return document.getElementById(id).value.trim(); }
function textoONulo(id) { return valor(id) || null; }
function numeroONulo(id) { const v = valor(id); return v === "" ? null : Number(v); }

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
  if (!payload.persona.idTipoIdentidad) errores.push("El tipo de documento es obligatorio.");
  if (!payload.persona.nDocumento) errores.push("El número de documento es obligatorio.");
  if (!payload.persona.nombre) errores.push("Los nombres son obligatorios.");
  return errores;
}

async function guardarEmpleado() {
  limpiarError();
  const payload = armarPayload();
  const errores = validar(payload);
  if (errores.length) { mostrarError(errores.join(" ")); return; }

  btnGuardar.disabled = true;
  try {
    if (!tieneCsrf()) await yo();
    if (editando) {
      await api("PUT", "/api/empleados/" + editando, payload);
    } else {
      await api("POST", "/api/empleados", payload);
    }
    form.reset();
    bootstrap.Modal.getInstance(modal).hide();
    editando = null;
    await listarEmpleados();
  } catch (err) {
    if (!irALogin(err)) mostrarError(err.mensaje || "No se pudo guardar el empleado.");
  } finally {
    btnGuardar.disabled = false;
  }
}

async function desactivarEmpleado(idEmp) {
  if (!window.confirm("¿Desactivar al empleado #" + idEmp + "?")) return;
  try {
    if (!tieneCsrf()) await yo();
    await api("DELETE", "/api/empleados/" + idEmp);
    await listarEmpleados();
  } catch (err) {
    if (!irALogin(err)) alert(err.mensaje || "No se pudo desactivar el empleado.");
  }
}

function cargarDatosEdicion(emp) {
  const persona = emp.persona || emp;
  document.getElementById("empleado-tipo-doc").value = leer(persona, ["idTipoIdentidad"]) ?? "";
  document.getElementById("empleado-documento").value = aTexto(leer(persona, ["nDocumento"]));
  document.getElementById("empleado-nombre").value = aTexto(leer(persona, ["nombre"]));
  document.getElementById("empleado-ap-paterno").value = aTexto(leer(persona, ["apPaterno"]));
  document.getElementById("empleado-ap-materno").value = aTexto(leer(persona, ["apMaterno"]));
  document.getElementById("empleado-nacimiento").value = leer(persona, ["fNacimiento"]) || "";
  document.getElementById("empleado-genero").value = leer(persona, ["genero"]) || "";
  document.getElementById("empleado-celular").value = aTexto(leer(persona, ["celular"]));
  document.getElementById("empleado-email").value = aTexto(leer(persona, ["email"]));
  document.getElementById("empleado-direccion").value = aTexto(leer(persona, ["direccion"]));
  document.getElementById("empleado-distrito").value = leer(persona, ["idDistrito"]) ?? "";
  document.getElementById("empleado-cargo").value = leer(emp, ["idCargo"]) ?? "";
  document.getElementById("empleado-contrato").value = leer(emp, ["idContrato"]) ?? "";
  document.getElementById("empleado-turno").value = aTexto(leer(emp, ["turno"]));
  document.getElementById("empleado-salario").value = leer(emp, ["salario"]) || "";
  document.getElementById("empleado-fondo-pension").value = aTexto(leer(emp, ["fondoPension"]));
  document.getElementById("empleado-hps").value = aTexto(leer(emp, ["nHps"]));
  document.getElementById("empleado-essalud").value = aTexto(leer(emp, ["essalud"]));
}

modal.addEventListener("show.bs.modal", () => {
  limpiarError();
  cargarCatalogos();
  if (editando) {
    titulo.textContent = "Editar Empleado";
    api("GET", "/api/empleados/" + editando).then(emp => {
      cargarDatosEdicion(emp);
    }).catch(err => {
      if (!irALogin(err)) mostrarError(err.mensaje || "No se pudo cargar el empleado.");
    });
  } else {
    titulo.textContent = "Nuevo Empleado";
    form.reset();
  }
});

modal.addEventListener("hidden.bs.modal", () => {
  editando = null;
  form.reset();
  limpiarError();
  titulo.textContent = "Nuevo Empleado";
});

btnGuardar.addEventListener("click", guardarEmpleado);

tbody.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = boton.dataset.id;
  if (boton.dataset.accion === "editar") {
    editando = id;
    bootstrap.Modal.getOrCreateInstance(modal).show();
  } else if (boton.dataset.accion === "desactivar") {
    desactivarEmpleado(id);
  }
});

function convertirFecha(fecha) {
  if (!fecha) return "";
  const partes = fecha.split("/");
  if (partes.length === 3) {
    return partes[2] + "-" + partes[1] + "-" + partes[0];
  }
  return fecha;
}

async function constatarDni() {
  const dni = document.getElementById("empleado-documento").value.trim();
  if (!dni) { mostrarError("Ingrese un DNI para constatar."); return; }
  try {
    const data = await api("GET", "/api/personas/consultar-dni/" + encodeURIComponent(dni));
    if (!data || !data.success || !data.datos) throw new Error(data && data.mensaje ? data.mensaje : "No se encontraron datos para ese DNI.");
    const d = data.datos;
    document.getElementById("empleado-nombre").value = d.nombre || "";
    document.getElementById("empleado-ap-paterno").value = d.apellidoPaterno || "";
    document.getElementById("empleado-ap-materno").value = d.apellidoMaterno || "";
    limpiarError();
  } catch (err) {
    mostrarError(err.mensaje || "No se pudo constatar el DNI.");
  }
}

btnConstatarDni.addEventListener("click", constatarDni);

listarEmpleados();
