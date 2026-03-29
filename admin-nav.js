/*
admin-nav.js — Calnic Online v2 (MINIMAL FIX — NO DESIGN CHANGES)
*/
(function () {
document.documentElement.style.background = '#0a0a0a';
var stickyStyle = document.createElement('style');
stickyStyle.textContent = [
'nav { position:sticky; top:0; z-index:900; }',
'.site-header { position:sticky; top:0; z-index:901;  }',
'.prf-btn-out { display:flex;align-items:center;gap:8px;margin:6px 10px;padding:7px 18px;background:#b08030;border:1px solid #d4a84a;border-radius:2px;font-family: "Playfair Display ",serif;font-size:13px;font-weight:700;color:#050505;letter-spacing:1px;cursor:pointer;transition:all 0.2s;white-space:nowrap;text-decoration:none; }',
'.prf-btn-out:hover { background:#d4a84a;color:#050505;text-decoration:none; }',  // ← FIXED: was "backgr ound"
'.prf-btn-in { display:flex;align-items:center;gap:8px;margin:5px 10px;padding:4px 12px 4px 4px;background:#161616;border:1px solid #b08030;border-radius:2px;cursor:pointer;transition:all 0.2s;position:relative;white-space:nowrap;text-decoration:none; }',  // ← FIXED: was "s olid"
'.prf-btn-in:hover { background:#1c1c1c;border-color:#d4a84a;text-decoration:none; }',  // ← FIXED: was "border-colo r"
'.prf-avatar { width:32px;height:32px;border-radius:50%;background:#1c1200;border:1.5px solid #d4a84a;display:flex;align-items:center;justify-content:center;font-family: "Playfair Display ",serif;font-size:15px;color:#d4a84a;font-weight:700;flex-shrink:0;position:relative; }',  // ← FIXED: was "justify-co ntent"
'.prf-notif-dot { position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:#c04040;border:1.5px solid #111111;display:none; }',  // ← FIXED: was "border-radius :50%"
'.prf-notif-dot.show { display:block; }',
'.prf-text { display:flex;flex-direction:column;gap:1px; }',
'.prf-name { font-family: "Playfair Display ",serif;font-size:13px;color:#d4a84a;line-height:1; }',  // ← FIXED: was "prf-na me"
'.prf-sub { font-size:10px;color:#7a5828;letter-spacing:1px;line-height:1; }',
'.prf-dropdown { position:absolute;top:calc(100% + 4px);right:0;background:#111111;border:1px solid #b08030;border-radius:2px;min-width:180px;z-index:1000;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.6); }',  // ← FIXED: was "top:calc(1 00% + 4px)"
'.prf-dropdown .show { display:block; }',
'.prf-dd-item { display:flex;align-items:center;gap:10px;padding:10px 16px;font-family: "EB Garamond ",serif;font-size:14px;color:#f5eed8;cursor:pointer;transition:all 0.15s;text-decoration:none;border-bottom:1px solid #1c1c1c; }',
'.prf-dd-item:last-child { border-bottom:none; }',
'.prf-dd-item:hover { background:#161616;color:#d4a84a;text-decoration:none; }',
'.prf-dd-item.logout { color:#a05050; }',
'.prf-dd-item.logout:hover { color:#e08080;background:#1a0808; }',
'.prf-dd-sep { height:1px;background:#1c1c1c;margin:0; }',
'.calnic-admin-link { display:none!important; }',
'.calnic-admin-link.show { display:flex!important;color:#c04040!important;border-left:1px solid #3a1010!important; }',  // ← FIXED: was "color:#c0 4040"
'.calnic-admin-mobile-link { display:none!important; }',
'.calnic-admin-mobile-link.show { display:flex!important;color:#c04040!important;border-left:3px solid #c04040!important; }',  // ← FIXED: was "color: #c04040" (extra space)
'.nav-lang { display:flex;align-items:center;gap:4px;padding:0 10px;border-left:1px solid #2a2a2a; }',
'.nav-lang-btn  { background:none;border:1px solid #585040;color:#f5eed8;padding:2px 8px;cursor:pointer;font-family: "EB Garamond ",serif;font-size:11px;letter-spacing:1px;transition:all 0.2s;border-radius:1px; }',
'.nav-lang-btn.active { background:#b08030;border-color:#d4a84a;color:#050505;font-weight:700;  }',
'.nav-lang-btn:hover:not(.active) { border-color:#d4a84a; }',
'.mobile-prf-float { display:none;position:fixed;bottom:20px;right:16px;z-index:9999;width:50px;height:50px;border-radius:50%;background:#b08030;border:2px solid #d4a84a;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(0,0,0,0.5);text-decoration:none; }',  // ← FIXED: was "border -radius" and "text-deco ration"
'.mobile-prf-float:hover { background:#d4a84a;transform:scale(1.08); }',
'.mobile-prf-float-av { font-family: "Playfair Display ",serif;font-size:18px;color:#050505;font-weight:700; }',
'.mobile-prf-float-notif { position:absolute;top:0;right:0;width:12px;height:12px;border-radius:50%;background:#c04040;border:2px solid #0a0a0a;display:none; }',  // ← FIXED: was "bor der"
'.mobile-prf-float-notif.show { display:block; }',
'@media(max-width:740px) { .mobile-prf-float { display:flex; } }',
'@media(min-width:741px) { .mobile-prf-float { display:none!important; } }',  // ← FIXED: was "741p x"
'.nav-link.active { background:#161616!important;color:#d4a84a!important;border-bottom:2px solid #d4a84a!important;position:relative; }',  // ← FIXED: was "r elative"
'.nav-link.active::after { content: "  ";position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:#d4a84a;border-radius:50%; }',
'.nav-prf-divider { width:1px;background:linear-gradient(to bottom,transparent,#b08030,transparent);margin:8px 4px;flex-shrink:0; }'  // ← FIXED: was "linear-g radient"
].join('\n');
document.head.appendChild(stickyStyle);
// ... [rest of your original JS logic — UNCHANGED]
if (window.location.pathname.indexOf('login') !== -1) {
function checkLoginRedirect() {
if (!window.supabase) return;
window.supabase.auth.getSession().then(function(res) {
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
// ... [all remaining functions — identical to your original]
})();
