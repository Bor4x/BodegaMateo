/* =========================================================
   Bodega Mateo · dashboard.js
   Controlador de P2 (Inicio): saludo, notificación, contadores,
   acciones rápidas, alertas recientes y productos destacados.
   Requiere: data.js, stock.js, auth.js y app.js (en ese orden).
   ========================================================= */
(function (global) {
  'use strict';

  var BM = (global.BM = global.BM || {});

  // RN01: sin sesión no se muestra ningún dato del negocio.
  if (!BM.auth || !BM.auth.requireSession()) return;

  var FEATURED_LIMIT = 4;
  var ALERTS_LIMIT = 3;

  function $(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function levelBadge(level) {
    var info = BM.level(level);
    return '<span class="bm-level" data-level="' + level + '">' +
      '<i class="bi ' + info.icon + '" aria-hidden="true"></i> ' + esc(info.label) + '</span>';
  }

  /* ---------- Saludo y fecha ---------- */
  function renderGreeting() {
    var now = new Date();
    var hour = now.getHours();
    var text = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    $('dash-greeting').textContent = text;
    $('dash-date').textContent = now.toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /* ---------- Datos derivados ---------- */
  function getPendingAlerts() {
    return BM.data.pendingAlerts()
      .map(function (alert) {
        return { alert: alert, product: BM.data.productById(alert.productId) };
      })
      .filter(function (item) { return item.product; })
      .sort(function (a, b) {
        return (BM.stock.rank(a.alert.level) - BM.stock.rank(b.alert.level)) ||
               (b.alert.seq - a.alert.seq);
      });
  }

  function getFeatured() {
    return BM.data.products()
      .map(function (product) { return { product: product, level: BM.stock.levelOf(product) }; })
      .filter(function (item) { return item.level !== 'normal'; })
      .sort(function (a, b) {
        return (BM.stock.rank(a.level) - BM.stock.rank(b.level)) ||
               a.product.name.localeCompare(b.product.name, 'es');
      })
      .slice(0, FEATURED_LIMIT);
  }

  /* ---------- Notificación visual ---------- */
  function renderNotice(pending) {
    var count = pending.length;
    var level = 'normal';
    var icon = 'bi-check-circle-fill';
    var title = 'No tienes alertas pendientes';
    var text = 'Tu inventario está al día.';

    if (count > 0) {
      level = pending[0].alert.level;          // la más urgente
      icon = 'bi-bell-fill';
      title = 'Tienes ' + count + (count === 1 ? ' alerta pendiente' : ' alertas pendientes');
      text = 'Revisa los productos que requieren reposición.';
    }

    $('dash-notice').innerHTML =
      '<a class="bm-notice" data-level="' + level + '" href="alerts.html">' +
        '<span class="bm-notice__icon"><i class="bi ' + icon + '" aria-hidden="true"></i></span>' +
        '<span class="bm-notice__body"><strong>' + esc(title) + '</strong><span>' + esc(text) + '</span></span>' +
        '<i class="bi bi-chevron-right bm-notice__go" aria-hidden="true"></i>' +
      '</a>';
  }

  /* ---------- Contadores ---------- */
  function statCard(label, value, level) {
    return '<div class="bm-stat"' + (level ? ' data-level="' + level + '"' : '') + '>' +
      '<p class="bm-stat__label">' + esc(label) + '</p>' +
      '<p class="bm-stat__value">' + value + '</p></div>';
  }

  function renderStats() {
    var s = BM.stock.summary(BM.data.products());
    $('dash-stats').innerHTML =
      statCard('Total de productos', s.total, null) +
      statCard('Stock bajo', s.low, 'low') +
      statCard('Stock crítico', s.critical, 'critical') +
      statCard('Agotados', s.out, 'out');
  }

  /* ---------- Productos destacados ---------- */
  function renderFeatured() {
    var items = getFeatured();
    var box = $('dash-featured');

    if (!items.length) {
      box.innerHTML =
        '<div class="bm-empty" style="grid-column:1/-1">' +
          '<div class="bm-empty__icon"><i class="bi bi-check2-circle" aria-hidden="true"></i></div>' +
          '<h3>Todo en orden</h3><p class="mb-0">Ningún producto necesita reposición por ahora.</p></div>';
      return;
    }

    box.innerHTML = items.map(function (item) {
      var p = item.product;
      var category = BM.data.categories[p.category] || '';
      return '<article class="bm-item" data-level="' + item.level + '">' +
        '<header class="bm-item__head">' +
          '<div><h3 class="bm-item__title">' + esc(p.name) + '</h3>' +
          '<p class="bm-item__sub">' + esc(category) + '</p></div>' +
          levelBadge(item.level) +
        '</header>' +
        '<dl class="bm-item__meta">' +
          '<div><dt>Stock actual</dt><dd>' + p.stock + ' un.</dd></div>' +
          '<div><dt>Stock mínimo</dt><dd>' + p.min + ' un.</dd></div>' +
        '</dl>' +
        '<div class="bm-item__actions">' +
          '<a class="btn btn-outline-secondary" href="inventory.html?producto=' + encodeURIComponent(p.id) + '">Ver/Editar</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- Alertas recientes ---------- */
  function renderAlerts(pending) {
    var box = $('dash-alerts');

    if (!pending.length) {
      box.innerHTML =
        '<div class="bm-card"><div class="bm-empty">' +
          '<div class="bm-empty__icon"><i class="bi bi-bell-slash" aria-hidden="true"></i></div>' +
          '<h3>No hay alertas pendientes</h3>' +
          '<p class="mb-0">Los productos con stock bajo aparecerán aquí.</p></div></div>';
      return;
    }

    box.innerHTML = '<ul class="bm-alert-list">' +
      pending.slice(0, ALERTS_LIMIT).map(function (item) {
        var a = item.alert;
        var p = item.product;
        return '<li><a class="bm-alert-row" data-level="' + a.level + '" href="alerts.html">' +
          '<span class="bm-alert-row__body">' +
            '<span class="bm-alert-row__name">' + esc(p.name) + '</span>' +
            '<span class="bm-alert-row__meta">' + p.stock + ' de ' + p.min + ' un. · ' + esc(a.at) + '</span>' +
          '</span>' + levelBadge(a.level) +
        '</a></li>';
      }).join('') + '</ul>';
  }

  /* ---------- Render general ---------- */
  function renderAll() {
    var pending = getPendingAlerts();
    renderGreeting();
    renderNotice(pending);
    renderStats();
    renderFeatured();
    renderAlerts(pending);
    BM.setAlertCount(pending.length);
  }

  function init() {
    renderAll();
    var reset = $('dash-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        BM.data.reset();
        renderAll();
        BM.toast('Datos de demostración restablecidos.', { type: 'success' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);