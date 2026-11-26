/* =========================================================
   Bodega Mateo · app.js
   Shell (sidebar, header, bottom nav, page header), connection
   state, toasts and generic behaviors. Scripts are classic (no
   ES modules) so the prototype also works from file://.
   Global namespace: window.BM
   ========================================================= */
(function (global) {
  'use strict';

  var BM = (global.BM = global.BM || {});

  /* ---------- Configuration ---------- */
  BM.config = {
    appName: 'Bodega Mateo',
    tagline: 'Gestión de inventario y reposición de productos',
    shortTagline: 'Inventario y reposición',
    ownerLabel: 'Propietaria',
    homeUrl: 'dashboard.html',
    loginUrl: 'index.html',
    nav: [
      { id: 'dashboard', label: 'Inicio',      icon: 'bi-house-door',       href: 'dashboard.html' },
      { id: 'movement',  label: 'Movimientos', icon: 'bi-arrow-left-right', href: 'movement.html' },
      { id: 'alerts',    label: 'Alertas',     icon: 'bi-bell',             href: 'alerts.html', badge: true }
    ]
  };

  BM.levels = {
    normal:   { label: 'Normal',        icon: 'bi-check-circle-fill' },
    low:      { label: 'Stock bajo',    icon: 'bi-exclamation-circle-fill' },
    critical: { label: 'Stock crítico', icon: 'bi-exclamation-triangle-fill' },
    out:      { label: 'Agotado',       icon: 'bi-x-octagon-fill' }
  };

  var TOAST_ICONS = {
    success: 'bi-check-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    danger:  'bi-x-octagon-fill',
    info:    'bi-info-circle-fill'
  };
  var TOAST_LEVEL = { success: 'normal', warning: 'low', danger: 'out' };

  var forcedOnline = null; // null = follow the browser; true/false = simulated

  /* ---------- Helpers ---------- */
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function create(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
  }

  BM.level = function (key) { return BM.levels[key] || BM.levels.normal; };

  /* ---------- Shell templates ---------- */
  function brandMarkup(modifier) {
    return '<a class="bm-brand ' + (modifier || '') + '" href="' + esc(BM.config.homeUrl) + '" aria-label="' + esc(BM.config.appName) + ', ir al inicio">' +
      '<span class="bm-brand-mark" aria-hidden="true"><i class="bi bi-basket2-fill"></i></span>' +
      '<span class="bm-brand-text"><span class="bm-brand-name">' + esc(BM.config.appName) + '</span>' +
      (modifier ? '' : '<span class="bm-brand-sub">' + esc(BM.config.shortTagline) + '</span>') +
      '</span></a>';
  }

  function navLink(item, variant, active) {
    var badge = item.badge ? '<span class="bm-nav-badge" data-bm-alert-badge hidden>0</span>' : '';
    var icon = '<i class="bi ' + item.icon + '" aria-hidden="true"></i>';
    var inner = variant === 'bottom'
      ? '<span class="bm-nav-icon">' + icon + badge + '</span><span>' + esc(item.label) + '</span>'
      : icon + '<span>' + esc(item.label) + '</span>' + badge;
    return '<a class="bm-nav-link' + (active ? ' is-active' : '') + '" href="' + esc(item.href) + '"' +
      (active ? ' aria-current="page"' : '') + '>' + inner + '</a>';
  }

  function buildSidebar(activeId) {
    var el = create('aside', 'bm-sidebar');
    el.innerHTML =
      brandMarkup('') +
      '<nav class="bm-sidenav" aria-label="Navegación principal">' +
        BM.config.nav.map(function (i) { return navLink(i, 'side', i.id === activeId); }).join('') +
      '</nav>' +
      '<div class="bm-sidebar-foot">' +
        '<span class="bm-tag"><i class="bi bi-eye" aria-hidden="true"></i> Prototipo visual</span>' +
        '<button type="button" class="btn btn-outline-secondary" data-bm-action="logout">' +
          '<i class="bi bi-box-arrow-right" aria-hidden="true"></i> Cerrar sesión</button>' +
      '</div>';
    return el;
  }

  function buildHeader() {
    var el = create('header', 'bm-header');
    el.innerHTML =
      brandMarkup('bm-brand--compact') +
      '<p class="bm-header-tagline">' + esc(BM.config.tagline) + '</p>' +
      '<div class="bm-header-end">' +
        '<span class="bm-conn" data-bm-conn data-state="online" aria-live="polite">' +
          '<span class="bm-conn-dot" aria-hidden="true"></span>' +
          '<span class="bm-conn-text d-none d-sm-inline">En línea</span>' +
        '</span>' +
        '<div class="dropdown">' +
          '<button type="button" class="bm-avatar" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menú de la propietaria">BM</button>' +
          '<ul class="dropdown-menu dropdown-menu-end bm-menu">' +
            '<li class="bm-menu-head"><strong>' + esc(BM.config.ownerLabel) + '</strong><span>' + esc(BM.config.appName) + '</span></li>' +
            '<li><hr class="dropdown-divider"></li>' +
            '<li><button type="button" class="dropdown-item" data-bm-action="logout">' +
              '<i class="bi bi-box-arrow-right" aria-hidden="true"></i> Cerrar sesión</button></li>' +
          '</ul>' +
        '</div>' +
      '</div>';
    return el;
  }

  function buildBottomNav(activeId) {
    var el = create('nav', 'bm-bottomnav');
    el.setAttribute('aria-label', 'Navegación principal');
    el.style.setProperty('--bm-nav-count', BM.config.nav.length);
    el.innerHTML = BM.config.nav.map(function (i) { return navLink(i, 'bottom', i.id === activeId); }).join('');
    return el;
  }

  function buildBanner() {
    var el = create('div', 'bm-banner',
      '<i class="bi bi-wifi-off" aria-hidden="true"></i>' +
      '<span>Sin conexión a internet. Tus datos se conservan en este dispositivo.</span>');
    el.setAttribute('role', 'status');
    el.setAttribute('data-bm-offline-banner', '');
    el.hidden = true;
    return el;
  }

  function buildPageHeader(main, data, banner) {
    var holder = document.createDocumentFragment();
    holder.appendChild(banner);
    if (data.bmTitle) {
      var head = create('div', 'bm-page-header');
      head.innerHTML =
        (data.bmBack ? '<a class="bm-back" href="' + esc(data.bmBack) + '" aria-label="Volver"><i class="bi bi-arrow-left" aria-hidden="true"></i></a>' : '') +
        '<div class="bm-page-heading"><h1 class="bm-page-title">' + esc(data.bmTitle) + '</h1>' +
        (data.bmSubtitle ? '<p class="bm-page-subtitle">' + esc(data.bmSubtitle) + '</p>' : '') +
        '</div><div class="bm-page-actions"></div>';
      var slot = main.querySelector('[data-bm-slot="actions"]');
      if (slot) head.querySelector('.bm-page-actions').appendChild(slot);
      holder.appendChild(head);
    }
    main.insertBefore(holder, main.firstChild);
  }

  function buildShell() {
    var main = document.getElementById('main-content');
    var body = document.body;
    if (!main || body.dataset.bmShell === 'off') return;

    var activeId = body.dataset.bmActive || '';
    var app = create('div', 'bm-app');
    var wrap = create('div', 'bm-main-wrap');
    var banner = buildBanner();

    var skip = create('a', 'bm-skip', 'Saltar al contenido');
    skip.href = '#main-content';
    body.insertBefore(skip, body.firstChild);

    main.parentNode.insertBefore(app, main);
    wrap.appendChild(buildHeader());
    wrap.appendChild(main);
    app.appendChild(buildSidebar(activeId));
    app.appendChild(wrap);
    app.appendChild(buildBottomNav(activeId));

    buildPageHeader(main, body.dataset, banner);
  }

  /* ---------- Alert badge ---------- */
  BM.setAlertCount = function (count) {
    var n = Math.max(0, parseInt(count, 10) || 0);
    document.querySelectorAll('[data-bm-alert-badge]').forEach(function (el) {
      el.textContent = n > 9 ? '9+' : String(n);
      el.hidden = n === 0;
      el.setAttribute('aria-label', n + (n === 1 ? ' alerta pendiente' : ' alertas pendientes'));
    });
  };

  /* ---------- Connection state (visual, RN04) ---------- */
  function isOnline() { return forcedOnline === null ? navigator.onLine !== false : forcedOnline; }

  function renderConnection() {
    var online = isOnline();
    var pill = document.querySelector('[data-bm-conn]');
    if (pill) {
      pill.setAttribute('data-state', online ? 'online' : 'offline');
      var text = pill.querySelector('.bm-conn-text');
      if (text) text.textContent = online ? 'En línea' : 'Sin conexión';
    }
    var banner = document.querySelector('[data-bm-offline-banner]');
    if (banner) banner.hidden = online;
  }

  BM.simulateConnection = function (state) {
    forcedOnline = state === 'offline' ? false : state === 'online' ? true : null;
    renderConnection();
  };

  /* ---------- Toasts ---------- */
  BM.toast = function (message, options) {
    var opts = options || {};
    var type = TOAST_ICONS[opts.type] ? opts.type : 'info';
    var container = document.querySelector('.bm-toast-container');
    if (!container) {
      container = create('div', 'bm-toast-container');
      document.body.appendChild(container);
    }
    var toast = create('div', 'toast bm-toast');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    if (TOAST_LEVEL[type]) toast.setAttribute('data-level', TOAST_LEVEL[type]);
    toast.innerHTML =
      '<div class="d-flex"><div class="toast-body"><i class="bi ' + TOAST_ICONS[type] + '" aria-hidden="true"></i><span></span></div>' +
      '<button type="button" class="btn-close me-3 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>';
    toast.querySelector('span').textContent = message;
    container.appendChild(toast);

    if (global.bootstrap && global.bootstrap.Toast) {
      var instance = new global.bootstrap.Toast(toast, { delay: opts.delay || 4500 });
      toast.addEventListener('hidden.bs.toast', function () { toast.remove(); });
      instance.show();
    } else {
      toast.classList.add('show');
    }
  };

  /* ---------- Generic behaviors (declarative) ---------- */
  function bindBehaviors() {
    document.addEventListener('click', function (event) {
      var target = event.target;

      var toastBtn = target.closest('[data-bm-toast]');
      if (toastBtn) {
        BM.toast(toastBtn.getAttribute('data-bm-toast'), { type: toastBtn.getAttribute('data-bm-toast-type') || 'info' });
        return;
      }

      var simBtn = target.closest('[data-bm-simulate]');
      if (simBtn) {
        BM.simulateConnection(simBtn.getAttribute('data-bm-simulate'));
        return;
      }

      var chip = target.closest('[data-bm-chips] .bm-chip');
      if (chip) {
        var group = chip.closest('[data-bm-chips]');
        group.querySelectorAll('.bm-chip').forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        group.dispatchEvent(new CustomEvent('bm:filter', {
          bubbles: true,
          detail: { value: chip.getAttribute('data-value') || '', group: group.getAttribute('data-bm-chips') || '' }
        }));
        return;
      }

      var logout = target.closest('[data-bm-action="logout"]');
      if (logout) {
        // auth.js can listen to this event to clear the session.
        document.dispatchEvent(new CustomEvent('bm:logout'));
        global.location.href = BM.config.loginUrl;
      }
    });

    global.addEventListener('online', renderConnection);
    global.addEventListener('offline', renderConnection);
  }

  /* ---------- Init ---------- */
  BM.init = function () {
    buildShell();
    BM.setAlertCount(document.body.dataset.bmAlerts || 0);
    renderConnection();
    bindBehaviors();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BM.init);
  } else {
    BM.init();
  }
})(window);