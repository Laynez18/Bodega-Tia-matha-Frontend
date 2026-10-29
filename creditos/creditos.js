import { api, tieneCsrf, yo } from "../login/login.js";

document.addEventListener("DOMContentLoaded", () => {
  let cuentas = [];
  let ventas = [];
  let clientes = [];

  const tbodyCtas = document.querySelector("#pane-ctas tbody");
  const tbodyCobros = document.querySelector("#pane-cobros tbody");

  function fm(n) { return "S/ " + (n || 0).toFixed(2); }
  function irALoginLocal(err) {
    if (err && err.status === 401) { window.location.href = "../login/login.html"; return true; }
    return false;
  }

  async function cargarCuentas() {
    if (!tbodyCtas) return;
    try {
      ventas = (await api("GET", "/api/ventas")) || [];
      clientes = (await api("GET", "/api/clientes")) || [];
      cuentas = ventas.filter(v => (v.saldo || 0) > 0);
      tbodyCtas.innerHTML = "";
      if (!cuentas.length) {
        tbodyCtas.innerHTML = "<tr><td colspan='9' class='text-center text-muted'>No hay cuentas pendientes.</td></tr>";
        return;
      }
      cuentas.forEach((c, i) => {
        const cliente = clientes.find(cl => String(cl.id) === String(c.idCliente));
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + (cliente ? (cliente.nombrePersona || "") : "") + "</td>" +
          "<td>Venta #" + (c.id || "") + "</td>" +
          "<td>" + (c.fVenta || "") + "</td>" +
          "<td>" + fm(c.total || 0) + "</td>" +
          "<td>" + fm(c.saldo || 0) + "</td>" +
          "<td><span class='badge text-bg-warning'>Pendiente</span></td>" +
          "<td><button class='btn btn-success btn-sm' onclick='abrirCobro(" + c.id + ", " + fm(c.saldo || 0) + ")'><i class='bi bi-cash-coin'></i></button></td>" +
          "<td>-</td>";
        tbodyCtas.appendChild(tr);
      });
    } catch (err) {
      if (!irALoginLocal(err)) {
        tbodyCtas.innerHTML = "<tr><td colspan='9' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  async function cargarCobros() {
    if (!tbodyCobros) return;
    try {
      tbodyCobros.innerHTML = "<tr><td colspan='7' class='text-center text-muted'>Sin cobros registrados.</td></tr>";
    } catch (e) { console.error(e); }
  }

  window.abrirCobro = function(idVenta, saldo) {
    alert("Cobro para venta #" + idVenta + " con saldo " + saldo + ". Funcionalidad de registro de pago por implementar.");
  };

  cargarCuentas();
  cargarCobros();
});
