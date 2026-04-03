/*
 * utils.js — Calnic Online
 * Functii comune folosite in toate paginile.
 * Trebuie incarcat DUPA config.js si supabase.js, INAINTE de orice alt script de pagina.
 */

(function (w) {
  'use strict';

  // ─── LIMBA ────────────────────────────────────────────────────────────────

  var currentLang = localStorage.getItem('calnic-lang') || 'ro';

  /**
   * Schimba limba si actualizeaza toate elementele [data-ro] / [data-en].
   * @param {'ro'|'en'} lang
   */
  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('calnic-lang', lang);
    document.querySelectorAll('[data-ro]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val != null) el.innerHTML = val;
    });
    // Actualizeaza butoanele de limba
    var btnRo = document.getElementById('btn-ro');
    var btnEn = document.getElementById('btn-en');
    if (btnRo) btnRo.classList.toggle('active', lang === 'ro');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  }

  /**
   * Returneaza textul in limba curenta.
   * @param {string} ro
   * @param {string} en
   * @returns {string}
   */
  function t(ro, en) {
    return currentLang === 'en' ? en : ro;
  }

  /**
   * Returneaza limba curenta.
   * @returns {'ro'|'en'}
   */
  function lang() {
    return currentLang;
  }

  // ─── HTML ESCAPE ──────────────────────────────────────────────────────────

  /**
   * Escapeaza caractere HTML speciale pentru a preveni XSS.
   * @param {*} s
   * @returns {string}
   */
  function escH(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── ANI / DATE ───────────────────────────────────────────────────────────

  var YEAR_MIN = 1400;
  var YEAR_MAX = new Date().getFullYear();

  /**
   * Parseaza un an dintr-un string (accepta ~1920, spatii, liniute).
   * Returneaza null daca valoarea nu e valida.
   * @param {string} v
   * @returns {number|null}
   */
  function parseYear(v) {
    if (!v || !v.trim() || v.trim() === '—') return null;
    var n = parseInt(v.replace(/[~\s]/g, ''), 10);
    return (n >= YEAR_MIN && n <= YEAR_MAX) ? n : null;
  }

  /**
   * Formateaza un an pentru afisare (returneaza '—' daca null).
   * @param {number|null} year
   * @returns {string}
   */
  function formatYear(year) {
    return year ? String(year) : '—';
  }

  // ─── MESAJE / TOAST ───────────────────────────────────────────────────────

  /**
   * Afiseaza un mesaj intr-un element de feedback din pagina.
   * Tipuri: 'ok' | 'err' | 'info'
   * @param {string} elementId
   * @param {string} text
   * @param {'ok'|'err'|'info'} type
   * @param {number} [duration=5000]
   */
  function showMsg(elementId, text, type, duration) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.className = 'm-msg ' + (type || 'info');
    el.textContent = text;
    el.style.display = 'block';
    clearTimeout(el._msgTimer);
    el._msgTimer = setTimeout(function () {
      el.style.display = 'none';
    }, duration || 5000);
  }

  /**
   * Afiseaza un toast global (creeaza elementul daca nu exista).
   * @param {string} text
   * @param {'ok'|'err'|'info'} type
   * @param {number} [duration=4000]
   */
  function showToast(text, type, duration) {
    var toast = document.getElementById('calnic-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'calnic-toast';
      toast.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'padding:10px 22px',
        'border-radius:3px',
        'font-family:"EB Garamond",serif',
        'font-size:14px',
        'z-index:99999',
        'display:none',
        'box-shadow:0 4px 16px rgba(0,0,0,.6)',
        'white-space:nowrap',
        'pointer-events:none',
      ].join(';');
      document.body.appendChild(toast);
    }

    var colors = {
      ok:   { bg: '#082a10', border: '#207840', color: '#80e0a0' },
      err:  { bg: '#2a0808', border: '#803020', color: '#e08080' },
      info: { bg: '#12100a', border: '#b08030', color: '#d4a84a' },
    };
    var c = colors[type] || colors.info;
    toast.style.background = c.bg;
    toast.style.border = '1px solid ' + c.border;
    toast.style.color = c.color;
    toast.textContent = text;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.display = 'none';
    }, duration || 4000);
  }

  /**
   * Afiseaza o eroare de retea/supabase intr-un container.
   * @param {string} containerId   ID-ul elementului container
   * @param {string} title
   * @param {string} detail
   */
  function showErr(containerId, title, detail) {
    var el = document.getElementById(containerId) || document.querySelector('.container') || document.body;
    el.innerHTML =
      '<div style="text-align:center;padding:2rem;background:#1a0808;border:1px solid #c04040;border-radius:4px;margin:2rem auto;max-width:500px;">' +
        '<div style="color:#c04040;font-size:1.5rem;margin-bottom:.5rem;">&#9888; ' + escH(title) + '</div>' +
        '<div style="color:#f5eed8;font-size:.9rem;">' + escH(detail) + '</div>' +
        '<a href="familiile.html" style="display:inline-block;margin-top:1rem;color:#d4a84a;">&larr; Inapoi</a>' +
      '</div>';
  }

  // ─── NAVIGATIE — HAMBURGER ────────────────────────────────────────────────

  /**
   * Initializeaza butonul hamburger pentru meniul mobil.
   * Astepteaza DOMContentLoaded daca e nevoie.
   */
  function initHamburger() {
    function _init() {
      var ham = document.getElementById('hamburgerBtn');
      var menu = document.getElementById('navMobileMenu') || document.getElementById('navMobileMenu2');
      if (!ham || !menu) return;
      ham.addEventListener('click', function () {
        var open = menu.style.display === 'flex';
        menu.style.display = open ? 'none' : 'flex';
        ham.setAttribute('aria-expanded', String(!open));
      });
      document.addEventListener('click', function (e) {
        if (!ham.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
          ham.setAttribute('aria-expanded', 'false');
        }
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _init);
    } else {
      _init();
    }
  }

  // ─── BUTOANE SCROLL ───────────────────────────────────────────────────────

  /**
   * Actualizeaza vizibilitatea butoanelor scroll-sus / scroll-jos.
   */
  function updateScrollBtns() {
    var t = document.getElementById('scrollTop');
    var b = document.getElementById('scrollBottom');
    var scrolled = window.scrollY > 300;
    var atBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 100;
    if (t) { t.style.opacity = scrolled ? '1' : '0'; t.style.pointerEvents = scrolled ? 'auto' : 'none'; }
    if (b) { b.style.opacity = atBottom ? '0' : '1'; b.style.pointerEvents = atBottom ? 'none' : 'auto'; }
  }

  /**
   * Initializeaza butoanele de scroll sus/jos.
   */
  function initScrollBtns() {
    window.addEventListener('scroll', updateScrollBtns, { passive: true });
    updateScrollBtns();
  }

  // ─── INITIALIZARE LIMBA ───────────────────────────────────────────────────

  /**
   * Leaga butoanele RO/EN si aplica limba salvata.
   * Se apeleaza o singura data, la DOMContentLoaded.
   */
  function initLang() {
    var btnRo = document.getElementById('btn-ro') || document.getElementById('btn-ro-li');
    var btnEn = document.getElementById('btn-en') || document.getElementById('btn-en-li');
    if (btnRo) btnRo.addEventListener('click', function () { setLang('ro'); });
    if (btnEn) btnEn.addEventListener('click', function () { setLang('en'); });
    setLang(currentLang); // aplica la incarcare
  }

  // ─── URL PARAMS ───────────────────────────────────────────────────────────

  /**
   * Returneaza valoarea unui parametru din URL.
   * @param {string} name
   * @returns {string|null}
   */
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // ─── SUPABASE HELPERS ─────────────────────────────────────────────────────

  /**
   * Returneaza sesiunea curenta (async).
   * Returneaza null daca supabase nu e configurat sau nu e logat.
   * @returns {Promise<object|null>}
   */
  function getSession() {
    if (!window.supabase) return Promise.resolve(null);
    return window.supabase.auth.getSession().then(function (r) {
      return (r.data && r.data.session) ? r.data.session : null;
    }).catch(function () { return null; });
  }

  /**
   * Ruleaza o functie dupa ce Supabase e gata.
   * @param {Function} fn
   */
  function onSupabaseReady(fn) {
    if (window.supabase) {
      fn();
    } else {
      document.addEventListener('supabase:ready', fn);
    }
  }

  // ─── AUTO-INIT ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLang();
      initScrollBtns();
      initHamburger();
    });
  } else {
    initLang();
    initScrollBtns();
    initHamburger();
  }

  // ─── EXPORT PUBLIC ────────────────────────────────────────────────────────

  w.CalnicUtils = {
    // Limba
    lang:           lang,
    t:              t,
    setLang:        setLang,
    // Escape
    escH:           escH,
    // Date
    parseYear:      parseYear,
    formatYear:     formatYear,
    // Mesaje
    showMsg:        showMsg,
    showToast:      showToast,
    showErr:        showErr,
    // Navigatie
    initHamburger:  initHamburger,
    initScrollBtns: initScrollBtns,
    // URL
    getParam:       getParam,
    // Supabase
    getSession:     getSession,
    onSupabaseReady: onSupabaseReady,
  };

  // Alias globali pentru compatibilitate cu codul existent din HTML-uri
  w.escH        = escH;
  w.parseYear   = parseYear;
  w.formatYear  = formatYear;
  w.showMsg     = showMsg;
  w.showToast   = showToast;
  w.getParam    = getParam;
  w.getSession  = getSession;
  w.onSupabaseReady = onSupabaseReady;

}(window));
