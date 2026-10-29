import { api, tieneCsrf, yo } from "../login/login.js";

document.addEventListener("DOMContentLoaded", () => {
  let cajas = [];
  let aperturas = [];

  const tbodyAperturas = document.querySelector("#pane-apertura tbody");
  const btnAperturar = document.getElementById("btnAperturarCaja");
  const btnCerrar = document.getElementById("btnCerrarCaja");
  const selectCaja = document.getElementById("cajaSeleccionada");
  const inputMonto = document.getElementById("montoInicial");
  const inputTurno = document.getElementById("numeroTurno");
  const modalAbrir = document.getElementById("modalAbrirCaja");
  const modalCerrar = document.getElementById("modalCerrarCaja");
  const inputMontoDeclarado = document.getElementById("montoDeclarado");
  const inputObservacion = document.getElementById("observacionCierre");

  function fm(n) { return "S/ " + (n || 0).toFixed(2); }
  function irALoginLocal(err) {
    if (err && err.status === 401) { window.location.href = "../login/login.html"; return true; }
    return false;
  }

  async function cargarCajas() {
    try {
      cajas = (await api("GET", "/api/cajas")) || [];
      selectCaja.innerHTML = "";
      cajas.forEach(c => {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = (c.nombre || "Caja") + " - " + (c.ubicacion || "");
        selectCaja.appendChild(o);
      });
    } catch (e) { console.error("Error cargando cajas:", e); }
  }

  async function cargarAperturas() {
    if (!tbodyAperturas) return;
    try {
      aperturas = (await api("GET", "/api/aperturas-caja")) || [];
      tbodyAperturas.innerHTML = "";
      if (!aperturas.length) {
        tbodyAperturas.innerHTML = "<tr><td colspan='8' class='text-center text-muted'>No hay aperturas registradas.</td></tr>";
        return;
      }
      aperturas.forEach((a, i) => {
        const abierta = a.situacion !== "C" && a.situacion !== "0";
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + (a.nombreUsuario || "") + "</td>" +
          "<td>" + (a.fApertura || "") + "</td>" +
          "<td>" + (a.fCierre || "-") + "</td>" +
          "<td>" + fm(a.montoInicial) + "</td>" +
          "<td><span class='badge " + (abierta ? "text-bg-success" : "text-bg-secondary") + "'>" + (abierta ? "Abierta" : "Cerrada") + "</span></td>" +
          "<td>" +
          (abierta
            ? '<button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#modalCerrarCaja" onclick="abrirCierre(' + a.id + ')"><i class="bi bi-lock"></i> Cerrar</button>'
            : '<button class="btn btn-outline-secondary btn-sm" disabled><i class="bi bi-lock-fill"></i></button>') +
          "</td>";
        tbodyAperturas.appendChild(tr);
      });
    } catch (err) {
      if (!irALoginLocal(err)) {
        tbodyAperturas.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  window.abrirCierre = function(idApertura) {
    btnCerrar.onclick = async () => {
      const montoDecl = inputMontoDeclarado.value.trim();
      const obs = inputObservacion.value.trim();
      if (!montoDecl) { alert("Ingrese el monto declarado."); return; }
      try {
        if (!tieneCsrf()) await yo();
        await api("PUT", "/api/aperturas-caja/" + idApertura, {
          montoDeclarado: Number(montoDecl),
          observacion: obs,
          situacion: "C"
        });
        const modalInst = bootstrap.Modal.getInstance(modalCerrar);
        modalInst.hide();
        inputMontoDeclarado.value = "";
        inputObservacion.value = "";
        await cargarAperturas();
      } catch (err) {
        if (!irALoginLocal(err)) alert(err.mensaje || "No se pudo cerrar la caja.");
      }
    };
  };

  if (btnAperturar) {
    btnAperturar.addEventListener("click", async () => {
      const idCaja = selectCaja ? selectCaja.value : null;
      const montoInicial = inputMonto ? inputMonto.value : null;
      const numeroTurno = inputTurno ? inputTurno.value : "";
      if (!idCaja) { alert("Seleccione una caja."); return; }
      if (!montoInicial || Number(montoInicial) < 0) { alert("Ingrese monto inicial válido."); return; }
      try {
        if (!tieneCsrf()) await yo();
        await api("POST", "/api/aperturas-caja", {
          idCaja: Number(idCaja),
          idUsuario: 1,
          numeroTurno: numeroTurno,
          montoInicial: Number(montoInicial),
          observacion: ""
        });
        const modalInst = bootstrap.Modal.getInstance(modalAbrir);
        modalInst.hide();
        inputMonto.value = "";
        await cargarAperturas();
      } catch (err) {
        if (!irALoginLocal(err)) alert(err.mensaje || "No se pudo aperturar la caja.");
      }
    });
  }

  cargarCajas();
  cargarAperturas();
});
