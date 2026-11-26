/* =========================================================
   Bodega Mateo · inventory.js (Modificado: Edición)
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

  /* =========================================================
     VISTA 1: INVENTARIO (inventory.html)
     ========================================================= */
  function initInventoryView() {
    var grid = document.getElementById('inventory-grid');
    var searchInput = document.getElementById('inv-search');
    var chipsContainer = document.getElementById('inv-chips');
    var countDisplay = document.getElementById('inv-count');
    var emptyState = document.getElementById('inv-empty');

    if (!grid) return;

    var currentFilter = 'all';
    var currentSearch = '';

    // Leer parámetros URL
    var urlParams = new URLSearchParams(window.location.search);
    var qParam = urlParams.get('q');
    var prodParam = urlParams.get('producto');

    if (qParam && searchInput) {
      searchInput.value = qParam;
      currentSearch = qParam;
    }

    if (prodParam && !currentSearch) {
      var targetProd = BM.data.productById(prodParam);
      if (targetProd) {
        currentSearch = targetProd.name;
        if (searchInput) searchInput.value = targetProd.name;
      }
    }

    function render() {
      var products = BM.data.products();

      var filtered = products.filter(function (p) {
        var matchSearch = p.name.toLowerCase().includes(currentSearch.toLowerCase());
        var matchFilter = currentFilter === 'all' || p.category === currentFilter;
        return matchSearch && matchFilter;
      });

      if (countDisplay) countDisplay.textContent = filtered.length;

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
            // NUEVO: Botón de editar
            '<button class="btn btn-outline-secondary btn-sm btn-edit" data-id="' + esc(p.id) + '">' +
              '<i class="bi bi-pencil" aria-hidden="true"></i> Editar' +
            '</button>' +
            '<button class="btn btn-outline-danger btn-sm btn-delete" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '">' +
              '<i class="bi bi-trash" aria-hidden="true"></i> Eliminar' +
            '</button>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    // Eventos de búsqueda y filtros
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

    // NUEVO: Delegación de eventos para botones de la tarjeta (Editar / Eliminar)
    grid.addEventListener('click', function (e) {
      // --- Lógica de Edición ---
      var editBtn = e.target.closest('.btn-edit');
      if (editBtn) {
        var productId = editBtn.getAttribute('data-id');
        var product = BM.data.productById(productId);

        if (product) {
          // Abrir el modal y prellenar los campos
          var editModalEl = document.getElementById('editProductModal');
          var editModal = new bootstrap.Modal(editModalEl);

          document.getElementById('edit-id').value = product.id;
          document.getElementById('edit-name').value = product.name;
          document.getElementById('edit-category').value = product.category;
          document.getElementById('edit-stock').value = product.stock;
          document.getElementById('edit-min').value = product.min;
          document.getElementById('edit-price').value = product.price || '';

          editModal.show();
        }
        return;
      }

      // --- Lógica de Eliminación (Módulo anterior) ---
      var deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) {
        var delId = deleteBtn.getAttribute('data-id');
        var delName = deleteBtn.getAttribute('data-name');

        var delModalEl = document.getElementById('deleteProductModal');
        var delModalBody = document.getElementById('deleteProductName');
        var btnConfirm = document.getElementById('btnConfirmDelete');

        if (delModalEl && delModalBody && btnConfirm) {
          delModalBody.textContent = delName;
          btnConfirm.setAttribute('data-id', delId);

          var delModal = new bootstrap.Modal(delModalEl);
          delModal.show();
        }
      }
    });

    // NUEVO: Manejar el guardado de la edición
    var editForm = document.getElementById('edit-product-form');
    if (editForm) {
      editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!editForm.checkValidity()) {
          editForm.classList.add('was-validated');
          return;
        }

        var id = document.getElementById('edit-id').value;
        var updatedData = {
          name: document.getElementById('edit-name').value.trim(),
          category: document.getElementById('edit-category').value,
          stock: parseInt(document.getElementById('edit-stock').value, 10) || 0,
          min: parseInt(document.getElementById('edit-min').value, 10) || 0,
          price: parseFloat(document.getElementById('edit-price').value) || 0
        };

        var success = BM.data.updateProduct(id, updatedData);

        if (success) {
          // Cerrar modal
          var editModalEl = document.getElementById('editProductModal');
          var editModal = bootstrap.Modal.getInstance(editModalEl);
          editModal.hide();

          // Mostrar éxito
          BM.toast('Producto actualizado correctamente.', { type: 'success' });

          // Refrescar la lista
          render();
        }
      });
    }

    // NUEVO: Manejar la confirmación de eliminación
    var btnConfirmDelete = document.getElementById('btnConfirmDelete');
    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', function () {
        var productId = this.getAttribute('data-id');
        if (productId) {
          var success = BM.data.deleteProduct(productId);
          if (success) {
            var modalEl = document.getElementById('deleteProductModal');
            var modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            BM.toast('Producto eliminado correctamente.', { type: 'success' });
            render();
          }
        }
      });
    }

    render();
  }

  /* =========================================================
     VISTA 2: REGISTRAR PRODUCTO (product-form.html) - sin cambios
     ========================================================= */
  function initProductFormView() {
    // ... (código existente)
  }

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