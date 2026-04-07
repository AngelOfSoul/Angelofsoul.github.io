/* transitions.js - Calnic Online
 * Safe page fade transitions that do not break browser back/forward.
 */
(function () {
  'use strict';

  function clearFade() {
    if (document.body) document.body.classList.remove('page-fade-out');
  }

  function shouldSkipLink(link, href) {
    if (!href) return true;
    if (href[0] === '#') return true;
    if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) return true;
    if (link.target === '_blank') return true;
    if (link.hasAttribute('download')) return true;
    return false;
  }

  // Ensure stale fade class is cleared on fresh load and bfcache restore.
  document.addEventListener('DOMContentLoaded', clearFade);
  window.addEventListener('pageshow', clearFade);
  window.addEventListener('popstate', function () {
    setTimeout(clearFade, 0);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) clearFade();
  });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;

    var href = link.getAttribute('href');
    if (shouldSkipLink(link, href)) return;

    e.preventDefault();
    clearFade();
    if (document.body) document.body.classList.add('page-fade-out');

    setTimeout(function () {
      window.location.href = href;
    }, 70);
  });
})();

