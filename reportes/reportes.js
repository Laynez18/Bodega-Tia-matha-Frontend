document.addEventListener("DOMContentLoaded", () => {
  const btnExportarVentas = document.querySelector("#pane-ventas .btn-primary");
  const btnExportarInventario = document.querySelector("#pane-inventario .btn-primary");

  if (btnExportarVentas) {
    btnExportarVentas.addEventListener("click", () => {
      alert("Exportación de reporte de ventas por implementar.");
    });
  }
  if (btnExportarInventario) {
    btnExportarInventario.addEventListener("click", () => {
      alert("Exportación de reporte de inventario por implementar.");
    });
  }
});
