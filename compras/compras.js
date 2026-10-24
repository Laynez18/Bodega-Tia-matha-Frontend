import { api, tieneCsrf, yo } from "../login/login.js";

let proveedores = [];
let productos = [];
let metodosPago = [];
let carrito = [];

const selectProveedor = document.getElementById("compra-proveedor");
const selectProducto = document.getElementById("compra-producto");
const selectMetodoPago = document.getElementById("compra-metodo-pago");
const inputCantidad = document.getElementById("compra-cantidad");
const inputCosto = document.getElementById("compra-costo");
const btnAgregar = document.getElementById("compra-agregar-producto");
const tblCarrito = document.querySelector("#compra-carrito tbody");
const lblSubtotal = document.getElementById("compra-subtotal");
const lblIGV = document.getElementById("compra-igv");
const lblTotal = document.getElementById("compra-total");
const btnGuardar = document.getElementById("compra-guardar");
const btnNueva = document.getElementById("compra-nueva");
const alerta = document.getElementById("compra-alerta");

function mostrarAlerta(msg) {
  if (alerta) { alerta.textContent = msg; alerta.classList.remove("d-none"); }
}
function limpiarAlerta() {
  if (alerta) { alerta.textContent = ""; alerta.classList.add("d-none"); }
}
function irALogin(err) {
  if (err && err.status === 401) { window.location.href = "../login/login.html"; return true; }
  return false;
}
function fm(n) { return "S/ " + (n || 0).toFixed(2); }

async function cargarInicial() {
  limpiarAlerta();
  try {
    const [prov, prod, mp] = await Promise.all([
      api("GET", "/api/proveedores"),
      api("GET", "/api/productos"),
      api("GET", "/api/metodos-pago")
    ]);
    proveedores = prov || [];
    productos = prod || [];
    metodosPago = mp || [];
    llenarSelect(selectProveedor, proveedores, p => p.id, p => p.nombrePersona + " (" + (p.nDocumento || "") + ")");
    llenarSelect(selectProducto, productos, p => p.id, p => p.nombre + " - S/ " + (p.precioVenta || 0));
    llenarSelect(selectMetodoPago, metodosPago, p => p.id, p => p.nombre);
    await listarCompras();
  } catch (err) {
    if (!irALogin(err)) mostrarAlerta(err.mensaje || "No se pudo cargar.");
  }
}

function llenarSelect(select, items, idFn, textoFn) {
  if (!select) return;
  const ph = select.querySelector('option[value=""]');
  select.innerHTML = "";
  if (ph) select.appendChild(ph);
  items.forEach(it => {
    const o = document.createElement("option");
    o.value = idFn(it);
    o.textContent = textoFn(it);
    select.appendChild(o);
  });
}

async function listarCompras() {
  const tbody = document.querySelector("#pane-compras-listado tbody");
  if (!tbody) return;
  try {
    const compras = (await api("GET", "/api/compras")) || [];
    tbody.innerHTML = "";
    if (!compras.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 8;
      td.className = "text-center text-muted";
      td.textContent = "No hay compras registradas.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    compras.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (c.id || "") + "</td>" +
        "<td>" + (c.nombreProveedor || "") + "</td>" +
        "<td>" + (c.numeroDocumento || "") + "</td>" +
        "<td>" + (c.fCompra || "") + "</td>" +
        "<td>" + fm(c.total) + "</td>" +
        "<td><span class='badge " + (c.estado === "COMPLETADA" ? "text-bg-success" : "text-bg-secondary") + "'>" + (c.estado || "") + "</span></td>" +
        "<td><button class='btn btn-sm btn-outline-primary' title='Ver'><i class='bi bi-eye'></i></button></td>";
      tbody.appendChild(tr);
    });
  } catch (err) {
    if (!irALogin(err)) {
      tbody.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
    }
  }
}

