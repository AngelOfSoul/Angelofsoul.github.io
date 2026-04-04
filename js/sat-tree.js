
(function(){
'use strict';

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];});}
function getLang(){return localStorage.getItem('calnic-lang')||'ro';}
function tr(ro,en){return getLang()==='en'?en:ro;}

var state = {
  nodes: [],
  links: [],
  adjacency: new Map(),
  selectedNodeId: null,
  highlightedNodeIds: new Set(),
  highlightedLinkKeys: new Set(),
  svg: null,
  root: null,
  linkLayer: null,
  nodeLayer: null,
  simulation: null,
  zoom: null,
  width: 0,
  height: 620
};

var els = {};

function byId(id){return document.getElementById(id);}
function linkKey(a,b){return [a,b].sort().join('__');}
function normalize(v){return String(v||'').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}

function initEls(){
  els.stage = byId('treeStage');
  els.svg = byId('treeSvg');
  els.status = byId('treeStatus');
  els.search = byId('familySearch');
  els.names = byId('familyNames');
  els.pathFrom = byId('pathFrom');
  els.pathTo = byId('pathTo');
  els.pathBtn = byId('pathBtn');
  els.fitBtn = byId('fitBtn');
  els.resetBtn = byId('resetBtn');
  els.tooltip = byId('treeTooltip');
  els.overlay = byId('treeOverlay');
  els.overlayTitle = byId('treeOverlayTitle');
  els.overlayText = byId('treeOverlayText');
  els.pathResult = byId('pathResult');
  els.tsFam = byId('ts-fam'); els.tsRel = byId('ts-rel'); els.tsPub = byId('ts-pub'); els.tsPri = byId('ts-pri'); els.tsIso = byId('ts-iso');
}

function setStatus(msg){ if(els.status) els.status.textContent = msg; }
function setPathResult(msg){ if(!els.pathResult) return; els.pathResult.innerHTML = msg; els.pathResult.classList.add('on'); }
function hideOverlay(){ if(els.overlay) els.overlay.classList.remove('show'); }
function showOverlay(title,text){ if(!els.overlay) return; els.overlayTitle.textContent = title; els.overlayText.innerHTML = text; els.overlay.classList.add('show'); }

function getSupabase(){ return window.supabase && typeof window.supabase.from==='function' ? window.supabase : null; }

function openFamily(node){
  if(node.visibility !== 'public' && node.is_public !== true){
    showOverlay(node.name, tr('Aceasta familie este privata. Structura ei apare in arbore, dar pagina familiei nu poate fi deschisa public.', 'This family is private. Its structure appears in the tree, but the family page cannot be opened publicly.'));
    setStatus(tr('Familia este privata.', 'The family is private.'));
    return;
  }
  window.location.href = 'genealogie-familie.html?family=' + encodeURIComponent(node.id);
}

function buildAdjacency(){
  state.adjacency = new Map(state.nodes.map(function(n){ return [n.id, []]; }));
  state.links.forEach(function(l){
    state.adjacency.get(l.source).push({nodeId:l.target,type:l.type});
    state.adjacency.get(l.target).push({nodeId:l.source,type:l.type});
  });
}

function findPath(startId,endId){
  if(!startId || !endId) return null;
  if(startId===endId) return [startId];
  var queue = [[startId]], visited = new Set([startId]);
  while(queue.length){
    var path = queue.shift();
    var current = path[path.length-1];
    var neighbors = state.adjacency.get(current) || [];
    for(var i=0;i<neighbors.length;i++){
      var n = neighbors[i].nodeId;
      if(visited.has(n)) continue;
      var np = path.concat([n]);
      if(n===endId) return np;
      visited.add(n); queue.push(np);
    }
  }
  return null;
}

function updateStats(){
  var pub = state.nodes.filter(function(n){return n.visibility==='public' || n.is_public===true;}).length;
  var pri = state.nodes.length - pub;
  var connectedIds = new Set();
  state.links.forEach(function(l){connectedIds.add(l.source); connectedIds.add(l.target);});
  var iso = state.nodes.filter(function(n){ return !connectedIds.has(n.id); }).length;
  els.tsFam.textContent = state.nodes.length;
  els.tsRel.textContent = state.links.length;
  els.tsPub.textContent = pub;
  els.tsPri.textContent = pri;
  els.tsIso.textContent = iso;
}

