/* tree-access-guard.js
 * Restrict genealogy tree pages to authenticated users only.
 */
(function () {
  'use strict';

  var path = String((window.location && window.location.pathname) || '').toLowerCase();
  var file = path.split('/').pop();
  var protectedPages = {
    'genealogie.html': true,
    'genealogie-familie.html': true,
    'arborele-satului.html': true
  };
  if (!protectedPages[file]) return;

  document.documentElement.classList.add('co-tree-auth-pending');

  function injectHideStyle() {
    if (document.getElementById('co-tree-auth-style')) return;
    var st = document.createElement('style');
    st.id = 'co-tree-auth-style';
    st.textContent = 'html.co-tree-auth-pending body{visibility:hidden !important;}';
    document.head.appendChild(st);
  }

  function reveal() {
    document.documentElement.classList.remove('co-tree-auth-pending');
  }

  function deny() {
    var next = (window.location.pathname || '') + (window.location.search || '');
    window.location.replace('login.html?next=' + encodeURIComponent(next));
  }

  function getClient() {
    if (window.supabaseClient && window.supabaseClient.auth) return window.supabaseClient;
    if (window.appSupabase && window.appSupabase.auth) return window.appSupabase;
    if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getUser === 'function') return window.supabase;
    return null;
  }

  function checkAuth() {
    var client = getClient();
    if (!client) return false;
    client.auth.getUser().then(function (res) {
      var user = res && res.data && res.data.user;
      if (user) {
        reveal();
      } else {
        deny();
      }
    }).catch(function () {
      deny();
    });
    return true;
  }

  injectHideStyle();

  if (checkAuth()) return;

  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    if (checkAuth()) {
      clearInterval(timer);
      return;
    }
    if (tries >= 60) {
      clearInterval(timer);
      deny();
    }
  }, 100);

  document.addEventListener('supabase:ready', function () {
    if (checkAuth()) clearInterval(timer);
  });
})();

