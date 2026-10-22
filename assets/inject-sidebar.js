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

    // ===== ACORDEÓN: independiente (todos pueden estar abiertos a la vez) =====
    const STORAGE_KEY = 'mmAccordionEstado';

    function guardarEstado(clave, abierto) {
      var estado = {};
      try { estado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) {}
      estado[clave] = abierto ? 'open' : 'closed';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    }

    function toggleIcon(btn) {
      var icon = btn.querySelector('.bi-chevron-down, .bi-chevron-up');
      if (!icon) return;
      if (btn.classList.contains('collapsed')) {
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-up');
      } else {
        icon.classList.remove('bi-chevron-up');
        icon.classList.add('bi-chevron-down');
      }
    }

    document.querySelectorAll('#accordionProcesos .accordion-button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var target = this.getAttribute('data-bs-target');
        if (!target) return;
        var clave = target.replace('#', '');
        var abierto = !this.classList.contains('collapsed');
        guardarEstado(clave, abierto);
        toggleIcon(this);
      });
    });

    // Restaurar estado guardado
    (function restaurar() {
      var estado = {};
      try { estado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) {}
      document.querySelectorAll('#accordionProcesos .accordion-button').forEach(function(btn) {
        var target = btn.getAttribute('data-bs-target');
        if (!target) return;
        var clave = target.replace('#', '');
        var colapsable = document.querySelector(target);
        if (!colapsable) return;
        var icon = btn.querySelector('.bi-chevron-down, .bi-chevron-up');

        if (estado[clave] === 'open') {
          btn.classList.remove('collapsed');
          btn.setAttribute('aria-expanded', 'true');
          colapsable.classList.remove('collapse');
          colapsable.classList.add('show');
          if (icon) {
            icon.classList.remove('bi-chevron-down');
            icon.classList.add('bi-chevron-up');
          }
        } else {
          btn.classList.add('collapsed');
          btn.setAttribute('aria-expanded', 'false');
          colapsable.classList.remove('show');
          colapsable.classList.add('collapse');
          if (icon) {
            icon.classList.remove('bi-chevron-up');
            icon.classList.add('bi-chevron-down');
          }
        }
      });
    })();

  } catch (e) {
    console.error('Error inyectando sidebar:', e);
  }
})();
