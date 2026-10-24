import { api, tieneCsrf, yo } from "../login/login.js";

document.addEventListener("DOMContentLoaded", () => {
  let clientes = [];
  let metodosPago = [];
  let productos = [];
  let carrito = [];
  let ventasDia = [];
  let boletas = [];
  let facturas = [];

  // ============ DOM: Ventas ============
  const modalVenta = document.getElementById("modalNuevaVenta");
  const btnGuardarVenta = modalVenta.querySelector("#venta-modal-guardar");
  const tbodyVentas = document.querySelector("#tbody-ventas-dia");
  const selectCliente = document.getElementById("venta-modal-cliente");
  const selectMetodoPago = document.getElementById("venta-modal-metodo-pago");
  const selectProducto = document.getElementById("venta-modal-producto");
  const inputCantidad = document.getElementById("venta-modal-cantidad");
  const btnAgregar = document.getElementById("venta-modal-agregar-producto");
  const btnLimpiar = document.getElementById("venta-modal-limpiar");
  const tblCarrito = document.querySelector("#venta-modal-carrito tbody");
  const lblSubtotal = document.getElementById("venta-modal-subtotal");
  const lblIGV = document.getElementById("venta-modal-igv");
  const lblTotal = document.getElementById("venta-modal-total");
  const alertaVenta = document.getElementById("venta-modal-alerta");

  // ============ DOM: Comprobantes ============
  const tbodyComprobantes = document.querySelector("#tbody-comprobantes");
  const btnEmitirComprobante = document.querySelector("#pane-comprobantes .btn-primary");

  function mostrarAlerta(el, msg) {
    if (el) { el.textContent = msg; el.classList.remove("d-none"); }
  }
  function limpiarAlerta(el) {
    if (el) { el.textContent = ""; el.classList.add("d-none"); }
  }
  function irALogin(err) {
    if (err && err.status === 401) { window.location.href = "../login/login.html"; return true; }
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
  function renderCarrito() {
    if (!tblCarrito) return;
    tblCarrito.innerHTML = "";
    carrito.forEach((d, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + d.nombreProducto + "</td>" +
        "<td class='text-center'>" + d.cantidad + "</td>" +
        "<td class='text-end'>" + formatearMoneda(d.precioUnitario) + "</td>" +
        "<td class='text-end'>" + formatearMoneda(d.subtotal) + "</td>" +
        "<td class='text-center'><button class='btn btn-sm btn-outline-danger' data-idx='" + idx + "'>Quitar</button></td>";
      tblCarrito.appendChild(tr);
    });
    calcularTotales();
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

  async function cargarDatosIniciales() {
    limpiarAlerta(alertaVenta);
    try {
      const [cs, mp, ps] = await Promise.all([
        api("GET", "/api/clientes"),
        api("GET", "/api/metodos-pago"),
        api("GET", "/api/productos")
      ]);
      clientes = cs || [];
      metodosPago = mp || [];
      productos = ps || [];
      llenarSelect(selectCliente, clientes, c => c.id, c => c.nombrePersona + " (" + (c.nDocumento || "") + ")");
      llenarSelect(selectMetodoPago, metodosPago, c => c.id, c => c.nombre);
      llenarSelect(selectProducto, productos, c => c.id, c => c.nombre + " - S/ " + (c.precioVenta || 0));
      await listarVentasDia();
      await listarComprobantes();
    } catch (err) {
      if (!irALogin(err)) mostrarAlerta(alertaVenta, err.mensaje || "No se pudo cargar.");
    }
  }

  async function listarVentasDia() {
    if (!tbodyVentas) return;
    try {
      const ventas = (await api("GET", "/api/ventas")) || [];
      ventasDia = ventas;
      tbodyVentas.innerHTML = "";
      if (!ventas.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.className = "text-center text-muted";
        td.textContent = "No hay ventas registradas.";
        tr.appendChild(td);
        tbodyVentas.appendChild(tr);
        return;
      }
      ventas.forEach(v => {
        const tr = document.createElement("tr");
        const estado = v.estado || "COMPLETADA";
        const activo = estado !== "0" && estado !== "ANULADA";
        if (!activo) tr.classList.add("text-muted", "opacity-75");
        tr.innerHTML =
          "<td>" + (v.id || "") + "</td>" +
          "<td>" + (v.nombreCliente || "") + "</td>" +
          "<td>" + (v.numeroDocumento || "") + "</td>" +
          "<td>" + (v.fVenta || "") + "</td>" +
          "<td>" + formatearMoneda(v.total) + "</td>" +
          "<td><span class='badge " + (activo ? "text-bg-success" : "text-bg-secondary") + "'>" + estado + "</span></td>" +
          "<td><div class='d-flex gap-1'>" +
          (activo
            ? '<button class="btn btn-sm btn-outline-primary" title="Ver detalles" data-accion="ver" data-id="' + v.id + '"><i class="bi bi-eye"></i></button>' +
              '<button class="btn btn-sm btn-outline-danger" title="Anular venta" data-accion="anular" data-id="' + v.id + '"><i class="bi bi-trash"></i></button>'
            : '<button class="btn btn-sm btn-outline-secondary" title="Anulado" disabled><i class="bi bi-trash opacity-50"></i></button>') +
          "</div></td>";
        tbodyVentas.appendChild(tr);
      });
    } catch (err) {
      if (!irALogin(err)) {
        tbodyVentas.innerHTML = "<tr><td colspan='7' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  async function listarComprobantes() {
    if (!tbodyComprobantes) return;
    try {
      const [bs, fs] = await Promise.all([
        api("GET", "/api/boletas").catch(() => []),
        api("GET", "/api/facturas").catch(() => [])
      ]);
      boletas = bs || [];
      facturas = fs || [];
      const todos = [];
      boletas.forEach(b => todos.push({ ...b, tipo: "Boleta", fuente: "boleta" }));
      facturas.forEach(f => todos.push({ ...f, tipo: "Factura", fuente: "factura" }));
      todos.sort((a, b) => String(b.id || "").localeCompare(String(a.id || "")));

      tbodyComprobantes.innerHTML = "";
      if (!todos.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 8;
        td.className = "text-center text-muted";
        td.textContent = "No hay comprobantes emitidos.";
        tr.appendChild(td);
        tbodyComprobantes.appendChild(tr);
        return;
      }
      todos.forEach(c => {
        const venta = ventasDia.find(v => String(v.id) === String(c.idVenta));
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + (c.id || "") + "</td>" +
          "<td>" + (c.serie || "") + "-" + (c.numero || "") + "</td>" +
          "<td><span class='badge " + (c.tipo === "Boleta" ? "text-bg-info" : "text-bg-primary") + "'>" + c.tipo + "</span></td>" +
          "<td>" + (c.fEmision || "") + "</td>" +
          "<td>" + (venta ? (venta.nombreCliente || "") : "Venta #" + c.idVenta) + "</td>" +
          "<td>" + (venta ? formatearMoneda(venta.total) : "") + "</td>" +
          "<td><span class='badge " + (c.estado === "1" ? "text-bg-success" : "text-bg-secondary") + "'>" + (c.estado === "1" ? "Activo" : "Inactivo") + "</span></td>" +
          "<td><button class='btn btn-sm btn-outline-primary' title='Ver' data-accion='ver' data-tipo='" + c.fuente + "' data-id='" + c.id + "'><i class='bi bi-eye'></i></button></td>";
        tbodyComprobantes.appendChild(tr);
      });
    } catch (err) {
      if (!irALogin(err)) {
        tbodyComprobantes.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  // ============ Modal: Nueva Venta ============
  // Al abrir el modal, limpiar estado previo
  if (modalVenta) {
    modalVenta.addEventListener("show.bs.modal", () => {
      carrito = [];
      renderCarrito();
      limpiarAlerta(alertaVenta);
      const mSelect = document.getElementById("venta-modal-cliente");
      const mDoc = document.getElementById("venta-modal-numero-documento");
      const mEstado = document.getElementById("venta-modal-estado");
      if (mSelect) mSelect.selectedIndex = 0;
      if (mDoc) mDoc.value = "";
      if (mEstado) mEstado.value = "COMPLETADA";
    });
  }

  if (btnAgregar) {
    btnAgregar.addEventListener("click", () => {
      const idProd = selectProducto ? selectProducto.value : null;
      const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 0;
      if (!idProd || !cantidad || cantidad <= 0) {
        mostrarAlerta(alertaVenta, "Seleccione producto y cantidad válida.");
        return;
      }
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
          precioUnitario: producto.precioVenta,
          subtotal: producto.precioVenta * cantidad
        });
      }
      inputCantidad.value = 1;
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

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      carrito = [];
      renderCarrito();
      limpiarAlerta(alertaVenta);
    });
  }

  if (btnGuardarVenta) {
    btnGuardarVenta.addEventListener("click", async () => {
      limpiarAlerta(alertaVenta);
      const idCliente = selectCliente ? selectCliente.value : null;
      const idMetodoPago = selectMetodoPago ? selectMetodoPago.value : null;
      const numeroDocumento = document.getElementById("venta-modal-numero-documento") ? document.getElementById("venta-modal-numero-documento").value : "";
      const estado = document.getElementById("venta-modal-estado") ? document.getElementById("venta-modal-estado").value : "COMPLETADA";

      if (!idCliente) { mostrarAlerta(alertaVenta, "Seleccione un cliente."); return; }
      if (!numeroDocumento) { mostrarAlerta(alertaVenta, "Ingrese el número de documento."); return; }
      if (!carrito.length) { mostrarAlerta(alertaVenta, "Agregue al menos un producto."); return; }

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
        limpiarAlerta(alertaVenta);
        const modalInstance = bootstrap.Modal.getInstance(modalVenta) || new bootstrap.Modal(modalVenta);
        modalInstance.hide();
        await listarVentasDia();
        await listarComprobantes();
      } catch (err) {
        if (!irALogin(err)) mostrarAlerta(alertaVenta, err.mensaje || "No se pudo registrar la venta.");
      } finally {
        btnGuardarVenta.disabled = false;
      }
    });
  }

  tbodyVentas.addEventListener("click", async (e) => {
    const boton = e.target.closest("button[data-accion]");
    if (!boton) return;
    const id = boton.dataset.id;
    const venta = ventasDia.find(v => String(v.id) === String(id));
    if (!venta) return;
    if (boton.dataset.accion === "ver") {
      alert("Detalles de venta #" + venta.id + "\nCliente: " + (venta.nombreCliente || "") + "\nDocumento: " + (venta.numeroDocumento || "") + "\nTotal: " + formatearMoneda(venta.total) + "\nEstado: " + (venta.estado || ""));
    } else if (boton.dataset.accion === "anular") {
      if (!window.confirm("¿Anular la venta #" + venta.id + "?")) return;
      try {
        if (!tieneCsrf()) await yo();
        await api("DELETE", "/api/ventas/" + venta.id);
        await listarVentasDia();
        await listarComprobantes();
      } catch (err) {
        if (!irALogin(err)) window.alert(err.mensaje || "No se pudo anular la venta.");
      }
    }
  });

  // ============ Modal: Emitir Comprobante ============
  function crearModalComprobante() {
    if (document.getElementById("modalEmitirComprobante")) return;
    const html = `
<div class="modal fade" id="modalEmitirComprobante" tabindex="-1" aria-labelledby="modalEmitirComprobanteLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalEmitirComprobanteLabel"><i class="bi bi-file-earmark-text me-2"></i>Emitir Comprobante</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <div id="comprobante-alerta" class="alert alert-danger d-none mb-3"></div>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Venta</label>
            <select class="form-select" id="comprobante-venta" required>
              <option value="" selected disabled>Seleccione una venta</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="comprobante-tipo" required>
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Serie</label>
            <input type="text" class="form-control" id="comprobante-serie" maxlength="10" placeholder="B001" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Número</label>
            <input type="text" class="form-control" id="comprobante-numero" maxlength="20" placeholder="000001" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Total venta</label>
            <input type="text" class="form-control" id="comprobante-total" readonly />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-success" id="comprobante-guardar">Emitir</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }
  crearModalComprobante();

  const modalComp = document.getElementById("modalEmitirComprobante");
  const selectCompVenta = document.getElementById("comprobante-venta");
  const selectCompTipo = document.getElementById("comprobante-tipo");
  const inputCompSerie = document.getElementById("comprobante-serie");
  const inputCompNumero = document.getElementById("comprobante-numero");
  const inputCompTotal = document.getElementById("comprobante-total");
  const alertaComp = document.getElementById("comprobante-alerta");
  const btnGuardarComp = document.getElementById("comprobante-guardar");

  function llenarSelectVentasComprobante() {
    llenarSelect(selectCompVenta, ventasDia, v => v.id, v => "Venta #" + v.id + " - " + (v.nombreCliente || "") + " - " + formatearMoneda(v.total));
  }
  selectCompVenta.addEventListener("change", () => {
    const id = selectCompVenta.value;
    const venta = ventasDia.find(v => String(v.id) === String(id));
    if (venta) {
      inputCompTotal.value = formatearMoneda(venta.total);
    } else {
      inputCompTotal.value = "";
    }
  });

  if (btnEmitirComprobante) {
    btnEmitirComprobante.addEventListener("click", () => {
      limpiarAlerta(alertaComp);
      selectCompVenta.selectedIndex = 0;
      selectCompTipo.value = "boleta";
      inputCompSerie.value = "";
      inputCompNumero.value = "";
      inputCompTotal.value = "";
      llenarSelectVentasComprobante();
      const mInstance = bootstrap.Modal.getInstance(modalComp) || new bootstrap.Modal(modalComp);
      mInstance.show();
    });
  }

  if (btnGuardarComp) {
    btnGuardarComp.addEventListener("click", async () => {
      limpiarAlerta(alertaComp);
      const idVenta = selectCompVenta.value;
      const tipo = selectCompTipo.value;
      const serie = inputCompSerie.value.trim();
      const numero = inputCompNumero.value.trim();
      if (!idVenta) { mostrarAlerta(alertaComp, "Seleccione una venta."); return; }
      if (!serie) { mostrarAlerta(alertaComp, "Ingrese la serie."); return; }
      if (!numero) { mostrarAlerta(alertaComp, "Ingrese el número."); return; }

      const payload = { idVenta: Number(idVenta), numero, serie };
      const url = tipo === "boleta" ? "/api/boletas/venta/" + idVenta : "/api/facturas/venta/" + idVenta;

      btnGuardarComp.disabled = true;
      try {
        if (!tieneCsrf()) await yo();
        await api("POST", url, payload);
        const mInstance = bootstrap.Modal.getInstance(modalComp) || new bootstrap.Modal(modalComp);
        mInstance.hide();
        await listarComprobantes();
      } catch (err) {
        if (!irALogin(err)) mostrarAlerta(alertaComp, err.mensaje || "No se pudo emitir el comprobante.");
      } finally {
        btnGuardarComp.disabled = false;
      }
    });
  }

  // Inicializar
  cargarDatosIniciales();
});
