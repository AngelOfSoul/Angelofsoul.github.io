import supabase from "./supabase-client.js";

const state = {
  nodes: [],
  links: [],
  adjacency: new Map(),
  simulation: null,
  svg: null,
  gRoot: null,
  gLinks: null,
  gNodes: null,
  zoom: null,
  width: 0,
  height: 0,
  selectedNodeId: null,
  highlightedNodeIds: new Set(),
  highlightedLinkKeys: new Set(),
};

const els = {
  svg: document.getElementById("village-tree"),
  treeContainer: document.getElementById("tree-container"),
  status: document.getElementById("status"),
  familySearch: document.getElementById("family-search"),
  familyList: document.getElementById("family-list"),
  relationFrom: document.getElementById("relation-from"),
  relationTo: document.getElementById("relation-to"),
  findRelation: document.getElementById("find-relation"),
  fitView: document.getElementById("fit-view"),
  clearSelection: document.getElementById("clear-selection"),
  tooltip: document.getElementById("tooltip"),
  modal: document.getElementById("family-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalText: document.getElementById("modal-text"),
};

function setStatus(message, kind = "normal") {
  els.status.textContent = message;
  els.status.className = kind === "ok" ? "message-ok" : kind === "warn" ? "message-warn" : "";
}

function normalizeName(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function linkKey(a, b) {
  return [a, b].sort().join("__");
}

async function loadVillageGraph() {
  const [familiesRes, linksRes, pagesRes] = await Promise.all([
    supabase
      .from("families")
      .select("id, slug, display_name, visibility")
      .order("display_name", { ascending: true }),
    supabase
      .from("v_family_connections")
      .select("source_family_id, target_family_id, relationship_type"),
    supabase
      .from("family_pages")
      .select("family_id, page_slug, is_public"),
  ]);

  if (familiesRes.error) throw familiesRes.error;
  if (linksRes.error) throw linksRes.error;
  if (pagesRes.error) throw pagesRes.error;

  const pageMap = new Map((pagesRes.data || []).map(row => [row.family_id, row]));

  const nodes = (familiesRes.data || []).map(f => ({
    id: f.id,
    slug: f.slug,
    name: f.display_name,
    visibility: f.visibility,
    pageSlug: pageMap.get(f.id)?.page_slug || null,
    pagePublic: pageMap.get(f.id)?.is_public || false,
  }));

  const seen = new Set();
  const links = [];
  for (const row of linksRes.data || []) {
    const dedupeKey = linkKey(row.source_family_id, row.target_family_id) + "::" + row.relationship_type;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    links.push({
      source: row.source_family_id,
      target: row.target_family_id,
      type: row.relationship_type,
    });
  }

  return { nodes, links };
}

function buildAdjacency(nodes, links) {
  const adjacency = new Map(nodes.map(node => [node.id, []]));
  for (const link of links) {
    adjacency.get(link.source)?.push({ nodeId: link.target, type: link.type });
    adjacency.get(link.target)?.push({ nodeId: link.source, type: link.type });
  }
  return adjacency;
}

function findNodeByName(inputName) {
  const normalized = normalizeName(inputName);
  return state.nodes.find(n => normalizeName(n.name) === normalized) || null;
}

function populateControls(nodes) {
  els.familyList.innerHTML = "";
  els.relationFrom.innerHTML = '<option value="">Alege familia</option>';
  els.relationTo.innerHTML = '<option value="">Alege familia</option>';

  for (const node of nodes) {
    const option = document.createElement("option");
    option.value = node.name;
    els.familyList.appendChild(option);

    const opt1 = document.createElement("option");
    opt1.value = node.id;
    opt1.textContent = node.name;
    els.relationFrom.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = node.id;
    opt2.textContent = node.name;
    els.relationTo.appendChild(opt2);
  }
}

function showModal(title, text) {
  els.modalTitle.textContent = title;
  els.modalText.textContent = text;
  els.modal.classList.remove("hidden");
}

function hideModal() {
  els.modal.classList.add("hidden");
}

function familyOpenUrl(node) {
  if (node.pagePublic && node.pageSlug) {
    return `${node.pageSlug}.html`;
  }
  return `genealogie-familie.html?family=${encodeURIComponent(node.slug || node.name)}`;
}

function handleNodeClick(event, node) {
  event.stopPropagation();
  state.selectedNodeId = node.id;
  centerOnNode(node, 1.35);

  if (node.visibility === "private") {
    showModal(node.name, "Privat");
    setStatus(`Familia "${node.name}" este privată.`, "warn");
    updateStyles();
    return;
  }

  hideModal();
  setStatus(`Se deschide familia "${node.name}"...`, "ok");
  updateStyles();
  window.location.href = familyOpenUrl(node);
}

function renderTooltip(event, node) {
  const visibilityText = node.visibility === "public" ? "Publică" : "Privată";
  els.tooltip.innerHTML = `<strong>${node.name}</strong><br>Status: ${visibilityText}`;
  els.tooltip.style.display = "block";
  els.tooltip.style.left = `${event.offsetX + 18}px`;
  els.tooltip.style.top = `${event.offsetY + 18}px`;
}

function hideTooltip() {
  els.tooltip.style.display = "none";
}

function resetHighlight() {
  state.highlightedNodeIds.clear();
  state.highlightedLinkKeys.clear();
  state.selectedNodeId = null;
  hideModal();
  updateStyles();
  setStatus("Vizualizare resetată.");
}

function updateStyles() {
  state.gNodes.selectAll("g.node").each(function(d) {
    const isSelected = state.selectedNodeId === d.id;
    const dimNode = state.highlightedNodeIds.size > 0 && !state.highlightedNodeIds.has(d.id);

    d3.select(this).select("circle")
      .attr("fill", d.visibility === "public" ? "#d4a84a" : "#6f7884")
      .attr("stroke", isSelected ? "#fff4c2" : state.highlightedNodeIds.has(d.id) ? "#f4d88a" : "#243244")
      .attr("r", isSelected ? 28 : 22)
      .attr("opacity", dimNode ? 0.22 : 1);

    d3.select(this).select("text")
      .attr("opacity", dimNode ? 0.25 : 1)
      .attr("font-weight", isSelected || state.highlightedNodeIds.has(d.id) ? 700 : 500);
  });

  state.gLinks.selectAll("line").each(function(d) {
    const sourceId = typeof d.source === "object" ? d.source.id : d.source;
    const targetId = typeof d.target === "object" ? d.target.id : d.target;
    const key = linkKey(sourceId, targetId);
    const dimLink = state.highlightedLinkKeys.size > 0 && !state.highlightedLinkKeys.has(key);

    d3.select(this)
      .attr("stroke", state.highlightedLinkKeys.has(key) ? "#f4d88a" : "#4f5d73")
      .attr("stroke-width", state.highlightedLinkKeys.has(key) ? 3.8 : 2)
      .attr("opacity", dimLink ? 0.16 : 0.9);
  });
}

function fitGraph(duration = 650) {
  if (!state.nodes.length) return;

  const xs = state.nodes.map(n => n.x || 0);
  const ys = state.nodes.map(n => n.y || 0);

  const minX = Math.min(...xs) - 80;
  const maxX = Math.max(...xs) + 80;
  const minY = Math.min(...ys) - 80;
  const maxY = Math.max(...ys) + 80;

  const graphWidth = Math.max(1, maxX - minX);
  const graphHeight = Math.max(1, maxY - minY);

  const scale = Math.min(2.1, 0.9 / Math.max(graphWidth / state.width, graphHeight / state.height));
  const translateX = state.width / 2 - scale * (minX + graphWidth / 2);
  const translateY = state.height / 2 - scale * (minY + graphHeight / 2);

  state.svg.transition()
    .duration(duration)
    .call(state.zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
}

function centerOnNode(node, zoomLevel = 1.5, duration = 650) {
  if (!node) return;
  const tx = state.width / 2 - zoomLevel * node.x;
  const ty = state.height / 2 - zoomLevel * node.y;

  state.svg.transition()
    .duration(duration)
    .call(state.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(zoomLevel));
}

function bfsFamilyPath(startId, endId) {
  if (!startId || !endId) return null;
  if (startId === endId) return [startId];

  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    const neighbors = state.adjacency.get(current) || [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor.nodeId)) continue;
      const nextPath = [...path, neighbor.nodeId];
      if (neighbor.nodeId === endId) return nextPath;
      visited.add(neighbor.nodeId);
      queue.push(nextPath);
    }
  }

  return null;
}

