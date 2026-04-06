(function (w) {
  var state = {
    sb: null,
    adminUserId: null,
    logAction: null,
    users: [],
    defs: [],
    currentUserId: ''
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(text, type) {
    var box = el('ab-status');
    if (!box) return;
    box.textContent = text || '';
    box.className = 'ab-status' + (type ? (' ' + type) : '');
  }

  function toDefRow(catalogBadge) {
    return {
      slug: catalogBadge.slug,
      label: catalogBadge.label,
      description: catalogBadge.description,
      color_base: catalogBadge.colors.base,
      color_dark: catalogBadge.colors.dark,
      color_accent: catalogBadge.colors.accent,
      icon: catalogBadge.icon,
      sort_order: catalogBadge.order
    };
  }

  async function loadDefinitions() {
    if (!state.sb) return [];
    var res = await state.sb.from('badge_definitions').select('*').order('sort_order', { ascending: true });
    if (res.error) throw res.error;
    var defs = res.data || [];

    if (!defs.length && w.CalnicBadges && typeof w.CalnicBadges.all === 'function') {
      var seedRows = w.CalnicBadges.all().map(toDefRow);
      var up = await state.sb.from('badge_definitions').upsert(seedRows, { onConflict: 'slug' });
      if (!up.error) {
        var re = await state.sb.from('badge_definitions').select('*').order('sort_order', { ascending: true });
        if (!re.error) defs = re.data || [];
      }
    }

    state.defs = defs.map(function (d) {
      return (w.BadgeUI && w.BadgeUI.normalizeDef) ? w.BadgeUI.normalizeDef(d) : d;
    });

    var badgeSelect = el('ab-badge-select');
    if (badgeSelect) {
      badgeSelect.innerHTML = '<option value="">Alege badge...</option>' + state.defs.map(function (d) {
        return '<option value="' + d.id + '">' + esc(d.label) + '</option>';
      }).join('');
    }

    return state.defs;
  }

  async function loadUsers() {
    if (!state.sb) return [];
    var pair = await Promise.all([
      state.sb.from('profiles').select('id,is_admin,created_at').order('created_at', { ascending: false }),
      state.sb.from('families').select('created_by,name,village').limit(500)
    ]);

    if (pair[0].error) throw pair[0].error;
    if (pair[1].error) throw pair[1].error;

    var famByOwner = {};
    (pair[1].data || []).forEach(function (f) {
      if (f && f.created_by && !famByOwner[f.created_by]) famByOwner[f.created_by] = f;
    });

    state.users = (pair[0].data || []).map(function (p) {
      var fam = famByOwner[p.id] || null;
      var title = fam ? (fam.name + (fam.village ? (' · ' + fam.village) : '')) : ('Utilizator ' + String(p.id || '').slice(0, 8));
      if (p.is_admin) title += ' (ADMIN)';
      return {
        id: p.id,
        label: title
      };
    }).sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });

    var userSelect = el('ab-user-select');
    if (userSelect) {
      userSelect.innerHTML = '<option value="">Alege utilizator...</option>' + state.users.map(function (u) {
        return '<option value="' + esc(u.id) + '">' + esc(u.label) + '</option>';
      }).join('');
    }

    return state.users;
  }

  async function fetchUserBadges(userId) {
    if (!userId || !state.sb) return [];
    var res = await state.sb
      .from('user_badges')
      .select('user_id,badge_id,is_primary,assigned_at,badge_definitions(id,slug,label,description,color_base,color_dark,color_accent,icon,sort_order)')
      .eq('user_id', userId);

    if (res.error) throw res.error;

    var list = (res.data || []).map(function (r) {
      return w.BadgeUI && w.BadgeUI.normalizeAssignmentRow ? w.BadgeUI.normalizeAssignmentRow(r) : r;
    }).filter(Boolean);

    return w.BadgeUI && w.BadgeUI.sortAssignments ? w.BadgeUI.sortAssignments(list) : list;
  }

  function renderUserBadges(assignments) {
    var host = el('ab-current');
    var primSel = el('ab-primary-select');
    if (!host || !primSel) return;

    if (!assignments || !assignments.length) {
      host.innerHTML = '<div class="ab-empty">Utilizatorul nu are badge-uri.</div>';
      primSel.innerHTML = '<option value="">Nu exista badge-uri</option>';
      return;
    }

    host.innerHTML = assignments.map(function (a) {
      var badgeHtml = w.BadgeUI && w.BadgeUI.badgeHtml ? w.BadgeUI.badgeHtml(a, { compact: true }) : '<span>' + esc(a.def.label) + '</span>';
      return (
        '<div class="ab-row">' +
          '<div class="ab-row-badge">' + badgeHtml + '</div>' +
          '<div class="ab-row-actions">' +
            (a.is_primary ? '<span class="ab-primary-tag">Principal</span>' : '') +
            '<button class="tbtn red" data-ab-remove="' + Number(a.badge_id) + '">Scoate</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    primSel.innerHTML = '<option value="">Alege badge principal...</option>' + assignments.map(function (a) {
      return '<option value="' + Number(a.badge_id) + '"' + (a.is_primary ? ' selected' : '') + '>' + esc(a.def.label) + '</option>';
    }).join('');
  }

  async function ensurePrimary(userId) {
    var list = await fetchUserBadges(userId);
    if (!list.length) return;
    var hasPrimary = list.some(function (x) { return x.is_primary; });
    if (hasPrimary) return;
    await state.sb.from('user_badges').update({ is_primary: true }).eq('user_id', userId).eq('badge_id', list[0].badge_id);
  }

  async function refreshForCurrentUser() {
    if (!state.currentUserId) {
      renderUserBadges([]);
      return;
    }
    try {
      var list = await fetchUserBadges(state.currentUserId);
      renderUserBadges(list);
    } catch (err) {
      renderUserBadges([]);
      setStatus('Nu s-au putut incarca badge-urile pentru utilizatorul selectat.', 'err');
    }
  }

  async function assignBadge() {
    var userId = state.currentUserId;
    var badgeId = Number((el('ab-badge-select') && el('ab-badge-select').value) || 0);
    if (!userId || !badgeId) { setStatus('Selecteaza utilizatorul si badge-ul.', 'warn'); return; }

    var payload = {
      user_id: userId,
      badge_id: badgeId,
      assigned_by: state.adminUserId || null,
      is_primary: false
    };

    var up = await state.sb.from('user_badges').upsert(payload, { onConflict: 'user_id,badge_id' });
    if (up.error) throw up.error;
    await ensurePrimary(userId);
    if (typeof state.logAction === 'function') {
      state.logAction('badges', 'Badge acordat utilizatorului: ' + badgeId + ' -> ' + userId);
    }
    setStatus('Badge acordat cu succes.', 'ok');
    await refreshForCurrentUser();
  }

  async function setPrimary() {
    var userId = state.currentUserId;
    var badgeId = Number((el('ab-primary-select') && el('ab-primary-select').value) || 0);
    if (!userId || !badgeId) { setStatus('Alege badge-ul principal.', 'warn'); return; }

    var reset = await state.sb.from('user_badges').update({ is_primary: false }).eq('user_id', userId);
    if (reset.error) throw reset.error;

    var set = await state.sb
      .from('user_badges')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('badge_id', badgeId);
    if (set.error) throw set.error;

    if (typeof state.logAction === 'function') {
      state.logAction('badges', 'Badge principal setat: ' + badgeId + ' -> ' + userId);
    }
    setStatus('Badge principal actualizat.', 'ok');
    await refreshForCurrentUser();
  }

  async function removeBadge(badgeId) {
    if (!state.currentUserId || !badgeId) return;
    var del = await state.sb
      .from('user_badges')
      .delete()
      .eq('user_id', state.currentUserId)
      .eq('badge_id', Number(badgeId));
    if (del.error) throw del.error;
    await ensurePrimary(state.currentUserId);
    if (typeof state.logAction === 'function') {
      state.logAction('badges', 'Badge eliminat: ' + badgeId + ' <- ' + state.currentUserId);
    }
    setStatus('Badge eliminat.', 'ok');
    await refreshForCurrentUser();
  }

  function bindEvents() {
    var selUser = el('ab-user-select');
    var btnAssign = el('ab-assign-btn');
    var btnPrimary = el('ab-primary-btn');
    var btnRefresh = el('ab-refresh-btn');
    var host = el('ab-current');

    if (selUser) {
      selUser.addEventListener('change', function () {
        state.currentUserId = selUser.value || '';
        setStatus('', '');
        refreshForCurrentUser();
      });
    }

    if (btnAssign) {
      btnAssign.addEventListener('click', async function () {
        try { await assignBadge(); } catch (err) { setStatus('Nu am putut acorda badge-ul.', 'err'); }
      });
    }

    if (btnPrimary) {
      btnPrimary.addEventListener('click', async function () {
        try { await setPrimary(); } catch (err) { setStatus('Nu am putut seta badge-ul principal.', 'err'); }
      });
    }

    if (btnRefresh) {
      btnRefresh.addEventListener('click', function () { refreshForCurrentUser(); });
    }

    if (host) {
      host.addEventListener('click', async function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('[data-ab-remove]') : null;
        if (!btn) return;
        var badgeId = Number(btn.getAttribute('data-ab-remove') || 0);
        if (!badgeId) return;
        try {
          await removeBadge(badgeId);
        } catch (err) {
          setStatus('Nu am putut elimina badge-ul.', 'err');
        }
      });
    }
  }

  async function init(options) {
    options = options || {};
    state.sb = options.supabase || w.supabase || w.supabaseClient || w.appSupabase || null;
    state.adminUserId = options.adminUserId || null;
    state.logAction = options.logAction || null;
    if (!state.sb) return;

    bindEvents();

    try {
      await loadDefinitions();
      await loadUsers();
      var userSelect = el('ab-user-select');
      if (userSelect && !state.currentUserId && userSelect.options.length > 1) {
        userSelect.selectedIndex = 1;
        state.currentUserId = userSelect.value;
      }
      await refreshForCurrentUser();
      setStatus('Sistem badge-uri gata.', 'ok');
    } catch (err) {
      var missing = w.BadgeUI && w.BadgeUI.isMissingBadgeTablesError && w.BadgeUI.isMissingBadgeTablesError(err);
      if (missing) {
        setStatus('Tabelele badges nu exista inca. Ruleaza fisierul SQL: sql/badges.sql', 'warn');
      } else {
        setStatus('Nu am putut initializa sistemul de badge-uri.', 'err');
      }
    }
  }

  w.AdminBadges = {
    init: init,
    refresh: refreshForCurrentUser
  };
})(window);
