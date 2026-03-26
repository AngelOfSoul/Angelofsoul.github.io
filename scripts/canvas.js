/**
 * canvas.js — MosaicCanvas: full 10×10 interactive grid renderer.
 * Features: pan, zoom (wheel + pinch), click-to-paint, hover glow,
 *           tooltips, piece borders, piece-complete reveal overlay,
 *           color palette.
 */

import { Storage }                                     from './storage.js';
import { getPieceForTile, isPieceComplete,
         getCompletedPieces }                          from './pieces.js';
import { I18n }                                        from './i18n.js';

const TILE_SIZE = 40;   // px per tile
const GAP       = 4;    // px gap between tiles
const GRID      = 10;   // 10×10

/** Seven warm palette colors. */
export const TILE_COLORS = [
  '#c0392b',  // brick red
  '#e07b54',  // terracotta
  '#f59e0b',  // amber
  '#27ae60',  // forest green
  '#7f8c8d',  // stone grey
  '#f5e6c8',  // cream
  '#1a237e'   // deep navy
];

/** Gradient pairs for completed-piece reveal overlays. */
const PIECE_GRADIENTS = [
  ['#c0392b', '#e07b54'],  // piece 0
  ['#f59e0b', '#fbbf24'],  // piece 1
  ['#27ae60', '#4ade80'],  // piece 2
  ['#1a237e', '#3b5bdb'],  // piece 3
];

/** Zoom boundaries. */
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

/** Pan margin — allow the grid to be scrolled this many px outside the canvas edge. */
const PAN_MARGIN = 80;

export class MosaicCanvas {

  constructor(canvasId) {
    this.canvas   = document.getElementById(canvasId);
    this.ctx      = this.canvas.getContext('2d');
    this.scale    = 1;
    this.offsetX  = 0;
    this.offsetY  = 0;
    this.isDragging   = false;
    this.wasDragging  = false;
    this.dragStart    = { x: 0, y: 0 };
    this.hoveredTile  = null;
    this.selectedColor = TILE_COLORS[0];
    this.completedPieces = [];
    this.tooltip = null;
    // Pinch zoom state
    this.pinchStart      = null;
    this.pinchScaleStart = 1;

    this._resize();
    this._bindEvents();
    this.createColorPalette();
    this.render();
  }

  // ── Layout helpers ────────────────────────────────────────────────────────

  /** Total pixel size of the full grid (without offset/scale). */
  _gridSize() {
    return GRID * TILE_SIZE + (GRID - 1) * GAP;
  }

  /**
   * Resize canvas to fill its wrapper (max 600 px) and re-centre grid.
   */
  _resize() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
    const size = Math.min(wrapper.clientWidth || 400, 600);
    this.canvas.width  = size;
    this.canvas.height = size;

    // Centre the grid initially
    const gridPx = this._gridSize();
    this.offsetX = (size - gridPx) / 2;
    this.offsetY = (size - gridPx) / 2;

    this.render();
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousemove',  this._onMouseMove.bind(this));
    c.addEventListener('mousedown',  this._onMouseDown.bind(this));
    c.addEventListener('mouseup',    this._onMouseUp.bind(this));
    c.addEventListener('mouseleave', this._onMouseLeave.bind(this));
    c.addEventListener('click',      this._onClick.bind(this));
    c.addEventListener('wheel',      this._onWheel.bind(this), { passive: false });

    c.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    c.addEventListener('touchmove',  this._onTouchMove.bind(this),  { passive: false });
    c.addEventListener('touchend',   this._onTouchEnd.bind(this));