function highlightPath(pathIds) {
  state.highlightedNodeIds = new Set(pathIds);
  state.highlightedLinkKeys = new Set();

  for (let i = 0; i < pathIds.length - 1; i += 1) {
    state.highlightedLinkKeys.add(linkKey(pathIds[i], pathIds[i + 1]));
  }

  state.selectedNodeId = pathIds[0] || null;
  updateStyles();

  const firstNode = state.nodes.find(n => n.id === pathIds[0]);
  if (firstNode) centerOnNode(firstNode, 1.2, 500);
}

function attachEvents() {
  els.findRelation.addEventListener("click", () => {
    const fromId = els.relationFrom.value;
    const toId = els.relationTo.value;

    if (!fromId || !toId) {
      setStatus("Alege ambele familii pentru a verifica relația.", "warn");
      return;
    }

    const path = bfsFamilyPath(fromId, toId);
    if (!path) {
      state.highlightedNodeIds.clear();
      state.highlightedLinkKeys.clear();
      updateStyles();
      setStatus("Nu există relație între familiile selectate.", "warn");
      showModal("Fără relație", "Nu a fost găsit niciun traseu între familiile selectate.");
      return;
    }

    highlightPath(path);
    const pathNames = path.map(id => state.nodes.find(n => n.id === id)?.name).filter(Boolean).join(" → ");
    setStatus(`Relație găsită: ${pathNames}`, "ok");
    showModal("Relație găsită", pathNames);
  });

  els.fitView.addEventListener("click", () => {
    fitGraph();
    setStatus("Arborele a fost recentrat.");
  });

  els.clearSelection.addEventListener("click", () => {
    resetHighlight();
    fitGraph(450);
  });

  els.familySearch.addEventListener("change", () => {
    const node = findNodeByName(els.familySearch.value);
    if (!node) {
      setStatus("Familia căutată nu a fost găsită.", "warn");
      return;
    }
    state.selectedNodeId = node.id;
    state.highlightedNodeIds = new Set([node.id]);
    state.highlightedLinkKeys.clear();
    updateStyles();
    centerOnNode(node, 1.5);
    setStatus(`Familia "${node.name}" a fost găsită.`, "ok");
  });

  els.treeContainer.addEventListener("click", (event) => {
    if (event.target === els.treeContainer || event.target === els.svg) {
      hideModal();
    }
  });
}

