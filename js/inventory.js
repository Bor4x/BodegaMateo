/* =========================================================
   Bodega Mateo · inventory.js
   Controlador para P3 (Registro de Producto) y la vista
   de Inventario (Listado de productos).
   ========================================================= */
(function (global) {
  'use strict';

  var BM = (global.BM = global.BM || {});

  // RN01: sin sesión no se muestra ningún dato del negocio.
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

  /* =========================================================
     VISTA 1: INVENTARIO (inventory.html)
     ========================================================= */
  function initInventoryView() {
    var grid = document.getElementById('inventory-grid');
    var searchInput = document.getElementById('inv-search');
    var chipsContainer = document.getElementById('inv-chips');
    var countDisplay = document.getElementById('inv-count');
    var emptyState = document.getElementById('inv-empty');

    if (!grid) return; // No estamos en inventory.html

    var currentFilter = 'all';
    var currentSearch = '';

    function render() {
      var products = BM.data.products(); // Solo activos
      
      // Filtrar
      var filtered = products.filter(function (p) {
        var matchSearch = p.name.toLowerCase().includes(currentSearch.toLowerCase());
        var matchFilter = currentFilter === 'all' || p.category === currentFilter;
        return matchSearch && matchFilter;
      });

      // Actualizar contador
      if (countDisplay) countDisplay.textContent = filtered.length;

      // Renderizar
      if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.hidden = false;
        return;
      }

      if (emptyState) emptyState.hidden = true;

      grid.innerHTML = filtered.map(function (p) {
        var level = BM.stock.levelOf(p);
        var categoryName = BM.data.categories[p.category] || p.category;
        return '<article class="bm-card bm-item" data-level="' + level + '">' +
          '<header class="bm-item__head">' +
            '<div><h3 class="bm-item__title">' + esc(p.name) + '</h3>' +
            '<p class="bm-item__sub">' + esc(categoryName) + '</p></div>' +
            levelBadge(level) +
          '</header>' +
          '<dl class="bm-item__meta">' +
            '<div><dt>Stock actual</dt><dd>' + p.stock + ' un.</dd></div>' +
            '<div><dt>Stock mínimo</dt><dd>' + p.min + ' un.</dd></div>' +
          '</dl>' +
          '<div class="bm-item__actions">' +
            '<button class="btn btn-outline-secondary btn-sm" data-bm-toast="Edición no disponible en el prototipo." data-bm-toast-type="info">Editar</button>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    // Eventos
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        currentSearch = e.target.value;
        render();
      });
    }

    if (chipsContainer) {
      chipsContainer.addEventListener('bm:filter', function (e) {
        currentFilter = e.detail.value;
        render();
      });
    }

    render();
  }

  /* =========================================================
     VISTA 2: REGISTRAR PRODUCTO (product-form.html)
     ========================================================= */
  function initProductFormView() {
    var form = document.getElementById('product-form');
    if (!form) return; // No estamos en product-form.html

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      
      var name = document.getElementById('prod-name').value.trim();
      var category = document.getElementById('prod-category').value;
      var stock = parseInt(document.getElementById('prod-stock').value, 10) || 0;
      var min = parseInt(document.getElementById('prod-min').value, 10) || 0;

      // Validación básica HTML5 (Bootstrap)
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      // Crear nuevo producto
      var newProduct = {
        id: 'p' + (Date.now()), // ID temporal único
        name: name,
        category: category,
        stock: stock,
        min: min,
        active: true
      };

      // Guardar en localStorage a través de BM.data
      // Nota: BM.data actualmente no tiene un método "add". 
      // Lo agregamos modificando el estado interno.
      var all = BM.data.allProducts();
      all.push(newProduct);
      BM.data.save();

      // Redirigir a la confirmación (P4) o al inventario
      global.location.href = 'product-success.html?type=create&name=' + encodeURIComponent(name);
    });
  }

  // Inicializar según la página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initInventoryView();
      initProductFormView();
    });
  } else {
    initInventoryView();
    initProductFormView();
  }

})(window);