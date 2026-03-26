/**
 * animations.js — Animation engine using CSS class toggling + DOM overlays.
 * All keyframe definitions live in styles/main.css.
 */

// Module-level timer map to avoid storing state on DOM elements
const _timers = new WeakMap();

export const AnimationEngine = {

  /**
   * Scale-pop + glow on the painted tile position.
   * Creates a temporary overlay div that animates then removes itself.
   * @param {HTMLCanvasElement} canvasEl
   * @param {number} col   tile column (0-9)
   * @param {number} row   tile row (0-9)
   * @param {number} tileSize  pixel size of each tile
   * @param {number} gap   pixel gap between tiles
   */
  tilePop(canvasEl, col, row, tileSize = 40, gap = 4) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    // Compute center of tile in viewport coords
    const scale = canvasEl._mosaicScaleRef || 1;
    const offsetX = canvasEl._mosaicOffsetXRef || 0;
    const offsetY = canvasEl._mosaicOffsetYRef || 0;

    const tileX = col * (tileSize + gap) * scale + offsetX;
    const tileY = row * (tileSize + gap) * scale + offsetY;
    const size  = tileSize * scale;

    const dot = document.createElement('div');
    dot.className = 'anim-tile-pop';
    dot.style.cssText = `
      position: fixed;
      left:   ${rect.left + tileX}px;
      top:    ${rect.top  + tileY}px;
      width:  ${size}px;
      height: ${size}px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 9999;
      background: rgba(0,245,255,0.35);
      box-shadow: 0 0 18px 6px rgba(0,245,255,0.6);
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  },

  /**
   * Ripple expanding circle from tile center outward.
   * @param {HTMLCanvasElement} canvasEl
   * @param {number} col
   * @param {number} row
   * @param {string} color  hex/rgb tile color
   */
  ripple(canvasEl, col, row, color = '#00f5ff') {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const tileSize = 40;
    const gap      = 4;
    const scale    = canvasEl._mosaicScaleRef  || 1;
    const offsetX  = canvasEl._mosaicOffsetXRef || 0;
    const offsetY  = canvasEl._mosaicOffsetYRef || 0;

    const cx = col * (tileSize + gap) * scale + offsetX + (tileSize * scale) / 2;
    const cy = row * (tileSize + gap) * scale + offsetY + (tileSize * scale) / 2;

    const ring = document.createElement('div');
    ring.className = 'anim-ripple';
    ring.style.cssText = `
      position: fixed;
      left:   ${rect.left + cx}px;
      top:    ${rect.top  + cy}px;
      width:  10px;
      height: 10px;
      margin-left: -5px;
      margin-top:  -5px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      border: 2px solid ${color};
      opacity: 1;
    `;
    document.body.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
  },

  /**
   * Dramatic piece reveal — flashes a coloured overlay over the quadrant area.
   * @param {number} pieceId  0-3
   * @param {HTMLCanvasElement} canvasEl
   */
  pieceReveal(pieceId, canvasEl) {
    if (!canvasEl) return;
    const rect     = canvasEl.getBoundingClientRect();
    const tileSize = 40;
    const gap      = 4;
    const scale    = canvasEl._mosaicScaleRef  || 1;
    const offsetX  = canvasEl._mosaicOffsetXRef || 0;
    const offsetY  = canvasEl._mosaicOffsetYRef || 0;

    const colStart = (pieceId === 1 || pieceId === 3) ? 5 : 0;
    const rowStart = pieceId >= 2 ? 5 : 0;
    const px = colStart * (tileSize + gap) * scale + offsetX;
    const py = rowStart * (tileSize + gap) * scale + offsetY;
    const ps = (5 * tileSize + 4 * gap) * scale;

    const COLORS = ['#c0392b','#f59e0b','#27ae60','#1a237e'];

    const flash = document.createElement('div');
    flash.className = 'anim-piece-reveal';
    flash.style.cssText = `
      position: fixed;
      left:   ${rect.left + px}px;
      top:    ${rect.top  + py}px;
      width:  ${ps}px;
      height: ${ps}px;
      pointer-events: none;
      z-index: 9997;
      border-radius: 6px;
      background: ${COLORS[pieceId]}44;
      box-shadow: 0 0 40px 15px ${COLORS[pieceId]}88;
    `;
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
  },

  /**
   * Rainbow wave animation across the full canvas.
   * @param {HTMLCanvasElement} canvasEl
   */
  puzzleComplete(canvasEl) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const cover = document.createElement('div');
    cover.className = 'anim-puzzle-complete';
    cover.style.cssText = `
      position: fixed;
      left:   ${rect.left}px;
      top:    ${rect.top}px;
      width:  ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 9996;
      border-radius: 8px;
    `;
    document.body.appendChild(cover);
    cover.addEventListener('animationend', () => cover.remove());
  },

  /**
   * Slide + scale-in animation for each reward card element.
   * @param {HTMLElement} el  the reward card element
   */
  rewardAppear(el) {
    if (!el) return;
    el.classList.add('anim-reward-appear');
    el.addEventListener('animationend', () => {
      el.classList.remove('anim-reward-appear');
    }, { once: true });
  },

  /**
   * Slide in an achievement notification from the right, auto-dismiss after 4s.
   * @param {{ id: string, icon: string, condition: string }} achievement
   */
  achievementUnlock(achievement) {
    const notif = document.getElementById('achievement-notification');
    if (!notif) return;

    notif.innerHTML = `
      <span class="ach-icon">${achievement.icon || '🏅'}</span>
      <div class="ach-text">
        <strong>Realizare deblocată!</strong>
        <span>${achievement.condition || achievement.id}</span>
      </div>
    `;
    notif.classList.remove('hidden', 'slide-out');
    notif.classList.add('slide-in');

    // Auto-dismiss using WeakMap-backed timer
    clearTimeout(_timers.get(notif));
    _timers.set(notif, setTimeout(() => {
      notif.classList.remove('slide-in');
      notif.classList.add('slide-out');
      notif.addEventListener('animationend', () => {
        notif.classList.add('hidden');
        notif.classList.remove('slide-out');
      }, { once: true });
    }, 4000);
  },

  /**
   * Animated flame banner for streak milestones.
   * @param {number} count  streak day count
   */
  streakMilestone(count) {
    const banner = document.createElement('div');
    banner.className = 'anim-streak-milestone';
    banner.innerHTML = `🔥 ${count} zile la rând! 🔥`;
    banner.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      color: #fff;
      font-size: 1.3rem;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 40px;
      box-shadow: 0 4px 24px rgba(245,158,11,0.5);
      z-index: 10001;
      pointer-events: none;
      white-space: nowrap;
    `;
    document.body.appendChild(banner);
    banner.addEventListener('animationend', () => banner.remove());
  },

  /**
   * Subtle canvas shake when the last tile is placed.
   * @param {HTMLCanvasElement} canvasEl
   */
  screenShake(canvasEl) {
    if (!canvasEl) return;
    const wrapper = canvasEl.closest('#canvas-wrapper') || canvasEl;
    wrapper.classList.add('anim-shake');
    wrapper.addEventListener('animationend', () => {
      wrapper.classList.remove('anim-shake');
    }, { once: true });
  }
};
