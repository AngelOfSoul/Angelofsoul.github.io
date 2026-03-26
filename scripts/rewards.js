/**
 * rewards.js — Four-tier reward system
 * Tier 1: Last tile placed (puzzle complete)
 * Tier 2: Most tiles when season times out
 * Tier 3: Longest streak when season times out
 * Tier 4: Won Tier 1 in 2+ seasons
 */

import { Storage }     from './storage.js';
import { Certificate } from './certificate.js';
import { I18n }        from './i18n.js';

// ── Utility helpers ────────────────────────────────────────────────────────

/**
 * Async delay helper.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display a brief toast notification.
 * @param {string} message
 * @param {'gold'|'amber'|'cyan'|'success'|'warning'|'error'} color
 * @param {number} duration  ms
 */
function showToast(message, color = 'success', duration = 3000) {
  const root = document.getElementById('feedback-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${color}`;
  toast.textContent = message;
  root.appendChild(toast);

  // Trigger CSS entrance animation
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// ── Rewards API ────────────────────────────────────────────────────────────

export const Rewards = {

  /**
   * Tier 1 — called when the very last tile is placed.
   * Shows a sequenced reward overlay with cards and a memory input.
   * @param {{ name: string }} user
   * @param {object}           season
   */
  async triggerTier1(user, season) {
    const overlay = document.getElementById('reward-overlay');
    const seq     = document.getElementById('reward-sequence');
    if (!overlay || !seq) return;

    overlay.classList.remove('hidden');
    seq.innerHTML = '';

    // ── Announcement ──────────────────────────────────────────────────────
    const announce = document.createElement('div');
    announce.className = 'reward-announce';
    announce.innerHTML = `
      <div class="reward-stars">⭐⭐⭐</div>
      <h1 class="reward-title">${I18n.t('congratulations')}</h1>
      <p class="reward-subtitle">${I18n.t('reward_tier1_title')}</p>
      <p class="reward-family">${user.name}</p>
    `;
    seq.appendChild(announce);

    await delay(900);

    // ── Reward cards (appear one by one) ─────────────────────────────────
    const rewardItems = [
      {
        icon:  '⭐',
        title: I18n.t('steaua_satului'),
        desc:  I18n.t('reward_tier1_title')
      },
      {
        icon:  '📜',
        title: I18n.t('pergamentul'),
        desc:  'Un certificat de onoare generat pentru tine / A certificate of honour generated for you'
      },
      {
        icon:  '🕯️',
        title: I18n.t('lumanarea_memoriei'),
        desc:  'Lasă un mesaj pentru comunitate / Leave a message for the community'
      }
    ];

    for (const item of rewardItems) {
      const card = document.createElement('div');
      card.className = 'reward-card glass anim-reward-appear';
      card.innerHTML = `
        <span class="reward-card-icon">${item.icon}</span>
        <div class="reward-card-body">
          <strong>${item.title}</strong>
          <p>${item.desc}</p>
        </div>
      `;
      seq.appendChild(card);
      await delay(550);
    }

    // ── Memory input ──────────────────────────────────────────────────────
    await delay(400);

    const memSection = document.createElement('div');
    memSection.className = 'memory-section glass';
    memSection.innerHTML = `
      <p class="memory-label">${I18n.t('leave_memory')}</p>
      <textarea id="memory-input"
        placeholder="${I18n.t('memory_placeholder')}"
        maxlength="200"
        rows="3"
      ></textarea>
      <button id="memory-submit" class="btn-primary">${I18n.t('memory_submit')}</button>
    `;
    seq.appendChild(memSection);

    // ── Persist reward + update user star ─────────────────────────────────
    Storage.addReward({
      type:     'tier1',
      seasonId: season.id,
      data:     { userName: user.name, timestamp: Date.now() }
    });

    const u = Storage.getUser();
    u.stars = (u.stars || 0) + 1;
    Storage.setUser(u);

    // ── Generate certificate ──────────────────────────────────────────────
    Certificate.generate(user, season, 'tier1');

    // ── Memory submit handler ─────────────────────────────────────────────
    const submitBtn = document.getElementById('memory-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const text = (document.getElementById('memory-input')?.value || '').trim();
        if (text) {
          Storage.addReward({
            type:     'memory',
            seasonId: season.id,
            data:     { text, userName: user.name, timestamp: Date.now() }
          });
        }
        submitBtn.textContent = I18n.getLang() === 'en' ? '✓ Saved!' : '✓ Salvat!';
        submitBtn.disabled    = true;

        // Show certificate modal after short pause
        setTimeout(() => {
          overlay.classList.add('hidden');
          document.getElementById('certificate-modal')?.classList.remove('hidden');
        }, 1200);
      }, { once: true });
    }

    // ── Close button ──────────────────────────────────────────────────────
    const closeBtn = document.getElementById('reward-close');
    if (closeBtn) {
      closeBtn.onclick = () => overlay.classList.add('hidden');
    }
  },

  /**
   * Tier 2 — Pictorul Satului (most tiles when season times out).
   * @param {{ name: string }} user
   * @param {object}           season
   */
  triggerTier2(user, season) {
    Storage.addReward({
      type:     'tier2',
      seasonId: season.id,
      data:     { userName: user.name, timestamp: Date.now() }
    });

    const u = Storage.getUser();
    u.isPictor = true;
    Storage.setUser(u);

    showToast(`🎨 ${I18n.t('pictorul_satului')}!`, 'gold', 6000);
    Certificate.generate(user, season, 'tier2');

    // Reveal certificate modal
    setTimeout(() => {
      document.getElementById('certificate-modal')?.classList.remove('hidden');
    }, 1000);
  },

  /**
   * Tier 3 — Fidelul Satului (longest streak when season times out).
   * @param {{ name: string }} user
   * @param {object}           season
   */
  triggerTier3(user, season) {
    Storage.addReward({
      type:     'tier3',
      seasonId: season.id,
      data:     { userName: user.name, timestamp: Date.now() }
    });

    const u = Storage.getUser();
    u.isFidel = true;
    Storage.setUser(u);

    showToast(`🔥 ${I18n.t('fidelul')}!`, 'amber', 6000);
  },

  /**
   * Tier 4 — Ctitorul (won Tier 1 in 2+ seasons).
   * Checks automatically; only awards once.
   * @param {{ name: string }} user
   */
  checkTier4(user) {
    const rewards  = Storage.getRewards();
    const tier1Win = rewards.filter(r => r.type === 'tier1' && r.data?.userName === user.name);

    if (tier1Win.length >= 2) {
      const alreadyTier4 = rewards.some(r => r.type === 'tier4' && r.data?.userName === user.name);
      if (!alreadyTier4) {
        Storage.addReward({
          type: 'tier4',
          data: { userName: user.name, timestamp: Date.now() }
        });

        const u = Storage.getUser();
        u.isCtitor          = true;
        u.hasExtendedProfile = true;
        Storage.setUser(u);

        showToast(`👑 ${I18n.t('ctitorul')}!`, 'cyan', 7000);
      }
    }
  }
};
