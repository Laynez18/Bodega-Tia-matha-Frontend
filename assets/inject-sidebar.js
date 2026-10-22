(function() {
  var sidebar = {
    contenedor: null,
    STORAGE_KEY: 'mmAccordionEstado',
    SCROLL_KEY: 'mmSidebarScroll',

    init: function() {
      var self = this;
      this.contenedor = document.getElementById('sidebar-contenedor');
      if (!this.contenedor) {
        console.error('No se encontró #sidebar-contenedor');
        return;
      }

      // Ancho fijo para evitar colapso y desplazamiento a la derecha
      this.contenedor.style.width = '250px';
      this.contenedor.style.minWidth = '250px';
      this.contenedor.style.flexShrink = '0';

      this.inyectarHTML();
    },

    inyectarHTML: function() {
      var self = this;
      fetch('/assets/sidebar.html')
        .then(function(res) {
          if (!res.ok) throw new Error('No se pudo cargar sidebar.html');
          return res.text();
        })
        .then(function(html) {
          self.contenedor.innerHTML = html;
          self.marcarActivo(window.location.pathname);
          self.restaurarAcordeon();
          self.restaurarScroll();
        })
        .catch(function(e) {
          console.error('Error inyectando sidebar:', e);
        });
    },

    // ===== ACORDEÓN =====
    guardarEstado: function(clave, abierto) {
      var estado = {};
      try { estado = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}'); } catch(e) {}
      estado[clave] = abierto ? 'open' : 'closed';
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estado));
    },

    toggleIcon: function(btn) {
      var icon = btn.querySelector('.bi-chevron-down, .bi-chevron-up');
      if (!icon) return;
      if (btn.classList.contains('collapsed')) {
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-up');
      } else {
        icon.classList.remove('bi-chevron-up');
        icon.classList.add('bi-chevron-down');
      }
    },

    initAcordeonListeners: function() {
      var self = this;
      document.querySelectorAll('#accordionProcesos .accordion-button').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var target = this.getAttribute('data-bs-target');
          if (!target) return;
          var clave = target.replace('#', '');
          var abierto = !this.classList.contains('collapsed');
          self.guardarEstado(clave, abierto);
          self.toggleIcon(this);
        });
      });
    },

    restaurarAcordeon: function() {
      var self = this;
      var estado = {};
      try { estado = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}'); } catch(e) {}
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
    },

    // ===== ACTIVO =====
    marcarActivo: function(url) {
      var ruta = url.split('?')[0].split('/').pop();
      if (this.contenedor) {
        this.contenedor.querySelectorAll('.nav-link').forEach(function(link) {
          var href = link.getAttribute('href');
          if (!href) return;
          var coincide = href === '/' + ruta || href.endsWith('/' + ruta) || href === ruta;
          link.classList.toggle('active', coincide);
          link.setAttribute('aria-current', coincide ? 'page' : null);
        });
      }
    },

    // ===== SCROLL =====
    guardarScroll: function() {
      var aside = document.querySelector('aside');
      if (aside) {
        sessionStorage.setItem(this.SCROLL_KEY, aside.scrollTop);
      }
    },

    restaurarScroll: function() {
      var aside = document.querySelector('aside');
      var scrollGuardado = sessionStorage.getItem(this.SCROLL_KEY);
      if (aside && scrollGuardado !== null) {
        aside.scrollTop = parseInt(scrollGuardado, 10);
        sessionStorage.removeItem(this.SCROLL_KEY);
      }
    }
  };

  // Inicializar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { sidebar.init(); });
  } else {
    sidebar.init();
  }

  window.sidebarInject = sidebar;
})();
