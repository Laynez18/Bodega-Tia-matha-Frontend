import { api, tieneCsrf, yo } from "../login/login.js";

// ============ ESTADO ============
let clientes = [];
let metodosPago = [];
let productos = [];
let carrito = [];
let editandoId = null;

// ============ ELEMENTOS DEL DOM ============
const tblClientesBody = document.querySelector("#pane-clientes tbody");
const tblVentasBody = document.querySelector("#pane-ventas tbody");
const selectCliente = document.getElementById("venta-cliente");
const selectMetodoPago = document.getElementById("venta-metodo-pago");
const selectProducto = document.getElementById("venta-producto");
const inputCantidad = document.getElementById("venta-cantidad");
const btnAgregarProducto = document.getElementById("venta-agregar-producto");
const tblCarritoBody = document.querySelector("#venta-carrito tbody");
const lblSubtotal = document.getElementById("venta-subtotal");
const lblIGV = document.getElementById("venta-igv");
const lblTotal = document.getElementById("venta-total");
const btnGuardarVenta = document.getElementById("venta-guardar");
const btnNuevaVenta = document.getElementById("venta-nueva");
const alerta = document.getElementById("venta-alerta");

// ============ FUNCIONES AUXILIARES ============
function mostrarAlerta(msg) {
  if (alerta) {
    alerta.textContent = msg;
    alerta.classList.remove("d-none");
  }
}
function limpiarAlerta() {
  if (alerta) {
    alerta.textContent = "";
    alerta.classList.add("d-none");
  }
}
function irALogin(err) {
  if (err && err.status === 401) {
    window.location.href = "../login/login.html";
    return true;
  }
  return false;
}
function formatearMoneda(n) {
  return "S/ " + (n || 0).toFixed(2);
}
function calcularTotales() {
  const subtotal = carrito.reduce((s, d) => s + d.subtotal, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  if (lblSubtotal) lblSubtotal.textContent = formatearMoneda(subtotal);
  if (lblIGV) lblIGV.textContent = formatearMoneda(igv);
  if (lblTotal) lblTotal.textContent = formatearMoneda(total);
}

// ============ CARGA INICIAL ============
async function cargarDatosIniciales() {
  limpiarAlerta();
  try {
    const [cs, mp, ps] = await Promise.all([
      api("GET", "/api/clientes"),
      api("GET", "/api/metodos-pago") || [],
      api("GET", "/api/productos")
    ]);
    clientes = cs || [];
    metodosPago = mp || [];
    productos = ps || [];

    llenarSelect(selectCliente, clientes, c => c.id, c => c.nombrePersona + " (" + (c.nDocumento || "") + ")");
    llenarSelect(selectMetodoPago, metodosPago, c => c.id, c => c.nombre);
    llenarSelect(selectProducto, productos, c => c.id, c => c.nombre + " - S/ " + c.precioVenta);

    await listarVentas();
  } catch (err) {
    if (!irALogin(err)) mostrarAlerta(err.mensaje || "No se pudo cargar.");
  }
}

function llenarSelect(select, items, idFn, textoFn) {
  if (!select) return;
  const placeholder = select.querySelector('option[value=""]');
  select.innerHTML = "";
  if (placeholder) select.appendChild(placeholder);
  items.forEach(item => {
    const o = document.createElement("option");
    o.value = idFn(item);
    o.textContent = textoFn(item);
    select.appendChild(o);
  });
}

// ============ LISTAR VENTAS ============
async function listarVentas() {
  const tbody = tblVentasBody;
  if (!tbody) return;
  try {
    const ventas = (await api("GET", "/api/ventas")) || [];
    tbody.innerHTML = "";
    if (!ventas.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "text-center text-muted";
      td.textContent = "No hay ventas registradas.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    ventas.forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (v.id || "") + "</td>" +
        "<td>" + (v.nombreCliente || "") + "</td>" +
        "<td>" + (v.numeroDocumento || "") + "</td>" +
        "<td>" + (v.fVenta || "") + "</td>" +
        "<td>" + formatearMoneda(v.total) + "</td>" +
        "<td><span class='badge " + (v.estado === "COMPLETADA" ? "text-bg-success" : "text-bg-secondary") + "'>" + (v.estado || "") + "</span></td>" +
        "<td><button class='btn btn-sm btn-outline-primary' title='Ver'><i class='bi bi-eye'></i></button></td>";
      tbody.appendChild(tr);
    });
  } catch (err) {
    if (!irALogin(err)) {
      tbody.innerHTML = "<tr><td colspan='7' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

// ============ CARRITO ============
function renderCarrito() {
  if (!tblCarritoBody) return;
  tblCarritoBody.innerHTML = "";
  carrito.forEach((d, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + d.nombreProducto + "</td>" +
      "<td>" + d.cantidad + "</td>" +
      "<td>" + formatearMoneda(d.precioUnitario) + "</td>" +
      "<td>" + formatearMoneda(d.subtotal) + "</td>" +
      "<td><button class='btn btn-sm btn-outline-danger' data-idx='" + idx + "'>Quitar</button></td>";
    tblCarritoBody.appendChild(tr);
  });
  calcularTotales();
}

if (btnAgregarProducto) {
  btnAgregarProducto.addEventListener("click", () => {
    const idProd = selectProducto ? selectProducto.value : null;
    const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 0;
    if (!idProd || !cantidad || cantidad <= 0) {
      mostrarAlerta("Seleccione producto y cantidad válida.");
      return;
    }
    const producto = productos.find(p => String(p.id) === String(idProd));
    if (!producto) return;
    if (cantidad > producto.stock) {
      mostrarAlerta("Stock insuficiente (disponible: " + producto.stock + ").");
      return;
    }
    const existente = carrito.findIndex(d => String(d.idProducto) === String(idProd));
    if (existente >= 0) {
      carrito[existente].cantidad += cantidad;
      carrito[existente].subtotal = carrito[existente].cantidad * carrito[existente].precioUnitario;
    } else {
      carrito.push({
        idProducto: producto.id,
        nombreProducto: producto.nombre,
        cantidad: cantidad,
        precioUnitario: producto.precioVenta,
        subtotal: producto.precioVenta * cantidad
      });
    }
    inputCantidad.value = 1;
    renderCarrito();
  });
}

if (tblCarritoBody) {
  tblCarritoBody.addEventListener("click", e => {
    const btn = e.target.closest("button[data-idx]");
    if (!btn) return;
    carrito.splice(parseInt(btn.dataset.idx), 1);
    renderCarrito();
  });
}

// ============ GUARDAR VENTA ============
if (btnGuardarVenta) {
  btnGuardarVenta.addEventListener("click", async () => {
    limpiarAlerta();
    const idCliente = selectCliente ? selectCliente.value : null;
    const idMetodoPago = selectMetodoPago ? selectMetodoPago.value : null;
    const numeroDocumento = document.getElementById("venta-numero-documento") ? document.getElementById("venta-numero-documento").value : "";
    const estado = document.getElementById("venta-estado") ? document.getElementById("venta-estado").value : "COMPLETADA";

    if (!idCliente) { mostrarAlerta("Seleccione un cliente."); return; }
    if (!numeroDocumento) { mostrarAlerta("Ingrese el número de documento."); return; }
    if (!carrito.length) { mostrarAlerta("Agregue al menos un producto."); return; }

    const payload = {
      idCliente: Number(idCliente),
      numeroDocumento: numeroDocumento.trim(),
      fVenta: new Date().toISOString(),
      idMetodoPago: idMetodoPago ? Number(idMetodoPago) : null,
      estado: estado || "COMPLETADA",
      observacion: "",
      detalles: carrito.map(d => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    btnGuardarVenta.disabled = true;
    try {
      if (!tieneCsrf()) await yo();
      await api("POST", "/api/ventas", payload);
      carrito = [];
      renderCarrito();
      await listarVentas();
      limpiarAlerta();
    } catch (err) {
      if (!irALogin(err)) mostrarAlerta(err.mensaje || "No se pudo registrar la venta.");
    } finally {
      btnGuardarVenta.disabled = false;
    }
  });
}

if (btnNuevaVenta) {
  btnNuevaVenta.addEventListener("click", () => {
    carrito = [];
    renderCarrito();
    limpiarAlerta();
  });
}

// Inicializar
document.addEventListener("DOMContentLoaded", cargarDatosIniciales);
