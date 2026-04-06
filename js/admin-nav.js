/*
admin-nav.js — Calnic Online v2 (FIXED)
*/
(function () {
document.documentElement.style.background = '#0a0a0a';

/* Local HTML-escape helper to prevent XSS from user-supplied data */
function _escH(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

var stickyStyle = document.createElement('style');
stickyStyle.textContent = [
  'nav { position:sticky; top:0; z-index:900; }',
  '.prf-btn-out { display:flex;align-items:center;gap:8px;margin:6px 10px;padding:7px 18px;background:var(--gold-d,#b08030);border:1px solid var(--gold,#d4a84a);border-radius:2px;font-family:"Playfair Display",serif;font-size:13px;font-weight:700;color:#050505;letter-spacing:1px;cursor:pointer;transition:all 0.2s;white-space:nowrap;text-decoration:none; }',
  '.prf-btn-out:hover { background:var(--gold,#d4a84a);color:#050505;text-decoration:none; }',
  '.prf-btn-in { display:flex;align-items:center;gap:8px;margin:5px 10px;padding:4px 12px 4px 4px;background:var(--s2,#161616);border:1px solid var(--gold-d,#b08030);border-radius:2px;cursor:pointer;transition:all 0.2s;position:relative;white-space:nowrap;text-decoration:none; }',
  '.prf-btn-in:hover { background:var(--s3,#1c1c1c);border-color:var(--gold,#d4a84a);text-decoration:none; }',
  '.prf-avatar { width:32px;height:32px;border-radius:50%;background:#1c1200;border:1.5px solid var(--gold,#d4a84a);display:flex;align-items:center;justify-content:center;font-family:"Playfair Display",serif;font-size:15px;color:var(--gold,#d4a84a);font-weight:700;flex-shrink:0;position:relative; }',
  '.prf-notif-dot { position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:#c04040;border:1.5px solid #111111;display:none; }',
  '.prf-notif-dot.show { display:block; }',
  '.prf-text { display:flex;flex-direction:column;gap:1px; }',
  '.prf-name { font-family:"Playfair Display",serif;font-size:13px;color:var(--gold,#d4a84a);line-height:1; }',
  '.prf-sub { font-size:10px;color:var(--gold-m,#7a5828);letter-spacing:1px;line-height:1; }',
  '.prf-dropdown { position:absolute;top:calc(100% + 4px);right:0;background:var(--s1,#111111);border:1px solid var(--gold-d,#b08030);border-radius:2px;min-width:180px;z-index:1000;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.6); }',
  '.prf-dropdown.show { display:block; }',
  '.prf-dd-item { display:flex;align-items:center;gap:10px;padding:10px 16px;font-family:"EB Garamond",serif;font-size:14px;color:var(--text,#f5eed8);cursor:pointer;transition:all 0.15s;text-decoration:none;border-bottom:1px solid var(--s3,#1c1c1c); }',
  '.prf-dd-item:last-child { border-bottom:none; }',
  '.prf-dd-item:hover { background:var(--s2,#161616);color:var(--gold,#d4a84a);text-decoration:none; }',
  '.prf-dd-item.logout { color:#a05050; }',
  '.prf-dd-item.logout:hover { color:#e08080;background:#1a0808; }',
  '.prf-dd-sep { height:1px;background:var(--s3,#1c1c1c);margin:0; }',
  '.calnic-admin-link { display:none!important; }',
  '.calnic-admin-link.show { display:flex!important;color:#c04040!important;border-left:1px solid #3a1010!important; }',
  '.calnic-admin-mobile-link { display:none!important; }',
  '.calnic-admin-mobile-link.show { display:flex!important;color:#c04040!important;border-left:3px solid #c04040!important; }',
  '.nav-lang { display:flex;align-items:center;gap:4px;padding:0 10px;border-left:1px solid var(--b1,#2a2a2a); }',
  '.nav-lang-btn { background:none;border:1px solid #585040;color:var(--text,#f5eed8);padding:2px 8px;cursor:pointer;font-family:"EB Garamond",serif;font-size:11px;letter-spacing:1px;transition:all 0.2s;border-radius:1px; }',
  '.nav-lang-btn.active { background:var(--gold-d,#b08030);border-color:var(--gold,#d4a84a);color:#050505;font-weight:700; }',
  '.nav-lang-btn:hover:not(.active) { border-color:var(--gold,#d4a84a); }',
  '.mobile-prf-float { display:none;position:fixed;bottom:20px;right:16px;z-index:9999;width:50px;height:50px;border-radius:50%;background:var(--gold-d,#b08030);border:2px solid var(--gold,#d4a84a);align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(0,0,0,0.5);text-decoration:none; }',
  '.mobile-prf-float:hover { background:var(--gold,#d4a84a);transform:scale(1.08); }',
  '.mobile-prf-float-av { font-family:"Playfair Display",serif;font-size:18px;color:#050505;font-weight:700; }',
  '.mobile-prf-float-notif { position:absolute;top:0;right:0;width:12px;height:12px;border-radius:50%;background:#c04040;border:2px solid #0a0a0a;display:none; }',
  '.mobile-prf-float-notif.show { display:block; }',
  '@media(max-width:740px) { .mobile-prf-float { display:flex; } }',
  '@media(min-width:741px) { .mobile-prf-float { display:none!important; } }',
  '.nav-link.active { background:var(--s2,#161616)!important;color:var(--gold,#d4a84a)!important;border-bottom:2px solid var(--gold,#d4a84a)!important;position:relative; }',
  '.nav-link.active::after { content:" ";position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:var(--gold,#d4a84a);border-radius:50%; }',
  '.nav-prf-divider { width:1px;background:linear-gradient(to bottom,transparent,var(--gold-d,#b08030),transparent);margin:8px 4px;flex-shrink:0; }',
  'body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }',
].join('\n');
document.head.appendChild(stickyStyle);

if (window.location.pathname.indexOf('login') !== -1) {
  function checkLoginRedirect() {
    if (!window.supabase) return;
    window.supabase.auth.getUser().then(function(res) {
      if (res.data && res.data.session) {
        window.location.href = 'dashboard.html';
      }
    });
  }
  if (window.supabase) { 
    checkLoginRedirect(); 
  } else { 
    document.addEventListener('supabase:ready', checkLoginRedirect); 
  }
}

function getActiveNavRights() {
  function isVisible(el) {
    if (!el) return false;
    var cs = window.getComputedStyle ? window.getComputedStyle(el) : null;
    return !cs || cs.display !== 'none';
  }
  var roots = [];
  var guest = document.getElementById('guest-view');
  var member = document.getElementById('member-view');
  if (isVisible(guest)) roots.push(guest);
  if (isVisible(member)) roots.push(member);
  if (!roots.length) roots = [document];
  var out = [];
  roots.forEach(function(root) {
    root.querySelectorAll('.nav-right').forEach(function(el) { out.push(el); });
  });
  return out;
}

function mergeLangIntoNav() {
  var langBar = document.querySelector('.lang-bar');
  var navRight = getActiveNavRights()[0] || null;
  if (!langBar || !navRight) return;
  if (navRight.querySelector('.nav-lang')) return;
  var btnRo = document.getElementById('btn-ro') || document.getElementById('btn-ro-li');
  var btnEn = document.getElementById('btn-en') || document.getElementById('btn-en-li');
  if (!btnRo || !btnEn) return;
  var langWrap = document.createElement('div');
  langWrap.className = 'nav-lang';
  var nbRo = document.createElement('button');
  nbRo.className = 'nav-lang-btn' + (btnRo.classList.contains('active') ? ' active' : '');
  nbRo.textContent = 'RO';
  nbRo.onclick = function() { btnRo.click(); nbRo.classList.add('active'); nbEn.classList.remove('active'); };
  var nbEn = document.createElement('button');
  nbEn.className = 'nav-lang-btn' + (btnEn.classList.contains('active') ? ' active' : '');
  nbEn.textContent = 'EN';
  nbEn.onclick = function() { btnEn.click(); nbEn.classList.add('active'); nbRo.classList.remove('active'); };
  langWrap.appendChild(nbRo);
  langWrap.appendChild(nbEn);
  navRight.appendChild(langWrap);
  langBar.style.display = 'none';
}

function buildProfileButton(session, familyName, hasNotif, isAdmin) {
  var navRights = getActiveNavRights();
  if (!navRights.length) return;

  navRights.forEach(function(navRight) {
    navRight.querySelectorAll('.prf-btn-out, .prf-btn-in, .prf-btn-wrap').forEach(function(el){ el.remove(); });
    navRight.querySelectorAll('.nav-login:not(.calnic-admin-link)').forEach(function(el){ el.remove(); });

    if (!navRight.querySelector('.nav-prf-divider')) {
      var div = document.createElement('div');
      div.className = 'nav-prf-divider';
      navRight.insertBefore(div, navRight.firstChild);
    }

    if (!session) {
      var outBtn = document.createElement('a');
      outBtn.className = 'prf-btn-out';
      outBtn.href = 'login.html';
      outBtn.innerHTML = 'Profilul meu';
      navRight.appendChild(outBtn);
      return;
    }

    var profileName = isAdmin ? 'Admin' : (familyName || 'Profilul meu');
    var profileSub = isAdmin ? 'ADMIN' : 'PROFILUL MEU';
    var initial = profileName ? profileName.charAt(0).toUpperCase() : '?';
    var wrap = document.createElement('div');
    wrap.className = 'prf-btn-wrap';
    wrap.style.cssText = 'position:relative;display:flex;align-items:center;';
    var btn = document.createElement('a');
    btn.className = 'prf-btn-in';
    btn.href = 'dashboard.html';
    btn.innerHTML =
      ' <div class="prf-avatar">' + _escH(initial) +
        ' <div class="prf-notif-dot' + (hasNotif ? ' show' : '') + '" id="prf-notif-dot"> </div>' +
      ' </div>' +
      ' <div class="prf-text">' +
        ' <div class="prf-name">' + _escH(profileName) + ' </div>' +
        ' <div class="prf-sub">' + _escH(profileSub) + ' </div>' +
      ' </div>';

    var dd = document.createElement('div');
    dd.className = 'prf-dropdown';
    dd.id = 'prf-dropdown';
    dd.innerHTML =
      ' <a class="prf-dd-item" href="dashboard.html"> &#128100; Profilul familiei mele </a>' +
      ' <a class="prf-dd-item" href="dashboard.html#photos"> &#128248; Fotografiile mele </a>' +
      ' <a class="prf-dd-item" href="dashboard.html#members"> &#127803; Membrii familiei </a>' +
      ' <div class="prf-dd-sep"> </div>' +
      ' <a class="prf-dd-item logout" href="#" onclick="window.supabase && window.supabase.auth.signOut().then(function(){window.location.href=\'index.html\'});return false;"> &#128275; Deconectare </a>';

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      dd.classList.toggle('show');
    });
    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) dd.classList.remove('show');
    });
    wrap.appendChild(btn);
    wrap.appendChild(dd);
    navRight.appendChild(wrap);
  });

  if (session) {
    var mobileName = isAdmin ? 'Admin' : familyName;
    var initial = mobileName ? mobileName.charAt(0).toUpperCase() : '?';
    buildMobileFloat(initial, hasNotif);
  } else {
    buildMobileFloat(null, false);
  }
}
function buildMobileFloat(initial, hasNotif) {
  var existing = document.querySelector('.mobile-prf-float');
  if (existing) existing.remove();
  var fb = document.createElement('a');
  fb.className = 'mobile-prf-float';
  fb.href = initial ? 'dashboard.html' : 'login.html';
  if (initial) {
    fb.innerHTML = '<span class="mobile-prf-float-av">' + _escH(initial) + '</span>' +
      '<span class="mobile-prf-float-notif' + (hasNotif ? ' show' : '') + '"></span>';
  } else {
    fb.innerHTML = '&#128274;';
  }
  document.body.appendChild(fb);
}

