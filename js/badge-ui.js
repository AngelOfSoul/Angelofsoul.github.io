(function (w) {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function iconChar(name) {
    var map = {
      crown: '\u265B',
      help: '\u2726',
      medal: '\u2605',
      feather: '\u2712',
      shield: '\u2726',
      seal: '\u2736',
      'check-shield': '\u2713',
      gavel: '\u2696'
    };
    return map[name] || '\u2605';
  }

  function normalizeDef(raw) {
    if (!raw) return null;
    var fallback = null;
    if (w.CalnicBadges) {
      fallback = w.CalnicBadges.getById(raw.id || raw.badge_id) || w.CalnicBadges.getBySlug(raw.slug || raw.badge_slug);
    }
    var src = raw || fallback || {};
    var c = src.colors || {};
    return {
      id: Number(src.id || (fallback && fallback.id) || 0),
      slug: src.slug || (fallback && fallback.slug) || '',
      label: src.label || (fallback && fallback.label) || 'Badge',
      description: src.description || (fallback && fallback.description) || '',
      icon: src.icon || (fallback && fallback.icon) || 'medal',
      order: Number(src.order || src.sort_order || (fallback && fallback.order) || 999),
      colors: {
        base: src.color_base || c.base || (fallback && fallback.colors.base) || '#7a5828',
        dark: src.color_dark || c.dark || (fallback && fallback.colors.dark) || '#3a2a10',
        accent: src.color_accent || c.accent || (fallback && fallback.colors.accent) || '#d4a84a'
      }
    };
  }

  function normalizeAssignmentRow(row) {
    if (!row) return null;
    var joined = row.badge_definitions && typeof row.badge_definitions === 'object' ? row.badge_definitions : null;
    var def = normalizeDef(joined || { id: row.badge_id, badge_id: row.badge_id, badge_slug: row.badge_slug });
    if (!def) return null;
    return {
      user_id: String(row.user_id || ''),
      badge_id: Number(row.badge_id || def.id || 0),
      is_primary: !!row.is_primary,
      assigned_at: row.assigned_at || null,
      def: def
    };
  }

  function sortAssignments(list) {
    return (list || []).slice().sort(function (a, b) {
      if (!!a.is_primary !== !!b.is_primary) return a.is_primary ? -1 : 1;
      var ao = Number((a.def && a.def.order) || 999);
      var bo = Number((b.def && b.def.order) || 999);
      if (ao !== bo) return ao - bo;
      var at = new Date(a.assigned_at || 0).getTime();
      var bt = new Date(b.assigned_at || 0).getTime();
      return at - bt;
    });
  }

  function pickCompact(list, max) {
    var sorted = sortAssignments(list);
    if (!sorted.length) return [];
    var out = [];
    var seen = {};
    var primary = sorted.find(function (x) { return x.is_primary; }) || null;
    if (primary) {
      out.push(primary);
      seen[primary.badge_id] = true;
    }
    for (var i = 0; i < sorted.length && out.length < max; i++) {
      var row = sorted[i];
      if (seen[row.badge_id]) continue;
      out.push(row);
      seen[row.badge_id] = true;
    }
    return out;
  }

  function badgeHtml(row, opts) {
    if (!row || !row.def) return '';
    var def = row.def;
    var compact = !!(opts && opts.compact);
    var cls = 'co-badge' + (compact ? ' co-badge--compact' : ' co-badge--profile') + (row.is_primary ? ' co-badge--primary' : '');
    var tooltip = def.description || '';
    return (
      '<article class="' + cls + ' co-has-tooltip" ' +
      'style="--co-b-base:' + esc(def.colors.base) + ';--co-b-dark:' + esc(def.colors.dark) + ';--co-b-accent:' + esc(def.colors.accent) + ';" ' +
      'data-tooltip="' + esc(tooltip) + '">' +
        '<span class="co-badge-medal">' + esc(iconChar(def.icon)) + '</span>' +
        '<span class="co-badge-text">' +
          '<span class="co-badge-title">' + esc(def.label) + '</span>' +
          (compact ? '' : '<span class="co-badge-desc">' + esc(def.description) + '</span>') +
        '</span>' +
      '</article>'
    );
  }

  function ensureGlobalTooltip() {
    if (document.getElementById('co-badge-tooltip')) return;
    var tip = document.createElement('div');
    tip.id = 'co-badge-tooltip';
    tip.className = 'co-badge-tooltip';
    tip.style.display = 'none';
    document.body.appendChild(tip);

    var active = null;

    function showFor(target) {
      if (!target) return;
      var text = target.getAttribute('data-tooltip') || '';
      if (!text.trim()) return;
      active = target;
      tip.textContent = text;
      tip.style.display = 'block';
    }

    function hideTip(target) {
      if (!active) return;
      if (target && active !== target) return;
      active = null;
      tip.style.display = 'none';
    }

    function moveTip(ev) {
      if (!active || tip.style.display === 'none') return;
      var x = ev.clientX + 14;
      var y = ev.clientY + 14;
      var maxX = window.innerWidth - tip.offsetWidth - 10;
      var maxY = window.innerHeight - tip.offsetHeight - 10;
      tip.style.left = Math.max(10, Math.min(x, maxX)) + 'px';
      tip.style.top = Math.max(10, Math.min(y, maxY)) + 'px';
    }

    document.addEventListener('mouseover', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('.co-has-tooltip') : null;
      if (!t) return;
      showFor(t);
    });

    document.addEventListener('mouseout', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('.co-has-tooltip') : null;
      if (!t) return;
      hideTip(t);
    });

    document.addEventListener('mousemove', moveTip);
    window.addEventListener('blur', function () { hideTip(); });
    document.addEventListener('scroll', function () { if (active) tip.style.display = 'none'; }, true);
  }

  function compactBadgesHTML(assignments, opts) {
    var max = Number((opts && opts.max) || 2);
    var picked = pickCompact(assignments || [], max);
    if (!picked.length) return '';
    return '<div class="co-badge-list co-badge-list--compact">' + picked.map(function (r) {
      return badgeHtml(r, { compact: true });
    }).join('') + '</div>';
  }

  function profileBadgesHTML(assignments) {
    var sorted = sortAssignments(assignments || []);
    if (!sorted.length) return '';
    return '<div class="co-badge-list co-badge-list--profile">' + sorted.map(function (r) {
      return badgeHtml(r, { compact: false });
    }).join('') + '</div>';
  }

  function renderProfileBadges(container, assignments, options) {
    if (!container) return;
    var html = profileBadgesHTML(assignments || []);
    var hideWhenEmpty = !!(options && options.hideWhenEmpty);
    if (!html) {
      container.innerHTML = hideWhenEmpty ? '' : '<div class="co-badge-empty">Fara badge-uri momentan.</div>';
      if (hideWhenEmpty) {
        var parent = options && options.hideTarget ? options.hideTarget : container;
        if (parent && parent.style) parent.style.display = 'none';
      }
      return;
    }
    container.innerHTML = html;
    if (options && options.hideTarget && options.hideTarget.style) {
      options.hideTarget.style.display = 'block';
    }
  }

  function renderCompactBadges(container, assignments, opts) {
    if (!container) return;
    var html = compactBadgesHTML(assignments || [], opts || { max: 2 });
    container.innerHTML = html;
    if (container.style) container.style.display = html ? '' : 'none';
  }

  function isMissingBadgeTablesError(err) {
    var msg = String((err && err.message) || '').toLowerCase();
    return msg.indexOf('user_badges') !== -1 || msg.indexOf('badge_definitions') !== -1 || msg.indexOf('does not exist') !== -1;
  }

  async function fetchUserBadgesMap(userIds, client) {
    var ids = (userIds || []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    ids = Array.from(new Set(ids));
    if (!ids.length || !client || typeof client.from !== 'function') return { map: {}, error: null };

    try {
      var res = await client
        .from('user_badges')
        .select('user_id,badge_id,is_primary,assigned_at,badge_definitions(id,slug,label,description,color_base,color_dark,color_accent,icon,sort_order)')
        .in('user_id', ids);

      if (res.error) return { map: {}, error: res.error };

      var map = {};
      (res.data || []).forEach(function (row) {
        var n = normalizeAssignmentRow(row);
        if (!n || !n.user_id) return;
        if (!map[n.user_id]) map[n.user_id] = [];
        map[n.user_id].push(n);
      });
      Object.keys(map).forEach(function (uid) {
        map[uid] = sortAssignments(map[uid]);
      });

      return { map: map, error: null };
    } catch (err) {
      return { map: {}, error: err };
    }
  }

  w.BadgeUI = {
    normalizeDef: normalizeDef,
    normalizeAssignmentRow: normalizeAssignmentRow,
    sortAssignments: sortAssignments,
    pickCompact: pickCompact,
    badgeHtml: badgeHtml,
    compactBadgesHTML: compactBadgesHTML,
    profileBadgesHTML: profileBadgesHTML,
    renderProfileBadges: renderProfileBadges,
    renderCompactBadges: renderCompactBadges,
    fetchUserBadgesMap: fetchUserBadgesMap,
    isMissingBadgeTablesError: isMissingBadgeTablesError
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureGlobalTooltip);
  } else {
    ensureGlobalTooltip();
  }
})(window);
