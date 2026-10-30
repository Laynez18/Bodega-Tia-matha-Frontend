import { api } from "../login/login.js";

const badgeRegistros = document.getElementById("badgeRegistros");
let totalRegistros = 0;

function fm(n) { return "S/ " + (n || 0).toFixed(2); }

function irALoginLocalLocal(err) {
  if (err && err.status === 401) { window.location.href = "../login/login.html"; return true; }
  return false;
}

function celdaTexto(texto) {
  const td = document.createElement("td");
  td.textContent = texto === null || texto === undefined ? "" : texto;
  return td;
}

function filaVacia(tablaId, columnas, mensaje) {
  const tbody = document.querySelector("#" + tablaId + " tbody");
  if (!tbody) return;
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = columnas;
  td.className = "text-center text-muted";
  td.textContent = mensaje;
  tr.appendChild(td);
  tbody.innerHTML = "";
  tbody.appendChild(tr);
}

function obtenerFechas() {
  const desde = document.getElementById("reporte-desde").value;
  const hasta = document.getElementById("reporte-hasta").value;
  return { desde, hasta };
}

function actualizarBadge(n) {
  totalRegistros = n;
  if (badgeRegistros) badgeRegistros.textContent = n + " registros";
}

/* ============ RESUMEN GENERAL ============ */
async function cargarResumen() {
  try {
    const [ventas, compras] = await Promise.all([
      api("GET", "/api/ventas").catch(() => []),
      api("GET", "/api/compras").catch(() => [])
    ]);

    const listaVentas = ventas || [];
    const listaCompras = compras || [];

    const totalVentas = listaVentas.reduce((s, v) => s + Number(v.total || 0), 0);
    const totalCompras = listaCompras.reduce((s, c) => s + Number(c.total || 0), 0);

    document.getElementById("resumen-total-ventas").textContent = fm(totalVentas);
    document.getElementById("resumen-cantidad-ventas").textContent = listaVentas.length;
    document.getElementById("resumen-total-compras").textContent = fm(totalCompras);

    // Créditos pendientes: ventas con saldo > 0
    const creditos = listaVentas.filter(v => Number(v.saldo || 0) > 0);
    const totalCreditos = creditos.reduce((s, c) => s + Number(c.saldo || 0), 0);
    document.getElementById("resumen-total-creditos").textContent = fm(totalCreditos);

    // Tabla ventas recientes
    const tbody = document.getElementById("tbody-resumen-ventas");
    tbody.innerHTML = "";
    listaVentas.slice(0, 5).forEach((v, i) => {
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(v.fVenta || ""));
      tr.appendChild(celdaTexto(v.numeroDocumento || ""));
      tr.appendChild(celdaTexto(v.nombreCliente || ""));
      tr.appendChild(celdaTexto(fm(v.total)));
      tbody.appendChild(tr);
    });

    // Tabla caja reciente
    const tbodyCaja = document.getElementById("tbody-resumen-caja");
    tbodyCaja.innerHTML = "";
    try {
      const aperturas = await api("GET", "/api/aperturas-caja").catch(() => []);
      (aperturas || []).slice(0, 5).forEach((a, i) => {
        const tr = document.createElement("tr");
        tr.appendChild(celdaTexto(i + 1));
        tr.appendChild(celdaTexto(a.fApertura || ""));
        tr.appendChild(celdaTexto(a.fCierre || "-"));
        tr.appendChild(celdaTexto(a.nombreUsuario || ""));
        tr.appendChild(celdaTexto("Apertura"));
        tr.appendChild(celdaTexto(fm(a.montoInicial)));
        tbodyCaja.appendChild(tr);
      });
    } catch (e) {
      tbodyCaja.innerHTML = "<tr><td colspan='6' class='text-center text-muted'>Sin datos de caja.</td></tr>";
    }

    actualizarBadge(listaVentas.length + listaCompras.length);
  } catch (err) {
    if (!irALoginLocal(err)) console.error("Error cargando resumen:", err);
  }
}

