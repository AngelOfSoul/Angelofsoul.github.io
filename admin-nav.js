/*
admin-nav.js — Calnic Online v2 (COMPLETE FIX)
*/
(function () {
    document.documentElement.style.background = '#0a0a0a';
    var stickyStyle = document.createElement('style');
    stickyStyle.textContent = [
        'nav { position:sticky; top:0; z-index:900; }',
        '.site-header { position:sticky; top:0; z-index:901; }',
        '.prf-btn-out { display:flex;align-items:center;gap:8px;margin:6px 10px;padding:7px 18px;background:#b08030;border:1px solid #d4a84a;border-radius:2px;font-family: "Playfair Display",serif;font-size:13px;font-weight:700;color:#050505;letter-spacing:1px;cursor:pointer;transition:all 0.2s;white-space:nowrap;text-decoration:none; }',
        '.prf-btn-out:hover { background:#d4a84a;color:#050505;text-decoration:none; }',
        '.prf-btn-in { display:flex;align-items:center;gap:8px;margin:5px 10px;padding:4px 12px 4px 4px;background:#161616;border:1px solid #b08030;border-radius:2px;cursor:pointer;transition:all 0.2s;position:relative;white-space:nowrap;text-decoration:none; }',
        '.prf-btn-in:hover { background:#1c1c1c;border-color:#d4a84a;text-decoration:none; }',
        '.prf-avatar { width:32px;height:32px;border-radius:50%;background:#1c1200;border:1.5px solid #d4a84a;display:flex;align-items:center;justify-content:center;font-family: "Playfair Display",serif;font-size:15px;color:#d4a84a;font-weight:700;flex-shrink:0;position:relative; }',
        '.prf-notif-dot { position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:#c04040;border:1.5px solid #111111;display:none; }',
        '.prf-notif-dot.show { display:block; }',
        '.prf-text { display:flex;flex-direction:column;gap:1px; }',
        '.prf-name { font-family: "Playfair Display",serif;font-size:13px;color:#d4a84a;line-height:1; }',
        '.prf-sub { font-size:10px;color:#7a5828;letter-spacing:1px;line-height:1; }',
        '.prf-dropdown { position:absolute;top:calc(100% + 4px);right:0;background:#111111;border:1px solid #b08030;border-radius:2px;min-width:180px;z-index:1000;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.6); }',
        '.prf-dropdown .show { display:block; }',
        '.prf-dd-item { display:flex;align-items:center;gap:10px;padding:10px 16px;font-family: "EB Garamond",serif;font-size:14px;color:#f5eed8;cursor:pointer;transition:all 0.15s;text-decoration:none;border-bottom:1px solid #1c1c1c; }',
        '.prf-dd-item:last-child { border-bottom:none; }',
        '.prf-dd-item:hover { background:#161616;color:#d4a84a;text-decoration:none; }',
        '.prf-dd-item.logout { color:#a05050; }',
        '.prf-dd-item.logout:hover { color:#e08080;background:#1a0808; }',
        '.prf-dd-sep { height:1px;background:#1c1c1c;margin:0; }',
        '.calnic-admin-link { display:none!important; }',
        '.calnic-admin-link.show { display:flex!important;color:#c04040!important;border-left:1px solid #3a1010!important; }',
        '.calnic-admin-mobile-link { display:none!important; }',
        '.calnic-admin-mobile-link.show { display:flex!important;color:#c04040!important;border-left:3px solid #c04040!important; }',
        '.nav-lang { display:flex;align-items:center;gap:4px;padding:0 10px;border-left:1px solid #2a2a2a; }',
        '.nav-lang-btn { background:none;border:1px solid #585040;color:#f5eed8;padding:2px 8px;cursor:pointer;font-family: "EB Garamond",serif;font-size:11px;letter-spacing:1px;transition:all 0.2s;border-radius:1px; }',
        '.nav-lang-btn.active { background:#b08030;border-color:#d4a84a;color:#050505;font-weight:700; }',
        '.nav-lang-btn:hover:not(.active) { border-color:#d4a84a; }',
        '.mobile-prf-float { display:none;position:fixed;bottom:20px;right:16px;z-index:9999;width:50px;height:50px;border-radius:50%;background:#b08030;border:2px solid #d4a84a;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(0,0,0,0.5);text-decoration:none; }',
        '.mobile-prf-float:hover { background:#d4a84a;transform:scale(1.08); }',
        '.mobile-prf-float-av { font-family: "Playfair Display",serif;font-size:18px;color:#050505;font-weight:700; }',
        '.mobile-prf-float-notif { position:absolute;top:0;right:0;width:12px;height:12px;border-radius:50%;background:#c04040;border:2px solid #0a0a0a;display:none; }',
        '.mobile-prf-float-notif.show { display:block; }',
        '@media(max-width:740px) { .mobile-prf-float { display:flex; } }',
        '@media(min-width:741px) { .mobile-prf-float { display:none!important; } }',
        '.nav-link.active { background:#161616!important;color:#d4a84a!important;border-bottom:2px solid #d4a84a!important;position:relative; }',
        '.nav-link.active::after { content:" ";position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:#d4a84a;border-radius:50%; }',
        '.nav-prf-divider { width:1px;background:linear-gradient(to bottom,transparent,#b08030,transparent);margin:8px 4px;flex-shrink:0; }'
    ].join('\n');
    document.head.appendChild(stickyStyle);

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

    function mergeLangIntoNav() {
        var langBar = document.querySelector('.lang-bar');
        var navRight = document.querySelector('.nav-right');
        if (!langBar || !navRight) return;

        var btnRo = document.getElementById('btn-ro') || document.getElementById('btn-ro-li');
        var btnEn = document.getElementById('btn-en') || document.getElementById('btn-en-li');
        if (!btnRo || !btnEn) return;

        var langWrap = document.createElement('div');
        langWrap.className = 'nav-lang';

        var nbRo = document.createElement('button');
        nbRo.className = 'nav-lang-btn' + (btnRo.classList.contains('active') ? ' active' : '');
        nbRo.textContent = 'RO';
        nbRo.onclick = function() {
            btnRo.click();
            nbRo.classList.add('active');
            nbEn.classList.remove('active');
        };

        var nbEn = document.createElement('button');
        nbEn.className = 'nav-lang-btn' + (btnEn.classList.contains('active') ? ' active' : '');
        nbEn.textContent = 'EN';
        nbEn.onclick = function() {
            btnEn.click();
            nbEn.classList.add('active');
            nbRo.classList.remove('active');
        };

        langWrap.appendChild(nbRo);
        langWrap.appendChild(nbEn);
        navRight.appendChild(langWrap);
        langBar.style.display = 'none';
    }

    function buildProfileButton(session, familyName, hasNotif) {
        var navRight = document.querySelector('#nav-right-main, .nav-right');
        if (!navRight) return;

        var existing = navRight.querySelector('.prf-btn-out, .prf-btn-in, .prf-btn-wrap');
        if (existing) existing.remove();

        var oldLogin = navRight.querySelector('.nav-login:not(.calnic-admin-link)');
        if (oldLogin) oldLogin.remove();

        var divExist = navRight.querySelector('.nav-prf-divider');
        if (!divExist) {
            var div = document.createElement('div');
            div.className = 'nav-prf-divider';
            navRight.insertBefore(div, navRight.firstChild);
        }

        if (!session) {
            var btn = document.createElement('a');
            btn.className = 'prf-btn-out';
            btn.href = 'login.html';
            btn.innerHTML = '🔒 Profilul Meu';
            navRight.appendChild(btn);
            buildMobileFloat(null, false);
        } else {
            var initial = familyName ? familyName.charAt(0).toUpperCase() : '?';
            var wrap = document.createElement('div');
            wrap.className = 'prf-btn-wrap';
            wrap.style.cssText = 'position:relative;display:flex;align-items:center;';

            var btn = document.createElement('a');
            btn.className = 'prf-btn-in';
            btn.href = 'dashboard.html';
            btn.innerHTML =
                '<div class="prf-avatar">' + initial +
                '<div class="prf-notif-dot' + (hasNotif ? ' show' : '') + '"></div>' +
                '</div>' +
                '<div class="prf-text">' +
                '<div class="prf-name">' + (familyName || 'Profilul Meu') + '</div>' +
                '<div class="prf-sub">PROFILUL MEU</div>' +
                '</div>';

            var dd = document.createElement('div');
            dd.className = 'prf-dropdown';
            dd.id = 'prf-dropdown';
            dd.innerHTML =
                '<a href="dashboard.html" class="prf-dd-item">👤 Profilul familiei mele</a>' +
                '<a href="dashboard.html#photos" class="prf-dd-item">📸 Fotografiile mele</a>' +
                '<a href="dashboard.html#members" class="prf-dd-item">🌻 Membrii familiei</a>' +
                '<div class="prf-dd-sep"></div>' +
                '<a href="#" class="prf-dd-item logout">🔓 Deconectare</a>';

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
            buildMobileFloat(initial, hasNotif);
        }
    }

    function buildMobileFloat(initial, hasNotif) {
        var existing = document.querySelector('.mobile-prf-float');
        if (existing) existing.remove();

        var fb = document.createElement('a');
        fb.className = 'mobile-prf-float';
        fb.href = initial ? 'dashboard.html' : 'login.html';

        if (initial) {
            fb.innerHTML = '<div class="mobile-prf-float-av">' + initial + '</div>';
        } else {
            fb.innerHTML = '🔒';
        }

        if (hasNotif) {
            fb.innerHTML += '<div class="mobile-prf-float-notif show"></div>';
        } else {
            fb.innerHTML += '<div class="mobile-prf-float-notif"></div>';
        }

        document.body.appendChild(fb);
    }

    function injectAdminLink() {
        var navRight = document.querySelector('.nav-right');
        if (!navRight) return;

        if (navRight.querySelector('.calnic-admin-link')) return;

        var link = document.createElement('a');
        link.className = 'nav-login calnic-admin-link';
        link.href = 'admin.html';
        link.title = 'Panou Admin';
        link.innerHTML = '◆ Admin';

        navRight.insertBefore(link, navRight.firstChild);

        var menus = document.querySelectorAll('.nav-mobile-menu, #navMobileMenu, #navMobileMenu2');
        menus.forEach(function(menu) {
            if (menu.querySelector('.calnic-admin-mobile-link')) return;

            var ml = document.createElement('a');
            ml.className = 'nav-mobile-link calnic-admin-mobile-link';
            ml.href = 'admin.html';
            ml.innerHTML = '◆ Admin';

            menu.insertBefore(ml, menu.firstChild);
        });
    }

    function showAdminLink() {
        document.querySelectorAll('.calnic-admin-link').forEach(function(el) {
            el.classList.add('show');
        });
        document.querySelectorAll('.calnic-admin-mobile-link').forEach(function(el) {
            el.classList.add('show');
        });
    }

    function checkNotifications(familyId) {
        if (!window.supabase || !familyId) return Promise.resolve(false);

        var now = new Date().toISOString();
        return window.supabase
            .from('announcements')
            .select('id', { count: 'exact', head: true })
            .lte('published_at', now)
            .gte('expires_at', now)
            .then(function(r) {
                return (r.count || 0) > 0;
            })
            .catch(function() {
                return false;
            });
    }

    function initAdminNav() {
        mergeLangIntoNav();
        if (!window.supabase) {
            buildProfileButton(null, null, false);
            return;
        }

        window.supabase.auth.getSession().then(function(res) {
            var session = res.data?.session;
            if (!session) {
                buildProfileButton(null, null, false);
                return;
            }

            Promise.all([
                window.supabase.from('families').select('name,id').eq('owner_id', session.user.id).single(),
                window.supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
            ]).then(function(results) {
                var familyData = results[0].data;
                var profileData = results[1].data;

                var familyName = familyData ? familyData.name : 'Profilul Meu';
                var familyId = familyData ? familyData.id : null;
                var isAdmin = profileData && profileData.is_admin;

                checkNotifications(familyId).then(function(hasNotif) {
                    buildProfileButton(session, familyName, hasNotif);
                    if (isAdmin) {
                        injectAdminLink();
                        showAdminLink();
                    }
                });
            }).catch(function(error) {
                console.error('[Admin-Nav] Error fetching data:', error);
                buildProfileButton(session, null, false);
            });
        }).catch(function(authError) {
            console.error('[Admin-Nav] Auth error:', authError);
            buildProfileButton(null, null, false);
        });
    }

    if (window.supabase) {
        initAdminNav();
    } else {
        document.addEventListener('supabase:ready', initAdminNav);
    }

    document.addEventListener('DOMContentLoaded', function() {
        var intrebariLink = document.querySelector('a.nav-link[href="intrebari.html"]');
        if (intrebariLink) {
            intrebariLink.style.display = 'none';

            var footer = document.querySelector('footer');
            if (footer) {
                var fl = document.createElement('a');
                fl.href = 'intrebari.html';
                fl.style.cssText = 'color:#7a5828;font-size:13px;margin-left:8px;';
                fl.textContent = 'Intrebari frecvente';

                footer.appendChild(document.createTextNode(' · '));
                footer.appendChild(fl);
            }
        }

        var mobileIntrebari = document.querySelector('a.nav-mobile-link[href="intrebari.html"]');
        if (mobileIntrebari) mobileIntrebari.style.display = 'none';
    });

    document.addEventListener('click', function(e) {
        if (e.target.closest('.prf-dd-item.logout')) {
            e.preventDefault();
            if (window.supabase) {
                window.supabase.auth.signOut().then(function() {
                    window.location.href = 'index.html';
                }).catch(function(signOutError) {
                    console.error('[Admin-Nav] Logout error:', signOutError);
                    alert('Eroare la deconectare. Va rugam reincarcati pagina.');
                });
            }
        }
    });

    // --- DYNAMIC LOADING OF GENEALOGY ENGINE ---
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`[Admin-Nav] Script ${src} already loaded.`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script ${src}`));
            document.head.appendChild(script);
        });
    }

    function maybeLoadGenealogyEngine() {
        if (window.location.pathname.includes('genealogie-familie.html')) {
            console.log('[Admin-Nav] Detected genealogie-familie.html, attempting to load genealogy-engine.js');
            loadScript('genealogy-engine.js')
                .then(() => {
                    console.log('[Admin-Nav] genealogy-engine.js loaded successfully.');
                    if (window.genealogyEngine && typeof window.genealogyEngine.init === 'function') {
                        window.genealogyEngine.init();
                    }
                })
                .catch(err => {
                    console.error('[Admin-Nav] Error loading genealogy-engine.js:', err);
                });
        }
    }

    if (window.supabase) {
        maybeLoadGenealogyEngine();
    } else {
        document.addEventListener('supabase:ready', maybeLoadGenealogyEngine);
    }

    document.addEventListener('DOMContentLoaded', maybeLoadGenealogyEngine);
})();
