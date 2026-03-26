/**
 * main.js — Entry point: wires all modules together.
 * Handles screen navigation, event routing, modals, and the dev test panel.
 */

import { Storage }         from './storage.js';
import { I18n }            from './i18n.js';
import { MosaicCanvas }    from './canvas.js';
import { Achievements }    from './achievements.js';
import { Leaderboard }     from './leaderboard.js';
import { Streak }          from './streak.js';
import { Rewards }         from './rewards.js';
import { Tutorial }        from './tutorial.js';
import { AnimationEngine } from './animations.js';
import {
  initSeason, getSeason, getTimeRemaining,
  startCountdown, endSeason, isSeasonActive
} from './season.js';
import { getCompletedPieces, isLastTileOverall } from './pieces.js';

// ── Module-level state ─────────────────────────────────────────────────────

let mosaicCanvas   = null;
let countdownTimer = null;

// ── Bootstrap ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // i18n — apply language immediately
  const lang = Storage.getLang();
  I18n.setLang(lang);
  applyTranslations();

  // Season init
  initSeason();

  // Update streak badge
  _updateStreakDisplay();

  // Language buttons
  document.getElementById('lang-ro')?.addEventListener('click', () => _setLang('ro'));
  document.getElementById('lang-en')?.addEventListener('click', () => _setLang('en'));

  // Help button
  document.getElementById('help-btn')?.addEventListener('click', () => {
    _showModal('help-modal');
    _populateHelpModal();
  });

  // Leaderboard button (only visible in game screen)
  document.getElementById('leaderboard-btn')?.addEventListener('click', () => {
    _showModal('leaderboard-modal');
    _populateLeaderboard();
  });

  // Mode selection → enter puzzle game
  document.getElementById('enter-puzzle')?.addEventListener('click', _enterGame);

  // Close buttons inside modals
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      document.getElementById(id)?.classList.add('hidden');
    });
  });

  // Click outside modal-content to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // Tab switching (leaderboard + help modals)
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId  = tab.dataset.tab;
      const parent = tab.closest('.modal-content, .tabs')?.closest('[id]') || document;
      // Deactivate sibling tabs and contents in the same container
      const container = tab.closest('.modal-content');
      if (container) {
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      }
      tab.classList.add('active');
      const content = document.getElementById(tabId);
      content?.classList.remove('hidden');
    });
  });

  // Global game events
  document.addEventListener('mozaic:tileFilled',         _onTileFilled);
  document.addEventListener('mozaic:pieceComplete',      _onPieceComplete);
  document.addEventListener('mozaic:puzzleComplete',     _onPuzzleComplete);
  document.addEventListener('mozaic:achievementUnlocked',_onAchievementUnlocked);
  document.addEventListener('mozaic:streakUpdate',       _onStreakUpdate);
  document.addEventListener('mozaic:streakMilestone',    _onStreakMilestone);
  document.addEventListener('mozaic:seasonEnd',          _onSeasonEnd);
  document.addEventListener('mozaic:comebackDetected',   () => Achievements.check('comeback', {}));

  // Disabled mode card (territories — coming soon)
  document.getElementById('mode-teritorii')?.addEventListener('click', () => {
    _showToast(I18n.t('mode_coming_soon'), 'warning', 2500);
  });
});

// ── Screen navigation ──────────────────────────────────────────────────────

function _enterGame() {
  document.getElementById('mode-selection')?.classList.add('hidden');
  const gameScreen = document.getElementById('game-screen');
  gameScreen?.classList.remove('hidden');

  // Init canvas
  mosaicCanvas = new MosaicCanvas('mosaic-canvas');
  mosaicCanvas.loadTiles(Storage.getTiles());

  // Season info bar
  _updateSeasonBar();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = startCountdown(_updateCountdown);

  // Anonymous / daily-limit banners
  _checkAnonBanner();
  if (Storage.hasPlantedToday()) {
    const msgEl = document.getElementById('daily-limit-msg');
    if (msgEl) {
      msgEl.textContent = I18n.t('daily_limit_msg');
      msgEl.classList.remove('hidden');
    }
  }

  // Init dev test panel
  _initTestPanel();

  // Show tutorial (only first visit)
  setTimeout(() => Tutorial.show(), 500);
}

// ── Language ───────────────────────────────────────────────────────────────

function _setLang(lang) {
  I18n.setLang(lang);
  Storage.setLang(lang);
  applyTranslations();
  mosaicCanvas?.render(); // re-render labels in new language
}

/**
 * Update all elements that carry data-ro / data-en attributes.
 */
