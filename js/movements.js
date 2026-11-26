/* =========================================================
   Bodega Mateo · movements.js
   Controlador de P5 (Registrar Movimiento) y P4 (Registro Exitoso).
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

  /* =========================================================
     VISTA 1: FORMULARIO (movement.html)
     ========================================================= */
  function initMovementForm() {
    var form = document.getElementById('movement-form');
    if (!form) return;

    var typeSelect = document.getElementById('mov-type');
    var productSelect = document.getElementById('mov-product');
    var qtyInput = document.getElementById('mov-qty');
    var stockHint = document.getElementById('mov-stock-hint');
    var dateInput = document.getElementById('mov-date');
    var btnSubmit = document.getElementById('mov-submit');

    // Poner fecha de hoy por defecto
    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }

    // Cargar productos en el select
    var products = BM.data.products();
    products.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + ' (' + p.stock + ' disp.)';
      productSelect.appendChild(opt);
    });

    // Función para actualizar el hint del stock y validar salidas
    function updateStockHint() {
      var prodId = productSelect.value;
      var type = typeSelect.value;
      var product = BM.data.productById(prodId);

      if (!product) {
        stockHint.textContent = '';
        return;
      }

      var currentStock = product.stock;
      
      if (type === 'out') {
        stockHint.innerHTML = '<i class="bi bi-info-circle"></i> Stock actual disponible: <strong>' + currentStock + '</strong>.';
        qtyInput.max = currentStock;
        
        // Si el stock es 0, avisar
        if (currentStock === 0) {
          stockHint.innerHTML += ' <span class="text-danger">No puedes registrar salidas de un producto agotado.</span>';
        }
      } else {
        stockHint.innerHTML = '<i class="bi bi-info-circle"></i> Stock actual: <strong>' + currentStock + '</strong>.';
        qtyInput.removeAttribute('max');
      }
    }

    // Eventos de cambio
    typeSelect.addEventListener('change', updateStockHint);
    productSelect.addEventListener('change', updateStockHint);
    
    // Validar manualmente la salida
    qtyInput.addEventListener('input', function() {
      var type = typeSelect.value;
      var max = parseInt(qtyInput.max, 10);
      var val = parseInt(qtyInput.value, 10);
      
      if (type === 'out' && !isNaN(max) && val > max) {
        qtyInput.setCustomValidity('No hay suficiente stock disponible.');
      } else {
        qtyInput.setCustomValidity('');
      }
    });

    updateStockHint();

    // Envío del formulario
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      var type = typeSelect.value;
      var prodId = productSelect.value;
      var qty = parseInt(qtyInput.value, 10);
      var date = dateInput.value;
      var notes = document.getElementById('mov-notes').value.trim();

      var product = BM.data.productById(prodId);
      var prevStock = product.stock;
      var newStock = type === 'in' ? prevStock + qty : prevStock - qty;

      // Aplicar cambio (Simulación)
      product.stock = newStock;
      
      // Registrar alerta si bajó del mínimo
      var level = BM.stock.levelOf(product);
      if (level !== 'normal') {
        // Generar una alerta visual si no existe una pendiente para este producto
        var hasPending = BM.data.pendingAlerts().some(function(a) { return a.productId === product.id; });
        if (!hasPending) {
          var alerts = BM.data.alerts();
          alerts.push({
            id: 'a' + Date.now(),
            productId: product.id,
            level: level,
            status: 'pending',
            at: 'Ahora',
            seq: 99
          });
        }
      }

      BM.data.save();

      // Redirigir a P4 (Éxito) con los datos en la URL
      var params = new URLSearchParams({
        prod: product.name,
        type: type === 'in' ? 'Entrada' : 'Salida',
        qty: qty,
        prev: prevStock,
        new: newStock,
        date: date
      });
      
      global.location.href = 'movement-success.html?' + params.toString();
    });
  }

  /* =========================================================
     VISTA 2: ÉXITO (movement-success.html) - Wireframe P4
     ========================================================= */
  function initSuccessView() {
    var summaryBox = document.getElementById('success-summary');
    if (!summaryBox) return;

    var params = new URLSearchParams(window.location.search);
    var prodName = params.get('prod') || 'Producto desconocido';
    var type = params.get('type') || 'Movimiento';
    var qty = params.get('qty') || '0';
    var prevStock = params.get('prev') || '0';
    var newStock = params.get('new') || '0';
    var date = params.get('date') || '';

    // Formatear fecha
    var dateFormatted = date;
    if (date) {
      var parts = date.split('-');
      dateFormatted = parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    var isIn = type === 'Entrada';
    var iconClass = isIn ? 'bi-box-arrow-in-down' : 'bi-box-arrow-up';
    var colorClass = isIn ? 'var(--bm-normal-fg)' : 'var(--bm-critical-fg)';
    var bgClass = isIn ? 'var(--bm-normal-bg)' : 'var(--bm-critical-bg)';

    summaryBox.innerHTML = 
      '<div class="text-center mb-4">' +
        '<div class="bm-empty__icon mx-auto" style="background: ' + bgClass + '; color: ' + colorClass + ';">' +
          '<i class="bi ' + iconClass + '" aria-hidden="true"></i>' +
        '</div>' +
        '<h2 class="mb-1">¡Movimiento registrado!</h2>' +
        '<p class="text-muted">' + esc(type) + ' de ' + esc(qty) + ' unidades</p>' +
      '</div>' +
      
      '<div class="bm-card bg-light mb-4">' +
        '<h3 class="bm-section-title text-start mb-3">Resumen del movimiento</h3>' +
        '<dl class="row mb-0">' +
          '<dt class="col-sm-4 text-muted">Producto</dt>' +
          '<dd class="col-sm-8 fw-bold">' + esc(prodName) + '</dd>' +
          
          '<dt class="col-sm-4 text-muted">Fecha</dt>' +
          '<dd class="col-sm-8">' + esc(dateFormatted) + '</dd>' +
          
          '<dt class="col-sm-4 text-muted">Tipo</dt>' +
          '<dd class="col-sm-8">' + esc(type) + '</dd>' +
          
          '<dt class="col-sm-4 text-muted">Cantidad</dt>' +
          '<dd class="col-sm-8">' + esc(qty) + ' un.</dd>' +
          
          '<dt class="col-sm-4 text-muted">Stock anterior</dt>' +
          '<dd class="col-sm-8">' + esc(prevStock) + ' un.</dd>' +
          
          '<dt class="col-sm-4 text-muted">Stock actual</dt>' +
          '<dd class="col-sm-8 fw-bold text-dark fs-5">' + esc(newStock) + ' un.</dd>' +
        '</dl>' +
      '</div>' +

      '<div class="d-flex flex-column gap-2">' +
        '<a href="dashboard.html" class="btn btn-primary">Volver al inicio</a>' +
        '<a href="movement.html" class="btn btn-outline-secondary">Registrar otro movimiento</a>' +
      '</div>';
  }

  // Inicializar según la vista
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initMovementForm();
      initSuccessView();
    });
  } else {
    initMovementForm();
    initSuccessView();
  }

})(window);