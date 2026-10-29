import { api, tieneCsrf, yo } from "../login/login.js";

document.addEventListener("DOMContentLoaded", () => {
  let productos = [];
  let lotes = [];
  let movimientos = [];

  const tbodyStock = document.querySelector("#pane-stock tbody");
  const tbodyLotes = document.querySelector("#pane-lotes tbody");
  const tbodyKardex = document.querySelector("#pane-kardex tbody");

  function fm(n) { return "S/ " + (n || 0).toFixed(2); }

  function irALoginLocal(err) {
    if (err && err.status === 401) { window.location.href = "../login/login.html"; return true; }
    return false;
  }

  async function cargarStock() {
    if (!tbodyStock) return;
    try {
      productos = (await api("GET", "/api/productos")) || [];
      tbodyStock.innerHTML = "";
      if (!productos.length) {
        tbodyStock.innerHTML = "<tr><td colspan='8' class='text-center text-muted'>No hay productos.</td></tr>";
        return;
      }
      productos.forEach((p, i) => {
        const bajoStock = (p.stock || 0) <= (p.stockMinimo || 0);
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + (p.codigoBarras || "") + "</td>" +
          "<td>" + (p.nombre || "") + "</td>" +
          "<td>" + (p.stock || 0) + "</td>" +
          "<td>" + (p.stockMinimo || 0) + "</td>" +
          "<td>-</td>" +
          "<td>" +
          (bajoStock
            ? '<span class="badge text-bg-danger">Bajo stock</span>'
            : '<span class="badge text-bg-success">Óptimo</span>') +
          "</td>" +
          "<td><button class='btn btn-outline-primary btn-sm'><i class='bi bi-pencil'></i></button></td>";
        tbodyStock.appendChild(tr);
      });
    } catch (err) {
      if (!irALoginLocal(err)) {
        tbodyStock.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  async function cargarLotes() {
    if (!tbodyLotes) return;
    try {
      lotes = (await api("GET", "/api/lotes")) || [];
      tbodyLotes.innerHTML = "";
      if (!lotes.length) {
        tbodyLotes.innerHTML = "<tr><td colspan='8' class='text-center text-muted'>No hay lotes.</td></tr>";
        return;
      }
      lotes.forEach((l, i) => {
        const tr = document.createElement("tr");
        const venc = new Date(l.fVencimiento);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
        let estado = "Vigente";
        let clase = "text-bg-success";
        if (dias < 0) { estado = "Vencido"; clase = "text-bg-danger"; }
        else if (dias <= 30) { estado = "Próximo a vencer"; clase = "text-bg-warning"; }
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + (l.nLote || "") + "</td>" +
          "<td>" + (l.nombreProducto || "") + "</td>" +
          "<td>" + (l.cantidadActual || 0) + "</td>" +
          "<td>" + (l.fVencimiento || "") + "</td>" +
          "<td><span class='badge " + clase + "'>" + estado + "</span></td>" +
          "<td><button class='btn btn-outline-primary btn-sm'><i class='bi bi-eye'></i></button></td>";
        tbodyLotes.appendChild(tr);
      });
    } catch (err) {
      if (!irALoginLocal(err)) {
        tbodyLotes.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  async function cargarKardex() {
    if (!tbodyKardex) return;
    try {
      movimientos = (await api("GET", "/api/movimientos-inventario")) || [];
      tbodyKardex.innerHTML = "";
      if (!movimientos.length) {
        tbodyKardex.innerHTML = "<tr><td colspan='8' class='text-center text-muted'>No hay movimientos.</td></tr>";
        return;
      }
      movimientos.forEach((m, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + (m.fMovimiento || "") + "</td>" +
          "<td>" + (m.nombreProducto || "") + "</td>" +
          "<td>" + (m.nombreTipoMovimientoInv || "") + "</td>" +
          "<td>" + (m.cantidad > 0 ? m.cantidad : "-") + "</td>" +
          "<td>" + (m.cantidad < 0 ? Math.abs(m.cantidad) : "-") + "</td>" +
          "<td>" + (m.stockNuevo || 0) + "</td>" +
          "<td><button class='btn btn-outline-primary btn-sm'><i class='bi bi-eye'></i></button></td>";
        tbodyKardex.appendChild(tr);
      });
    } catch (err) {
      if (!irALoginLocal(err)) {
        tbodyKardex.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  cargarStock();
  cargarLotes();
  cargarKardex();
});