function fillControls(){
  els.names.innerHTML = '';
  els.pathFrom.innerHTML = '<option value="">'+tr('Alege familia','Choose family')+'</option>';
  els.pathTo.innerHTML = '<option value="">'+tr('Alege familia','Choose family')+'</option>';
  state.nodes.slice().sort(function(a,b){return a.name.localeCompare(b.name,'ro');}).forEach(function(n){
    var o = document.createElement('option'); o.value = n.name; els.names.appendChild(o);
    var o1 = document.createElement('option'); o1.value = n.id; o1.textContent = n.name; els.pathFrom.appendChild(o1);
    var o2 = document.createElement('option'); o2.value = n.id; o2.textContent = n.name; els.pathTo.appendChild(o2);
  });
}

async function loadData(){
  var supabase = getSupabase();
  if(!supabase){
    throw new Error('Supabase nu este disponibil.');
  }
  var famRes = await supabase.from('families').select('id, display_name, visibility, is_public').order('display_name');
  if(famRes.error) throw famRes.error;
  var linkRes = await supabase.from('v_family_connections').select('source_family_id,target_family_id,relationship_type');
  if(linkRes.error) throw linkRes.error;

  state.nodes = (famRes.data||[]).map(function(f){
    return { id:f.id, name:f.display_name || 'Familie', visibility:f.visibility || (f.is_public ? 'public' : 'private'), is_public:!!f.is_public };
  });

  var seen = new Set();
  state.links = [];
  (linkRes.data||[]).forEach(function(l){
    var key = linkKey(l.source_family_id, l.target_family_id) + '::' + (l.relationship_type||'relation');
    if(seen.has(key)) return;
    seen.add(key);
    state.links.push({source:l.source_family_id, target:l.target_family_id, type:l.relationship_type || 'relation'});
  });
  buildAdjacency();
  updateStats();
  fillControls();
}

function initSvg(){
  var rect = els.stage.getBoundingClientRect();
  state.width = Math.max(320, rect.width);
  state.height = 620;
  state.svg = d3.select(els.svg).attr('viewBox', [0,0,state.width,state.height]);
  state.root = state.svg.append('g');
  state.linkLayer = state.root.append('g');
  state.nodeLayer = state.root.append('g');
  state.zoom = d3.zoom().scaleExtent([0.25, 3.5]).on('zoom', function(event){ state.root.attr('transform', event.transform); });
  state.svg.call(state.zoom);
}

function tooltipHtml(d){
  return '<strong>'+esc(d.name)+'</strong><br>' + esc((d.visibility==='public'||d.is_public)?tr('Publica','Public'):tr('Privata','Private'));
}

function showTooltip(event,d){
  els.tooltip.innerHTML = tooltipHtml(d);
  els.tooltip.style.display='block';
  var rect = els.stage.getBoundingClientRect();
  els.tooltip.style.left = (event.clientX - rect.left + 18)+'px';
  els.tooltip.style.top = (event.clientY - rect.top + 18)+'px';
}
function hideTooltip(){ els.tooltip.style.display='none'; }

function updateStyles(){
  state.nodeLayer.selectAll('g.tree-node').each(function(d){
    var selected = state.selectedNodeId === d.id;
    var dim = state.highlightedNodeIds.size>0 && !state.highlightedNodeIds.has(d.id);
    d3.select(this).select('circle')
      .attr('fill', (d.visibility==='public'||d.is_public) ? '#d4a84a' : '#7d8491')
      .attr('stroke', selected ? '#f0e8d0' : state.highlightedNodeIds.has(d.id) ? '#e0b84a' : '#243244')
      .attr('r', selected ? 29 : 23)
      .attr('opacity', dim ? .22 : 1);
    d3.select(this).select('text').attr('opacity', dim ? .25 : 1).attr('font-weight', selected||state.highlightedNodeIds.has(d.id) ? 700 : 500);
  });
  state.linkLayer.selectAll('line').each(function(d){
    var s = typeof d.source==='object'?d.source.id:d.source;
    var t = typeof d.target==='object'?d.target.id:d.target;
    var k = linkKey(s,t);
    var dim = state.highlightedLinkKeys.size>0 && !state.highlightedLinkKeys.has(k);
    d3.select(this)
      .attr('stroke', state.highlightedLinkKeys.has(k)? '#d4a84a' : '#4b5c7c')
      .attr('stroke-width', state.highlightedLinkKeys.has(k)? 3.5 : 2.1)
      .attr('opacity', dim ? .16 : .92);
  });
}

