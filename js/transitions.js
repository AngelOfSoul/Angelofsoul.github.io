/* transitions.js — Calnic Online
 * Fade between pages. No framework needed.
 * Loaded LAST in every HTML, after all other scripts.
 */
(function() {
  'use strict';

  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Skip: external, anchor, javascript:, mailto:, tel:
    if (href.startsWith('http') || href.startsWith('#') ||
        href.startsWith('javascript') || href.startsWith('mailto') ||
        href.startsWith('tel')) return;

    // Skip: new tab
    if (link.target === '_blank') return;

    e.preventDefault();

    document.body.classList.add('page-fade-out');

    setTimeout(function() {
      window.location.href = href;
    }, 150);
  });
})();
