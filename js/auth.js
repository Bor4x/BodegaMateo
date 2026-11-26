/* =========================================================
   Bodega Mateo · auth.js
   Inicio de sesión SIMULADO (prototipo visual).
   - No hay autenticación real ni hash de contraseña (RN01).
   - La contraseña escrita nunca se guarda.
   - Solo se guarda la marca de sesión en sessionStorage.
   Espacio de nombres global: window.BM
   ========================================================= */
(function (global) {
  'use strict';

  var BM = (global.BM = global.BM || {});

  /* ---------- Configuración ---------- */
  var DEMO_PASSWORD = 'mateo123';      // Solo para demostración
  var SESSION_KEY = 'bm_session';
  var SESSION_VALUE = 'active';
  var LOGIN_URL = 'index.html';
  var HOME_URL = 'dashboard.html';
  var REDIRECT_DELAY_MS = 700;

  /* ---------- API de sesión (reutilizable por otras pantallas) ---------- */
  function isLoggedIn() {
    try { return global.sessionStorage.getItem(SESSION_KEY) === SESSION_VALUE; }
    catch (e) { return false; }
  }

  function login(password) {
    if (password !== DEMO_PASSWORD) return false;
    try { global.sessionStorage.setItem(SESSION_KEY, SESSION_VALUE); }
    catch (e) { /* almacenamiento no disponible: la guardia redirigirá al login */ }
    return true;
  }

  function logout() {
    try { global.sessionStorage.removeItem(SESSION_KEY); }
    catch (e) { /* sin acción */ }
  }

  // Para pantallas internas: redirige al login si no hay sesión (RN01).
  function requireSession() {
    if (!isLoggedIn()) {
      global.location.replace(LOGIN_URL);
      return false;
    }
    return true;
  }

  BM.auth = {
    isLoggedIn: isLoggedIn,
    login: login,
    logout: logout,
    requireSession: requireSession
  };

  // app.js emite este evento al pulsar "Cerrar sesión".
  document.addEventListener('bm:logout', logout);

  /* ---------- Controlador de la pantalla P1 ---------- */
  function initLoginPage() {
    var form = document.getElementById('login-form');
    if (!form) return;

    var input = document.getElementById('password');
    var toggle = document.getElementById('toggle-password');
    var toggleIcon = toggle.querySelector('i');
    var errorBox = document.getElementById('login-error');
    var errorText = document.getElementById('login-error-text');
    var submit = document.getElementById('login-submit');
    var submitText = document.getElementById('login-submit-text');
    var spinner = document.getElementById('login-spinner');
    var busy = false;

    function showError(message) {
      errorText.textContent = message;
      errorBox.hidden = false;
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorBox.hidden = true;
      errorText.textContent = '';
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    }

    function setVisible(visible) {
      input.type = visible ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', visible ? 'true' : 'false');
      toggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
      toggleIcon.className = 'bi ' + (visible ? 'bi-eye-slash' : 'bi-eye');
    }

    function setLoading(loading) {
      busy = loading;
      submit.disabled = loading;
      spinner.hidden = !loading;
      submitText.textContent = loading ? 'Ingresando…' : 'Ingresar';
      form.setAttribute('aria-busy', loading ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setVisible(input.type === 'password');
    });

    input.addEventListener('input', clearError);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (busy) return;

      var value = input.value;

      if (value.length === 0) {
        showError('Ingresa tu contraseña.');
        input.focus();
        return;
      }

      if (!login(value)) {
        showError('Contraseña incorrecta. Inténtalo de nuevo.');
        input.value = '';
        setVisible(false);
        input.focus();
        return;
      }

      clearError();
      input.value = '';
      setVisible(false);
      setLoading(true);
      global.setTimeout(function () {
        global.location.replace(HOME_URL);
      }, REDIRECT_DELAY_MS);
    });

    // Si el navegador restaura la página desde caché (botón "atrás").
    global.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        setLoading(false);
        input.value = '';
        clearError();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
  } else {
    initLoginPage();
  }
})(window);