/* ============ VENTAS ============ */
async function cargarVentas() {
  const tbody = document.getElementById("tbody-ventas");
  if (!tbody) return;
  try {
    const ventas = (await api("GET", "/api/ventas")) || [];
    tbody.innerHTML = "";
    if (!ventas.length) { filaVacia("ventas", 8, "No hay ventas registradas."); actualizarBadge(0); return; }
    ventas.forEach((v, i) => {
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(v.fVenta || ""));
      tr.appendChild(celdaTexto(v.numeroDocumento || ""));
      tr.appendChild(celdaTexto(v.nombreCliente || ""));
      tr.appendChild(celdaTexto(fm(v.total)));
      tr.appendChild(celdaTexto(v.metodoPago || "-"));
      tr.appendChild(celdaTexto(v.estado || ""));
      tr.appendChild(celdaTexto(v.nombreUsuario || "-"));
      tbody.appendChild(tr);
    });
    actualizarBadge(ventas.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

/* ============ COMPRAS ============ */
async function cargarCompras() {
  const tbody = document.getElementById("tbody-compras");
  if (!tbody) return;
  try {
    const compras = (await api("GET", "/api/compras")) || [];
    tbody.innerHTML = "";
    if (!compras.length) { filaVacia("compras", 7, "No hay compras registradas."); actualizarBadge(0); return; }
    compras.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(c.fCompra || ""));
      tr.appendChild(celdaTexto(c.numeroDocumento || ""));
      tr.appendChild(celdaTexto(c.nombreProveedor || ""));
      tr.appendChild(celdaTexto(fm(c.total)));
      tr.appendChild(celdaTexto(c.estado || ""));
      tr.appendChild(celdaTexto(c.nombreUsuario || "-"));
      tbody.appendChild(tr);
    });
    actualizarBadge(compras.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='7' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

/* ============ CAJA ============ */
async function cargarCaja() {
  const tbody = document.getElementById("tbody-caja");
  if (!tbody) return;
  try {
    const aperturas = (await api("GET", "/api/aperturas-caja")) || [];
    tbody.innerHTML = "";
    if (!aperturas.length) { filaVacia("caja", 6, "No hay aperturas de caja registradas."); actualizarBadge(0); return; }
    aperturas.forEach((a, i) => {
      const abierta = a.situacion !== "C" && a.situacion !== "0";
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(a.fApertura || ""));
      tr.appendChild(celdaTexto(a.fCierre || "-"));
      tr.appendChild(celdaTexto(a.nombreUsuario || ""));
      tr.appendChild(celdaTexto(fm(a.montoInicial)));
      tr.appendChild(celdaTexto(abierta ? "Abierta" : "Cerrada"));
      tbody.appendChild(tr);
    });
    actualizarBadge(aperturas.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='6' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

/* ============ CRÉDITOS ============ */
async function cargarCreditos() {
  const tbody = document.getElementById("tbody-creditos");
  if (!tbody) return;
  try {
    const ventas = (await api("GET", "/api/ventas")) || [];
    const creditos = ventas.filter(v => Number(v.saldo || 0) > 0);
    tbody.innerHTML = "";
    if (!creditos.length) { filaVacia("creditos", 7, "No hay créditos pendientes."); actualizarBadge(0); return; }
    creditos.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(c.fVenta || ""));
      tr.appendChild(celdaTexto(c.nombreCliente || ""));
      tr.appendChild(celdaTexto("Venta #" + (c.id || "")));
      tr.appendChild(celdaTexto(fm(c.total)));
      tr.appendChild(celdaTexto(fm(c.saldo)));
      tr.appendChild(celdaTexto("Pendiente"));
      tbody.appendChild(tr);
    });
    actualizarBadge(creditos.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='7' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

/* ============ INVENTARIO ============ */
async function cargarStock() {
  const tbody = document.getElementById("tbody-stock");
  if (!tbody) return;
  try {
    const productos = (await api("GET", "/api/productos")) || [];
    tbody.innerHTML = "";
    if (!productos.length) { filaVacia("stock", 6, "No hay productos registrados."); actualizarBadge(0); return; }
    productos.forEach((p, i) => {
      const bajoStock = Number(p.stock || 0) <= Number(p.stockMinimo || 0);
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(p.codigoBarras || ""));
      tr.appendChild(celdaTexto(p.nombre || ""));
      tr.appendChild(celdaTexto(p.stock || 0));
      tr.appendChild(celdaTexto(p.stockMinimo || 0));
      const tdEstado = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "badge " + (bajoStock ? "text-bg-danger" : "text-bg-success");
      badge.textContent = bajoStock ? "Bajo stock" : "Óptimo";
      tdEstado.appendChild(badge);
      tr.appendChild(tdEstado);
      tbody.appendChild(tr);
    });
    actualizarBadge(productos.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='6' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

async function cargarKardex() {
  const tbody = document.getElementById("tbody-kardex");
  if (!tbody) return;
  try {
    const movimientos = (await api("GET", "/api/movimientos-inventario")) || [];
    tbody.innerHTML = "";
    if (!movimientos.length) { filaVacia("kardex", 7, "No hay movimientos de inventario."); actualizarBadge(0); return; }
    movimientos.forEach((m, i) => {
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(m.fMovimiento || ""));
      tr.appendChild(celdaTexto(m.nombreProducto || ""));
      tr.appendChild(celdaTexto(m.nombreTipoMovimientoInv || ""));
      tr.appendChild(celdaTexto(m.cantidad > 0 ? m.cantidad : "-"));
      tr.appendChild(celdaTexto(m.cantidad < 0 ? Math.abs(m.cantidad) : "-"));
      tr.appendChild(celdaTexto(m.stockNuevo || 0));
      tbody.appendChild(tr);
    });
    actualizarBadge(movimientos.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='7' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

/* ============ EMPLEADOS ============ */
async function cargarEmpleados() {
  const tbody = document.getElementById("tbody-empleados");
  if (!tbody) return;
  try {
    const empleados = (await api("GET", "/api/empleados")) || [];
    tbody.innerHTML = "";
    if (!empleados.length) { filaVacia("empleados", 7, "No hay empleados registrados."); actualizarBadge(0); return; }
    empleados.forEach((e, i) => {
      const persona = e.persona || e;
      const nombre = e.nombreCompleto || [leer(persona, ["nombre"]), leer(persona, ["apPaterno"]), leer(persona, ["apMaterno"])].filter(Boolean).join(" ");
      const activo = e.estado !== "0";
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(leer(persona, ["nDocumento"]) || ""));
      tr.appendChild(celdaTexto(nombre));
      tr.appendChild(celdaTexto(leer(e, ["cargo", "nCargo"]) || ""));
      tr.appendChild(celdaTexto(e.turno || ""));
      tr.appendChild(celdaTexto(leer(persona, ["celular"]) || ""));
      tr.appendChild(celdaTexto(activo ? "Activo" : "Inactivo"));
      tbody.appendChild(tr);
    });
    actualizarBadge(empleados.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='7' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

function leer(obj, claves) {
  if (!obj) return undefined;
  const clave = claves.find((c) => obj[c] !== undefined && obj[c] !== null);
  return clave === undefined ? undefined : obj[clave];
}

/* ============ AUDITORÍA ============ */
async function cargarAuditoria() {
  const tbody = document.getElementById("tbody-auditoria");
  if (!tbody) return;
  try {
    // No hay endpoint de auditoría expuesto en el backend aún; usamos usuarios como referencia o datos vacíos
    const usuarios = (await api("GET", "/api/usuarios")) || [];
    tbody.innerHTML = "";
    if (!usuarios.length) {
      tbody.innerHTML = "<tr><td colspan='7' class='text-center text-muted'>No hay registros de auditoría disponibles.</td></tr>";
      actualizarBadge(0);
      return;
    }
    usuarios.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.appendChild(celdaTexto(i + 1));
      tr.appendChild(celdaTexto(leer(u, ["fecCre"]) || ""));
      tr.appendChild(celdaTexto(leer(u, ["logeo"]) || ""));
      tr.appendChild(celdaTexto("Seguridad"));
      tr.appendChild(celdaTexto("Registro"));
      tr.appendChild(celdaTexto("Usuario " + (leer(u, ["logeo"]) || "") + " creado en el sistema."));
      tr.appendChild(celdaTexto("127.0.0.1"));
      tbody.appendChild(tr);
    });
    actualizarBadge(usuarios.length);
  } catch (err) {
    if (!irALoginLocal(err)) {
      tbody.innerHTML = "<tr><td colspan='7' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

/* ============ EXPORTAR ============ */
function prepararExportar() {
  document.querySelectorAll("button[id^='btnExportar']").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("Exportación de este reporte por implementar (CSV/PDF).");
    });
  });
}

/* ============ NAVEGACIÓN DE PESTAÑAS ============ */
const tabReportes = document.getElementById("tabReportes");
const mapCarga = {
  tab-resumen: cargarResumen,
  tab-ventas: cargarVentas,
  tab-compras: cargarCompras,
  tab-caja: cargarCaja,
  tab-creditos: cargarCreditos,
  tab-inventario: () => { cargarStock(); cargarKardex(); },
  tab-empleados: cargarEmpleados,
  tab-auditoria: cargarAuditoria
};

tabReportes.addEventListener("shown.bs.tab", (e) => {
  const targetId = e.target.getAttribute("data-bs-target").replace("#", "");
  const btnId = e.target.id;
  const fn = mapCarga[btnId];
  if (fn) fn();
});

// Cargar la pestaña activa al iniciar
const btnActivo = tabReportes.querySelector(".nav-link.active");
if (btnActivo && mapCarga[btnActivo.id]) {
  mapCarga[btnActivo.id]();
}

prepararExportar();
