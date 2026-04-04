(function () {
  'use strict';

  const state = {
    lang: localStorage.getItem('calnic-lang') || 'ro',
    data: null,
    nodesById: new Map(),
    transform: { x: 0, y: 0, scale: 1 },
    viewport: { width: 1200, height: 700 },
    isPanning: false,
    dragNode: null,
    selectedNodeId: null,
    highlightedNodeIds: new Set(),
    highlightedLinkIds: new Set(),
    animationFrame: null,
    simulationRunning: true,
    searchResults: [],
    selectedPath: null,
    hoveredNodeId: null,
    loadedWithDemo: false,
    dragMoved: false,
    suppressClick: false
  };

  const labels = {
    ro: {
      pageTitle: 'Arborele satului',
      pageSub: 'Toate familiile din Calnic, intr-un arbore interactiv al legaturilor de sange, casatorie si rudenie.',
      loading: 'Se incarca arborele satului...',
      errorTitle: 'Nu s-a putut incarca arborele satului',
      retry: 'Incearca din nou',
      searchPlaceholder: 'Cauta o familie...',
      reset: 'Reset view',
      center: 'Centreaza arborele',
      fit: 'Incadreaza tot',
      zoomIn: 'Plus',
      zoomOut: 'Minus',
      relationTitle: 'Cauta relatie intre familii',
      startFamily: '— Familie de start —',
      targetFamily: '— Familie destinatie —',
      findRelation: 'Gaseste relatia',
      clearRelation: 'Curata',
      noFamilies: 'Nu exista familii disponibile.',
      privateFamily: 'Aceasta familie este privata.',
      openPublicFamily: 'Deschide familia',
      familyPrivate: 'Privat',
      familyPublic: 'Public',
      villageConnected: 'Conectata la arborele satului',
      isolated: 'Familie izolata',
      relationNotFound: 'Nu exista nicio relatie documentata intre aceste familii.',
      relationInvalid: 'Alege doua familii diferite.',
      relationFoundPrefix: 'Relatie gasita:',
      relationPathSeparator: ' → ',
      legendPublic: 'familie publica',
      legendPrivate: 'familie privata',
      legendHighlighted: 'traseu evidentiat',
      statsFamilies: 'Familii',
      statsLinks: 'Legaturi',
      statsIsolated: 'Izolate',
      statusCentered: 'Arborele a fost centrat.',
      statusOpened: 'Familia publica a fost deschisa.',
      statusFocused: 'Familia a fost centrata in arbore.',
      statusPrivate: 'Familia selectata este privata.',
      statusPathFound: 'Traseul dintre familii a fost evidentiat.',
      statusPathMissing: 'Nu exista un traseu documentat intre familiile selectate.',
      relationTypes: {
        blood: 'sange',
        marriage: 'casatorie',
        alliance: 'rudenie',
        distant: 'legatura indepartata'
      },
      tooltipMembers: 'membri',
      tooltipGenerations: 'generatii',
      tooltipPhotos: 'fotografii',
      tooltipOpenHint: 'Click pentru a deschide familia',
      tooltipPrivateHint: 'Click pentru mesajul Privat',
      sourceInfo: 'Sursa: genealogia site-ului (Supabase)',
      noResults: 'Nicio familie gasita.'
    },
    en: {
      pageTitle: 'Village tree',
      pageSub: 'All families in Calnic shown in an interactive map of blood, marriage, and kinship links.',
      loading: 'Loading village tree...',
      errorTitle: 'Could not load the village tree',
      retry: 'Try again',
      searchPlaceholder: 'Search a family...',
      reset: 'Reset view',
      center: 'Center tree',
      fit: 'Fit all',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      relationTitle: 'Find relation between families',
      startFamily: '— Start family —',
      targetFamily: '— Destination family —',
      findRelation: 'Find relation',
      clearRelation: 'Clear',
      noFamilies: 'No families available.',
      privateFamily: 'This family is private.',
      openPublicFamily: 'Open family',
      familyPrivate: 'Private',
      familyPublic: 'Public',
      villageConnected: 'Connected to village tree',
      isolated: 'Isolated family',
      relationNotFound: 'There is no documented relation between these families.',
      relationInvalid: 'Choose two different families.',
      relationFoundPrefix: 'Relation found:',
      relationPathSeparator: ' → ',
      legendPublic: 'public family',
      legendPrivate: 'private family',
      legendHighlighted: 'highlighted path',
      statsFamilies: 'Families',
      statsLinks: 'Links',
      statsIsolated: 'Isolated',
      statusCentered: 'Tree has been centered.',
      statusOpened: 'Public family was opened.',
      statusFocused: 'Family was centered in the tree.',
      statusPrivate: 'Selected family is private.',
      statusPathFound: 'The path between families was highlighted.',
      statusPathMissing: 'No documented path exists between the selected families.',
      relationTypes: {
        blood: 'blood',
        marriage: 'marriage',
        alliance: 'kinship',
        distant: 'distant link'
      },
      tooltipMembers: 'members',
      tooltipGenerations: 'generations',
      tooltipPhotos: 'photos',
      tooltipOpenHint: 'Click to open family',
      tooltipPrivateHint: 'Click for Private message',
      sourceInfo: 'Source: site genealogy (Supabase)',
      noResults: 'No family found.'
    }
  };

  function t(key) {
    const dict = labels[state.lang] || labels.ro;
    const parts = key.split('.');
    let value = dict;
    for (const part of parts) value = value && value[part];
    return value == null ? key : value;
  }

  function $(id) { return document.getElementById(id); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function distance(a, b) { const dx = a.x - b.x; const dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy) || 1; }
  function relationLabel(type) { return t('relationTypes.' + (type || 'distant')); }

  function setStatus(message) {
    const el = $('statusLine');
    if (el) el.textContent = message || '';
  }

  function getSvgPoint(clientX, clientY) {
    const svg = $('villageTreeSvg');
    const rect = svg.getBoundingClientRect();
    const x = (clientX - rect.left - state.transform.x) / state.transform.scale;
    const y = (clientY - rect.top - state.transform.y) / state.transform.scale;
    return { x, y };
  }

  function nodeFill(node) {
    if (state.highlightedNodeIds.size && !state.highlightedNodeIds.has(node.id)) return 'rgba(80,80,80,0.28)';
    return node.visibility === 'private' ? '#3b2222' : '#1a160d';
  }

  function nodeStroke(node) {
    if (state.highlightedNodeIds.has(node.id)) return '#f2d17e';
    return node.visibility === 'private' ? '#c86a6a' : '#d4a84a';
  }

  function linkStroke(link) {
    if (state.highlightedLinkIds.has(link.id)) return '#f2d17e';
    if (state.highlightedLinkIds.size) return 'rgba(120,120,120,0.25)';
    const map = { blood: '#d4a84a', marriage: '#6bb874', alliance: '#7aa8d8', distant: '#8d7c5b' };
    return map[link.type] || '#8d7c5b';
  }

  function linkOpacity(link) {
    if (state.highlightedLinkIds.has(link.id)) return '1';
    if (state.highlightedLinkIds.size) return '0.16';
    return '0.65';
  }

  function ensureLang() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-ro]').forEach(function (el) {
      const text = el.getAttribute('data-' + state.lang);
      if (text == null) return;
      if (el.matches('input, textarea')) el.placeholder = text;
      else el.innerHTML = text;
    });
    $('searchInput').placeholder = t('searchPlaceholder');
    $('relationFrom').options[0].textContent = t('startFamily');
    $('relationTo').options[0].textContent = t('targetFamily');
    $('sourceInfo').textContent = t('sourceInfo');
    renderSearchResults([]);
  }

  function populateSelectors() {
    const from = $('relationFrom');
    const to = $('relationTo');
    from.innerHTML = '<option value="">' + esc(t('startFamily')) + '</option>';
    to.innerHTML = '<option value="">' + esc(t('targetFamily')) + '</option>';

    (state.data.graph.nodes || []).slice().sort(function (a, b) {
      return a.familyName.localeCompare(b.familyName, 'ro');
    }).forEach(function (node) {
      const label = node.familyName + (node.village ? ' (' + node.village + ')' : '');
      const optionA = document.createElement('option');
      optionA.value = node.id;
      optionA.textContent = label;
      from.appendChild(optionA);
      const optionB = optionA.cloneNode(true);
      to.appendChild(optionB);
    });
  }

  function updateStats() {
    const nodes = state.data.graph.nodes || [];
    const links = state.data.graph.links || [];
    const adjacency = state.data.graph.adjacency || new Map();
    let isolated = 0;
    nodes.forEach(function (node) {
      if (!(adjacency.get(node.id) || []).length) isolated += 1;
    });
    $('statFamilies').textContent = String(nodes.length);
    $('statLinks').textContent = String(links.length);
    $('statIsolated').textContent = String(isolated);
  }

  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function setupInitialPositions() {
    const nodes = state.data.graph.nodes;
    const adjacency = state.data.graph.adjacency;
    const visited = new Set();
    const components = [];

    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      const queue = [node.id];
      visited.add(node.id);
      const component = [];
      while (queue.length) {
        const currentId = queue.shift();
        component.push(currentId);
        (adjacency.get(currentId) || []).forEach(function (edge) {
          if (!visited.has(edge.nodeId)) {
            visited.add(edge.nodeId);
            queue.push(edge.nodeId);
          }
        });
      }
      components.push(component);
    }

    const cols = Math.max(1, Math.ceil(Math.sqrt(components.length)));
    const spacingX = 420;
    const spacingY = 320;
    components.forEach(function (component, idx) {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const centerX = (col - (cols - 1) / 2) * spacingX;
      const centerY = (row - (Math.ceil(components.length / cols) - 1) / 2) * spacingY;
      component.forEach(function (nodeId, localIndex) {
        const node = state.nodesById.get(nodeId);
        const angle = (Math.PI * 2 * localIndex) / Math.max(1, component.length);
        const ring = component.length === 1 ? 0 : 40 + (localIndex % 3) * 24;
        node.x = centerX + Math.cos(angle) * ring + (seededRandom(localIndex + idx + 1) - 0.5) * 20;
        node.y = centerY + Math.sin(angle) * ring + (seededRandom(localIndex + idx + 21) - 0.5) * 20;
      });
    });
  }

  function runSimulationStep() {
    if (!state.simulationRunning || !state.data) return;
    const nodes = state.data.graph.nodes;
    const links = state.data.graph.links;
    const centerPull = 0.0014;
    const repulsion = 22000;
    const spring = 0.009;
    const idealLength = 160;
    const damping = 0.88;

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      if (state.dragNode && state.dragNode.id === a.id) continue;
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = Math.max(dx * dx + dy * dy, 0.01);
        const force = repulsion / distSq;
        const dist = Math.sqrt(distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    links.forEach(function (link) {
      const a = state.nodesById.get(link.source);
      const b = state.nodesById.get(link.target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desired = link.type === 'blood' ? idealLength : link.type === 'marriage' ? 150 : 175;
      const force = (dist - desired) * spring;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    });

    nodes.forEach(function (node) {
      if (state.dragNode && state.dragNode.id === node.id) return;
      node.vx += -node.x * centerPull;
      node.vy += -node.y * centerPull;
      node.vx *= damping;
      node.vy *= damping;
      node.x += clamp(node.vx, -16, 16);
      node.y += clamp(node.vy, -16, 16);
    });
  }

  function boundsOfNodes(nodeIds) {
    const selected = nodeIds && nodeIds.length ? nodeIds.map(id => state.nodesById.get(id)).filter(Boolean) : (state.data.graph.nodes || []);
    if (!selected.length) return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selected.forEach(function (node) {
      const r = node.radius + 12;
      minX = Math.min(minX, node.x - r);
      minY = Math.min(minY, node.y - r);
      maxX = Math.max(maxX, node.x + r);
      maxY = Math.max(maxY, node.y + r);
    });
    return { minX, minY, maxX, maxY };
  }

  function fitToNodes(nodeIds, animate) {
    const box = boundsOfNodes(nodeIds);
    const width = Math.max(120, box.maxX - box.minX);
    const height = Math.max(120, box.maxY - box.minY);
    const pad = 72;
    const scale = clamp(Math.min((state.viewport.width - pad * 2) / width, (state.viewport.height - pad * 2) / height), 0.26, 2.3);
    const x = state.viewport.width / 2 - ((box.minX + box.maxX) / 2) * scale;
    const y = state.viewport.height / 2 - ((box.minY + box.maxY) / 2) * scale;
    setTransform({ x, y, scale }, animate);
  }

  function centerOnNode(nodeId, animate) {
    const node = state.nodesById.get(nodeId);
    if (!node) return;
    const target = {
      scale: clamp(Math.max(state.transform.scale, 1.08), 0.3, 2.4),
      x: state.viewport.width / 2 - node.x * Math.max(state.transform.scale, 1.08),
      y: state.viewport.height / 2 - node.y * Math.max(state.transform.scale, 1.08)
    };
    setTransform(target, animate);
  }

  function setTransform(next, animate) {
    const from = { ...state.transform };
    const to = {
      x: next.x,
      y: next.y,
      scale: clamp(next.scale, 0.22, 2.8)
    };
    if (!animate) {
      state.transform = to;
      return;
    }
    const start = performance.now();
    const duration = 260;
    function frame(now) {
      const p = clamp((now - start) / duration, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      state.transform = {
        x: from.x + (to.x - from.x) * ease,
        y: from.y + (to.y - from.y) * ease,
        scale: from.scale + (to.scale - from.scale) * ease
      };
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function screenPos(node) {
    return {
      x: node.x * state.transform.scale + state.transform.x,
      y: node.y * state.transform.scale + state.transform.y
    };
  }

  function renderTooltip() {
    const tooltip = $('treeTooltip');
    if (!state.hoveredNodeId) {
      tooltip.style.display = 'none';
      return;
    }
    const node = state.nodesById.get(state.hoveredNodeId);
    if (!node) {
      tooltip.style.display = 'none';
      return;
    }
    const pos = screenPos(node);
    tooltip.style.display = 'block';
    tooltip.style.left = Math.round(pos.x + 16) + 'px';
    tooltip.style.top = Math.round(pos.y - 12) + 'px';
    const badges = [
      '<span class="tt-badge ' + (node.visibility === 'private' ? 'private' : 'public') + '">' + esc(node.visibility === 'private' ? t('familyPrivate') : t('familyPublic')) + '</span>'
    ];
    if (node.connectedToVillage) badges.push('<span class="tt-badge connected">' + esc(t('villageConnected')) + '</span>');
    if (!(state.data.graph.adjacency.get(node.id) || []).length) badges.push('<span class="tt-badge isolated">' + esc(t('isolated')) + '</span>');
    tooltip.innerHTML = '<div class="tt-title">' + esc(node.familyName) + '</div>'
      + '<div class="tt-sub">' + esc(node.village || 'Calnic') + '</div>'
      + '<div class="tt-badges">' + badges.join('') + '</div>'
      + '<div class="tt-meta">' + esc(node.membersCount) + ' ' + esc(t('tooltipMembers')) + ' · ' + esc(node.generationsCount || 0) + ' ' + esc(t('tooltipGenerations')) + '</div>'
      + '<div class="tt-hint">' + esc(node.visibility === 'private' ? t('tooltipPrivateHint') : t('tooltipOpenHint')) + '</div>';
  }

  function renderGraph() {
    const linksLayer = $('linksLayer');
    const nodesLayer = $('nodesLayer');
    const labelsLayer = $('labelsLayer');
    if (!state.data) return;

    const nodeOpacity = function (node) {
      if (!state.highlightedNodeIds.size) return 1;
      return state.highlightedNodeIds.has(node.id) ? 1 : 0.28;
    };

    linksLayer.innerHTML = state.data.graph.links.map(function (link) {
      const a = state.nodesById.get(link.source);
      const b = state.nodesById.get(link.target);
      if (!a || !b) return '';
      const dash = link.type === 'marriage' ? '7 7' : link.type === 'alliance' ? '4 6' : link.type === 'distant' ? '3 7' : '';
      return '<line x1="' + a.x.toFixed(2) + '" y1="' + a.y.toFixed(2) + '" x2="' + b.x.toFixed(2) + '" y2="' + b.y.toFixed(2) + '" '
        + 'stroke="' + linkStroke(link) + '" stroke-width="' + (state.highlightedLinkIds.has(link.id) ? 3.2 : 1.7) + '" '
        + 'stroke-opacity="' + linkOpacity(link) + '" '
        + (dash ? 'stroke-dasharray="' + dash + '" ' : '') + '/>';
    }).join('');

    nodesLayer.innerHTML = state.data.graph.nodes.map(function (node) {
      const glow = state.highlightedNodeIds.has(node.id) ? '<circle cx="' + node.x.toFixed(2) + '" cy="' + node.y.toFixed(2) + '" r="' + (node.radius + 11) + '" fill="rgba(242,209,126,0.10)" stroke="rgba(242,209,126,0.45)" stroke-width="1.2"></circle>' : '';
      return '<g class="tree-node-g" data-node-id="' + esc(node.id) + '" opacity="' + nodeOpacity(node) + '">'
        + glow
        + '<circle cx="' + node.x.toFixed(2) + '" cy="' + node.y.toFixed(2) + '" r="' + node.radius + '" fill="' + nodeFill(node) + '" stroke="' + nodeStroke(node) + '" stroke-width="2"></circle>'
        + '<text x="' + node.x.toFixed(2) + '" y="' + (node.y + 5).toFixed(2) + '" text-anchor="middle" class="tree-node-initial">' + esc((node.familyName || '?').charAt(0).toUpperCase()) + '</text>'
        + '</g>';
    }).join('');

    labelsLayer.innerHTML = state.data.graph.nodes.map(function (node) {
      const posY = node.y + node.radius + 18;
      const faded = state.highlightedNodeIds.size && !state.highlightedNodeIds.has(node.id);
      return '<text x="' + node.x.toFixed(2) + '" y="' + posY.toFixed(2) + '" text-anchor="middle" class="tree-node-label" opacity="' + (faded ? '0.25' : '0.95') + '">' + esc(node.familyName) + '</text>';
    }).join('');

    $('scene').setAttribute('transform', 'translate(' + state.transform.x.toFixed(2) + ',' + state.transform.y.toFixed(2) + ') scale(' + state.transform.scale.toFixed(4) + ')');
    renderTooltip();
  }

  function renderSearchResults(results) {
    const panel = $('searchResults');
    if (!results || !results.length) {
      panel.innerHTML = $('searchInput').value.trim() ? '<div class="search-empty">' + esc(t('noResults')) + '</div>' : '';
      panel.classList.toggle('open', !!$('searchInput').value.trim());
      return;
    }
    panel.innerHTML = results.map(function (node) {
      return '<button class="search-item" data-node-id="' + esc(node.id) + '">'
        + '<span class="search-name">' + esc(node.familyName) + '</span>'
        + '<span class="search-meta">' + esc(node.visibility === 'private' ? t('familyPrivate') : t('familyPublic')) + ' · ' + esc(node.village || 'Calnic') + '</span>'
        + '</button>';
    }).join('');
    panel.classList.add('open');
  }

  function updateLegend() {
    $('legendPublicLabel').textContent = t('legendPublic');
    $('legendPrivateLabel').textContent = t('legendPrivate');
    $('legendHighlightedLabel').textContent = t('legendHighlighted');
    $('statsFamiliesLabel').textContent = t('statsFamilies');
    $('statsLinksLabel').textContent = t('statsLinks');
    $('statsIsolatedLabel').textContent = t('statsIsolated');
  }

  function clearHighlights() {
    state.highlightedNodeIds.clear();
    state.highlightedLinkIds.clear();
    state.selectedPath = null;
    $('relationResult').innerHTML = '';
  }

  function findPath(startId, targetId) {
    const adjacency = state.data.graph.adjacency;
    const queue = [startId];
    const visited = new Set([startId]);
    const prevNode = new Map();
    const prevLink = new Map();

    while (queue.length) {
      const current = queue.shift();
      if (current === targetId) break;
      (adjacency.get(current) || []).forEach(function (edge) {
        if (visited.has(edge.nodeId)) return;
        visited.add(edge.nodeId);
        prevNode.set(edge.nodeId, current);
        prevLink.set(edge.nodeId, edge.link);
        queue.push(edge.nodeId);
      });
    }

    if (!visited.has(targetId)) return null;

    const nodeIds = [targetId];
    const links = [];
    let cursor = targetId;
    while (cursor !== startId) {
      links.push(prevLink.get(cursor));
      cursor = prevNode.get(cursor);
      nodeIds.push(cursor);
    }
    nodeIds.reverse();
    links.reverse();
    return { nodeIds, links };
  }

  function describePath(path) {
    const segments = [];
    for (let i = 0; i < path.nodeIds.length; i += 1) {
      const node = state.nodesById.get(path.nodeIds[i]);
      if (!node) continue;
      segments.push(esc(node.familyName));
      if (i < path.links.length) {
        segments.push('<span class="relation-sep">' + esc(relationLabel(path.links[i].type)) + '</span>');
      }
    }
    return segments.join(' ' + esc(t('relationPathSeparator')) + ' ');
  }

  function highlightPath(path) {
    clearHighlights();
    path.nodeIds.forEach(id => state.highlightedNodeIds.add(id));
    path.links.forEach(link => state.highlightedLinkIds.add(link.id));
    state.selectedPath = path;
    $('relationResult').innerHTML = '<strong>' + esc(t('relationFoundPrefix')) + '</strong> ' + describePath(path);
    fitToNodes(path.nodeIds, true);
    setStatus(t('statusPathFound'));
  }

  function onFamilyActivate(nodeId) {
    const node = state.nodesById.get(nodeId);
    if (!node) return;
    state.selectedNodeId = node.id;
    state.highlightedNodeIds = new Set([node.id]);
    state.highlightedLinkIds.clear();
    centerOnNode(node.id, true);
    if (node.visibility === 'private') {
      $('privateModalText').textContent = t('privateFamily');
      $('privateModal').classList.add('open');
      setStatus(t('statusPrivate'));
    } else {
      window.location.href = node.publicUrl;
      setStatus(t('statusOpened'));
    }
  }

  function setupEvents() {
    $('closePrivateModal').addEventListener('click', function () {
      $('privateModal').classList.remove('open');
    });
    $('privateModal').addEventListener('click', function (e) {
      if (e.target === $('privateModal')) $('privateModal').classList.remove('open');
    });
    $('retryBtn').addEventListener('click', load);

    $('searchInput').addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      if (!q) {
        renderSearchResults([]);
        return;
      }
      const results = state.data.graph.nodes
        .filter(node => node.familyName.toLowerCase().includes(q))
        .sort((a, b) => a.familyName.localeCompare(b.familyName, 'ro'))
        .slice(0, 8);
      renderSearchResults(results);
    });

    $('searchResults').addEventListener('click', function (e) {
      const btn = e.target.closest('.search-item');
      if (!btn) return;
      const nodeId = btn.getAttribute('data-node-id');
      const node = state.nodesById.get(nodeId);
      if (!node) return;
      state.highlightedNodeIds = new Set([node.id]);
      state.highlightedLinkIds.clear();
      centerOnNode(node.id, true);
      $('searchInput').value = node.familyName;
      $('searchResults').classList.remove('open');
      setStatus(t('statusFocused'));
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-wrap')) $('searchResults').classList.remove('open');
    });

    $('relationFindBtn').addEventListener('click', function () {
      const from = $('relationFrom').value;
      const to = $('relationTo').value;
      if (!from || !to || from === to) {
        $('relationResult').textContent = t('relationInvalid');
        setStatus(t('relationInvalid'));
        return;
      }
      const path = findPath(from, to);
      if (!path) {
        clearHighlights();
        $('relationResult').textContent = t('relationNotFound');
        setStatus(t('statusPathMissing'));
        return;
      }
      highlightPath(path);
    });

    $('relationClearBtn').addEventListener('click', function () {
      clearHighlights();
      renderGraph();
      setStatus('');
    });

    $('resetBtn').addEventListener('click', function () {
      clearHighlights();
      fitToNodes(null, true);
      setStatus(t('statusCentered'));
    });
    $('centerBtn').addEventListener('click', function () {
      fitToNodes(null, true);
      setStatus(t('statusCentered'));
    });
    $('fitBtn').addEventListener('click', function () {
      fitToNodes(null, true);
      setStatus(t('statusCentered'));
    });
    $('zoomInBtn').addEventListener('click', function () {
      setTransform({ x: state.transform.x, y: state.transform.y, scale: state.transform.scale * 1.15 }, true);
    });
    $('zoomOutBtn').addEventListener('click', function () {
      setTransform({ x: state.transform.x, y: state.transform.y, scale: state.transform.scale / 1.15 }, true);
    });

    $('btn-ro').addEventListener('click', function () {
      state.lang = 'ro';
      localStorage.setItem('calnic-lang', 'ro');
      ensureLang();
      updateLegend();
      populateSelectors();
    });
    $('btn-en').addEventListener('click', function () {
      state.lang = 'en';
      localStorage.setItem('calnic-lang', 'en');
      ensureLang();
      updateLegend();
      populateSelectors();
    });

    const svg = $('villageTreeSvg');
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      const newScale = clamp(state.transform.scale * factor, 0.22, 2.8);
      const cx = state.viewport.width / 2;
      const cy = state.viewport.height / 2;
      const worldX = (cx - state.transform.x) / state.transform.scale;
      const worldY = (cy - state.transform.y) / state.transform.scale;
      state.transform.scale = newScale;
      state.transform.x = cx - worldX * newScale;
      state.transform.y = cy - worldY * newScale;
    }, { passive: false });

    svg.addEventListener('mousedown', function (e) {
      const nodeEl = e.target.closest('.tree-node-g');
      if (nodeEl) {
        const node = state.nodesById.get(nodeEl.getAttribute('data-node-id'));
        if (node) {
          state.dragNode = node;
          const pt = getSvgPoint(e.clientX, e.clientY);
          node.x = pt.x;
          node.y = pt.y;
          node.vx = 0;
          node.vy = 0;
        }
      } else {
        state.isPanning = true;
      }
      state.panStart = { x: e.clientX, y: e.clientY, tx: state.transform.x, ty: state.transform.y };
      state.dragMoved = false;
    });

    window.addEventListener('mousemove', function (e) {
      if (state.dragNode) {
        const pt = getSvgPoint(e.clientX, e.clientY);
        state.dragNode.x = pt.x;
        state.dragNode.y = pt.y;
        state.dragNode.vx = 0;
        state.dragNode.vy = 0;
        if (state.panStart && (Math.abs(e.clientX - state.panStart.x) > 6 || Math.abs(e.clientY - state.panStart.y) > 6)) state.dragMoved = true;
        return;
      }
      if (state.isPanning && state.panStart) {
        state.transform.x = state.panStart.tx + (e.clientX - state.panStart.x);
        state.transform.y = state.panStart.ty + (e.clientY - state.panStart.y);
        if (Math.abs(e.clientX - state.panStart.x) > 4 || Math.abs(e.clientY - state.panStart.y) > 4) state.dragMoved = true;
        return;
      }
      const nodeEl = e.target.closest('.tree-node-g');
      state.hoveredNodeId = nodeEl ? nodeEl.getAttribute('data-node-id') : null;
    });

    window.addEventListener('mouseup', function (e) {
      const wasDraggingNode = !!state.dragNode;
      const node = state.dragNode;
      state.isPanning = false;
      state.dragNode = null;
      if (state.dragMoved) state.suppressClick = true;
      if (!wasDraggingNode) return;
      const nodeEl = e.target.closest('.tree-node-g');
      if (!state.dragMoved && node && nodeEl && nodeEl.getAttribute('data-node-id') === node.id) {
        onFamilyActivate(node.id);
      }
    });

    svg.addEventListener('click', function (e) {
      if (state.suppressClick) {
        state.suppressClick = false;
        return;
      }
      const nodeEl = e.target.closest('.tree-node-g');
      if (!nodeEl || state.dragNode) return;
      onFamilyActivate(nodeEl.getAttribute('data-node-id'));
    });

    window.addEventListener('resize', function () {
      const wrap = $('treeViewport');
      state.viewport.width = wrap.clientWidth;
      state.viewport.height = wrap.clientHeight;
      $('villageTreeSvg').setAttribute('viewBox', '0 0 ' + state.viewport.width + ' ' + state.viewport.height);
    });
  }

  function animate() {
    runSimulationStep();
    renderGraph();
    state.animationFrame = requestAnimationFrame(animate);
  }

  async function load() {
    $('loadingState').style.display = 'flex';
    $('errorState').style.display = 'none';
    $('treeShell').style.display = 'none';
    try {
      if (!window.VillageTreeAdapter) throw new Error('Adaptorul pentru date nu este disponibil.');
      state.data = await window.VillageTreeAdapter.fetchVillageTreeData();
      state.nodesById = new Map((state.data.graph.nodes || []).map(node => [node.id, node]));
      setupInitialPositions();
      populateSelectors();
      updateStats();
      updateLegend();
      ensureLang();
      const wrap = $('treeViewport');
      state.viewport.width = wrap.clientWidth;
      state.viewport.height = wrap.clientHeight;
      $('villageTreeSvg').setAttribute('viewBox', '0 0 ' + state.viewport.width + ' ' + state.viewport.height);
      fitToNodes(null, false);
      $('loadingState').style.display = 'none';
      $('treeShell').style.display = 'grid';
      if (!state.animationFrame) animate();
    } catch (err) {
      console.error('[VillageTree] load failed', err);
      $('loadingState').style.display = 'none';
      $('errorState').style.display = 'flex';
      $('errorText').textContent = err && err.message ? err.message : 'Unknown error';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupEvents();
    ensureLang();
    load();
  });
})();
