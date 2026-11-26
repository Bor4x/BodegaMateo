/* =========================================================
   Bodega Mateo · stock.js
   Evaluador de nivel de stock (equivale a CU-12).
   - El nivel CRÍTICO es PROVISIONAL: usa la mitad del stock
     mínimo y está pendiente de confirmar con la propietaria.
   - La proporción es una única constante configurable.
   Espacio de nombres global: window.BM
   ========================================================= */
(function (global) {
  'use strict';

  var BM = (global.BM = global.BM || {});

  var config = {
    criticalRatio: 0.5,   // PROVISIONAL: crítico si stock < mínimo × 0.5
    provisional: true
  };

  // Menor número = mayor urgencia
  var RANK = { out: 0, critical: 1, low: 2, normal: 3 };

  /**
   * Reglas (provisionales para "critical"):
   *   out      → stock = 0
   *   critical → stock < mínimo × criticalRatio
   *   low      → stock ≤ mínimo
   *   normal   → stock > mínimo
   */
  function level(stock, min) {
    var s = Number(stock);
    var m = Number(min);
    if (s <= 0) return 'out';
    if (s < m * config.criticalRatio) return 'critical';
    if (s <= m) return 'low';
    return 'normal';
  }

  function levelOf(product) {
    return level(product.stock, product.min);
  }

  function rank(levelKey) {
    return RANK.hasOwnProperty(levelKey) ? RANK[levelKey] : RANK.normal;
  }

  function summary(products) {
    var result = { total: 0, normal: 0, low: 0, critical: 0, out: 0 };
    products.forEach(function (product) {
      result.total += 1;
      result[levelOf(product)] += 1;
    });
    return result;
  }

  BM.stock = {
    config: config,
    level: level,
    levelOf: levelOf,
    rank: rank,
    summary: summary
  };
})(window);