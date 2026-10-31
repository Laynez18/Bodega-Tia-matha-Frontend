import { api } from "../login/login.js";

const btnDni = document.getElementById("btnCfgConstatarDni");
const btnRuc = document.getElementById("btnCfgConstatarRuc");
const inputDni = document.getElementById("cfg-dni");
const inputRuc = document.getElementById("cfg-ruc");
const resultado = document.getElementById("cfgResultado");

function mostrarResultado(datos) {
  if (!datos) { resultado.style.display = "none"; return; }
  const esRuc = !!datos.nombre_o_razon_social;
  const html = `
    <div class="row g-2">
      <div class="col-6"><strong>Número:</strong> ${datos.numero || datos.dni || "-"}</div>
      <div class="col-6"><strong>Nombre / Razón Social:</strong> ${datos.nombres || datos.nombre_o_razon_social || "-"}</div>
      ${!esRuc ? `<div class="col-6"><strong>Apellido Paterno:</strong> ${datos.apellido_paterno || "-"}</div>` : ""}
      ${!esRuc ? `<div class="col-6"><strong>Apellido Materno:</strong> ${datos.apellido_materno || "-"}</div>` : ""}
      <div class="col-6"><strong>Dirección:</strong> ${datos.direccion || "-"}</div>
      <div class="col-6"><strong>Distrito:</strong> ${datos.distrito || "-"}</div>
      <div class="col-6"><strong>Provincia:</strong> ${datos.provincia || "-"}</div>
      <div class="col-6"><strong>Departamento:</strong> ${datos.departamento || "-"}</div>
    </div>
  `;
  resultado.innerHTML = html;
  resultado.style.display = "block";
}

async function consultarDni() {
  const dni = inputDni.value.trim();
  if (!dni) return;
  try {
    const data = await api("GET", "/api/personas/consultar-dni/" + encodeURIComponent(dni));
    mostrarResultado(data && data.data ? data.data : data);
  } catch (err) {
    resultado.innerHTML = '<div class="text-danger">Error: ' + (err.mensaje || err.message) + "</div>";
    resultado.style.display = "block";
  }
}

async function consultarRuc() {
  const ruc = inputRuc.value.trim();
  if (!ruc) return;
  try {
    const data = await api("GET", "/api/personas/consultar-ruc/" + encodeURIComponent(ruc));
    mostrarResultado(data && data.data ? data.data : data);
  } catch (err) {
    resultado.innerHTML = '<div class="text-danger">Error: ' + (err.mensaje || err.message) + "</div>";
    resultado.style.display = "block";
  }
}

if (btnDni) btnDni.addEventListener("click", consultarDni);
if (btnRuc) btnRuc.addEventListener("click", consultarRuc);
