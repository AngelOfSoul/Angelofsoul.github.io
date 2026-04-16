/*
 * utils.js — Calnic Online
 * Functii comune folosite in toate paginile.
 * Trebuie incarcat DUPA config.js si supabase.js, INAINTE de orice alt script de pagina.
 */

(function (w) {
  'use strict';

  // ─── LIMBA ────────────────────────────────────────────────────────────────

  var currentLang = (localStorage.getItem('calnic-lang') || 'ro');
  if (currentLang !== 'ro' && currentLang !== 'en') currentLang = 'ro';

  /**
   * Schimba limba si actualizeaza toate elementele [data-ro] / [data-en].
   * @param {'ro'|'en'} lang
   */
  function setLang(lang) {
    if (lang !== 'ro' && lang !== 'en') lang = 'ro';
    currentLang = lang;
    localStorage.setItem('calnic-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-ro]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val == null) return;
      if (el.matches('input, textarea')) {
        el.placeholder = val;
        if (el.hasAttribute('title')) el.title = val;
        return;
      }
      if (el.matches('option')) {
        el.textContent = val;
        return;
      }
      el.innerHTML = val;
    });
    // Actualizeaza butoanele de limba
    var btnRo = document.getElementById('btn-ro');
    var btnEn = document.getElementById('btn-en');
    if (btnRo) btnRo.classList.toggle('active', lang === 'ro');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    document.dispatchEvent(new CustomEvent('calnic:langchange', {
      detail: { lang: lang }
    }));
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
        'padding:10px 16px',
        'border-radius:3px',
        'font-family:"EB Garamond",serif',
        'font-size:14px',
        'z-index:99999',
        'display:none',
        'opacity:0',
        'transition:opacity .18s ease',
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
    var icon = type === 'ok' ? '✓' : (type === 'err' ? '✕' : '•');
    toast.textContent = icon + ' ' + text;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.style.display = 'none'; }, 180);
    }, duration || 4000);
  }

  var _dlgRefs = null;
  var _dlgQueue = Promise.resolve();

  function queueDialog(openFn) {
    _dlgQueue = _dlgQueue.then(openFn, openFn);
    return _dlgQueue;
  }

  function ensureDialogUi() {
    if (_dlgRefs) return _dlgRefs;

    var styleId = 'calnic-dialog-style';
    if (!document.getElementById(styleId)) {
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent = [
        '.calnic-dlg-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.72);z-index:100000;}',
        '.calnic-dlg-backdrop.open{display:flex;}',
        '.calnic-dlg{width:min(520px,100%);background:linear-gradient(180deg,#141414,#0e0e0e);border:1px solid #8a6a30;border-radius:4px;box-shadow:0 20px 60px rgba(0,0,0,.6);padding:18px;}',
        '.calnic-dlg-title{font-family:"Playfair Display",serif;font-size:24px;color:#d4a84a;margin:0 0 8px;}',
        '.calnic-dlg-msg{font-family:"EB Garamond",serif;color:#ece4d0;font-size:18px;line-height:1.45;white-space:pre-wrap;}',
        '.calnic-dlg-input{width:100%;margin-top:12px;background:#111;border:1px solid #3a2f1d;border-radius:2px;padding:10px 12px;color:#ece4d0;font-family:"EB Garamond",serif;font-size:18px;outline:none;}',
        '.calnic-dlg-input:focus{border-color:#b08030;}',
        '.calnic-dlg-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;flex-wrap:wrap;}',
        '.calnic-dlg-btn{min-width:112px;padding:9px 16px;border-radius:2px;border:1px solid #3f2f18;background:#111;color:#d4a84a;font-family:"Playfair Display",serif;letter-spacing:1px;cursor:pointer;}',
        '.calnic-dlg-btn:hover{border-color:#b08030;color:#e6c97f;}',
        '.calnic-dlg-btn.primary{background:linear-gradient(180deg,#2a1d0e,#181107);border-color:#b08030;color:#f0d79f;}',
      ].join('');
      document.head.appendChild(style);
    }

    var root = document.createElement('div');
    root.className = 'calnic-dlg-backdrop';
    root.innerHTML = '' +
      '<div class="calnic-dlg" role="dialog" aria-modal="true" aria-labelledby="calnic-dlg-title">' +
        '<h3 id="calnic-dlg-title" class="calnic-dlg-title">Calnic Online</h3>' +
        '<div class="calnic-dlg-msg" id="calnic-dlg-msg"></div>' +
        '<input id="calnic-dlg-input" class="calnic-dlg-input" type="text" autocomplete="off">' +
        '<div class="calnic-dlg-actions">' +
          '<button id="calnic-dlg-cancel" class="calnic-dlg-btn"></button>' +
          '<button id="calnic-dlg-ok" class="calnic-dlg-btn primary"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    _dlgRefs = {
      root: root,
      title: root.querySelector('#calnic-dlg-title'),
      msg: root.querySelector('#calnic-dlg-msg'),
      input: root.querySelector('#calnic-dlg-input'),
      ok: root.querySelector('#calnic-dlg-ok'),
      cancel: root.querySelector('#calnic-dlg-cancel')
    };
    return _dlgRefs;
  }

  function openDialog(type, message, options) {
    options = options || {};
    return new Promise(function (resolve) {
      var refs = ensureDialogUi();
      var active = document.activeElement;
      var done = false;
      var labels = {
        title: options.title || 'Calnic Online',
        ok: options.okText || t('OK', 'OK'),
        cancel: options.cancelText || t('Anuleaza', 'Cancel')
      };

      refs.title.textContent = labels.title;
      refs.msg.textContent = String(message == null ? '' : message);
      refs.input.value = options.defaultValue == null ? '' : String(options.defaultValue);
      refs.input.style.display = type === 'prompt' ? 'block' : 'none';
      refs.cancel.style.display = type === 'alert' ? 'none' : 'inline-block';
      refs.ok.textContent = labels.ok;
      refs.cancel.textContent = labels.cancel;

      function close(result) {
        if (done) return;
        done = true;
        refs.root.classList.remove('open');
        refs.ok.removeEventListener('click', onOk);
        refs.cancel.removeEventListener('click', onCancel);
        refs.root.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onKeyDown, true);
        if (active && active.focus) {
          try { active.focus(); } catch (e) {}
        }
        resolve(result);
      }

      function onOk() {
        close(type === 'prompt' ? String(refs.input.value || '') : true);
      }
      function onCancel() {
        if (type === 'alert') close(true);
        else close(type === 'prompt' ? null : false);
      }
      function onBackdrop(e) {
        if (e.target === refs.root) onCancel();
      }
      function onKeyDown(e) {
        if (!refs.root.classList.contains('open')) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (e.key === 'Enter') {
          if (type !== 'prompt' || document.activeElement === refs.input) {
            e.preventDefault();
            onOk();
          }
        }
      }

      refs.ok.addEventListener('click', onOk);
      refs.cancel.addEventListener('click', onCancel);
      refs.root.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onKeyDown, true);

      refs.root.classList.add('open');
      setTimeout(function () {
        if (type === 'prompt') refs.input.focus();
        else refs.ok.focus();
      }, 0);
    });
  }

  function dialogAlert(message, options) {
    return queueDialog(function () { return openDialog('alert', message, options); });
  }
  function dialogConfirm(message, options) {
    return queueDialog(function () { return openDialog('confirm', message, options); });
  }
  function dialogPrompt(message, defaultValue, options) {
    var opts = options || {};
    opts.defaultValue = defaultValue == null ? '' : defaultValue;
    return queueDialog(function () { return openDialog('prompt', message, opts); });
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
    function syncHamburgerState(ham, menu, open) {
      menu.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', String(open));
      if (ham.dataset.calnicToggleIcon === 'true') {
        ham.textContent = open ? '\u2715' : '\u2630';
      }
    }

    function bindHamburgerPair(buttonId, menuId) {
      var ham = document.getElementById(buttonId);
      var menu = document.getElementById(menuId);
      if (!ham || !menu || ham.dataset.calnicHamburgerBound === 'true') return;
      ham.dataset.calnicHamburgerBound = 'true';
      ham.dataset.calnicToggleIcon = 'true';
      syncHamburgerState(ham, menu, menu.classList.contains('open'));
      ham.addEventListener('click', function (e) {
        e.stopPropagation();
        syncHamburgerState(ham, menu, !menu.classList.contains('open'));
      });
      document.addEventListener('click', function (e) {
        if (!ham.contains(e.target) && !menu.contains(e.target)) {
          syncHamburgerState(ham, menu, false);
        }
      });
    }

    function _init() {
      bindHamburgerPair('hamburgerBtn', 'navMobileMenu');
      bindHamburgerPair('hamburgerBtn2', 'navMobileMenu2');
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
    var stored = localStorage.getItem('calnic-lang');
    if (stored === 'ro' || stored === 'en') currentLang = stored;
    else currentLang = 'ro';

    var btnRo = document.getElementById('btn-ro') || document.getElementById('btn-ro-li');
    var btnEn = document.getElementById('btn-en') || document.getElementById('btn-en-li');
    if (btnRo) btnRo.addEventListener('click', function () { setLang('ro'); });
    if (btnEn) btnEn.addEventListener('click', function () { setLang('en'); });
    if (window.setLang) { window.setLang(currentLang); } // aplica la incarcare

    // Keep language uniform when page toggles guest/member or dynamic fragments.
    document.addEventListener('calnic:viewchange', function () {
      setLang(currentLang);
    });
    window.addEventListener('pageshow', function () {
      setLang(currentLang);
    });
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
    if (!window.supabase || !window.supabase.auth) return Promise.resolve(null);
    return window.supabase.auth.getUser().then(function (r) {
      return (r && r.data && r.data.session) ? r.data.session : null;
    }).catch(function () { return null; });
  }

  function getUser() {
    if (!window.supabase || !window.supabase.auth) return Promise.resolve(null);
    return window.supabase.auth.getUser().then(function (r) {
      if (r && r.data && r.data.user) return r.data.user;
      if (r && r.data && r.data.session && r.data.session.user) return r.data.session.user;
      return null;
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
    dialogAlert:    dialogAlert,
    dialogConfirm:  dialogConfirm,
    dialogPrompt:   dialogPrompt,
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
  w.dialogAlert = dialogAlert;
  w.dialogConfirm = dialogConfirm;
  w.dialogPrompt = dialogPrompt;
  w.getParam    = getParam;
  w.getSession  = getSession;
  w.getUser     = getUser;
  w.onSupabaseReady = onSupabaseReady;
  w.setLang = setLang;

}(window));
