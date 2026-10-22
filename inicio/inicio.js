import { api, yo } from "../login/login.js";

let graficoVentas = null;
let chartRango = 7;

const rangoSelect = document.getElementById("grafico-rango");

async function obtenerFechas() {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - (chartRango - 1));
  const fmt = d => d.toISOString().split("T")[0];
  return { inicio: fmt(inicio), fin: fmt(fin) };
}

async function cargarKPIs() {
  try {
    // Ventas de hoy (misma fecha inicio=fin=hoy)
    const hoy = new Date().toISOString().split("T")[0];
    const ventasHoy = await api("GET", `/api/reportes/ventas/resumen?fechaInicio=${hoy}&fechaFin=${hoy}`);
    document.getElementById("kpi-ventas-hoy").textContent = "S/ " + (ventasHoy.montoTotal || 0).toFixed(2);
    document.getElementById("kpi-ventas-hoy-cambio").textContent = (ventasHoy.totalVentas || 0) + " venta(s) hoy";

    // Productos en stock (sumar stock de todos los productos)
    const productos = (await api("GET", "/api/productos")) || [];
    const totalStock = productos.reduce((s, p) => s + (p.stock || 0), 0);
    const bajoStock = productos.filter(p => (p.stock || 0) <= (p.stockMinimo || 0)).length;
    document.getElementById("kpi-productos-stock").textContent = totalStock;
    document.getElementById("kpi-productos-cambio").innerHTML =
      '<i class="bi bi-exclamation-triangle"></i> ' + bajoStock + " por reponer";

    // Créditos / cuentas por cobrar
    const creditos = (await api("GET", "/api/creditos")) || [];
    const saldoTotal = creditos.reduce((s, c) => s + Number(c.saldo || 0), 0);
    document.getElementById("kpi-creditos").textContent = "S/ " + saldoTotal.toFixed(2);
    document.getElementById("kpi-creditos-cambio").innerHTML =
      '<i class="bi bi-person-circle"></i> ' + creditos.length + " cliente(s)";
  } catch (err) {
    console.error("Error cargando KPIs:", err);
  }
}

async function cargarGrafico() {
  try {
    const { inicio, fin } = await obtenerFechas();
    const ventasPorDia = (await api("GET", `/api/reportes/ventas/por-dia?fechaInicio=${inicio}&fechaFin=${fin}`)) || [];

    // Agrupar por fecha
    const datosPorFecha = {};
    ventasPorDia.forEach(v => {
      const fecha = v.fecha;
      if (!datosPorFecha[fecha]) datosPorFecha[fecha] = { cantidad: 0, monto: 0 };
      datosPorFecha[fecha].cantidad += v.cantidad || 0;
      datosPorFecha[fecha].monto += Number(v.monto || 0);
    });

    // Generar array de fechas completas (incluir días sin ventas)
    const fechas = [];
    const montos = [];
    const cantidades = [];
    const dInicio = new Date(inicio);
    const dFin = new Date(fin);
    for (let d = new Date(dInicio); d <= dFin; d.setDate(d.getDate() + 1)) {
      const clave = d.toISOString().split("T")[0];
      fechas.push(clave);
      montos.push(datosPorFecha[clave] ? datosPorFecha[clave].monto : 0);
      cantidades.push(datosPorFecha[clave] ? datosPorFecha[clave].cantidad : 0);
    }

    const ctx = document.getElementById("graficoVentas").getContext("2d");
    if (graficoVentas) {
      graficoVentas.destroy();
    }

    graficoVentas = new Chart(ctx, {
      type: "bar",
      data: {
        labels: fechas,
        datasets: [{
          label: "Ventas (S/)",
          data: montos,
          backgroundColor: "rgba(13, 110, 253, 0.7)",
          borderColor: "rgba(13, 110, 253, 1)",
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => "S/ " + v }
          },
          x: {
            ticks: { maxRotation: 45, minRotation: 45 }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => "S/ " + ctx.parsed.y.toFixed(2) } }
        }
      }
    });
  } catch (err) {
    console.error("Error cargando gráfico:", err);
  }
}

async function cargarProductosTop() {
  try {
    const productos = (await api("GET", "/api/productos")) || [];
    const top = productos
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .slice(0, 5);

    const lista = document.getElementById("lista-productos-top");
    if (!lista) return;
    lista.innerHTML = "";

    if (!top.length) {
      lista.innerHTML = '<li class="list-group-item text-center text-muted">Sin productos</li>';
      return;
    }

    top.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center py-2";
      li.innerHTML =
        "<div>" +
        "<div>" + (p.nombre || "") + "</div>" +
        "<small class='text-muted'>" + (p.codigo || "") + "</small>" +
        "</div>" +
        "<span class='badge text-bg-" + (i === 0 ? "primary" : "secondary") + " rounded-pill'>" + (p.stock || 0) + "</span>";
      lista.appendChild(li);
    });
  } catch (err) {
    console.error("Error cargando productos top:", err);
  }
}

(async function() {
  try {
    await yo();

    if (rangoSelect) {
      rangoSelect.addEventListener("change", e => {
        chartRango = parseInt(e.target.value) || 7;
        cargarGrafico();
      });
    }

    await cargarKPIs();
    await cargarGrafico();
    await cargarProductosTop();
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "../login/login.html";
    } else {
      console.error("Error inicializando dashboard:", err);
    }
  }
})();
