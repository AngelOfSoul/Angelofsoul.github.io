// script-arbore.js — Arborele Satului local tree renderer
// Uses window.families (populated by Supabase in arborele-satului.html) to render
// family nodes inside #noduri and SVG lines in #linii.
// Falls back to an empty view if no families are available.
(function () {
  'use strict';

  var noduri   = document.getElementById('noduri');
  var liniiSvg = document.getElementById('linii');
  var searchIn = document.getElementById('search');
  var container = document.getElementById('container');
  var arbore   = document.getElementById('arbore');

  // Guard: exit silently if the arbore-wrapper elements are missing
  if (!noduri || !liniiSvg) return;

  var famData   = [];  // mapped from window.families
  var relData   = [];
  var famEls    = [];  // rendered DOM nodes (for search filtering)

  /* ── helpers ──────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── map Supabase families to local format ───────────────────────────── */
  function mapSupabaseFamilies(supabaseFamilies) {
    return (supabaseFamilies || []).map(function (f) {
      return {
        nume: f.name || '?',
        link: 'genealogie-familie.html?family=' + encodeURIComponent(f.id),
        privat: false  // Supabase RLS already filters to public families only
      };
    });
  }

  /* ── initialise with data ────────────────────────────────────────────── */
  function initWithSupabase(supabaseFamilies) {
    famData = mapSupabaseFamilies(supabaseFamilies);
    relData = [];
    render();
  }

  /* ── load: use window.families if ready, else wait for event ────────── */
  if (window.families && window.families.length) {
    initWithSupabase(window.families);
  } else {
    document.addEventListener('families:loaded', function () {
      initWithSupabase(window.families || []);
    }, { once: true });
  }

  /* ── render families ─────────────────────────────────────────────────── */
  function render() {
    noduri.innerHTML = '';
    famEls = [];
    if (!famData.length) return;  // show nothing when no data

    var cols   = Math.max(1, Math.ceil(Math.sqrt(famData.length)));
    var spacX  = 200;
    var spacY  = 120;

    famData.forEach(function (f, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x   = 40 + col * spacX;
      var y   = 40 + row * spacY;

      var div = document.createElement('div');
      div.className = 'familie';
      div.style.left = x + 'px';
      div.style.top  = y + 'px';
      div.textContent = f.nume || '?';
      div.setAttribute('data-idx', String(i));
      div.setAttribute('data-name', (f.nume || '').toLowerCase());

      div.addEventListener('click', function () {
        if (f.privat) {
          if (typeof showPopup === 'function') {
            showPopup('Această familie este privată');
          }
          return;
        }
        if (f.link) {
          window.location.href = f.link;
        }
      });

      noduri.appendChild(div);
      famEls.push({ el: div, x: x, y: y, idx: i, fam: f });
    });

    // size the arbore so scrolling / panning works
    var maxX = 40 + cols * spacX;
    var maxY = 40 + (Math.ceil(famData.length / cols)) * spacY;
    arbore.style.width  = maxX + 'px';
    arbore.style.height = maxY + 'px';

    drawLines();
  }

  /* ── SVG lines for relatii ───────────────────────────────────────────── */
  function drawLines() {
    liniiSvg.innerHTML = '';
    if (!relData.length || !famEls.length) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var maxX  = parseInt(arbore.style.width,  10) || 700;
    var maxY  = parseInt(arbore.style.height, 10) || 480;
    liniiSvg.setAttribute('width',  maxX);
    liniiSvg.setAttribute('height', maxY);
    liniiSvg.style.width  = maxX + 'px';
    liniiSvg.style.height = maxY + 'px';
    liniiSvg.style.position = 'absolute';
    liniiSvg.style.top  = '0';
    liniiSvg.style.left = '0';
    liniiSvg.style.pointerEvents = 'none';

    relData.forEach(function (r) {
      var a = famEls[r.de_la];
      var b = famEls[r.catre];
      if (!a || !b) return;
      // center of each node (approx 80×40)
      var x1 = a.x + 50, y1 = a.y + 20;
      var x2 = b.x + 50, y2 = b.y + 20;
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('class', 'linie');
      liniiSvg.appendChild(line);
    });
  }

  /* ── search / filter ─────────────────────────────────────────────────── */
  if (searchIn) {
    searchIn.addEventListener('input', function () {
      var q = searchIn.value.trim().toLowerCase();
      famEls.forEach(function (fe) {
        var match = !q || fe.fam.nume.toLowerCase().indexOf(q) !== -1;
        fe.el.style.display = match ? '' : 'none';
        if (match && q) {
          fe.el.classList.add('highlight');
        } else {
          fe.el.classList.remove('highlight');
        }
      });
    });
  }

  /* ── pan / zoom on #container ────────────────────────────────────────── */
  if (container && arbore) {
    var scale = 1, panX = 0, panY = 0, dragging = false, startX = 0, startY = 0;

    function applyTr() {
      arbore.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
    }

    container.addEventListener('wheel', function (e) {
      e.preventDefault();
      scale = Math.min(3, Math.max(0.3, scale * (e.deltaY > 0 ? 0.9 : 1.1)));
      applyTr();
    }, { passive: false });

    container.addEventListener('mousedown', function (e) {
      dragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      container.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', function () {
      dragging = false;
      if (container) container.style.cursor = 'grab';
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTr();
    });
  }
}());