function injectAdminLink() {
  var navRights = getActiveNavRights();
  navRights.forEach(function(navRight) {
    if (navRight.querySelector('.calnic-admin-link')) return;
    var link = document.createElement('a');
    link.className = 'nav-login calnic-admin-link';
    link.href = 'admin.html';
    link.title = 'Panou Admin';
    link.innerHTML = '&#9670; Admin';
    navRight.insertBefore(link, navRight.firstChild);
  });

  var menus = document.querySelectorAll('.nav-mobile-menu, #navMobileMenu, #navMobileMenu2');
  menus.forEach(function(menu) {
    if (menu.querySelector('.calnic-admin-mobile-link')) return;
    var ml = document.createElement('a');
    ml.className = 'nav-mobile-link calnic-admin-mobile-link';
    ml.href = 'admin.html';
    ml.innerHTML = '&#9670; Admin';
    menu.insertBefore(ml, menu.firstChild);
  });
}
function showAdminLink() {
  document.querySelectorAll('.calnic-admin-link').forEach(function(el){
    el.innerHTML = '&#9670; Admin';
    el.title = 'Panou Admin';
  });
  document.querySelectorAll('.calnic-admin-mobile-link').forEach(function(el){
    el.innerHTML = '&#9670; Admin';
  });
  document.querySelectorAll('.calnic-admin-link').forEach(function(el){ el.classList.add('show'); });
  document.querySelectorAll('.calnic-admin-mobile-link').forEach(function(el){ el.classList.add('show'); });
}