function fitGraph(duration){
  duration = duration || 650;
  if(!state.nodes.length) return;
  var xs = state.nodes.map(function(n){return n.x||0;}), ys = state.nodes.map(function(n){return n.y||0;});
  var minX = Math.min.apply(null,xs)-90, maxX=Math.max.apply(null,xs)+90, minY=Math.min.apply(null,ys)-90, maxY=Math.max.apply(null,ys)+90;
  var gw=Math.max(1,maxX-minX), gh=Math.max(1,maxY-minY);
  var scale=Math.min(2.2, 0.9 / Math.max(gw/state.width, gh/state.height));
  var tx=state.width/2 - scale*(minX+gw/2), ty=state.height/2 - scale*(minY+gh/2);
  state.svg.transition().duration(duration).call(state.zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(scale));
}

function centerOnNode(node, zoomLevel, duration){
  zoomLevel = zoomLevel || 1.55; duration = duration || 650;
  if(!node) return;
  var tx = state.width/2 - zoomLevel*node.x, ty = state.height/2 - zoomLevel*node.y;
  state.svg.transition().duration(duration).call(state.zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(zoomLevel));
}

function draw(){
  state.simulation = d3.forceSimulation(state.nodes)
    .force('link', d3.forceLink(state.links).id(function(d){return d.id;}).distance(function(d){
      var s = typeof d.source==='object'?d.source.id:d.source;
      var t = typeof d.target==='object'?d.target.id:d.target;
      var sd=(state.adjacency.get(s)||[]).length, td=(state.adjacency.get(t)||[]).length;
      return (sd===0 || td===0) ? 250 : 150;
    }).strength(0.7))
    .force('charge', d3.forceManyBody().strength(function(d){return ((state.adjacency.get(d.id)||[]).length===0)? -560 : -720;}))
    .force('center', d3.forceCenter(state.width/2, state.height/2))
    .force('collision', d3.forceCollide().radius(function(d){return ((state.adjacency.get(d.id)||[]).length===0) ? 56 : 42;}));

  var linkSel = state.linkLayer.selectAll('line').data(state.links).join('line')
    .attr('stroke','#4b5c7c').attr('stroke-width',2.1).attr('stroke-linecap','round');

  var nodeSel = state.nodeLayer.selectAll('g.tree-node').data(state.nodes).join('g').attr('class','tree-node')
    .call(d3.drag()
      .on('start', function(event,d){ if(!event.active) state.simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
      .on('drag', function(event,d){ d.fx=event.x; d.fy=event.y; })
      .on('end', function(event,d){ if(!event.active) state.simulation.alphaTarget(0); d.fx=null; d.fy=null; }));

  nodeSel.append('circle').attr('r',23).attr('fill', function(d){return (d.visibility==='public'||d.is_public)? '#d4a84a' : '#7d8491';}).attr('stroke','#243244').attr('stroke-width',2);
  nodeSel.append('text').attr('class','tree-node-label').attr('dy',42).text(function(d){return d.name;});

  nodeSel.on('mouseover', function(event,d){showTooltip(event,d);})
    .on('mousemove', function(event,d){showTooltip(event,d);})
    .on('mouseout', hideTooltip)
    .on('click', function(event,d){ event.stopPropagation(); state.selectedNodeId = d.id; updateStyles(); centerOnNode(d); openFamily(d); });

  state.simulation.on('tick', function(){
    linkSel.attr('x1', function(d){return d.source.x;}).attr('y1', function(d){return d.source.y;}).attr('x2', function(d){return d.target.x;}).attr('y2', function(d){return d.target.y;});
    nodeSel.attr('transform', function(d){return 'translate('+d.x+','+d.y+')';});
  });

  state.simulation.on('end', function(){ fitGraph(); setStatus(tr('Arbore incarcat: ','Tree loaded: ')+state.nodes.length+' '+tr('familii, ','families, ')+state.links.length+' '+tr('conexiuni.','connections.')); });
  updateStyles();
}

function resetHighlights(){
  state.selectedNodeId = null; state.highlightedNodeIds.clear(); state.highlightedLinkKeys.clear(); updateStyles(); hideOverlay();
  if(els.pathResult) els.pathResult.classList.remove('on');
}

function attachEvents(){
  els.search.addEventListener('change', function(){
    var q = normalize(els.search.value);
    var node = state.nodes.find(function(n){return normalize(n.name)===q;}) || state.nodes.find(function(n){return normalize(n.name).indexOf(q)!==-1;});
    if(!node){ setStatus(tr('Familia nu a fost gasita.','Family not found.')); return; }
    state.selectedNodeId = node.id; state.highlightedNodeIds = new Set([node.id]); state.highlightedLinkKeys.clear(); updateStyles(); centerOnNode(node,1.65); setStatus(tr('Familie gasita: ','Family found: ')+node.name); hideOverlay();
  });

  els.pathBtn.addEventListener('click', function(){
    var from = els.pathFrom.value, to = els.pathTo.value;
    if(!from || !to || from===to){ setPathResult(esc(tr('Selecteaza doua familii diferite.','Select two different families.'))); return; }
    var path = findPath(from,to);
    if(!path){ state.highlightedNodeIds.clear(); state.highlightedLinkKeys.clear(); updateStyles(); setPathResult(esc(tr('Nu exista o legatura documentata intre aceste familii.','There is no documented connection between these families.'))); return; }
    state.highlightedNodeIds = new Set(path); state.highlightedLinkKeys = new Set();
    for(var i=0;i<path.length-1;i++) state.highlightedLinkKeys.add(linkKey(path[i], path[i+1]));
    state.selectedNodeId = path[0]; updateStyles();
    var names = path.map(function(id){ var n=state.nodes.find(function(x){return x.id===id;}); return n?n.name:id; });
    setPathResult(esc(tr('Traseu gasit: ','Path found: '))+ names.map(esc).join(' &rarr; '));
    centerOnNode(state.nodes.find(function(n){return n.id===path[0];}),1.2,500);
  });

  els.fitBtn.addEventListener('click', function(){ fitGraph(); setStatus(tr('Arborele a fost recentrat.','The tree was re-centered.')); });
  els.resetBtn.addEventListener('click', function(){ resetHighlights(); fitGraph(450); setStatus(tr('Vizualizare resetata.','View reset.')); });
  els.stage.addEventListener('click', function(e){ if(e.target===els.stage || e.target===els.svg){ hideOverlay(); } });
  window.addEventListener('resize', function(){
    var rect = els.stage.getBoundingClientRect(); state.width = Math.max(320, rect.width); state.svg.attr('viewBox',[0,0,state.width,state.height]);
    if(state.simulation){ state.simulation.force('center', d3.forceCenter(state.width/2, state.height/2)); state.simulation.alpha(0.25).restart(); setTimeout(function(){ fitGraph(350); },220); }
  });
}

function showError(msg){
  els.stage.innerHTML = '<div class="calnic-error"><div class="calnic-error-icon">&#9888;&#65039;</div><div class="calnic-error-title">'+esc(tr('Nu s-a putut incarca arborele satului','Could not load the village tree'))+'</div><div class="calnic-error-sub">'+esc(msg)+'</div><button class="calnic-error-btn" onclick="location.reload()">'+esc(tr('Incearca din nou','Try again'))+'</button></div>';
}

async function init(){
  initEls();
  initSvg();
  attachEvents();
  try {
    setStatus(tr('Se incarca arborele...','Loading tree...'));
    await loadData();
    if(!state.nodes.length){ els.stage.innerHTML = '<div class="tree-empty">'+esc(tr('Nu exista inca familii pentru arborele satului.','There are no families yet for the village tree.'))+'</div>'; return; }
    draw();
  } catch(err){ console.error(err); showError(err && err.message ? err.message : String(err)); }
}

if(getSupabase()) init(); else document.addEventListener('supabase:ready', init, {once:true});
})();