function applyTranslations() {
  const lang = I18n.getLang();
  document.querySelectorAll('[data-ro]').forEach(el => {
    const text = lang === 'en' ? (el.dataset.en || el.dataset.ro) : el.dataset.ro;
    if (text) el.textContent = text;
  });

  // Update daily limit message text
  const dailyMsg = document.getElementById('daily-limit-msg');
  if (dailyMsg && !dailyMsg.classList.contains('hidden')) {
    dailyMsg.textContent = I18n.t('daily_limit_msg');
  }
}

// ── Season bar ─────────────────────────────────────────────────────────────

function _updateSeasonBar() {
  const season = getSeason();
  const lang   = I18n.getLang();
  const name   = season.name
    ? (typeof season.name === 'object' ? (season.name[lang] || season.name.ro) : season.name)
    : '';
  const nameEl = document.getElementById('season-name');
  if (nameEl) nameEl.textContent = `🌿 ${name}`;
}

function _updateCountdown(remaining) {
  const el = document.getElementById('season-countdown');
  if (!el) return;
  const { days, hours, minutes, seconds } = remaining;
  el.textContent = `⏱ ${days}z ${hours}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`;
}

// ── Streak display ────────────────────────────────────────────────────────

function _updateStreakDisplay() {
  const streak = Streak.get();
  const el = document.getElementById('streak-count');
  if (el) el.textContent = streak.count;
}

// ── Anonymous banner ──────────────────────────────────────────────────────

function _checkAnonBanner() {
  const user   = Storage.getUser();
  const banner = document.getElementById('anon-banner');
  if (!banner) return;

  if (user.isAnon) {
    banner.classList.remove('hidden');
    banner.innerHTML = `
      <span>${I18n.t('register_push')}</span>
      <button id="register-btn" class="btn-primary btn-sm">${I18n.t('enter_mode')}</button>
    `;
    document.getElementById('register-btn')?.addEventListener('click', _showRegisterPrompt, { once: true });
  } else {
    banner.classList.add('hidden');
  }
}

