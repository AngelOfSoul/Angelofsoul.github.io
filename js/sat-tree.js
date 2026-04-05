(function () {
  'use strict';

  function qs(id) { return document.getElementById(id); }
  function lang() { return localStorage.getItem('calnic-lang') || 'ro'; }
  function t(ro, en) { return lang() === 'en' ? en : ro; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
  function params() { return new URLSearchParams(window.location.search); }
  function shortLabel(label) {
    var text = String(label || '').trim();
    return text.length > 22 ? text.slice(0, 21) + '…' : text;
  }
  function nodeMeta(d) {
    return d.visibility === 'public'
      ? t('Familie publica', 'Public family')
      : t('Familie privata', 'Private family');
  }
  function linkBaseColor(type) {
    if (type === 'blood') return '#b98732';
    if (type === 'marriage') return '#8e6a2d';
    if (type === 'alliance') return '#775726';
    return '#5f4926';
  }

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

  var CARD_W = 170;
  var CARD_H = 62;
  var HALF_W = CARD_W / 2;
  var HALF_H = CARD_H / 2;
  var svg = d3.select(svgEl);
  var defs = svg.append('defs');
  var g = svg.append('g');

  var glow = defs.append('filter').attr('id', 'node-gold-glow').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
  glow.append('feGaussianBlur').attr('stdDeviation', 5).attr('result', 'blur');
  glow.append('feColorMatrix')
    .attr('in', 'blur')
    .attr('type', 'matrix')
    .attr('values', '1 0 0 0 0  0 0.85 0 0 0  0 0 0.45 0 0  0 0 0 0.9 0')
    .attr('result', 'goldblur');
  var merge = glow.append('feMerge');
  merge.append('feMergeNode').attr('in', 'goldblur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');

  var softShadow = defs.append('filter').attr('id', 'node-soft-shadow').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
  softShadow.append('feDropShadow')
    .attr('dx', 0)
    .attr('dy', 10)
    .attr('stdDeviation', 12)
    .attr('flood-color', '#000000')
    .attr('flood-opacity', 0.35);

  var zoom = d3.zoom()
    .scaleExtent([0.35, 3])
    .filter(function (event) { return event.type !== 'wheel'; })
    .on('zoom', function (event) { g.attr('transform', event.transform); });
  svg.call(zoom);

  var graphData = null;
  var simulation = null;
  var selectedNodeId = null;
  var highlightedPathKeys = {};

  function zoomByFactor(factor) {
    if (!factor || factor <= 0) return;
    var w = shell.clientWidth || 900;
    var h = 820;
    svg.transition().duration(220).call(zoom.scaleBy, factor, [w / 2, h / 2]);
  }

  function resizeSvg() {
    var w = shell.clientWidth || 900;
    var h = window.innerWidth < 760 ? 720 : 820;
    svg.attr('viewBox', '0 0 ' + w + ' ' + h).attr('width', w).attr('height', h);
    if (simulation) simulation.force('center', d3.forceCenter(w / 2, h / 2)).alpha(0.3).restart();
  }

  function status(text) {
    if (statusEl) statusEl.textContent = text;
  }

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
    var stats = [];
    if (node.membersCount) stats.push('<div class="modal-stat"><strong>' + esc(node.membersCount) + '</strong><span>' + esc(t('membri', 'members')) + '</span></div>');
    if (node.generationsCount) stats.push('<div class="modal-stat"><strong>' + esc(node.generationsCount) + '</strong><span>' + esc(t('generatii', 'generations')) + '</span></div>');
    if (node.photosCount || node.photosCount === 0) stats.push('<div class="modal-stat"><strong>' + esc(node.photosCount) + '</strong><span>' + esc(t('fotografii', 'photos')) + '</span></div>');

    modal.classList.remove('hidden');
    modalTitle.textContent = node.label;
    modalText.innerHTML = (isPublic
      ? esc(t('Familie publica din ' + (node.village || 'Calnic') + '. Poti deschide direct arborele familiei sau poti reveni la lista genealogica.', 'Public family from ' + (node.village || 'Calnic') + '. You can open the family tree directly or return to the genealogy list.'))
      : esc(t('Familie privata. Numele apare in arborele satului, dar detaliile publice raman ascunse.', 'Private family. The name appears in the village tree, but public details remain hidden.')))
      + (stats.length ? '<div class="modal-mini-stats">' + stats.slice(0, 3).join('') + '</div>' : '');
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
    var w = shell.clientWidth || 900, h = window.innerWidth < 760 ? 720 : 820;
    var nodes = graphData.graph.nodes.filter(function (n) { return isFinite(n.x) && isFinite(n.y); });
    if (!nodes.length) return;
    var minX = d3.min(nodes, function (n) { return n.x; }), maxX = d3.max(nodes, function (n) { return n.x; });
    var minY = d3.min(nodes, function (n) { return n.y; }), maxY = d3.max(nodes, function (n) { return n.y; });
    var dx = Math.max(320, maxX - minX + 260), dy = Math.max(260, maxY - minY + 220);
    var scale = Math.max(0.4, Math.min(1.15, 0.92 / Math.max(dx / w, dy / h)));
    var tx = w / 2 - ((minX + maxX) / 2) * scale;
    var ty = h / 2 - ((minY + maxY) / 2) * scale;
    var tr = d3.zoomIdentity.translate(tx, ty).scale(scale);
    svg.transition().duration(duration || 500).call(zoom.transform, tr);
  }

  function focusNode(nodeId, duration) {
    var node = nodeById(nodeId);
    if (!node || !isFinite(node.x) || !isFinite(node.y)) return;
    var w = shell.clientWidth || 900, h = window.innerWidth < 760 ? 720 : 820;
    var tr = d3.zoomIdentity.translate(w / 2 - node.x * 1.1, h / 2 - node.y * 1.1).scale(1.1);
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
      .attr('stroke', function (d) {
        var key = linkKey(d.source.id || d.source, d.target.id || d.target);
        return highlightedPathKeys[key] ? '#f1d694' : linkBaseColor(d.type);
      })
      .attr('stroke-width', function (d) {
        var key = linkKey(d.source.id || d.source, d.target.id || d.target);
        return highlightedPathKeys[key] ? 3.2 : 1.8;
      })
      .attr('stroke-opacity', function (d) {
        var key = linkKey(d.source.id || d.source, d.target.id || d.target);
        return highlightedPathKeys[key] ? 1 : 0.72;
      });

    g.selectAll('.tree-node .node-card-outer')
      .attr('stroke', function (d) {
        if (String(d.id) === String(selectedNodeId)) return '#f1d694';
        return d.visibility === 'public' ? '#bc8a36' : '#786954';
      })
      .attr('stroke-width', function (d) { return String(d.id) === String(selectedNodeId) ? 2.4 : 1.3; })
      .attr('fill', function (d) {
        if (String(d.id) === String(selectedNodeId)) return 'rgba(80,56,18,0.92)';
        return d.visibility === 'public' ? 'rgba(34,23,13,0.94)' : 'rgba(22,18,14,0.94)';
      })
      .attr('filter', function (d) { return String(d.id) === String(selectedNodeId) ? 'url(#node-gold-glow)' : 'url(#node-soft-shadow)'; });

    g.selectAll('.tree-node .node-card-inner')
      .attr('stroke', function (d) {
        if (String(d.id) === String(selectedNodeId)) return 'rgba(241,214,148,0.42)';
        return d.visibility === 'public' ? 'rgba(214,170,85,0.22)' : 'rgba(255,255,255,0.06)';
      })
      .attr('fill', function (d) {
        if (String(d.id) === String(selectedNodeId)) return 'rgba(56,39,15,0.94)';
        return d.visibility === 'public' ? 'rgba(20,14,10,0.96)' : 'rgba(18,15,12,0.96)';
      });

    g.selectAll('.tree-node .node-divider')
      .attr('stroke', function (d) { return String(d.id) === String(selectedNodeId) ? 'rgba(241,214,148,0.55)' : 'rgba(214,170,85,0.32)'; });

    g.selectAll('.tree-node .node-name')
      .attr('fill', function (d) { return String(d.id) === String(selectedNodeId) ? '#f7e6bc' : '#f2e3bf'; })
      .style('font-weight', function (d) { return String(d.id) === String(selectedNodeId) ? '700' : '600'; });

    g.selectAll('.tree-node .node-meta')
      .attr('fill', function (d) {
        return d.visibility === 'public' ? '#d0ae6a' : '#99876a';
      });
  }

  function attachEvents(nodeSel) {
    nodeSel
      .on('mouseenter', function (event, d) {
        tooltip.style.display = 'block';
        tooltip.innerHTML =
          '<strong>' + esc(d.label) + '</strong>' +
          '<span class="tooltip-meta">' + esc(d.village || 'Calnic') + ' · ' + esc(nodeMeta(d)) + '</span>';
      })
      .on('mousemove', function (event) {
        var rect = shell.getBoundingClientRect();
        tooltip.style.left = (event.clientX - rect.left + 18) + 'px';
        tooltip.style.top = (event.clientY - rect.top + 18) + 'px';
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

    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(190).strength(0.72))
      .force('charge', d3.forceManyBody().strength(-2100))
      .force('collide', d3.forceCollide().radius(108))
      .force('x', d3.forceX((shell.clientWidth || 900) / 2).strength(0.03))
      .force('y', d3.forceY((window.innerWidth < 760 ? 720 : 820) / 2).strength(0.035))
      .force('center', d3.forceCenter((shell.clientWidth || 900) / 2, (window.innerWidth < 760 ? 720 : 820) / 2));

    var link = g.append('g').selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', 'tree-link')
      .attr('stroke-linecap', 'round');

    var node = g.append('g').selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'tree-node')
      .style('cursor', 'pointer');

    node.append('rect')
      .attr('class', 'node-card-outer')
      .attr('x', -HALF_W)
      .attr('y', -HALF_H)
      .attr('width', CARD_W)
      .attr('height', CARD_H)
      .attr('rx', 8)
      .attr('ry', 8);

    node.append('rect')
      .attr('class', 'node-card-inner')
      .attr('x', -HALF_W + 5)
      .attr('y', -HALF_H + 5)
      .attr('width', CARD_W - 10)
      .attr('height', CARD_H - 10)
      .attr('rx', 6)
      .attr('ry', 6);

    node.append('line')
      .attr('class', 'node-divider')
      .attr('x1', -50)
      .attr('x2', 50)
      .attr('y1', 2)
      .attr('y2', 2)
      .attr('stroke-width', 1);

    node.append('text')
      .attr('class', 'node-name')
      .attr('text-anchor', 'middle')
      .attr('y', -9)
      .style('font-family', 'Playfair Display, serif')
      .style('font-size', '18px')
      .text(function (d) { return shortLabel(d.label); });

    node.append('text')
      .attr('class', 'node-meta')
      .attr('text-anchor', 'middle')
      .attr('y', 21)
      .style('font-size', '12px')
      .style('letter-spacing', '1.4px')
      .style('text-transform', 'uppercase')
      .text(function (d) { return nodeMeta(d); });

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
    var match = graphData.graph.nodes.find(function (n) {
      var label = String(n.label || '').toLowerCase();
      return label === value || label.indexOf(value) !== -1;
    });
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
