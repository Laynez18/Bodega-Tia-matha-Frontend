(function () {
  var GLOBAL_SRC = /bootstrap|theme\.js|navegacion-persistente/;
  var EVENTO_CAMBIO = 'navegacion-persistente-cambio';
  var EVENTO_DESPUES = 'navegacion-persistente-despues';
  var SCROLL_KEY = 'mmSidebarScroll';

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

  function actualizarActivo(url) {
    var ruta = url.split('?')[0];
    document.querySelectorAll('aside .nav-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var coincide = href === ruta;
      link.classList.toggle('active', coincide);
      link.setAttribute('aria-current', coincide ? 'page' : null);
    });
  }

  function navegar(url) {
    if (!/\.html$/i.test(url)) return;
    if (url === window.location.pathname + window.location.search) return;

    // Guardar scroll del sidebar actual antes de navegar
    var asideActual = document.querySelector('aside');
    if (asideActual) {
      sessionStorage.setItem(SCROLL_KEY, asideActual.scrollTop);
    }

    fetch(url, { headers: { 'X-Requested-With': 'fetch' } })
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar ' + url);
        return res.text();
      })
      .then(function (html) {
        var extraido = extraerDeHTML(html);
        var body = document.body;

        var asideActual = body.querySelector('aside');
        var contenedorLayout = asideActual ? asideActual.parentElement : null;

        if (contenedorLayout) {
          var mainActual = contenedorLayout.querySelector('main');
          if (mainActual) mainActual.remove();
          if (extraido.main) {
            contenedorLayout.appendChild(extraido.main);
          }
        } else if (extraido.main) {
          var mainExistente = body.querySelector('main');
          if (mainExistente) mainExistente.remove();
          body.insertBefore(extraido.main, body.firstChild);
        }

        body.querySelectorAll('.modal').forEach(function (m) { m.remove(); });
        extraido.modales.forEach(function (m) { body.appendChild(m); });

        body.querySelectorAll('script[data-persistente="true"]').forEach(function (s) { s.remove(); });
        ejecutarScripts(extraido.scripts);

        if (extraido.title) document.title = extraido.title;
        actualizarActivo(url);
        history.pushState(null, '', url);

        window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: { url: url } }));
        window.dispatchEvent(new CustomEvent(EVENTO_DESPUES, { detail: { url: url } }));
      })
      .catch(function (err) {
        console.error(err);
        window.location.href = url;
      });
  }

  function inicializar() {
    // Enlaces del sidebar funcionan normalmente (recarga de página).
    // El estado del acordeón se conserva vía localStorage (ver inject-sidebar.js).
    document.body.addEventListener('click', function (e) {
      // Sin preventDefault: el enlace navega normalmente
    });

    window.addEventListener('popstate', function () {
      navegar(window.location.pathname + window.location.search);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  window.navegacionPersistente = { navegarA: navegar, EVENTO_CAMBIO: EVENTO_CAMBIO, EVENTO_DESPUES: EVENTO_DESPUES };
})();
