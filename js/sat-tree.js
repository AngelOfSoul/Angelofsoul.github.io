(function () {
  'use strict';

  function qs(id) { return document.getElementById(id); }
  function lang() { return localStorage.getItem('calnic-lang') || 'ro'; }
  function t(ro, en) { return lang() === 'en' ? en : ro; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
  function params() { return new URLSearchParams(window.location.search); }

  var shell = qs('tree-container');
  var svgEl = qs('village-tree');
  var tooltip = qs('tooltip');
  var modal = qs('family-modal');
  var modalTitle = qs('modal-title');
  var modalText = qs('modal-text');
  var modalFamilyLink = qs('modal-family-link');
  var modalGenealogyLink = qs('modal-genealogy-link');
  var statusEl = qs('status');
  var searchInput = qs('family-search');
  var familyList = qs('family-list');
  var relationFrom = qs('relation-from');
  var relationTo = qs('relation-to');
  var clearBtn = qs('clear-selection');
  var fitBtn = qs('fit-view');
  var findBtn = qs('find-relation');
  var zoomInBtn = qs('villageZoomIn');
  var zoomOutBtn = qs('villageZoomOut');

  var svg = d3.select(svgEl);
  var g = svg.append('g');
  var zoom = d3.zoom()
    .scaleExtent([0.35, 3])
    // Keep page wheel scrolling active; zoom only from explicit UI actions.
    .filter(function (event) { return event.type !== 'wheel'; })
    .on('zoom', function (event) { g.attr('transform', event.transform); });
  svg.call(zoom);

  var graphData = null;
  var simulation = null;
  var currentTransform = d3.zoomIdentity;
  var selectedNodeId = null;
  var highlightedPathKeys = {};

  function zoomByFactor(factor) {
    if (!factor || factor <= 0) return;
    var w = shell.clientWidth || 900;
    var h = 760;
    svg.transition().duration(220).call(zoom.scaleBy, factor, [w / 2, h / 2]);
  }

  function resizeSvg() {
    var w = shell.clientWidth || 900;
    var h = 760;
    svg.attr('viewBox', '0 0 ' + w + ' ' + h).attr('width', w).attr('height', h);
    if (simulation) simulation.force('center', d3.forceCenter(w / 2, h / 2)).alpha(0.3).restart();
  }

  function status(text) { if (statusEl) statusEl.textContent = text; }

  function populateSelectors(nodes) {
    var sorted = nodes.slice().sort(function (a, b) { return (a.label || '').localeCompare(b.label || '', 'ro'); });
    familyList.innerHTML = '';
    relationFrom.innerHTML = '<option value="">' + t('Alege familia', 'Choose family') + '</option>';
    relationTo.innerHTML = '<option value="">' + t('Alege familia', 'Choose family') + '</option>';
    sorted.forEach(function (n) {
      var label = n.label + (n.village ? ' (' + n.village + ')' : '');
      var opt1 = document.createElement('option'); opt1.value = n.id; opt1.textContent = label; relationFrom.appendChild(opt1);
      var opt2 = document.createElement('option'); opt2.value = n.id; opt2.textContent = label; relationTo.appendChild(opt2);
      var dl = document.createElement('option'); dl.value = n.label; familyList.appendChild(dl);
    });
  }

  function nodeById(id) {
    return (graphData && graphData.graph.nodes || []).find(function (n) { return String(n.id) === String(id); }) || null;
  }

  function openFamilyDetails(node) {
    if (!node) return;
    selectedNodeId = node.id;
    var isPublic = node.visibility === 'public';
    modal.classList.remove('hidden');
    modalTitle.textContent = node.label;
    modalText.innerHTML = isPublic
      ? esc(t('Familie publica din ' + (node.village || 'Calnic') + '. Poti deschide direct arborele familiei sau poti reveni la lista genealogica.', 'Public family from ' + (node.village || 'Calnic') + '. You can open the family tree directly or return to the genealogy list.'))
      : esc(t('Familie privata. Numele apare in arborele satului, dar detaliile publice raman ascunse.', 'Private family. The name appears in the village tree, but public details remain hidden.'));
    modalFamilyLink.href = isPublic ? ('genealogie-familie.html?family=' + encodeURIComponent(node.id)) : '#';
    modalFamilyLink.style.pointerEvents = isPublic ? 'auto' : 'none';
    modalFamilyLink.style.opacity = isPublic ? '1' : '.55';
    modalFamilyLink.textContent = isPublic ? t('Deschide arborele familiei', 'Open family tree') : t('Familie privata', 'Private family');
    modalGenealogyLink.href = 'genealogie.html';
    modalGenealogyLink.textContent = t('Vezi in Genealogie', 'See in Genealogy');
  }

  function hideFamilyDetails() { modal.classList.add('hidden'); }

  function fitGraph(duration) {
    if (!graphData || !graphData.graph.nodes.length) return;
    var w = shell.clientWidth || 900, h = 760;
    var nodes = graphData.graph.nodes.filter(function (n) { return isFinite(n.x) && isFinite(n.y); });
    if (!nodes.length) return;
    var minX = d3.min(nodes, function (n) { return n.x; }), maxX = d3.max(nodes, function (n) { return n.x; });
    var minY = d3.min(nodes, function (n) { return n.y; }), maxY = d3.max(nodes, function (n) { return n.y; });
    var dx = Math.max(200, maxX - minX + 140), dy = Math.max(200, maxY - minY + 140);
    var scale = Math.max(0.45, Math.min(1.35, 0.92 / Math.max(dx / w, dy / h)));
    var tx = w / 2 - ((minX + maxX) / 2) * scale;
    var ty = h / 2 - ((minY + maxY) / 2) * scale;
    var tr = d3.zoomIdentity.translate(tx, ty).scale(scale);
    svg.transition().duration(duration || 500).call(zoom.transform, tr);
  }

  function focusNode(nodeId, duration) {
    var node = nodeById(nodeId);
    if (!node || !isFinite(node.x) || !isFinite(node.y)) return;
    var w = shell.clientWidth || 900, h = 760;
    var tr = d3.zoomIdentity.translate(w / 2 - node.x * 1.25, h / 2 - node.y * 1.25).scale(1.25);
    svg.transition().duration(duration || 650).call(zoom.transform, tr);
    openFamilyDetails(node);
  }

  function linkKey(a, b) { return [String(a), String(b)].sort().join('::'); }

  function bfs(from, to) {
    if (!graphData || !from || !to) return null;
    if (String(from) === String(to)) return [String(from)];
    var adj = graphData.graph.adjacency || new Map();
    var q = [[String(from)]], seen = {}; seen[String(from)] = 1;
    while (q.length) {
      var path = q.shift();
      var cur = path[path.length - 1];
      var neigh = adj.get(String(cur)) || [];
      for (var i = 0; i < neigh.length; i++) {
        var nextId = String(neigh[i].nodeId);
        if (seen[nextId]) continue;
        var nextPath = path.concat(nextId);
        if (nextId === String(to)) return nextPath;
        seen[nextId] = 1;
        q.push(nextPath);
      }
    }
    return null;
  }

  function applyPath(path) {
    highlightedPathKeys = {};
    if (Array.isArray(path) && path.length > 1) {
      for (var i = 0; i < path.length - 1; i++) highlightedPathKeys[linkKey(path[i], path[i + 1])] = true;
    }
    redrawStyles();
  }

  function redrawStyles() {
    g.selectAll('.tree-link')
      .attr('stroke', function (d) { return highlightedPathKeys[linkKey(d.source.id || d.source, d.target.id || d.target)] ? '#9bc5ff' : 'rgba(120,152,208,.45)'; })
      .attr('stroke-width', function (d) { return highlightedPathKeys[linkKey(d.source.id || d.source, d.target.id || d.target)] ? 3.6 : 1.9; })
      .attr('stroke-opacity', function (d) { return highlightedPathKeys[linkKey(d.source.id || d.source, d.target.id || d.target)] ? 1 : 0.86; })
      .attr('filter', function (d) { return highlightedPathKeys[linkKey(d.source.id || d.source, d.target.id || d.target)] ? 'url(#linkGlow)' : null; });

    g.selectAll('.tree-node .node-glow')
      .attr('fill', function (d) {
        if (String(d.id) === String(selectedNodeId)) return 'rgba(120,171,255,.34)';
        return d.visibility === 'public' ? 'rgba(217,176,93,.18)' : 'rgba(130,145,170,.16)';
      })
      .attr('width', function (d) { return String(d.id) === String(selectedNodeId) ? 200 : 186; })
      .attr('height', function (d) { return String(d.id) === String(selectedNodeId) ? 88 : 76; })
      .attr('x', function (d) { return String(d.id) === String(selectedNodeId) ? -100 : -93; })
      .attr('y', function (d) { return String(d.id) === String(selectedNodeId) ? -44 : -38; });

    g.selectAll('.tree-node .node-card')
      .attr('fill', function (d) {
        if (String(d.id) === String(selectedNodeId)) return 'url(#nodeSelectedGradient)';
        return d.visibility === 'public' ? 'url(#nodePublicGradient)' : 'url(#nodePrivateGradient)';
      })
      .attr('stroke', function (d) {
        if (String(d.id) === String(selectedNodeId)) return '#cfe2ff';
        return d.visibility === 'public' ? 'rgba(233,198,128,.72)' : 'rgba(170,186,214,.48)';
      })
      .attr('stroke-width', function (d) { return String(d.id) === String(selectedNodeId) ? 2.3 : 1.2; })
      .attr('width', function (d) { return String(d.id) === String(selectedNodeId) ? 188 : 174; })
      .attr('height', function (d) { return String(d.id) === String(selectedNodeId) ? 76 : 68; })
      .attr('x', function (d) { return String(d.id) === String(selectedNodeId) ? -94 : -87; })
      .attr('y', function (d) { return String(d.id) === String(selectedNodeId) ? -38 : -34; })
      .attr('filter', 'url(#cardShadow)');

    g.selectAll('.tree-node .node-accent')
      .attr('fill', function (d) {
        if (String(d.id) === String(selectedNodeId)) return '#9bc5ff';
        return d.visibility === 'public' ? '#d9b05d' : '#8b9bb7';
      })
      .attr('width', function (d) { return String(d.id) === String(selectedNodeId) ? 150 : 136; })
      .attr('x', function (d) { return String(d.id) === String(selectedNodeId) ? -75 : -68; });

    g.selectAll('.tree-node .node-title')
      .attr('fill', function (d) { return String(d.id) === String(selectedNodeId) ? '#ffffff' : '#f2f7ff'; })
      .attr('font-size', function (d) { return String(d.id) === String(selectedNodeId) ? 16 : 15; });

    g.selectAll('.tree-node .node-subtitle')
      .attr('fill', function (d) { return String(d.id) === String(selectedNodeId) ? '#dce8ff' : '#a9bddf'; });
  }

  function attachEvents(nodeSel) {
    nodeSel
      .on('mouseenter', function (event, d) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = '<strong>' + esc(d.label) + '</strong><br>' + esc(d.village || 'Calnic');
      })
      .on('mousemove', function (event) {
        var rect = shell.getBoundingClientRect();
        tooltip.style.left = (event.clientX - rect.left + 16) + 'px';
        tooltip.style.top = (event.clientY - rect.top + 16) + 'px';
      })
      .on('mouseleave', function () { tooltip.style.display = 'none'; })
      .on('click', function (event, d) {
        selectedNodeId = d.id;
        redrawStyles();
        focusNode(d.id, 450);
      })
      .call(d3.drag()
        .on('start', function (event, d) {
          if (!event.active) simulation.alphaTarget(0.2).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', function (event, d) { d.fx = event.x; d.fy = event.y; })
        .on('end', function (event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));
  }

  function renderGraph() {
    var nodes = graphData.graph.nodes;
    var links = graphData.graph.links;
    g.selectAll('*').remove();

    var defs = g.append('defs');

    var cardShadow = defs.append('filter').attr('id', 'cardShadow').attr('x', '-40%').attr('y', '-60%').attr('width', '180%').attr('height', '220%');
    cardShadow.append('feDropShadow').attr('dx', 0).attr('dy', 12).attr('stdDeviation', 10).attr('flood-color', '#000814').attr('flood-opacity', 0.45);

    var linkGlow = defs.append('filter').attr('id', 'linkGlow').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
    linkGlow.append('feDropShadow').attr('dx', 0).attr('dy', 0).attr('stdDeviation', 4).attr('flood-color', '#8fc0ff').attr('flood-opacity', 0.55);

    var gradPublic = defs.append('linearGradient').attr('id', 'nodePublicGradient').attr('x1', '0%').attr('x2', '100%').attr('y1', '0%').attr('y2', '100%');
    gradPublic.append('stop').attr('offset', '0%').attr('stop-color', '#152b4f');
    gradPublic.append('stop').attr('offset', '100%').attr('stop-color', '#0b1730');

    var gradPrivate = defs.append('linearGradient').attr('id', 'nodePrivateGradient').attr('x1', '0%').attr('x2', '100%').attr('y1', '0%').attr('y2', '100%');
    gradPrivate.append('stop').attr('offset', '0%').attr('stop-color', '#13233e');
    gradPrivate.append('stop').attr('offset', '100%').attr('stop-color', '#0b1324');

    var gradSelected = defs.append('linearGradient').attr('id', 'nodeSelectedGradient').attr('x1', '0%').attr('x2', '100%').attr('y1', '0%').attr('y2', '100%');
    gradSelected.append('stop').attr('offset', '0%').attr('stop-color', '#25457d');
    gradSelected.append('stop').attr('offset', '50%').attr('stop-color', '#1d3a6f');
    gradSelected.append('stop').attr('offset', '100%').attr('stop-color', '#102445');

    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(170).strength(0.66))
      .force('charge', d3.forceManyBody().strength(-1200))
      .force('collide', d3.forceCollide().radius(98))
      .force('center', d3.forceCenter((shell.clientWidth || 900) / 2, 760 / 2));

    var link = g.append('g').selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', 'tree-link')
      .attr('stroke-linecap', 'round');

    var node = g.append('g').selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'tree-node');

    node.append('rect').attr('class', 'node-glow').attr('rx', 22).attr('ry', 22);
    node.append('rect').attr('class', 'node-card').attr('rx', 18).attr('ry', 18);
    node.append('rect').attr('class', 'node-accent').attr('x', -68).attr('y', -24).attr('height', 3).attr('rx', 999).attr('ry', 999);
    node.append('text')
      .attr('class', 'node-title')
      .attr('dy', -2)
      .text(function (d) {
        var label = String(d.label || '');
        return label.length > 20 ? label.slice(0, 20) + '…' : label;
      });
    node.append('text')
      .attr('class', 'node-subtitle')
      .attr('dy', 18)
      .text(function (d) {
        return d.visibility === 'public'
          ? t('Familie publică', 'Public family')
          : t('Familie privată', 'Private family');
      });

    attachEvents(node);

    simulation.on('tick', function () {
      link
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; });
      node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
    });

    simulation.on('end', function () {
      redrawStyles();
      fitGraph(650);
      applyInitialState();
    });

    redrawStyles();
    status(t(nodes.length + ' familii incarcate.', nodes.length + ' families loaded.'));
  }

  function applyInitialState() {
    var q = params();
    var from = q.get('from');
    var to = q.get('to');
    var familyId = q.get('family') || localStorage.getItem('selectedFamily');
    if (from && to) {
      relationFrom.value = from;
      relationTo.value = to;
      var path = bfs(from, to);
      applyPath(path);
      if (path && path.length) {
        selectedNodeId = path[0];
        redrawStyles();
        focusNode(path[0], 650);
        status(t('Legatura evidentiata intre familii.', 'Connection highlighted between families.'));
      } else {
        status(t('Nu exista o legatura documentata intre familiile alese.', 'No documented connection found between the selected families.'));
      }
    } else if (familyId) {
      selectedNodeId = familyId;
      redrawStyles();
      focusNode(familyId, 650);
      localStorage.removeItem('selectedFamily');
    }
  }

  function searchByLabel() {
    var value = String(searchInput.value || '').trim().toLowerCase();
    if (!value || !graphData) return;
    var match = graphData.graph.nodes.find(function (n) { return String(n.label || '').toLowerCase() === value || String(n.label || '').toLowerCase().indexOf(value) !== -1; });
    if (match) {
      selectedNodeId = match.id;
      redrawStyles();
      applyPath(null);
      focusNode(match.id, 500);
    }
  }

  async function bootstrap() {
    try {
      resizeSvg();
      if (!window.VillageTreeAdapter || !window.VillageTreeAdapter.fetchVillageTreeData) {
        throw new Error('Adapterul pentru arborele satului lipseste.');
      }
      graphData = await window.VillageTreeAdapter.fetchVillageTreeData();
      populateSelectors(graphData.graph.nodes);
      if (!graphData.graph.nodes.length) {
        status(t('Nu exista inca familii publice de afisat in arborele satului.', 'There are no public families to display in the village tree yet.'));
        return;
      }
      renderGraph();
    } catch (err) {
      console.error(err);
      status(t('Eroare la incarcarea arborelui satului.', 'Error loading the village tree.'));
    }
  }

  if (searchInput) searchInput.addEventListener('change', searchByLabel);
  if (searchInput) searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') searchByLabel(); });
  if (clearBtn) clearBtn.addEventListener('click', function () {
    selectedNodeId = null;
    hideFamilyDetails();
    applyPath(null);
    redrawStyles();
    fitGraph(450);
    history.replaceState({}, '', 'arborele-satului.html');
  });
  if (fitBtn) fitBtn.addEventListener('click', function () { fitGraph(450); });
  if (zoomInBtn) zoomInBtn.addEventListener('click', function () { zoomByFactor(1.14); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', function () { zoomByFactor(1 / 1.14); });
  if (findBtn) findBtn.addEventListener('click', function () {
    var from = relationFrom.value, to = relationTo.value;
    if (!from || !to || from === to) {
      status(t('Alege doua familii diferite.', 'Choose two different families.'));
      return;
    }
    var path = bfs(from, to);
    if (!path) {
      applyPath(null);
      status(t('Nu exista o legatura documentata intre familiile alese.', 'No documented connection found between the selected families.'));
      return;
    }
    selectedNodeId = path[0];
    applyPath(path);
    focusNode(path[0], 500);
    status(t('Traseu gasit: ' + path.length + ' familii.', 'Path found: ' + path.length + ' families.'));
    history.replaceState({}, '', 'arborele-satului.html?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to));
  });

  window.addEventListener('resize', resizeSvg);
  bootstrap();
})();