async function isAdminUser(userId) {
  var client = window.supabaseClient || window.appSupabase || window.supabase;
  if (!client || !userId) return false;
  try {
    var res = await client.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
    return !!(res && !res.error && res.data && res.data.is_admin);
  } catch (err) {
    return false;
  }
}

function checkNotifications(familyId) {
  if (!window.supabase || !familyId) return Promise.resolve(false);
  var now = new Date().toISOString();
  return window.supabase
    .from('announcements')
    .select('id', {count:'exact', head:true})
    .lte('published_at', now)
    .gte('expires_at', now)
    .then(function(r) { return (r.count || 0) > 0; })
    .catch(function() { return false; });
}

async function getCurrentFamilyForUser(userId) {
  if (!window.supabase || !userId) return null;
  try {
    var res = await (window.supabaseClient || window.appSupabase || window.supabase).from('families').select('*').limit(100);
    if (res && !res.error && Array.isArray(res.data)) {
      return res.data.find(function(row){ return row && row.created_by === userId; }) || null;
    }
  } catch (err) {}
  return null;
}

function initAdminNav() {
  injectAdminLink();
  mergeLangIntoNav();
  var client = window.supabaseClient || window.appSupabase || window.supabase;
  if (!client || !client.auth || typeof client.auth.getUser !== 'function') {
    buildProfileButton(null, null, false, false);
    return;
  }
  client.auth.getUser().then(function(res) {
    var session = res && res.data ? res.data.session : null;
    var user = res && res.data ? (res.data.user || (session && session.user) || null) : null;
    if (!user) {
      buildProfileButton(null, null, false, false);
      return;
    }

    var fakeSession = session || { user: user };

    Promise.all([
      getCurrentFamilyForUser(user.id),
      isAdminUser(user.id)
    ])
      .then(function(values) {
        var familyData = values[0];
        var admin = !!values[1];
        var familyName = familyData ? (familyData.display_name || familyData.name || 'Profilul meu') : 'Profilul meu';
        var familyId = familyData ? familyData.id : null;
        return checkNotifications(familyId).then(function(hasNotif) {
          buildProfileButton(fakeSession, familyName, hasNotif, admin);
          injectAdminLink();
          if (admin) showAdminLink();
        });
      })
      .catch(function() {
        buildProfileButton(fakeSession, 'Profilul meu', false, false);
      });
  }).catch(function() {
    buildProfileButton(null, null, false, false);
  });
}
var _adminNavInitTimer = null;
function scheduleAdminNavInit() {
  if (_adminNavInitTimer) clearTimeout(_adminNavInitTimer);
  _adminNavInitTimer = setTimeout(function() {
    _adminNavInitTimer = null;
    initAdminNav();
  }, 0);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleAdminNavInit, { once: true });
} else {
  scheduleAdminNavInit();
}

window.addEventListener('load', scheduleAdminNavInit);
document.addEventListener('supabase:ready', scheduleAdminNavInit);
document.addEventListener('calnic:viewchange', scheduleAdminNavInit);

/* Re-init when index switches between guest/member views. */
function watchViewSwitches() {
  var guest = document.getElementById('guest-view');
  var member = document.getElementById('member-view');
  if (!guest && !member) return;
  var mo = new MutationObserver(scheduleAdminNavInit);
  if (guest) mo.observe(guest, { attributes: true, attributeFilter: ['style', 'class'] });
  if (member) mo.observe(member, { attributes: true, attributeFilter: ['style', 'class'] });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watchViewSwitches, { once: true });
} else {
  watchViewSwitches();
}

})();


