import { t } from './i18n.js';

export const AnimationEngine = {
  tilePop(el) {
    el.classList.add('tile-pop');
    el.addEventListener('animationend', () => el.classList.remove('tile-pop'), { once: true });
  },

  sectionComplete(tiles) {
    tiles.forEach(el => {
      el.classList.add('section-burst');
      el.addEventListener('animationend', () => el.classList.remove('section-burst'), { once: true });
    });
  },

  winSequence(allTiles) {
    let i = 0;
    const step = () => {
      if (i < allTiles.length) {
        allTiles[i].classList.add('rainbow-wave');
        allTiles[i].addEventListener('animationend', () => allTiles[i].classList.remove('rainbow-wave'), { once: true });
        i++;
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  },

  streakBanner(days) {
    const el = document.createElement('div');
    el.className = 'streak-banner';
    el.textContent = t('streak_label', { n: days });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  achievementUnlock(achievement) {
    const el = document.createElement('div');
    el.className = 'achievement-card';
    el.innerHTML = `
      <span class="achievement-card-icon">${achievement.icon}</span>
      <div class="achievement-card-info">
        <div class="achievement-card-name">${t(achievement.nameKey) || achievement.name}</div>
        <div class="achievement-card-desc">${t(achievement.descKey) || achievement.description}</div>
      </div>
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
};

