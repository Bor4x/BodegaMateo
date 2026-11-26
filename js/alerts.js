/* =========================================================
   Bodega Mateo · alerts.js
   Controlador de P6 (Alertas Pendientes).
   ========================================================= */
(function (global) {
  'use strict';

  var BM = (global.BM = global.BM || {});

  if (!BM.auth || !BM.auth.requireSession()) return;

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

  function initAlertsView() {
    var grid = document.getElementById('alerts-grid');
    var chipsContainer = document.getElementById('alerts-chips');
    var countDisplay = document.getElementById('alerts-count');
    var emptyState = document.getElementById('alerts-empty');

    if (!grid) return;

    var currentFilter = 'all';

    function render() {
      // Obtenemos las alertas pendientes ordenadas por gravedad
      var pending = BM.data.pendingAlerts()
        .map(function (alert) {
          return { alert: alert, product: BM.data.productById(alert.productId) };
        })
        .filter(function (item) { return item.product; })
        .sort(function (a, b) {
          // 1. Ordenar por nivel (out -> critical -> low)
          var rankDiff = BM.stock.rank(a.alert.level) - BM.stock.rank(b.alert.level);
          if (rankDiff !== 0) return rankDiff;
          // 2. Si son del mismo nivel, ordenar por recencia
          return b.alert.seq - a.alert.seq;
        });

      // Aplicar filtro de chips
      var filtered = pending.filter(function (item) {
        return currentFilter === 'all' || item.alert.level === currentFilter;
      });

      // Actualizar contador global (badge)
      BM.setAlertCount(pending.length);

      // Actualizar contador visual de la vista
      if (countDisplay) countDisplay.textContent = filtered.length;

      if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.hidden = false;
        return;
      }

      if (emptyState) emptyState.hidden = true;

      // Renderizar tarjetas de alerta
      grid.innerHTML = filtered.map(function (item) {
        var p = item.product;
        var a = item.alert;
        var category = BM.data.categories[p.category] || '';
        var missing = p.min - p.stock;
        
        // Texto extra según el nivel
        var missingText = a.level === 'out' 
          ? 'Agotado. Requiere pedido urgente.'
          : 'Faltan ' + missing + ' un. para el mínimo.';

        return '<article class="bm-item" data-level="' + a.level + '">' +
          '<header class="bm-item__head">' +
            '<div>' +
              '<h3 class="bm-item__title">' + esc(p.name) + '</h3>' +
              '<p class="bm-item__sub">' + esc(category) + ' · ' + esc(a.at) + '</p>' +
            '</div>' +
            levelBadge(a.level) +
          '</header>' +
          
          '<dl class="bm-item__meta">' +
            '<div><dt>Stock actual</dt><dd>' + p.stock + ' un.</dd></div>' +
            '<div><dt>Stock mínimo</dt><dd>' + p.min + ' un.</dd></div>' +
          '</dl>' +
          
          '<p class="small mb-0 ' + (a.level === 'out' ? 'text-danger' : 'text-muted') + '">' +
            '<i class="bi bi-info-circle"></i> ' + esc(missingText) +
          '</p>' +

          '<div class="bm-item__actions mt-2">' +
            '<button class="btn btn-sm btn-outline-secondary" data-bm-mark-seen="' + a.id + '">' +
              '<i class="bi bi-check2-all"></i> Marcar como visto' +
            '</button>' +
            '<a href="movement.html" class="btn btn-sm btn-primary">Reponer</a>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    // Eventos
    if (chipsContainer) {
      chipsContainer.addEventListener('bm:filter', function (e) {
        currentFilter = e.detail.value;
        render();
      });
    }

    // Delegación de eventos para el botón "Marcar como visto"
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-bm-mark-seen]');
      if (!btn) return;

      var alertId = btn.getAttribute('data-bm-mark-seen');
      var alerts = BM.data.alerts();
      var alertObj = alerts.find(function(x) { return x.id === alertId; });

      if (alertObj) {
        alertObj.status = 'seen'; // Cambiamos el estado
        BM.data.save();           // Guardamos en localStorage
        render();                 // Volvemos a renderizar
        BM.toast('Alerta marcada como vista.', { type: 'success' });
      }
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlertsView);
  } else {
    initAlertsView();
  }

})(window);