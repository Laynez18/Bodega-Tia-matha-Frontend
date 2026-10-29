(function() {
  function activar(hash) {
    if (!hash) return;

    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(function(t) {
      t.classList.remove('active', 'show');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-pane').forEach(function(p) {
      p.classList.remove('show', 'active');
    });

    var btn = document.querySelector('[data-bs-target="' + hash + '"]');
    if (btn) {
      btn.classList.add('active', 'show');
      btn.setAttribute('aria-selected', 'true');
    }

    var pane = document.querySelector(hash);
    if (pane) {
      pane.classList.add('show', 'active');
    }
  }

  function sidebarActivo() {
    var hash = window.location.hash;
    var path = window.location.pathname;
    document.querySelectorAll('aside .nav-link').forEach(function(l) {
      l.classList.remove('active');
      l.removeAttribute('aria-current');
      var href = l.getAttribute('href');
      if (!href) return;
      var hrefBase = href.split('#')[0];
      var hrefHash = href.split('#')[1] || '';
      var coincideRuta = (hrefBase === path) || href.endsWith(path);
      var coincideHash = (!hash || hrefHash === hash.replace('#', ''));
      if (coincideRuta && coincideHash) {
        l.classList.add('active');
        l.setAttribute('aria-current', 'page');
      }
    });
  }

  function init() {
    activar(window.location.hash);
    sidebarActivo();

    document.body.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-bs-toggle="tab"]');
      if (!btn) return;
      var target = btn.getAttribute('data-bs-target');
      if (target && target.startsWith('#')) {
        window.location.hash = target;
        activar(target);
        sidebarActivo();
      }
    });

    window.addEventListener('hashchange', function() {
      activar(window.location.hash);
      sidebarActivo();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-inicializar cuando navegacion-persistente cargue una página nueva
  window.addEventListener('navegacion-persistente-cambio', function(e) {
    setTimeout(function() {
      activar(window.location.hash);
      sidebarActivo();
    }, 100);
  });
})();
