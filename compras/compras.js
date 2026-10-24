import { api, tieneCsrf, yo } from "../login/login.js";

document.addEventListener("DOMContentLoaded", () => {
  let proveedores = [];
  let productos = [];
  let metodosPago = [];
  let carrito = [];
  let comprasDia = [];

  const btnIniciarCompra = document.getElementById("btn-iniciar-compra");
  const modalCompra = document.getElementById("modalNuevaCompra");
  const btnGuardarCompra = modalCompra.querySelector("#compra-modal-guardar");
  const tbodyCompras = document.querySelector("#tbody-ordenes-compra");
  const selectProveedor = document.getElementById("compra-modal-proveedor");
  const selectMetodoPago = document.getElementById("compra-modal-metodo-pago");
  const selectProducto = document.getElementById("compra-modal-producto");
  const inputCantidad = document.getElementById("compra-modal-cantidad");
  const inputCosto = document.getElementById("compra-modal-costo");
  const btnAgregar = document.getElementById("compra-modal-agregar-producto");
  const btnLimpiar = document.getElementById("compra-modal-limpiar");
  const tblCarrito = document.querySelector("#compra-modal-carrito tbody");
  const lblSubtotal = document.getElementById("compra-modal-subtotal");
  const lblIGV = document.getElementById("compra-modal-igv");
  const lblTotal = document.getElementById("compra-modal-total");
  const alerta = document.getElementById("compra-modal-alerta");

  // --- Proveedores ---
  const btnNuevoProveedor = document.getElementById("btn-nuevo-proveedor");
  const modalProv = document.getElementById("modalNuevoProveedor");
  const btnGuardarProv = modalProv.querySelector("#proveedor-modal-guardar");
  const tbodyProv = document.querySelector("#tbody-proveedores");
  const alertaProv = document.getElementById("proveedor-modal-alerta");

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
  function fm(n) { return "S/ " + (n || 0).toFixed(2); }

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

  async function cargarDatosIniciales() {
    limpiarAlerta(alerta);
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
      llenarSelect(selectMetodoPago, metodosPago, p => p.id, p => p.nombre);
      llenarSelect(selectProducto, productos, p => p.id, p => p.nombre + " - S/ " + (p.precioVenta || 0));
      await listarComprasDia();
      await listarProveedores();
    } catch (err) {
      if (!irALogin(err)) mostrarAlerta(alerta, err.mensaje || "No se pudo cargar.");
    }
  }

  async function listarComprasDia() {
    if (!tbodyCompras) return;
    try {
      const compras = (await api("GET", "/api/compras")) || [];
      comprasDia = compras;
      tbodyCompras.innerHTML = "";
      if (!compras.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 8;
        td.className = "text-center text-muted";
        td.textContent = "No hay órdenes de compra registradas.";
        tr.appendChild(td);
        tbodyCompras.appendChild(tr);
        return;
      }
      compras.forEach(c => {
        const tr = document.createElement("tr");
        const estado = c.estado || "COMPLETADA";
        const activo = estado !== "0" && estado !== "ANULADA";
        if (!activo) tr.classList.add("text-muted", "opacity-75");
        tr.innerHTML =
          "<td>" + (c.id || "") + "</td>" +
          "<td>" + (c.nombreProveedor || "") + "</td>" +
          "<td>" + (c.numeroDocumento || "") + "</td>" +
          "<td>" + (c.fCompra || "") + "</td>" +
          "<td>" + fm(c.total) + "</td>" +
          "<td><span class='badge " + (activo ? "text-bg-success" : "text-bg-secondary") + "'>" + estado + "</span></td>" +
          "<td><div class='d-flex gap-1'>" +
          (activo
            ? '<button class="btn btn-sm btn-outline-primary" title="Ver" data-accion="ver" data-id="' + c.id + '"><i class="bi bi-eye"></i></button>' +
              '<button class="btn btn-sm btn-outline-danger" title="Anular" data-accion="anular" data-id="' + c.id + '"><i class="bi bi-trash"></i></button>'
            : '<button class="btn btn-sm btn-outline-secondary" title="Anulado" disabled><i class="bi bi-trash opacity-50"></i></button>') +
          "</div></td>";
        tbodyCompras.appendChild(tr);
      });
    } catch (err) {
      if (!irALogin(err)) {
        tbodyCompras.innerHTML = "<tr><td colspan='8' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
      }
    }
  }

  async function listarProveedores() {
    if (!tbodyProv) return;
    try {
      const provs = (await api("GET", "/api/proveedores")) || [];
      proveedores = provs;
      tbodyProv.innerHTML = "";
      if (!provs.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.className = "text-center text-muted";
        td.textContent = "No hay proveedores registrados.";
        tr.appendChild(td);
        tbodyProv.appendChild(tr);
        return;
      }
      provs.forEach((p, i) => {
        const tr = document.createElement("tr");
        const activo = p.estado !== "0" && p.estado !== false;
        if (!activo) tr.classList.add("text-muted", "opacity-75");
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + (p.nDocumento || "") + "</td>" +
          "<td>" + (p.nombrePersona || "") + "</td>" +
          "<td>" + (p.contacto || "") + "</td>" +
          "<td>" + (p.telefonoContacto || "") + "</td>" +
          "<td>" + (p.emailContacto || "") + "</td>" +
          "<td>" + (p.direccion || "") + "</td>" +
          "<td><span class='badge " + (activo ? "text-bg-success" : "text-bg-secondary") + "'>" + (activo ? "Activo" : "Inactivo") + "</span></td>" +
          "<td><div class='d-flex gap-1'>" +
          (activo
            ? '<button class="btn btn-sm btn-outline-primary" title="Editar" data-accion="editar" data-id="' + p.id + '"><i class="bi bi-pencil"></i></button>' +
              '<button class="btn btn-sm btn-outline-danger" title="Desactivar" data-accion="desactivar" data-id="' + p.id + '"><i class="bi bi-toggle-on"></i></button>'
            : '<button class="btn btn-sm btn-outline-secondary" title="Inactivo" disabled><i class="bi bi-toggle-off opacity-50"></i></button>') +
          "</div></td>";
        tbodyProv.appendChild(tr);
      });
    } catch (err) {
      if (!irALogin(err)) {
        tbodyProv.innerHTML = "<tr><td colspan='9' class='text-center text-danger'>Error: " + (err.mensaje || "No se pudo cargar.") + "</td></tr>";
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
      if (!idProd || !cantidad || cantidad <= 0) { mostrarAlerta(alerta, "Seleccione producto y cantidad válida."); return; }
      if (costo <= 0) { mostrarAlerta(alerta, "Ingrese el costo unitario."); return; }
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

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      carrito = [];
      renderCarrito();
      limpiarAlerta(alerta);
    });
  }

  if (btnGuardarCompra) {
    btnGuardarCompra.addEventListener("click", async () => {
      limpiarAlerta(alerta);
      const idProveedor = selectProveedor ? selectProveedor.value : null;
      const idMetodoPago = selectMetodoPago ? selectMetodoPago.value : null;
      const numeroDocumento = document.getElementById("compra-modal-numero-documento") ? document.getElementById("compra-modal-numero-documento").value : "";
      const estado = document.getElementById("compra-modal-estado") ? document.getElementById("compra-modal-estado").value : "COMPLETADA";
      if (!idProveedor) { mostrarAlerta(alerta, "Seleccione un proveedor."); return; }
      if (!numeroDocumento) { mostrarAlerta(alerta, "Ingrese número de documento."); return; }
      if (!carrito.length) { mostrarAlerta(alerta, "Agregue al menos un producto."); return; }

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

      btnGuardarCompra.disabled = true;
      try {
        if (!tieneCsrf()) await yo();
        await api("POST", "/api/compras", payload);
        carrito = [];
        renderCarrito();
        limpiarAlerta(alerta);
        bootstrap.Modal.getInstance(modalCompra).hide();
        await listarComprasDia();
      } catch (err) {
        if (!irALogin(err)) mostrarAlerta(alerta, err.mensaje || "No se pudo registrar la compra.");
      } finally {
        btnGuardarCompra.disabled = false;
      }
    });
  }

  if (btnIniciarCompra) {
    btnIniciarCompra.addEventListener("click", () => {
      carrito = [];
      renderCarrito();
      limpiarAlerta(alerta);
      const mProv = document.getElementById("compra-modal-proveedor");
      const mDoc = document.getElementById("compra-modal-numero-documento");
      const mEstado = document.getElementById("compra-modal-estado");
      if (mProv) mProv.selectedIndex = 0;
      if (mDoc) mDoc.value = "";
      if (mEstado) mEstado.value = "COMPLETADA";
      bootstrap.Modal.getOrCreateInstance(modalCompra).show();
    });
  }

  tbodyCompras.addEventListener("click", async (e) => {
    const boton = e.target.closest("button[data-accion]");
    if (!boton) return;
    const id = boton.dataset.id;
    const compra = comprasDia.find(c => String(c.id) === String(id));
    if (!compra) return;
    if (boton.dataset.accion === "ver") {
      alert("Detalles de compra #" + compra.id + "\nProveedor: " + (compra.nombreProveedor || "") + "\nTotal: " + fm(compra.total) + "\nEstado: " + (compra.estado || ""));
    } else if (boton.dataset.accion === "anular") {
      if (!window.confirm("¿Anular la compra #" + compra.id + "?")) return;
      try {
        if (!tieneCsrf()) await yo();
        await api("DELETE", "/api/compras/" + compra.id);
        await listarComprasDia();
      } catch (err) {
        if (!irALogin(err)) window.alert(err.mensaje || "No se pudo anular la compra.");
      }
    }
  });

  // --- Proveedores CRUD ---
  if (btnNuevoProveedor) {
    btnNuevoProveedor.addEventListener("click", () => {
      limpiarAlerta(alertaProv);
      const form = modalProv.querySelector("form");
      if (form) form.reset();
      bootstrap.Modal.getOrCreateInstance(modalProv).show();
    });
  }

  if (btnGuardarProv) {
    btnGuardarProv.addEventListener("click", async () => {
      limpiarAlerta(alertaProv);
      const razonSocial = document.getElementById("proveedor-modal-razon-social").value.trim();
      const telefono = document.getElementById("proveedor-modal-telefono").value.trim();
      const email = document.getElementById("proveedor-modal-email").value.trim();
      const direccion = document.getElementById("proveedor-modal-direccion").value.trim();
      if (!razonSocial) { mostrarAlerta(alertaProv, "La razón social es obligatoria."); return; }
      mostrarAlerta(alertaProv, "Requiere seleccionar una persona válida (funcionalidad pendiente de endpoint /api/personas).");
    });
  }

  tbodyProv.addEventListener("click", async (e) => {
    const boton = e.target.closest("button[data-accion]");
    if (!boton) return;
    const id = boton.dataset.id;
    const prov = proveedores.find(p => String(p.id) === String(id));
    if (!prov) return;
    if (boton.dataset.accion === "desactivar") {
      if (!window.confirm("¿Desactivar al proveedor " + prov.nombrePersona + "?")) return;
      try {
        if (!tieneCsrf()) await yo();
        await api("DELETE", "/api/proveedores/" + prov.id);
        await listarProveedores();
      } catch (err) {
        if (!irALogin(err)) window.alert(err.mensaje || "No se pudo desactivar el proveedor.");
      }
    }
  });

  cargarDatosIniciales();
});