function calcularTotales() {
  const subtotal = carrito.reduce((s, d) => s + d.subtotal, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  if (lblSubtotal) lblSubtotal.textContent = fm(subtotal);
  if (lblIGV) lblIGV.textContent = fm(igv);
  if (lblTotal) lblTotal.textContent = fm(total);
}

function renderCarrito() {
  if (!tblCarrito) return;
  tblCarrito.innerHTML = "";
  carrito.forEach((d, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + d.nombreProducto + "</td>" +
      "<td class='text-center'>" + d.cantidad + "</td>" +
      "<td class='text-end'>" + fm(d.precioUnitario) + "</td>" +
      "<td class='text-end'>" + fm(d.subtotal) + "</td>" +
      "<td class='text-center'><button class='btn btn-sm btn-outline-danger' data-idx='" + idx + "'>Quitar</button></td>";
    tblCarrito.appendChild(tr);
  });
  calcularTotales();
}

if (btnAgregar) {
  btnAgregar.addEventListener("click", () => {
    const idProd = selectProducto ? selectProducto.value : null;
    const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 0;
    const costo = inputCosto ? parseFloat(inputCosto.value) : 0;
    if (!idProd || !cantidad || cantidad <= 0) { mostrarAlerta("Seleccione producto y cantidad válida."); return; }
    if (costo <= 0) { mostrarAlerta("Ingrese el costo unitario."); return; }
    const producto = productos.find(p => String(p.id) === String(idProd));
    if (!producto) return;
    const existente = carrito.findIndex(d => String(d.idProducto) === String(idProd));
    if (existente >= 0) {
      carrito[existente].cantidad += cantidad;
      carrito[existente].subtotal = carrito[existente].cantidad * carrito[existente].precioUnitario;
    } else {
      carrito.push({
        idProducto: producto.id,
        nombreProducto: producto.nombre,
        cantidad: cantidad,
        precioUnitario: costo,
        subtotal: costo * cantidad
      });
    }
    inputCantidad.value = 1;
    inputCosto.value = "";
    renderCarrito();
  });
}

if (tblCarrito) {
  tblCarrito.addEventListener("click", e => {
    const btn = e.target.closest("button[data-idx]");
    if (!btn) return;
    carrito.splice(parseInt(btn.dataset.idx), 1);
    renderCarrito();
  });
}

if (btnGuardar) {
  btnGuardar.addEventListener("click", async () => {
    limpiarAlerta();
    const idProveedor = selectProveedor ? selectProveedor.value : null;
    const idMetodoPago = selectMetodoPago ? selectMetodoPago.value : null;
    const numeroDocumento = document.getElementById("compra-numero-documento") ? document.getElementById("compra-numero-documento").value : "";
    const estado = document.getElementById("compra-estado") ? document.getElementById("compra-estado").value : "COMPLETADA";
    if (!idProveedor) { mostrarAlerta("Seleccione un proveedor."); return; }
    if (!numeroDocumento) { mostrarAlerta("Ingrese número de documento."); return; }
    if (!carrito.length) { mostrarAlerta("Agregue al menos un producto."); return; }

    const payload = {
      idProveedor: Number(idProveedor),
      numeroDocumento: numeroDocumento.trim(),
      fCompra: new Date().toISOString(),
      estado: estado || "COMPLETADA",
      observacion: "",
      detalles: carrito.map(d => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    btnGuardar.disabled = true;
    try {
      if (!tieneCsrf()) await yo();
      await api("POST", "/api/compras", payload);
      carrito = [];
      renderCarrito();
      await listarCompras();
    } catch (err) {
      if (!irALogin(err)) mostrarAlerta(err.mensaje || "No se pudo registrar la compra.");
    } finally {
      btnGuardar.disabled = false;
    }
  });
}

if (btnNueva) {
  btnNueva.addEventListener("click", () => {
    carrito = [];
    renderCarrito();
    limpiarAlerta();
  });
}

document.addEventListener("DOMContentLoaded", cargarInicial);
