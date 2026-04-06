/* scroll-effects.js — Calnic Online
 * Scroll reveal pentru .section
 * Înlocuiește wow.js — compatibil 100% cu clasele existente.
 * Loaded LAST în fiecare pagină.
 */
(function() {
  'use strict';

  function checkSections() {
    document.querySelectorAll('.section').forEach(function(s) {
      var rect = s.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        s.classList.add('visible');
      }
    });
  }

  // Verifică la scroll
  window.addEventListener('scroll', checkSections, { passive: true });

  // Verifică la load (pentru elementele deja vizibile)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSections);
  } else {
    checkSections();
  }
})();
