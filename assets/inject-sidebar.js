(async function() {
  try {
    const res = await fetch('../assets/sidebar.html');
    if (!res.ok) throw new Error('No se pudo cargar sidebar.html');
    const html = await res.text();

    const contenedor = document.getElementById('sidebar-contenedor');
    if (!contenedor) {
      console.error('No se encontró #sidebar-contenedor');
      return;
    }
    contenedor.innerHTML = html;

    // Marcar link activo según la URL actual
    const ruta = window.location.pathname.split('/').pop();
    contenedor.querySelectorAll('.nav-link').forEach(function(link) {
      const href = link.getAttribute('href');
      if (href && href.endsWith(ruta)) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  } catch (e) {
    console.error('Error inyectando sidebar:', e);
  }
})();
