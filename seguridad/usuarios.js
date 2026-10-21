import { api, tieneCsrf, yo } from "../login/login.js";

const modal = document.getElementById("modalNuevoUsuario");
const form = modal.querySelector("form");
const btnGuardar = modal.querySelector(".modal-footer .btn-primary");
const tbody = document.querySelector("#pane-usuarios tbody");
const selectTipo = document.getElementById("usuario-tipo");
const selectEmpleado = document.getElementById("usuario-empleado");
const contenedorRoles = document.getElementById("usuario-roles");

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

// Acepta texto o un objeto anidado ({ nRol: "..." }).
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

function nombreEmpleado(e) {
  const persona = e.persona || e;
  return (
    leer(e, ["nombreCompleto"]) ||
    [
      leer(persona, ["nombre"]),
      leer(persona, ["apPaterno"]),
      leer(persona, ["apMaterno"]),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

/* ---------- Listado ---------- */

function celda(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

function badge(texto, clase) {
  const span = document.createElement("span");
  span.className = "badge " + clase;
  span.textContent = texto;
  return span;
}

function filaUsuario(u, indice) {
  const idUsuario = leer(u, ["idUsuario", "id"]);
  const tr = document.createElement("tr");
  const estado = leer(u, ["estado"]);
  const activo = estado !== "0" && estado !== false;
  if (!activo) {
    tr.classList.add("text-muted", "opacity-75");
  }
  tr.appendChild(celda(leer(u, ["idUsuario", "id"]) ?? indice + 1));
  tr.appendChild(celda(aTexto(leer(u, ["logeo"]))));

  const empleado = leer(u, ["empleado"]);
  tr.appendChild(
    celda(
      leer(u, ["nombreEmpleado"]) ||
        (empleado && typeof empleado === "object"
          ? nombreEmpleado(empleado)
          : aTexto(empleado)),
    ),
  );

  const tdRoles = document.createElement("td");
  (leer(u, ["roles"]) || []).forEach((rol) => {
    tdRoles.appendChild(badge(aTexto(rol), "text-bg-info me-1"));
  });
  tr.appendChild(tdRoles);

  const tdEstado = document.createElement("td");
  tdEstado.appendChild(
    badge(
      activo ? "Activo" : "Inactivo",
      activo ? "text-bg-success" : "text-bg-secondary",
    ),
  );
  tr.appendChild(tdEstado);

  const fecha = leer(u, ["fecCre"]);
  tr.appendChild(
    celda(fecha ? new Date(fecha).toLocaleDateString("es-PE") : ""),
  );

  const tdAcciones = document.createElement("td");
  tdAcciones.innerHTML =
    '<div class="d-flex gap-1">' +
    (activo
      ? '<button class="btn btn-sm btn-outline-primary" title="Editar" data-accion="editar"><i class="bi bi-pencil"></i></button>' +
        '<button class="btn btn-sm btn-outline-primary" title="Desactivar" data-accion="desactivar"><i class="bi bi-toggle-on"></i></button>'
      : '<button class="btn btn-sm btn-outline-secondary" title="Desactivado" disabled><i class="bi bi-toggle-off opacity-50"></i></button>') +
    "</div>";
  tdAcciones.querySelectorAll("button").forEach((b) => {
    b.dataset.id = idUsuario;
  });
  tr.appendChild(tdAcciones);
  return tr;
}

function filaMensaje(texto) {
  const tr = document.createElement("tr");
  const td = celda(texto);
  td.colSpan = 7;
  td.className = "text-center text-muted";
  tr.appendChild(td);
  return tr;
}

let usuarios = [];
let editando = null;
// El backend deja de listar los desactivados; se conservan hasta recargar la página.
const desactivados = [];

async function listarUsuarios() {
  try {
    usuarios = (await api("GET", "/api/usuarios")) || [];
    const idDe = (x) => leer(x, ["idUsuario", "id"]);
    const vigentes = new Set(usuarios.map(idDe));
    const visibles = [
      ...usuarios,
      ...desactivados.filter((d) => !vigentes.has(idDe(d))),
    ].sort((a, b) => idDe(a) - idDe(b));
    if (!visibles.length) {
      tbody.replaceChildren(filaMensaje("No hay usuarios registrados."));
      return;
    }
    tbody.replaceChildren(...visibles.map(filaUsuario));
  } catch (err) {
    if (!irALogin(err)) {
      tbody.replaceChildren(filaMensaje(err.mensaje || "No se pudo cargar."));
    }
  }
}

/* ---------- Catálogos del modal ---------- */

function llenarSelect(select, items, claveId, textoDe) {
  const placeholder = select.querySelector('option[value=""]');
  select.replaceChildren(placeholder);
  items.forEach((item) => {
    const opcion = document.createElement("option");
    opcion.value = leer(item, claveId);
    opcion.textContent = textoDe(item);
    select.appendChild(opcion);
  });
}

function llenarRoles(roles) {
  contenedorRoles.replaceChildren(
    ...roles.map((rol) => {
      const id = leer(rol, ["idRol", "id"]);
      const div = document.createElement("div");
      div.className = "form-check form-switch";

      const input = document.createElement("input");
      input.className = "form-check-input";
      input.type = "checkbox";
      input.role = "switch";
      input.id = "usuario-rol-" + id;
      input.value = id;

      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = input.id;
      label.textContent = aTexto(leer(rol, ["nRol", "nombre"]));

      div.append(input, label);
      return div;
    }),
  );
}

// Solo se ofrecen empleados que todavía no tienen usuario (salvo el del usuario editado).
function idsEmpleadosConUsuario() {
  return new Set(
    usuarios
      .filter((u) => u !== editando)
      .map((u) => leer(u, ["idEmpleado"]) ?? leer(u.empleado, ["idEmpleado"]))
      .filter((id) => id !== undefined),
  );
}

async function cargarCatalogos() {
  try {
    const [tipos, roles, empleados] = await Promise.all([
      api("GET", "/api/usuarios/tipos"),
      api("GET", "/api/usuarios/roles"),
      api("GET", "/api/empleados"),
    ]);
    llenarSelect(selectTipo, tipos || [], ["idTipoUsuario", "id"], (t) =>
      aTexto(leer(t, ["nTipoUsuario", "nombre"])),
    );
    llenarRoles(roles || []);
    const ocupados = idsEmpleadosConUsuario();
    llenarSelect(
      selectEmpleado,
      (empleados || []).filter(
        (e) => !ocupados.has(leer(e, ["idEmpleado", "id"])),
      ),
      ["idEmpleado", "id"],
      nombreEmpleado,
    );
    return true;
  } catch (err) {
    if (!irALogin(err)) {
      mostrarError(err.mensaje || "No se pudieron cargar los catálogos.");
    }
    return false;
  }
}

/* ---------- Alta ---------- */

function armarPayload() {
  const empleado = selectEmpleado.value;
  return {
    idTipoUsuario: Number(selectTipo.value),
    idEmpleado: empleado === "" ? null : Number(empleado),
    logeo: document.getElementById("usuario-logeo").value.trim(),
    clave: document.getElementById("usuario-clave").value,
    idsRol: Array.from(
      contenedorRoles.querySelectorAll("input:checked"),
      (input) => Number(input.value),
    ),
  };
}

function validar(payload, clave2) {
  const errores = [];
  if (!payload.logeo) {
    errores.push("El usuario es obligatorio.");
  }
  if (!selectTipo.value) {
    errores.push("El tipo de usuario es obligatorio.");
  }
  if (editando && !payload.clave) {
    // Se mantiene la contraseña actual.
  } else if (payload.clave.length < 8 || payload.clave.length > 100) {
    errores.push("La contraseña debe tener entre 8 y 100 caracteres.");
  } else if (payload.clave !== clave2) {
    errores.push("Las contraseñas no coinciden.");
  }
  return errores;
}

async function guardarUsuario() {
  limpiarError();
  const payload = armarPayload();
  const clave2 = document.getElementById("usuario-clave2").value;
  const errores = validar(payload, clave2);
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
      if (!payload.clave) {
        delete payload.clave;
      }
      await api(
        "PUT",
        "/api/usuarios/" + leer(editando, ["idUsuario", "id"]),
        payload,
      );
    } else {
      await api("POST", "/api/usuarios", payload);
    }
    form.reset();
    bootstrap.Modal.getInstance(modal).hide();
    await listarUsuarios();
  } catch (err) {
    if (!irALogin(err)) {
      mostrarError(err.mensaje || "No se pudo guardar el usuario.");
    }
  } finally {
    btnGuardar.disabled = false;
  }
}

const titulo = document.getElementById("modalNuevoUsuarioLabel");
const inputClave = document.getElementById("usuario-clave");
const inputClave2 = document.getElementById("usuario-clave2");

function prepararModo() {
  const edicion = editando !== null;
  titulo.textContent = edicion ? "Editar Usuario" : "Nuevo Usuario";
  inputClave.required = !edicion;
  inputClave2.required = !edicion;
  inputClave.placeholder = edicion
    ? "Dejar vacío para mantener la actual"
    : "Crear contraseña";
}

function cargarDatosEdicion() {
  document.getElementById("usuario-logeo").value =
    leer(editando, ["logeo"]) || "";
  selectTipo.value = leer(editando, ["idTipoUsuario"]) ?? "";
  selectEmpleado.value = leer(editando, ["idEmpleado"]) ?? "";
  const ids = new Set(
    (leer(editando, ["roles"]) || []).map((r) =>
      Number(leer(r, ["idRol", "id"])),
    ),
  );
  contenedorRoles.querySelectorAll("input").forEach((input) => {
    input.checked = ids.has(Number(input.value));
  });
}

modal.addEventListener("show.bs.modal", async () => {
  limpiarError();
  prepararModo();
  const ok = await cargarCatalogos();
  if (ok && editando) {
    // El empleado actual puede no estar en la lista filtrada.
    const idEmp = leer(editando, ["idEmpleado"]);
    if (
      idEmp != null &&
      !selectEmpleado.querySelector(`option[value="${idEmp}"]`)
    ) {
      const op = document.createElement("option");
      op.value = idEmp;
      op.textContent =
        leer(editando, ["nombreEmpleado"]) || "Empleado " + idEmp;
      selectEmpleado.appendChild(op);
    }
    cargarDatosEdicion();
  }
});

modal.addEventListener("hidden.bs.modal", () => {
  editando = null;
  form.reset();
});

btnGuardar.addEventListener("click", guardarUsuario);

async function desactivarUsuario(u) {
  const nombre = leer(u, ["logeo"]);
  if (!window.confirm(`¿Desactivar al usuario "${nombre}"?`)) {
    return;
  }
  try {
    if (!tieneCsrf()) {
      await yo();
    }
    await api("DELETE", "/api/usuarios/" + leer(u, ["idUsuario", "id"]));
    desactivados.push({ ...u, estado: false });
    await listarUsuarios();
  } catch (err) {
    if (!irALogin(err)) {
      window.alert(err.mensaje || "No se pudo desactivar el usuario.");
    }
  }
}

tbody.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) {
    return;
  }
  const u = usuarios.find(
    (x) => String(leer(x, ["idUsuario", "id"])) === boton.dataset.id,
  );
  if (!u) {
    return;
  }
  if (boton.dataset.accion === "editar") {
    editando = u;
    bootstrap.Modal.getOrCreateInstance(modal).show();
  } else {
    desactivarUsuario(u);
  }
});

listarUsuarios();
