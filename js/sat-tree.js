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
    .on('zoom', function (event) {
      currentTransform = event.transform;
      g.attr('transform', event.transform);
      if (modal && !modal.classList.contains('hidden') && selectedNodeId != null) {
        var selected = nodeById(selectedNodeId);
        if (selected) positionFamilyDetails(selected);
      }
    });
  svg.call(zoom);

  var graphData = null;
  var simulation = null;
  var currentTransform = d3.zoomIdentity;
  var selectedNodeId = null;
  var highlightedPathKeys = {};

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

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

  function positionFamilyDetails(node) {
    if (!modal || !shell || !node || !isFinite(node.x) || !isFinite(node.y)) return;
    var shellW = shell.clientWidth || 900;
    var pad = 14;
    var gap = 18;
    var px = currentTransform.applyX(node.x);
    var py = currentTransform.applyY(node.y);
    var modalW = modal.offsetWidth || Math.min(360, shellW - pad * 2);
    var modalH = modal.offsetHeight || 180;
    var shellRect = shell.getBoundingClientRect();
    var svgRect = svgEl.getBoundingClientRect();
    var svgLeft = Math.max(0, svgRect.left - shellRect.left);
    var svgTop = Math.max(0, svgRect.top - shellRect.top);
    var svgRight = Math.min(shellW, svgLeft + (svgEl.clientWidth || shellW));
    var svgBottom = svgTop + (svgEl.clientHeight || 760);

    // Horizontal rule: right of node if it fits, otherwise left of node.
    var rightCandidate = px + gap;
    var leftCandidate = px - modalW - gap;
    var left = (rightCandidate + modalW <= svgRight - pad) ? rightCandidate : leftCandidate;
    left = clamp(left, svgLeft + pad, Math.max(svgLeft + pad, svgRight - modalW - pad));

    // Vertical rule: keep card fully inside the SVG area.
    var top = clamp(py - modalH / 2, svgTop + pad, Math.max(svgTop + pad, svgBottom - modalH - pad));

    modal.style.left = Math.round(left) + 'px';
    modal.style.top = Math.round(top) + 'px';
  }

  function openFamilyDetails(node) {
    if (!node) return;
    selectedNodeId = node.id;
    var isPublic = node.visibility === 'public';
    modal.classList.remove('hidden');
    modalTitle.textContent = node.label;

    var subEl = document.getElementById('modal-sub');
    if (subEl) subEl.textContent = (node.village || 'Călnic') + ' · Alba · Transilvania';

    var badgeEl = document.getElementById('modal-badge');
    if (badgeEl) {
      badgeEl.textContent = isPublic ? t('FAMILIE PUBLICĂ', 'PUBLIC FAMILY') : t('FAMILIE PRIVATĂ', 'PRIVATE FAMILY');
      badgeEl.className = 'overlay-badge ' + (isPublic ? 'pub' : 'prv');
    }

    var fleurEl = modal.querySelector('.overlay-fleur');
    if (fleurEl) {
      if (!isPublic) {
        fleurEl.innerHTML = '<rect x="5" y="9" width="18" height="14" rx="2" fill="#303540" stroke="#505860" stroke-width="0.8"/><path d="M8,9 V6 Q8,1 14,1 Q20,1 20,6 V9" fill="none" stroke="#505860" stroke-width="1.5"/><circle cx="14" cy="16" r="2.5" fill="#252830"/>';
        fleurEl.setAttribute('viewBox','0 0 28 24');
        fleurEl.setAttribute('height','20');
      } else {
        fleurEl.innerHTML = '<ellipse cx="14" cy="5" rx="3" ry="5.5" fill="#8a6818"/><ellipse cx="8" cy="9" rx="2.2" ry="4" fill="#7a5810" transform="rotate(-25,8,9)"/><ellipse cx="20" cy="9" rx="2.2" ry="4" fill="#7a5810" transform="rotate(25,20,9)"/><rect x="10" y="12" width="8" height="3" rx="1" fill="#6a4e10"/>';
        fleurEl.setAttribute('viewBox','0 0 28 18');
        fleurEl.setAttribute('height','18');
      }
    }

    modalText.innerHTML = isPublic
      ? esc(t('Familie publică din ' + (node.village || 'Calnic') + '. Poți deschide direct arborele familiei sau reveni la lista genealogică.', 'Public family from ' + (node.village || 'Calnic') + '. You can open the family tree directly or return to the genealogy list.'))
      : esc(t('Numele apare în arborele satului, dar detaliile rămân ascunse pentru familiile private.', 'The name appears in the village tree, but details remain hidden for private families.'));
    modalFamilyLink.href = isPublic ? ('genealogie-familie.html?family=' + encodeURIComponent(node.id)) : '#';
    modalFamilyLink.style.pointerEvents = isPublic ? 'auto' : 'none';
    modalFamilyLink.style.opacity = isPublic ? '1' : '.45';
    modalFamilyLink.textContent = isPublic ? t('Arborele familiei', 'Family tree') : t('Familie privată', 'Private family');
    modalGenealogyLink.href = 'genealogie.html';
    modalGenealogyLink.textContent = t('Vezi Genealogie', 'See Genealogy');
    positionFamilyDetails(node);
    requestAnimationFrame(function () { positionFamilyDetails(node); });
  }

  function hideFamilyDetails() {
    modal.classList.add('hidden');
    modal.style.left = '';
    modal.style.top = '';
  }

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
    svg
      .transition()
      .duration(duration || 650)
      .call(zoom.transform, tr)
      .on('end', function () { openFamilyDetails(node); });
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
      .attr('stroke', function (d) { return highlightedPathKeys[linkKey(d.source.id || d.source, d.target.id || d.target)] ? '#c8a030' : '#3a4448'; })
      .attr('stroke-width', function (d) { return highlightedPathKeys[linkKey(d.source.id || d.source, d.target.id || d.target)] ? 2.2 : 1.1; })
      .attr('stroke-opacity', function (d) { return highlightedPathKeys[linkKey(d.source.id || d.source, d.target.id || d.target)] ? 0.9 : 0.4; });

    g.selectAll('.tree-node rect.node-frame')
      .attr('stroke', function (d) {
        if (String(d.id) === String(selectedNodeId)) return '#f0d060';
        return d.visibility === 'public' ? '#9a7218' : '#585048';
      })
      .attr('stroke-width', function (d) { return String(d.id) === String(selectedNodeId) ? 2.2 : 1.6; });

    g.selectAll('.tree-node rect.node-bg')
      .attr('fill', function (d) {
        var onPath = false;
        for (var k in highlightedPathKeys) {
          var parts = k.split('::');
          if (parts[0] === String(d.id) || parts[1] === String(d.id)) { onPath = true; break; }
        }
        if (String(d.id) === String(selectedNodeId)) return '#1e1608';
        if (onPath) return d.visibility === 'public' ? '#1a1408' : '#111418';
        return d.visibility === 'public' ? '#0e0c06' : '#090a0c';
      });

    g.selectAll('.tree-node text.node-label')
      .attr('fill', function (d) {
        if (String(d.id) === String(selectedNodeId)) return '#f0d040';
        var onPath = false;
        for (var k in highlightedPathKeys) {
          var parts = k.split('::');
          if (parts[0] === String(d.id) || parts[1] === String(d.id)) { onPath = true; break; }
        }
        if (onPath) return d.visibility === 'public' ? '#c8a030' : '#8090a0';
        return d.visibility === 'public' ? '#6a5018' : '#404850';
      });
  }

  function attachEvents(nodeSel) {
    nodeSel
      .on('mouseenter', null)
      .on('mousemove', null)
      .on('mouseleave', null)
      .on('click', function (event, d) {
        selectedNodeId = d.id;
        redrawStyles();
        openFamilyDetails(d);
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

  function positionAndShowModal(node, event) {
    if (!node) return;
    openFamilyDetails(node);

    requestAnimationFrame(function() {
      /* D3 transform → coordonate în pixeli CSS față de shell (1:1 pentru că viewBox=clientWidth) */
      var transform = d3.zoomTransform(svgEl);
      var nx = transform.applyX(node.x);
      var ny = transform.applyY(node.y);

      var popW = modal.offsetWidth  || 280;
      var popH = modal.offsetHeight || 220;
      var shellW = shell.clientWidth || 900;
      var margin = 14;
      var nodeHalfW = 76;

      /* orizontal: dreapta dacă încape, altfel stânga */
      var left = nx + nodeHalfW + margin;
      if (left + popW > shellW - margin) {
        left = nx - nodeHalfW - margin - popW;
      }
      left = Math.max(margin, Math.min(left, shellW - popW - margin));

      /* vertical: plasează popup-ul relativ la viewport, nu la shell
         Convertim ny (față de shell) → față de viewport, poziționăm, reconvertim */
      var shellRect = shell.getBoundingClientRect();
      var nyViewport = shellRect.top + ny; /* ny față de viewport */

      /* dorim popup centrat pe nod, dar în zona vizibilă a viewport-ului */
      var vpMargin = 10;
      var topViewport = nyViewport - popH / 2;
      topViewport = Math.max(vpMargin, Math.min(topViewport, window.innerHeight - popH - vpMargin));

      /* convertim înapoi la coordonate față de shell */
      var top = topViewport - shellRect.top;

      modal.style.left   = Math.round(left) + 'px';
      modal.style.top    = Math.round(top)  + 'px';
      modal.style.right  = 'auto';
      modal.style.bottom = 'auto';
    });
  }

  /* ── Draggable popup ── */
  function initModalDrag() {
    var isDragging = false, startX, startY, origLeft, origTop;

    function onMouseDown(e) {
      if (e.target.closest('a') || e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      origLeft = parseInt(modal.style.left) || 0;
      origTop = parseInt(modal.style.top) || 0;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    }

    function onMouseMove(e) {
      if (!isDragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      modal.style.left = (origLeft + dx) + 'px';
      modal.style.top = (origTop + dy) + 'px';
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    modal.addEventListener('mousedown', onMouseDown);
  }

  function renderGraph() {
    var nodes = graphData.graph.nodes;
    var links = graphData.graph.links;
    g.selectAll('*').remove();

    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(130).strength(0.7))
      .force('charge', d3.forceManyBody().strength(-700))
      .force('collide', d3.forceCollide().radius(52))
      .force('center', d3.forceCenter((shell.clientWidth || 900) / 2, 760 / 2));

    var link = g.append('g').selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', 'tree-link');

    var node = g.append('g').selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'tree-node');

    /* ── Nod heraldic: dreptunghi cu fleur-de-lis ── */
    var isPub = function(d){ return d.visibility === 'public'; };

    /* 1. Cadru exterior (gradient simulat cu fill) */
    node.append('rect')
      .attr('class', 'node-frame')
      .attr('x', -66).attr('y', -23)
      .attr('width', 132).attr('height', 46)
      .attr('rx', 2)
      .attr('fill', function(d){ return isPub(d) ? '#7a5818' : '#484038'; })
      .attr('stroke', function(d){ return isPub(d) ? '#9a7218' : '#585048'; })
      .attr('stroke-width', 1.6);

    /* 2. Inel interior întunecat */
    node.append('rect')
      .attr('x', -63).attr('y', -20)
      .attr('width', 126).attr('height', 40)
      .attr('rx', 1)
      .attr('fill', function(d){ return isPub(d) ? '#181308' : '#131518'; });

    /* 3. Fundal interior */
    node.append('rect')
      .attr('class', 'node-bg')
      .attr('x', -61).attr('y', -18)
      .attr('width', 122).attr('height', 36)
      .attr('rx', 1)
      .attr('fill', function(d){ return isPub(d) ? '#0e0c06' : '#090a0c'; });

    /* 4. Linie interioară fină */
    node.append('rect')
      .attr('x', -56).attr('y', -13)
      .attr('width', 112).attr('height', 26)
      .attr('rx', 0)
      .attr('fill', 'none')
      .attr('stroke', function(d){ return isPub(d) ? '#3a2a08' : '#252830'; })
      .attr('stroke-width', 0.45);

    /* 5. Fleur-de-lis pe colțuri și ornamente laterale */
    var corners = [[-64,-21],[64,-21],[-64,21],[64,21]];
    corners.forEach(function(c){
      /* petală centrală */
      node.append('ellipse')
        .attr('cx', c[0]).attr('cy', c[1])
        .attr('rx', 2.2).attr('ry', 4.2)
        .attr('fill', function(d){ return isPub(d) ? '#8a6818' : '#585050'; });
      /* petale laterale stânga */
      node.append('ellipse')
        .attr('cx', c[0] + (c[0]<0?-3:3))
        .attr('cy', c[1] + (c[1]<0?3:-3))
        .attr('rx', 1.4).attr('ry', 2.8)
        .attr('transform', 'rotate(' + (c[0]<0 ? (c[1]<0?-28:28) : (c[1]<0?-28:28)) + ',' + (c[0]+(c[0]<0?-3:3)) + ',' + (c[1]+(c[1]<0?3:-3)) + ')')
        .attr('fill', function(d){ return isPub(d) ? '#7a5810' : '#484848'; });
      /* petale laterale dreapta */
      node.append('ellipse')
        .attr('cx', c[0] + (c[0]<0?3:-3))
        .attr('cy', c[1] + (c[1]<0?3:-3))
        .attr('rx', 1.4).attr('ry', 2.8)
        .attr('transform', 'rotate(' + (c[0]<0 ? (c[1]<0?28:-28) : (c[1]<0?28:-28)) + ',' + (c[0]+(c[0]<0?3:-3)) + ',' + (c[1]+(c[1]<0?3:-3)) + ')')
        .attr('fill', function(d){ return isPub(d) ? '#7a5810' : '#484848'; });
      /* baza fleur */
      node.append('rect')
        .attr('x', c[0]-2).attr('y', c[1]+(c[1]<0?1.5:-3.5))
        .attr('width', 4).attr('height', 1.8).attr('rx', 0.4)
        .attr('fill', function(d){ return isPub(d) ? '#6a4e10' : '#383838'; });
    });

    /* ornamente laterale stânga */
    [-66, 66].forEach(function(lx){
      node.append('ellipse').attr('cx', lx).attr('cy', -7).attr('rx', 1.7).attr('ry', 3.4)
        .attr('fill', function(d){ return isPub(d) ? '#8a6818' : '#505050'; });
      node.append('ellipse').attr('cx', lx).attr('cy', 7).attr('rx', 1.7).attr('ry', 3.4)
        .attr('fill', function(d){ return isPub(d) ? '#8a6818' : '#505050'; });
      node.append('circle').attr('cx', lx).attr('cy', 0).attr('r', 2.1)
        .attr('fill', function(d){ return isPub(d) ? '#7a5818' : '#484848'; });
    });

    /* 6. Text nume */
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'Cinzel, serif')
      .attr('font-size', function(d){ return (d.label && d.label.length > 7) ? 10 : 12; })
      .attr('font-weight', '500')
      .attr('letter-spacing', '1')
      .attr('fill', function(d){ return isPub(d) ? '#6a5018' : '#404850'; })
      .attr('pointer-events', 'none')
      .text(function (d) { return d.label; });

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
      initModalDrag();
      var closeBtn = document.getElementById('modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          hideFamilyDetails();
          selectedNodeId = null;
          redrawStyles();
        });
      }
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
