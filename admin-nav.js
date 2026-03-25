/*
 * admin-nav.js — Calnic Online
 * Add this script to every HTML page.
 * It does two things:
 *   1. Injects a hidden "Admin" link in the nav — visible only to is_admin accounts
 *   2. Fixes the dashboard spinner by checking session on every page load
 *
 * Usage: <script src="admin-nav.js"></script>
 * Place AFTER supabase.js in the <head> or just before </body>
 */

(function () {

  /* CSS for the admin nav link — injected once */
  var style = document.createElement('style');
  style.textContent = '.calnic-admin-link { display:none !important; } .calnic-admin-link.visible { display:flex !important; }';
  document.head.appendChild(style);

  function injectAdminLinks() {
    /* Find all nav-right divs on the page and inject the admin link */
    document.querySelectorAll('.nav-right').forEach(function (navRight) {
      if (navRight.querySelector('.calnic-admin-link')) return; /* already injected */
      var link = document.createElement('a');
      link.className = 'nav-login calnic-admin-link';
      link.href = 'admin.html';
      link.title = 'Panou Admin';
      link.style.cssText = 'color:#c04040;border-left:1px solid #3a1010;';
      link.innerHTML = '&#9670; <span class="nl">Admin</span>';
      navRight.insertBefore(link, navRight.firstChild);
    });

    /* Mobile nav — inject admin link if not already there */
    document.querySelectorAll('.nav-mobile-menu, #navMobileMenu, #navMobileMenu2').forEach(function (menu) {
      if (menu.querySelector('.calnic-admin-mobile-link')) return;
      var link = document.createElement('a');
      link.className = 'nav-mobile-link calnic-admin-mobile-link';
      link.href = 'admin.html';
      link.style.cssText = 'display:none;color:#c04040;border-left:3px solid #c04040;';
      link.innerHTML = '&#9670; Admin';
      menu.insertBefore(link, menu.firstChild);
    });
  }

  function showAdminLinks() {
    document.querySelectorAll('.calnic-admin-link').forEach(function (el) {
      el.style.display = 'flex';
    });
    document.querySelectorAll('.calnic-admin-mobile-link').forEach(function (el) {
      el.style.display = 'flex';
    });
  }

  function checkAdmin() {
    if (!window.supabase) return;
    window.supabase.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (!session) return;
      window.supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()
        .then(function (r) {
          if (r.data && r.data.is_admin) {
            injectAdminLinks();
            showAdminLinks();
          }
        })
        .catch(function () {});
    });
  }

  /* Run after Supabase is ready */
  document.addEventListener('supabase:ready', function () {
    checkAdmin();
  });

  /* Also fix dashboard spinner — if we're on dashboard.html and session exists,
     make sure the page doesn't get stuck on "Se incarca..." */
  document.addEventListener('supabase:ready', function () {
    if (!window.supabase) return;
    var isDashboard = window.location.pathname.indexOf('dashboard') !== -1;
    if (!isDashboard) return;
    window.supabase.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (!session) {
        /* Not logged in — redirect to login */
        window.location.href = 'login.html';
      }
      /* If logged in, dashboard.html handles it from here */
    });
  });

})();
