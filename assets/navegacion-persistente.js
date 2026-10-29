(function () {
  // Se añade inject-sidebar para que no se re-ejecute en cada navegación SPA
  var GLOBAL_SRC = /bootstrap|theme\.js|navegacion-persistente|inject-sidebar/;
  var EVENTO_CAMBIO = 'navegacion-persistente-cambio';

  function extraerDeHTML(htmlTexto) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlTexto, 'text/html');
    var body = doc.body;
    return {
      title: doc.title,
      main: body.querySelector('main'),
      modales: Array.from(body.querySelectorAll('.modal')),
      scripts: Array.from(body.querySelectorAll('script'))
    };
  }

  function ejecutarScripts(scripts) {
    scripts.forEach(function (original) {
      if (original.src && GLOBAL_SRC.test(original.src)) return;
      var s = document.createElement('script');
      Array.from(original.attributes).forEach(function (attr) {
        s.setAttribute(attr.name, attr.value);
      });
      if (original.src) s.src = original.src;
      else s.text = original.textContent;
      s.setAttribute('data-persistente', 'true');
      document.head.appendChild(s);
      if (!original.src) {
        s.onload = function () { s.remove(); };
        s.onerror = function () { s.remove(); };
      }
    });
  }

  function obtenerUrlBase(url) {
    return url.split('#')[0].split('?')[0];
  }

  function obtenerAncla(url) {
    var partes = url.split('#');
    return partes.length > 1 ? '#' + partes[1] : '';
  }

  function actualizarActivo(url) {
    document.querySelectorAll('aside .nav-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var coincide = href === url;
      link.classList.toggle('active', coincide);
      link.setAttribute('aria-current', coincide ? 'page' : null);
    });
  }

  function aplicarAncla(ancla) {
    if (!ancla) return;
    setTimeout(function () {
      var btn = document.querySelector('button[data-bs-target="' + ancla + '"], a[data-bs-target="' + ancla + '"]');
      if (btn) {
        btn.click();
      }
      var el = document.querySelector(ancla);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function navegar(url) {
    var urlBase = obtenerUrlBase(url);
    if (!/\.html$/i.test(urlBase)) return;

    // Guardar scroll del sidebar antes de navegar
    var asideActual = document.querySelector('aside');
    if (asideActual) {
      sessionStorage.setItem('mmSidebarScroll', asideActual.scrollTop);
    }

    // Mismo archivo, solo cambió el hash (ej: pestañas dentro de seguridad.html)
    if (urlBase === window.location.pathname + window.location.search) {
      var ancla = obtenerAncla(url);
      var anclaActual = obtenerAncla(window.location.href);
      if (ancla && ancla !== anclaActual) {
        window.location.hash = ancla;
      }
      return;
    }

    fetch(urlBase, { headers: { 'X-Requested-With': 'fetch' } })
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar ' + url);
        return res.text();
      })
      .then(function (html) {
        var extraido = extraerDeHTML(html);

        // Solo reemplazar el <main>. El sidebar (<aside>) nunca se toca.
        var mainActual = document.querySelector('main');
        if (mainActual) {
          mainActual.remove();
        }

        var contenedorPagina = document.querySelector('.d-flex') || document.body;
        if (extraido.main) {
          var aside = contenedorPagina.querySelector('aside');
          if (aside && aside.parentNode === contenedorPagina) {
            aside.parentNode.insertBefore(extraido.main, aside.nextSibling);
          } else {
            contenedorPagina.appendChild(extraido.main);
          }
        }

        // Reemplazar modales
        document.body.querySelectorAll('.modal').forEach(function (m) { m.remove(); });
        extraido.modales.forEach(function (m) { document.body.appendChild(m); });

        // Ejecutar scripts de la página destino (menos los globales)
        document.body.querySelectorAll('script[data-persistente="true"]').forEach(function (s) { s.remove(); });
        ejecutarScripts(extraido.scripts);

        // Restaurar scroll del sidebar
        var scrollGuardado = sessionStorage.getItem('mmSidebarScroll');
        if (scrollGuardado !== null) {
          var aside2 = document.querySelector('aside');
          if (aside2) {
            aside2.scrollTop = parseInt(scrollGuardado, 10);
          }
          sessionStorage.removeItem('mmSidebarScroll');
        }

        if (extraido.title) document.title = extraido.title;
        actualizarActivo(url);
        aplicarAncla(obtenerAncla(url));
        history.pushState(null, '', url);

        window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: { url: url } }));
      })
      .catch(function (err) {
        console.error(err);
        window.location.href = url;
      });
  }

  function inicializar() {
    actualizarActivo(window.location.pathname + window.location.search + window.location.hash);
    aplicarAncla(window.location.hash);

    document.body.addEventListener('click', function (e) {
      var enlace = e.target.closest('aside a[href]');
      if (!enlace) return;
      var href = enlace.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) return;
      if (enlace.getAttribute('data-bs-toggle') || enlace.getAttribute('data-bs-target')) return;
      if (enlace.getAttribute('data-bs-dismiss')) return;
      e.preventDefault();
      navegar(href);
    });

    window.addEventListener('popstate', function () {
      navegar(window.location.pathname + window.location.search + window.location.hash);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  window.navegacionPersistente = { navegarA: navegar, EVENTO_CAMBIO: EVENTO_CAMBIO };
})();
