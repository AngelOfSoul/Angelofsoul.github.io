import { initGrid, resetGrid, getTileElements } from './grid.js';
import { setLang, t, applyI18n } from './i18n.js';
import { Sections } from './sections.js';
import { Streak } from './streak.js';
import { Achievements } from './achievements.js';
import { AnimationEngine } from './animations.js';
import { update } from './progress.js';
import { Storage } from './storage.js';

const STREAK_MILESTONES = [3, 7, 14, 30];

function updateStreakDisplay(count) {
  const el = document.getElementById('streak-count');
  if (el) el.textContent = count;
}

function restoreSectionBadges(completed) {
  completed.forEach(id => {
    const badge = document.getElementById(`section-badge-${id}`);
    if (badge) {
      badge.textContent = '✓';
      badge.classList.add('visible');
    }
  });
}

function renderAchievementsList() {
  const list = document.getElementById('achievements-list');
  if (!list) return;
  const all = Achievements.getAll();
  const unlocked = Achievements.getUnlocked();
  list.innerHTML = '';
  all.forEach(a => {
    const isUnlocked = unlocked.includes(a.id);
    const item = document.createElement('div');
    item.className = 'achievement-item' + (isUnlocked ? ' unlocked' : ' locked');
    item.innerHTML = `
      <span class="achievement-item-icon">${isUnlocked ? a.icon : '🔒'}</span>
      <div class="achievement-item-info">
        <div class="achievement-item-name">${a.name}</div>
        <div class="achievement-item-desc">${a.description}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function showWinOverlay() {
  const overlay = document.getElementById('win-overlay');
  if (overlay) {
    document.getElementById('win-title').textContent = t('win_title');
    document.getElementById('win-subtitle').textContent = t('win_subtitle');
    document.getElementById('reset-btn').textContent = t('reset');
    overlay.classList.remove('hidden');
  }
}

function doReset() {
  ['tiles', 'sections', 'achievements', 'streak_count', 'streak_last_date'].forEach(k =>
    localStorage.removeItem(k)
  );
  document.getElementById('win-overlay').classList.add('hidden');
  updateStreakDisplay(0);
  [0, 1, 2, 3].forEach(id => {
    const badge = document.getElementById(`section-badge-${id}`);
    if (badge) { badge.textContent = ''; badge.classList.remove('visible'); }
  });
  document.dispatchEvent(new CustomEvent('mosaic:reset'));
}

// Wire events
document.addEventListener('mosaic:tileFilled', e => {
  const { filled, total } = e.detail;
  update(filled, total);
  Streak.update();
  const { count } = Streak.get();
  updateStreakDisplay(count);

  const data = Storage.get();
  const prevCompleted = Sections.loadCompleted();
  Sections.checkAndEmit(data, prevCompleted);

  const sections = Sections.loadCompleted();
  Achievements.check({ filled, sections, streak: count });
});

document.addEventListener('mosaic:sectionComplete', e => {
  const { sectionId, tiles: tileIndices } = e.detail;
  const tileEls = getTileElements();
  const tilesToAnimate = tileIndices.map(i => tileEls[i]).filter(Boolean);
  AnimationEngine.sectionComplete(tilesToAnimate);

  const badge = document.getElementById(`section-badge-${sectionId}`);
  if (badge) {
    badge.textContent = '✓';
    badge.classList.add('visible');
  }
});

document.addEventListener('mosaic:achievementUnlocked', e => {
  AnimationEngine.achievementUnlock(e.detail.achievement);
  renderAchievementsList();
});

document.addEventListener('mosaic:streakUpdate', e => {
  const { count } = e.detail;
  updateStreakDisplay(count);
  if (STREAK_MILESTONES.includes(count)) {
    AnimationEngine.streakBanner(count);
  }
});

document.addEventListener('mosaic:gameComplete', e => {
  AnimationEngine.winSequence(e.detail.allTiles);
  showWinOverlay();
  const data = Storage.get();
  const sections = Sections.loadCompleted();
  const { count } = Streak.get();
  Achievements.check({ filled: 100, sections, streak: count });
});

document.addEventListener('mosaic:reset', () => {
  resetGrid();
});

// Language buttons
document.getElementById('lang-en').onclick = () => { setLang('en'); applyI18n(); };
document.getElementById('lang-ro').onclick = () => { setLang('ro'); applyI18n(); };

// Achievements panel
document.getElementById('achievements-btn').onclick = () => {
  const panel = document.getElementById('achievements-panel');
  panel.classList.remove('hidden');
  renderAchievementsList();
};
document.getElementById('achievements-close').onclick = () => {
  document.getElementById('achievements-panel').classList.add('hidden');
};

// Reset button in win overlay
document.getElementById('reset-btn').onclick = doReset;

// Init
initGrid();

const { count: initialStreak } = Streak.get();
updateStreakDisplay(initialStreak);

const completedSections = Sections.loadCompleted();
restoreSectionBadges(completedSections);

renderAchievementsList();
applyI18n();
