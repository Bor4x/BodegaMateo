/* =========================================================
   Bodega Mateo · data.js
   Datos FICTICIOS de demostración (sin backend).
   - 48 productos activos y 8 alertas (3 pendientes).
   - El estado se guarda en localStorage solo al modificarse.
   - No contiene datos sensibles.
   Espacio de nombres global: window.BM
   ========================================================= */
(function (global) {
  'use strict';

  var BM = (global.BM = global.BM || {});

  var STORAGE_KEY = 'bm_data_v1';

  var CATEGORIES = {
    primera: 'Primera necesidad',
    otros: 'Otros'
  };

  // [id, nombre, categoría, stock actual, stock mínimo]
  var PRODUCT_ROWS = [
    ['p01', 'Arroz Costeño 1 kg',       'primera', 4, 8],
    ['p02', 'Aceite vegetal 1 L',       'primera', 1, 6],
    ['p03', 'Leche entera 1 L',         'primera', 0, 10],
    ['p04', 'Azúcar rubia 1 kg',        'primera', 4, 8],
    ['p05', 'Fideos spaghetti 500 g',   'primera', 5, 10],
    ['p06', 'Avena en hojuelas 400 g',  'primera', 3, 6],
    ['p07', 'Atún en conserva 170 g',   'primera', 0, 6],
    ['p08', 'Sal de mesa 1 kg',         'primera', 14, 6],
    ['p09', 'Harina preparada 1 kg',    'primera', 9, 5],
    ['p10', 'Lentejas 500 g',           'primera', 11, 6],
    ['p11', 'Frejol canario 500 g',     'primera', 10, 6],
    ['p12', 'Huevos (docena)',          'primera', 12, 6],
    ['p13', 'Leche evaporada 400 g',    'primera', 18, 8],
    ['p14', 'Pan de molde',             'primera', 7, 4],
    ['p15', 'Mantequilla 200 g',        'primera', 8, 4],
    ['p16', 'Café instantáneo 50 g',    'primera', 9, 4],
    ['p17', 'Quinua 500 g',             'primera', 8, 4],
    ['p18', 'Fideos tallarín 500 g',    'primera', 15, 8],
    ['p19', 'Mermelada de fresa 300 g', 'primera', 7, 3],
    ['p20', 'Garbanzo 500 g',           'primera', 9, 4],
    ['p21', 'Detergente en polvo 500 g','otros', 2, 8],
    ['p22', 'Gaseosa cola 1.5 L',       'otros', 16, 8],
    ['p23', 'Gaseosa 500 ml',           'otros', 22, 10],
    ['p24', 'Agua mineral 625 ml',      'otros', 30, 12],
    ['p25', 'Jugo en caja 1 L',         'otros', 14, 6],
    ['p26', 'Galletas de soda',         'otros', 24, 10],
    ['p27', 'Galletas dulces',          'otros', 20, 8],
    ['p28', 'Papas fritas (bolsa)',     'otros', 15, 6],
    ['p29', 'Caramelos (bolsa)',        'otros', 12, 5],
    ['p30', 'Chocolate en barra',       'otros', 18, 8],
    ['p31', 'Chicles',                  'otros', 24, 10],
    ['p32', 'Jabón de tocador',         'otros', 12, 6],
    ['p33', 'Papel higiénico x4',       'otros', 10, 5],
    ['p34', 'Lavavajilla 500 g',        'otros', 8, 4],
    ['p35', 'Lejía 1 L',                'otros', 9, 4],
    ['p36', 'Champú (sachet)',          'otros', 25, 10],
    ['p37', 'Pasta dental 75 ml',       'otros', 8, 4],
    ['p38', 'Bolsas plásticas',         'otros', 12, 5],
    ['p39', 'Servilletas',              'otros', 11, 5],
    ['p40', 'Esponja de cocina',        'otros', 13, 6],
    ['p41', 'Pilas AA x2',              'otros', 9, 4],
    ['p42', 'Encendedor',               'otros', 15, 6],
    ['p43', 'Fósforos',                 'otros', 20, 8],
    ['p44', 'Velas',                    'otros', 10, 4],
    ['p45', 'Cuaderno',                 'otros', 8, 3],
    ['p46', 'Lapicero',                 'otros', 20, 8],
    ['p47', 'Té filtrante x25',         'otros', 12, 5],
    ['p48', 'Chocolate en polvo 200 g', 'otros', 6, 3]
  ];

  // [id, producto, nivel al generarse, estado, momento (texto), orden de recencia]
  var ALERT_ROWS = [
    ['a01', 'p03', 'out',      'pending', 'Hoy, 6:10 a. m.',      8],
    ['a02', 'p02', 'critical', 'pending', 'Hoy, 5:50 a. m.',      7],
    ['a03', 'p04', 'low',      'pending', 'Ayer, 6:40 p. m.',     6],
    ['a04', 'p01', 'low',      'seen',    'Ayer, 11:15 a. m.',    5],
    ['a05', 'p07', 'out',      'seen',    'Ayer, 9:30 a. m.',     4],
    ['a06', 'p21', 'critical', 'seen',    'Hace 2 días',          3],
    ['a07', 'p05', 'low',      'seen',    'Hace 2 días',          2],
    ['a08', 'p06', 'low',      'seen',    'Hace 3 días',          1]
  ];

  function seed() {
    return {
      products: PRODUCT_ROWS.map(function (r) {
        return { id: r[0], name: r[1], category: r[2], stock: r[3], min: r[4], active: true };
      }),
      alerts: ALERT_ROWS.map(function (r) {
        return { id: r[0], productId: r[1], level: r[2], status: r[3], at: r[4], seq: r[5] };
      })
    };
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.alerts)) return parsed;
      }
    } catch (e) { /* almacenamiento no disponible o dato inválido: usar semilla */ }
    return seed();
  }

  var state = load();

  function save() {
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* sin acción: el prototipo sigue funcionando en memoria */ }
    return state;
  }

  function reset() {
    state = seed();
    try { global.localStorage.removeItem(STORAGE_KEY); }
    catch (e) { /* sin acción */ }
    return state;
  }

  function isActive(product) { return product.active !== false; }

  function productById(id) {
    for (var i = 0; i < state.products.length; i += 1) {
      if (state.products[i].id === id) return state.products[i];
    }
    return null;
  }

  BM.data = {
    categories: CATEGORIES,
    allProducts: function () { return state.products; },
    products: function () { return state.products.filter(isActive); },   // solo activos (RF04)
    productById: productById,
    alerts: function () { return state.alerts; },
    pendingAlerts: function () {
      return state.alerts.filter(function (alert) {
        var product = productById(alert.productId);
        return alert.status === 'pending' && product && isActive(product);
      });
    },
    save: save,
    reset: reset
  };
})(window);