    window.addEventListener('resize', this._resize.bind(this));
  }

  /** Convert a pointer event to canvas-local coordinates. */
  _canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY
    };
  }

  /**
   * Map canvas pixel coords to grid tile {x, y}.
   * Returns null if outside the 10×10 grid or inside a gap.
   */
  _getTileAt(cx, cy) {
    const wx = (cx - this.offsetX) / this.scale;
    const wy = (cy - this.offsetY) / this.scale;

    const col = Math.floor(wx / (TILE_SIZE + GAP));
    const row = Math.floor(wy / (TILE_SIZE + GAP));

    if (col < 0 || col >= GRID || row < 0 || row >= GRID) return null;

    // Reject if pointer is in the gap
    const tileLeft = col * (TILE_SIZE + GAP);
    const tileTop  = row * (TILE_SIZE + GAP);
    if (wx < tileLeft || wx > tileLeft + TILE_SIZE) return null;
    if (wy < tileTop  || wy > tileTop  + TILE_SIZE) return null;

    return { x: col, y: row };
  }

  _onMouseMove(e) {
    const pos  = this._canvasPos(e);
    const tile = this._getTileAt(pos.x, pos.y);

    const changed =
      (tile === null && this.hoveredTile !== null) ||
      (tile !== null && (this.hoveredTile === null ||
        this.hoveredTile.x !== tile.x || this.hoveredTile.y !== tile.y));

    this.hoveredTile = tile;
    if (changed) this.render();

    // Tooltip for painted tiles
    if (tile) {
      const painted = Storage.getTiles().find(t => t.x === tile.x && t.y === tile.y);
      if (painted) {
        this._showTooltip(painted.family || I18n.t('anonymous_tile'), e.clientX, e.clientY);
      } else {
        this._hideTooltip();
      }
    } else {
      this._hideTooltip();
    }

    // Drag pan
    if (this.isDragging) {
      const dx = e.clientX - this.dragStart.x - this.offsetX;
      const dy = e.clientY - this.dragStart.y - this.offsetY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.wasDragging = true;
      this.offsetX = e.clientX - this.dragStart.x;
      this.offsetY = e.clientY - this.dragStart.y;
      this._clampOffset();
      this.render();
    }
  }

  _onMouseDown(e) {
    this.isDragging  = true;
    this.wasDragging = false;
    this.dragStart   = { x: e.clientX - this.offsetX, y: e.clientY - this.offsetY };
    this.canvas.style.cursor = 'grabbing';
  }

  _onMouseUp() {
    this.isDragging  = false;
    this.canvas.style.cursor = 'default';
  }

  _onMouseLeave() {
    this.isDragging  = false;
    this.hoveredTile = null;
    this._hideTooltip();
    this.render();
    this.canvas.style.cursor = 'default';
  }

  _onClick(e) {
    if (this.wasDragging) {
      this.wasDragging = false;
      return;
    }
    const pos  = this._canvasPos(e);
    const tile = this._getTileAt(pos.x, pos.y);
    if (!tile) return;

    this._attemptPaint(tile.x, tile.y);
  }

  _onWheel(e) {
    e.preventDefault();
    const factor   = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.scale * factor));

    // Zoom towards the pointer position
    const pos = this._canvasPos(e);
    this.offsetX = pos.x - (pos.x - this.offsetX) * (newScale / this.scale);
    this.offsetY = pos.y - (pos.y - this.offsetY) * (newScale / this.scale);
    this.scale   = newScale;
    this._clampOffset();
    this._syncRefVars();
    this.render();
  }

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      this.isDragging  = true;
      this.wasDragging = false;
      this.dragStart   = { x: t.clientX - this.offsetX, y: t.clientY - this.offsetY };
    } else if (e.touches.length === 2) {
      this.isDragging      = false;
      this.pinchStart      = this._touchDist(e.touches);
      this.pinchScaleStart = this.scale;
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const t  = e.touches[0];
      const dx = t.clientX - this.dragStart.x - this.offsetX;
      const dy = t.clientY - this.dragStart.y - this.offsetY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.wasDragging = true;
      this.offsetX = t.clientX - this.dragStart.x;
      this.offsetY = t.clientY - this.dragStart.y;
      this._clampOffset();
      this.render();
    } else if (e.touches.length === 2 && this.pinchStart !== null) {
      const dist  = this._touchDist(e.touches);
      this.scale  = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.pinchScaleStart * (dist / this.pinchStart)));
      this._clampOffset();
      this._syncRefVars();
      this.render();
    }
  }

  _onTouchEnd(e) {
    if (e.touches.length === 0) {
      if (!this.wasDragging && e.changedTouches.length === 1) {
        const t    = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width  / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const cx   = (t.clientX - rect.left) * scaleX;
        const cy   = (t.clientY - rect.top)  * scaleY;
        const tile = this._getTileAt(cx, cy);
        if (tile) this._attemptPaint(tile.x, tile.y);
      }
      this.isDragging  = false;
      this.pinchStart  = null;
    }
  }

  /** Return distance between two touch points. */
  _touchDist(touches) {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  // ── Pan / zoom helpers ────────────────────────────────────────────────────

  _clampOffset() {
    const gridPx = this._gridSize() * this.scale;
    const { width: W, height: H } = this.canvas;

    this.offsetX = Math.max(-(gridPx - PAN_MARGIN), Math.min(W - PAN_MARGIN, this.offsetX));
    this.offsetY = Math.max(-(gridPx - PAN_MARGIN), Math.min(H - PAN_MARGIN, this.offsetY));
  }

  /**
   * Sync public-facing reference vars so animations.js can read them
   * without importing canvas internals.
   */
  _syncRefVars() {
    this.canvas._mosaicScaleRef   = this.scale;
    this.canvas._mosaicOffsetXRef = this.offsetX;
    this.canvas._mosaicOffsetYRef = this.offsetY;
  }

  // ── Painting logic ────────────────────────────────────────────────────────

  /**
   * Validate and paint a tile, dispatching game events.
   * @param {number} col
   * @param {number} row
   */
  _attemptPaint(col, row) {
    const tiles = Storage.getTiles();
    const already = tiles.find(t => t.x === col && t.y === row);

    if (already) {
      this._showFeedback(I18n.t('error_already_painted'), 'error');
      return;
    }

    if (Storage.hasPlantedToday()) {
      this._showFeedback(I18n.t('error_daily_limit'), 'warning');
      document.getElementById('daily-limit-msg')?.classList.remove('hidden');
      return;
    }

    const user = Storage.getUser();
    const pieceId = getPieceForTile(col, row);

    const newTile = {
      id:        `${col}_${row}`,
      x:         col,
      y:         row,
      color:     this.selectedColor,
      family:    user.name,
      isAnon:    user.isAnon,
      paintedAt: new Date().toISOString(),
      seasonId:  1,
      pieceId
    };

    // Check piece completion BEFORE adding
    const wasComplete = isPieceComplete(tiles, pieceId);

    tiles.push(newTile);
    Storage.setTiles(tiles);
    Storage.markPaintedToday();

    // Check if this tile completed the piece
    const isNowComplete = isPieceComplete(tiles, pieceId);
    if (!wasComplete && isNowComplete) {
      this.completedPieces = getCompletedPieces(tiles);
      document.dispatchEvent(new CustomEvent('mozaic:pieceComplete', {
        detail: { pieceId, tiles, completedCount: this.completedPieces.length }
      }));
    }

    this._syncRefVars();
    this.render();

    document.dispatchEvent(new CustomEvent('mozaic:tileFilled', {
      detail: { tile: newTile, tiles }
    }));
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────

  _showTooltip(text, clientX, clientY) {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'tile-tooltip';
      document.body.appendChild(this.tooltip);
    }
    this.tooltip.textContent = text;
    this.tooltip.style.left  = (clientX + 12) + 'px';
    this.tooltip.style.top   = (clientY - 34) + 'px';
    this.tooltip.classList.remove('hidden');
  }

  _hideTooltip() {
    this.tooltip?.classList.add('hidden');
  }

  // ── Feedback toast ────────────────────────────────────────────────────────

  _showFeedback(msg, type = 'info') {
    const root = document.getElementById('feedback-root');
    if (!root) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3000);
  }

  // ── Color palette ─────────────────────────────────────────────────────────

  createColorPalette() {
    const palette = document.getElementById('color-palette');
    if (!palette) return;
    palette.innerHTML = '';

    TILE_COLORS.forEach((color, i) => {
      const swatch = document.createElement('button');
      swatch.className   = 'color-swatch' + (i === 0 ? ' selected' : '');
      swatch.style.background = color;
      swatch.title       = color;
      swatch.setAttribute('aria-label', `Color ${i + 1}: ${color}`);
      swatch.addEventListener('click', () => {
        this.selectedColor = color;
        palette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
      });
      palette.appendChild(swatch);
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Reload tiles from storage and re-render.
   * @param {object[]} tiles
   */
  loadTiles(tiles) {
    this.completedPieces = getCompletedPieces(tiles);
    this._syncRefVars();
    this.render();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  render() {
    const ctx   = this.ctx;
    const tiles = Storage.getTiles();
    this.completedPieces = getCompletedPieces(tiles);
    this._syncRefVars();

    const { width: W, height: H } = this.canvas;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#080c18';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Piece-quadrant tinted backgrounds (very subtle)
    this._drawPieceBackgrounds(ctx, tiles);

    // Piece border outlines
    this._drawPieceBorders(ctx);

    // Draw every tile
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const tx      = col * (TILE_SIZE + GAP);
        const ty      = row * (TILE_SIZE + GAP);
        const painted = tiles.find(t => t.x === col && t.y === row);
        const hovered = this.hoveredTile?.x === col && this.hoveredTile?.y === row;
        this._drawTile(ctx, tx, ty, painted, hovered);
      }
    }

    // Completed-piece reveal overlays (coloured gradient)
    this.completedPieces.forEach(pid => this._drawPieceReveal(ctx, pid));

    // Piece labels
    this._drawPieceLabels(ctx);

    ctx.restore();
  }

  // ── Draw helpers ──────────────────────────────────────────────────────────

  /**
   * Draw a single tile rounded rectangle.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} tx  x pixel in world space
   * @param {number} ty  y pixel in world space
   * @param {object|undefined} painted  tile data or undefined
   * @param {boolean} hovered
   */
  _drawTile(ctx, tx, ty, painted, hovered) {
    ctx.save();
    const r = 4;

    // Build path
    ctx.beginPath();
    ctx.moveTo(tx + r, ty);
    ctx.lineTo(tx + TILE_SIZE - r, ty);
    ctx.arcTo(tx + TILE_SIZE, ty,              tx + TILE_SIZE, ty + r,              r);
    ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE - r);
    ctx.arcTo(tx + TILE_SIZE, ty + TILE_SIZE,  tx + TILE_SIZE - r, ty + TILE_SIZE, r);
    ctx.lineTo(tx + r,         ty + TILE_SIZE);
    ctx.arcTo(tx,              ty + TILE_SIZE, tx, ty + TILE_SIZE - r,              r);
    ctx.lineTo(tx,             ty + r);
    ctx.arcTo(tx,              ty,             tx + r, ty,                          r);
    ctx.closePath();

    if (painted) {
      // Fill with tile's stored color
      ctx.fillStyle = painted.color || '#c0392b';
      ctx.fill();
      // Subtle inner shadow for depth
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    } else if (hovered) {
      ctx.fillStyle   = '#2a3a5a';
      ctx.fill();
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1b233a';
      ctx.fill();
      // Very dim grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw subtle tinted backgrounds for each quadrant before tiles.
   */
  _drawPieceBackgrounds(ctx, tiles) {
    const quadrants = [
      { pieceId: 0, colS: 0, rowS: 0 },
      { pieceId: 1, colS: 5, rowS: 0 },
      { pieceId: 2, colS: 0, rowS: 5 },
      { pieceId: 3, colS: 5, rowS: 5 }
    ];
    const tints = [
      'rgba(192,57,43,0.06)',
      'rgba(245,158,11,0.06)',
      'rgba(39,174,96,0.06)',
      'rgba(26,35,126,0.06)'
    ];

    quadrants.forEach(({ pieceId, colS, rowS }) => {
      const x = colS * (TILE_SIZE + GAP) - GAP / 2;
      const y = rowS * (TILE_SIZE + GAP) - GAP / 2;
      const s = 5 * TILE_SIZE + 5 * GAP;
      ctx.fillStyle = tints[pieceId];
      ctx.fillRect(x, y, s, s);
    });
  }

  /** Draw outer border lines around each 5×5 quadrant. */
  _drawPieceBorders(ctx) {
    const starts = [[0,0],[5,0],[0,5],[5,5]];
    const colors = [
      'rgba(192,57,43,0.45)',
      'rgba(245,158,11,0.45)',
      'rgba(39,174,96,0.45)',
      'rgba(26,35,126,0.55)'
    ];
    starts.forEach(([cS, rS], i) => {
      const x = cS * (TILE_SIZE + GAP) - 2;
      const y = rS * (TILE_SIZE + GAP) - 2;
      const s = 5 * TILE_SIZE + 4 * GAP + 4;
      ctx.strokeStyle = colors[i];
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(x, y, s, s);
    });
  }

  /** Draw gradient overlay and glow border for a completed piece. */
  _drawPieceReveal(ctx, pieceId) {
    const colS = (pieceId === 1 || pieceId === 3) ? 5 : 0;
    const rowS = pieceId >= 2 ? 5 : 0;
    const px   = colS * (TILE_SIZE + GAP);
    const py   = rowS * (TILE_SIZE + GAP);
    const ps   = 5 * TILE_SIZE + 4 * GAP;

    const [c1, c2] = PIECE_GRADIENTS[pieceId];
    const grad = ctx.createLinearGradient(px, py, px + ps, py + ps);
    grad.addColorStop(0, c1 + '33');
    grad.addColorStop(1, c2 + '33');

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, ps, ps);

    // Glowing border
    ctx.shadowColor = c1;
    ctx.shadowBlur  = 22;
    ctx.strokeStyle = c1 + 'aa';
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(px - 2, py - 2, ps + 4, ps + 4);
    ctx.restore();
  }

  /** Draw tiny piece labels in each quadrant corner. */
  _drawPieceLabels(ctx) {
    const labels = [
      { col: 0, row: 0, key: 'piece_0' },
      { col: 5, row: 0, key: 'piece_1' },
      { col: 0, row: 5, key: 'piece_2' },
      { col: 5, row: 5, key: 'piece_3' }
    ];

    labels.forEach(({ col, row, key }) => {
      const px = col * (TILE_SIZE + GAP) + 3;
      const py = row * (TILE_SIZE + GAP) + 11;
      // Adaptive font size: shrink when zoomed out
      const fs = Math.max(6, Math.min(10, 10 / this.scale));
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font      = `${fs}px sans-serif`;
      ctx.fillText(I18n.t(key), px, py);
    });
  }
}