function initSvg() {
  const rect = els.treeContainer.getBoundingClientRect();
  state.width = Math.max(300, rect.width);
  state.height = Math.max(500, rect.height);

  state.svg = d3.select(els.svg)
    .attr("viewBox", [0, 0, state.width, state.height]);

  state.gRoot = state.svg.append("g");
  state.gLinks = state.gRoot.append("g").attr("class", "links");
  state.gNodes = state.gRoot.append("g").attr("class", "nodes");

  state.zoom = d3.zoom()
    .scaleExtent([0.25, 3.5])
    .on("zoom", (event) => {
      state.gRoot.attr("transform", event.transform);
    });

  state.svg.call(state.zoom);
}

function drawGraph() {
  state.simulation = d3.forceSimulation(state.nodes)
    .force("link", d3.forceLink(state.links).id(d => d.id).distance(d => {
      const sourceId = typeof d.source === "object" ? d.source.id : d.source;
      const targetId = typeof d.target === "object" ? d.target.id : d.target;
      const sourceDegree = state.adjacency.get(sourceId)?.length || 0;
      const targetDegree = state.adjacency.get(targetId)?.length || 0;
      return (sourceDegree === 0 || targetDegree === 0) ? 240 : 145;
    }).strength(0.65))
    .force("charge", d3.forceManyBody().strength(d => ((state.adjacency.get(d.id)?.length || 0) === 0 ? -520 : -680)))
    .force("center", d3.forceCenter(state.width / 2, state.height / 2))
    .force("collision", d3.forceCollide().radius(d => ((state.adjacency.get(d.id)?.length || 0) === 0 ? 54 : 42)));

  const linkSelection = state.gLinks.selectAll("line")
    .data(state.links)
    .join("line")
    .attr("stroke", "#4f5d73")
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round");

  const nodeSelection = state.gNodes.selectAll("g.node")
    .data(state.nodes)
    .join("g")
    .attr("class", "node")
    .call(
      d3.drag()
        .on("start", (event, d) => {
          if (!event.active) state.simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) state.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  nodeSelection.append("circle")
    .attr("r", 22)
    .attr("fill", d => d.visibility === "public" ? "#d4a84a" : "#6f7884")
    .attr("stroke", "#243244");

  nodeSelection.append("text")
    .attr("dy", 40)
    .text(d => d.name);

  nodeSelection
    .on("mouseover", (event, d) => renderTooltip(event, d))
    .on("mousemove", (event, d) => renderTooltip(event, d))
    .on("mouseout", hideTooltip)
    .on("click", handleNodeClick);

  state.simulation.on("tick", () => {
    linkSelection
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodeSelection.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  state.simulation.on("end", () => {
    fitGraph();
    setStatus(`Arbore încărcat: ${state.nodes.length} familii, ${state.links.length} conexiuni.`, "ok");
  });

  updateStyles();
}

async function init() {
  try {
    setStatus("Se încarcă familiile și relațiile...");
    initSvg();

    const { nodes, links } = await loadVillageGraph();

    if (!nodes.length) {
      setStatus("Nu există familii în baza de date.", "warn");
      return;
    }

    state.nodes = nodes;
    state.links = links;
    state.adjacency = buildAdjacency(nodes, links);

    populateControls(nodes);
    attachEvents();
    drawGraph();

    window.addEventListener("resize", () => {
      const rect = els.treeContainer.getBoundingClientRect();
      state.width = Math.max(300, rect.width);
      state.height = Math.max(500, rect.height);
      state.svg.attr("viewBox", [0, 0, state.width, state.height]);
      state.simulation?.force("center", d3.forceCenter(state.width / 2, state.height / 2));
      state.simulation?.alpha(0.25).restart();
      setTimeout(() => fitGraph(350), 220);
    });
  } catch (error) {
    console.error(error);
    setStatus("Eroare la încărcarea datelor din Supabase.", "warn");
    showModal("Eroare", `${error.message || error}`);
  }
}

init();