function _showRegisterPrompt() {
  const label = I18n.getLang() === 'en'
    ? 'Enter your family name:'
    : 'Introdu numele familiei tale:';
  const name = window.prompt(label, I18n.getLang() === 'en' ? 'The  Family' : 'Familia ');
  if (name && name.trim().length >= 2) {
    const user = { name: name.trim(), isAnon: false, isRegistered: true };
    Storage.setUser(user);
    document.getElementById('anon-banner')?.classList.add('hidden');
    Achievements.check('registered', {});
    mosaicCanvas?.render();
    _showToast(`✓ ${I18n.getLang() === 'en' ? 'Welcome' : 'Bun venit'}, ${user.name}!`, 'success');
  } else if (name !== null) {
    // User entered something but it's too short — show feedback
    _showToast(
      I18n.getLang() === 'en' ? 'Name must be at least 2 characters.' : 'Numele trebuie să aibă cel puțin 2 caractere.',
      'warning'
    );
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────

function _onTileFilled(e) {
  const { tile, tiles } = e.detail;

  // Streak
  const streak = Streak.update();
  _updateStreakDisplay();

  // Achievements
  Achievements.check('tilePainted',  { tiles });
  Achievements.check('streakUpdate', { count: streak.count });

  // Leaderboard
  const user     = Storage.getUser();
  const myTiles  = tiles.filter(t => t.family === user.name).length;
  Leaderboard.updateUserEntry(user, myTiles, streak.count);

  // Puzzle complete?
  if (isLastTileOverall(tiles)) {
    document.dispatchEvent(new CustomEvent('mozaic:puzzleComplete', {
      detail: { winner: user, tiles }
    }));
  }

  // Animations
  AnimationEngine.tilePop(mosaicCanvas?.canvas, tile.x, tile.y, 40, 4);
  AnimationEngine.ripple(mosaicCanvas?.canvas, tile.x, tile.y, tile.color);
}

function _onPieceComplete(e) {
  const { pieceId, tiles, completedCount } = e.detail;
  const user = Storage.getUser();

  Achievements.check('pieceComplete', { pieceId, completedCount });
  AnimationEngine.pieceReveal(pieceId, mosaicCanvas?.canvas);

  const pieceName = I18n.t(`piece_${pieceId}`);
  _showToast(`🧩 Bucată completă: ${pieceName}!`, 'success', 4000);

  // Update leaderboard piece count
  Leaderboard.incrementPieces(user);

  // Re-render with reveal overlay
  mosaicCanvas?.render();
}

function _onPuzzleComplete(e) {
  const { winner } = e.detail;
  const season     = getSeason();

  Achievements.check('lastTile', {});
  AnimationEngine.screenShake(mosaicCanvas?.canvas);
  AnimationEngine.puzzleComplete(mosaicCanvas?.canvas);

  // Show reward sequence after a short dramatic pause
  setTimeout(() => {
    Rewards.triggerTier1(winner, season);
    Rewards.checkTier4(winner);
    endSeason('completed');
  }, 2200);
}

function _onAchievementUnlocked(e) {
  AnimationEngine.achievementUnlock(e.detail.achievement);
}

function _onStreakUpdate() {
  _updateStreakDisplay();
}

function _onStreakMilestone(e) {
  AnimationEngine.streakMilestone(e.detail.count);
}

function _onSeasonEnd(e) {
  const { season, reason } = e.detail;

  if (reason === 'timeout') {
    // Award Tier-2 to top tile contributor and Tier-3 to longest streak
    const byTiles  = Leaderboard.getByTiles();
    const byStreak = Leaderboard.getByStreak();

    if (byTiles[0])  Rewards.triggerTier2({ name: byTiles[0].name },  season);
    if (byStreak[0]) Rewards.triggerTier3({ name: byStreak[0].name }, season);

    _showToast('🏁 Sezonul s-a încheiat!', 'warning', 6000);
  }
}

// ── Modal helpers ──────────────────────────────────────────────────────────

function _showModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function _populateLeaderboard() {
  const user = Storage.getUser();

  document.getElementById('lb-tiles').innerHTML =
    _renderLeaderboardTable(Leaderboard.getByTiles(),  'tiles',  user.name);
  document.getElementById('lb-pieces').innerHTML =
    _renderLeaderboardTable(Leaderboard.getByPieces(), 'pieces', user.name);
  document.getElementById('lb-streak').innerHTML =
    _renderLeaderboardTable(Leaderboard.getByStreak(), 'streak', user.name);

  const hof   = Leaderboard.getHallOfFame();
  const hofEl = document.getElementById('hall-of-fame');
  if (hofEl) {
    hofEl.innerHTML = hof.length > 0
      ? `<h3>⭐ ${I18n.t('hall_of_fame')}</h3>` +
        hof.map(f => `<div class="hof-entry">${f.name} ${'⭐'.repeat(f.stars)}</div>`).join('')
      : '';
  }
}

function _renderLeaderboardTable(data, field, currentUser) {
  const medals = ['🥇','🥈','🥉'];
  const rows = data.map((f, i) => `
    <tr class="${f.name === currentUser ? 'user-row' : ''}">
      <td>${medals[i] || (i + 1)}</td>
      <td>${f.name}</td>
      <td><strong>${f[field]}</strong></td>
    </tr>`).join('');

  return `
    <table class="lb-table">
      <thead>
        <tr>
          <th>${I18n.t('rank')}</th>
          <th>${I18n.t('family')}</th>
          <th>${I18n.t('score')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function _populateHelpModal() {
  const how = document.getElementById('help-how');
  if (how) how.innerHTML = `<p class="help-text">${I18n.t('how_to_play_text').replace(/\n/g,'<br>')}</p>`;

  const rewards = document.getElementById('help-rewards');
  if (rewards) rewards.innerHTML = `<p class="help-text">${I18n.t('rewards_text').replace(/\n/g,'<br><br>')}</p>`;

  const seasonEl = document.getElementById('help-season');
  if (seasonEl) {
    const season = getSeason();
    const lang   = I18n.getLang();
    const name   = season.name
      ? (typeof season.name === 'object' ? (season.name[lang] || season.name.ro) : season.name)
      : '';
    const rem = getTimeRemaining();
    seasonEl.innerHTML = `
      <p><strong>${name}</strong></p>
      <p>⏱ ${rem.days} ${I18n.getLang() === 'en' ? 'days' : 'zile'} ${rem.hours}h ${I18n.getLang() === 'en' ? 'remaining' : 'rămase'}</p>
      <p>${I18n.t('tiles_painted')}: <strong>${Storage.getTiles().length}</strong> / 100</p>
      <p>${I18n.t('your_streak')}: <strong>${Streak.get().count}</strong></p>
    `;
  }
}

// ── Toast helper ──────────────────────────────────────────────────────────

function _showToast(msg, type = 'success', duration = 3000) {
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
  }, duration);
}

// ── Dev test panel ─────────────────────────────────────────────────────────

function _initTestPanel() {
  const toggle  = document.getElementById('test-panel-toggle');
  const content = document.getElementById('test-panel-content');
  const arrow   = document.getElementById('test-panel-arrow');

  // Start collapsed
  if (content) content.style.display = 'none';
  if (arrow)   arrow.textContent = '▲';

  toggle?.addEventListener('click', () => {
    const collapsed = content.style.display === 'none';
    content.style.display = collapsed ? 'flex' : 'none';
    arrow.textContent     = collapsed ? '▼' : '▲';
  });

  // ── Reset daily limit ──────────────────────────────────────────────────
  document.getElementById('test-reset-daily')?.addEventListener('click', () => {
    localStorage.removeItem('mozaic_daily');
    document.getElementById('daily-limit-msg')?.classList.add('hidden');
    _showToast('✓ Daily limit reset', 'success');
  });

  // ── Toggle anonymous / registered ─────────────────────────────────────
  document.getElementById('test-toggle-anon')?.addEventListener('click', () => {
    const user = Storage.getUser();
    if (user.isAnon) {
      Storage.setUser({ name: 'Familia Test', isAnon: false, isRegistered: true });
      _showToast('✓ Switched to: Familia Test', 'success');
    } else {
      Storage.setUser({ name: 'Vizitator anonim', isAnon: true, isRegistered: false });
      _showToast('✓ Switched to: Anonymous', 'success');
    }
    _checkAnonBanner();
    mosaicCanvas?.render();
  });

  // ── Complete piece 0 (top-left quadrant) ──────────────────────────────
  document.getElementById('test-complete-piece1')?.addEventListener('click', () => {
    const tiles = Storage.getTiles();
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (!tiles.find(t => t.x === x && t.y === y)) {
          tiles.push({
            id: `${x}_${y}`, x, y,
            color:     '#c0392b',
            family:    'Familia Test',
            isAnon:    false,
            paintedAt: new Date().toISOString(),
            seasonId:  1,
            pieceId:   0
          });
        }
      }
    }
    Storage.setTiles(tiles);
    mosaicCanvas?.loadTiles(tiles);
    document.dispatchEvent(new CustomEvent('mozaic:pieceComplete', {
      detail: { pieceId: 0, tiles, completedCount: 1 }
    }));
    _showToast('✓ Piece 0 completed', 'success');
  });

  // ── Trigger puzzle complete (fill all 100 tiles) ───────────────────────
  document.getElementById('test-last-tile')?.addEventListener('click', () => {
    const colors = ['#c0392b','#e07b54','#f59e0b','#27ae60','#7f8c8d','#f5e6c8','#1a237e'];
    const tiles  = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        tiles.push({
          id:        `${x}_${y}`,
          x, y,
          color:     colors[(x + y) % 7],
          family:    'Familia Test',
          isAnon:    false,
          paintedAt: new Date().toISOString(),
          seasonId:  1,
          pieceId:   Math.floor(y / 5) * 2 + Math.floor(x / 5)
        });
      }
    }
    Storage.setTiles(tiles);
    mosaicCanvas?.loadTiles(tiles);
    const user = Storage.getUser();
    document.dispatchEvent(new CustomEvent('mozaic:puzzleComplete', {
      detail: { winner: user, tiles }
    }));
    _showToast('✓ Last tile triggered', 'success');
  });

  // ── Reset all data ─────────────────────────────────────────────────────
  document.getElementById('test-reset-all')?.addEventListener('click', () => {
    const msg = I18n.getLang() === 'en'
      ? 'Reset all game data? This cannot be undone.'
      : 'Resetezi toate datele jocului? Această acțiune nu poate fi anulată.';
    if (window.confirm(msg)) {
      Storage.resetAll();
      location.reload();
    }
  });

  // ── Fast season end (10 seconds) ──────────────────────────────────────
  document.getElementById('test-fast-season')?.addEventListener('click', () => {
    const season = getSeason();
    season.endDate = new Date(Date.now() + 10_000).toISOString();
    Storage.setSeason(season);
    _showToast('✓ Season ends in 10s', 'warning');
  });

  // ── Add 5 random mock tiles ────────────────────────────────────────────
  document.getElementById('test-mock-tiles')?.addEventListener('click', () => {
    const tiles    = Storage.getTiles();
    const families = ['Familia Popa','Familia Ionescu','Familia Moldovan'];
    const colors   = ['#c0392b','#e07b54','#f59e0b','#27ae60','#7f8c8d'];
    let added = 0, attempts = 0;

    while (added < 5 && attempts < 200) {
      attempts++;
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);
      if (!tiles.find(t => t.x === x && t.y === y)) {
        tiles.push({
          id:        `${x}_${y}`,
          x, y,
          color:     colors[Math.floor(Math.random() * colors.length)],
          family:    families[Math.floor(Math.random() * families.length)],
          isAnon:    false,
          paintedAt: new Date().toISOString(),
          seasonId:  1,
          pieceId:   Math.floor(y / 5) * 2 + Math.floor(x / 5)
        });
        added++;
      }
    }

    Storage.setTiles(tiles);
    mosaicCanvas?.loadTiles(tiles);
    mosaicCanvas?.render();
    _showToast(`✓ Added ${added} mock tiles`, 'success');
  });
}
