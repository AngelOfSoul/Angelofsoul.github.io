/**
 * tutorial.js — 4-step tutorial overlay shown on first visit.
 * Steps are displayed with dot navigation, skip and next buttons.
 */

import { Storage } from './storage.js';
import { I18n }    from './i18n.js';

/** Tutorial step definitions (keys resolved via I18n). */
const STEPS = [
  {
    titleKey: 'tutorial_step1_title',
    descKey:  'tutorial_step1_desc',
    emoji:    '🏘️'
  },
  {
    titleKey: 'tutorial_step2_title',
    descKey:  'tutorial_step2_desc',
    emoji:    '🎨',
    showPalette: true
  },
  {
    titleKey:    'tutorial_step3_title',
    descKey:     'tutorial_step3_desc',
    emoji:       '🏆',
    showRewards: true
  },
  {
    titleKey: 'tutorial_step4_title',
    descKey:  'tutorial_step4_desc',
    emoji:    '✨'
  }
];

export const Tutorial = {
  currentStep: 0,
  _nextBound:  null,
  _skipBound:  null,

  /**
   * Show the tutorial overlay unless it has already been completed.
   */
  show() {
    if (Storage.isTutorialDone()) return;

    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    this.renderStep(0);
    this._bindButtons();
  },

  /**
   * Render a specific step into the tutorial card.
   * @param {number} step  0-3
   */
  renderStep(step) {
    this.currentStep = step;

    const content = document.getElementById('tutorial-step-content');
    const dots    = document.getElementById('tutorial-dots');
    const nextBtn = document.getElementById('tutorial-next');
    const skipBtn = document.getElementById('tutorial-skip');

    if (!content || !dots || !nextBtn) return;

    const s = STEPS[step];

    // Build palette preview HTML if needed
    const paletteHtml = s.showPalette
      ? `<div class="tutorial-palette-preview">
           ${['#c0392b','#e07b54','#f59e0b','#27ae60','#7f8c8d','#f5e6c8','#1a237e']
               .map(c => `<span class="tutorial-swatch" style="background:${c}"></span>`)
               .join('')}
         </div>`
      : '';

    // Build rewards preview HTML if needed
    const rewardsHtml = s.showRewards
      ? `<div class="tutorial-rewards-preview">
           <span title="Steaua Satului">⭐</span>
           <span title="Pictorul Satului">🎨</span>
           <span title="Fidelul Satului">🔥</span>
           <span title="Ctitorul">👑</span>
         </div>`
      : '';

    content.innerHTML = `
      <div class="tutorial-step">
        <div class="tutorial-emoji">${s.emoji}</div>
        <h3>${I18n.t(s.titleKey)}</h3>
        <p>${I18n.t(s.descKey)}</p>
        ${paletteHtml}
        ${rewardsHtml}
      </div>
    `;

    // Dots
    dots.innerHTML = STEPS.map((_, i) =>
      `<span class="dot ${i === step ? 'active' : ''}"></span>`
    ).join('');

    // Button labels
    if (step === STEPS.length - 1) {
      nextBtn.textContent = I18n.t('start_painting');
      nextBtn.classList.add('btn-success');
    } else {
      nextBtn.textContent = I18n.t('next');
      nextBtn.classList.remove('btn-success');
    }
    skipBtn.textContent = I18n.t('skip');
  },

  /**
   * Bind next / skip button handlers (only once; rebind on each show() call).
   */
  _bindButtons() {
    const nextBtn = document.getElementById('tutorial-next');
    const skipBtn = document.getElementById('tutorial-skip');

    // Remove old listeners to avoid duplicates
    if (this._nextBound && nextBtn) nextBtn.removeEventListener('click', this._nextBound);
    if (this._skipBound && skipBtn) skipBtn.removeEventListener('click', this._skipBound);

    this._nextBound = () => {
      if (this.currentStep < STEPS.length - 1) {
        this.renderStep(this.currentStep + 1);
      } else {
        this.dismiss();
      }
    };

    this._skipBound = () => this.dismiss();

    nextBtn?.addEventListener('click', this._nextBound);
    skipBtn?.addEventListener('click', this._skipBound);
  },

  /**
   * Hide the tutorial overlay and mark it as done.
   */
  dismiss() {
    const overlay = document.getElementById('tutorial-overlay');
    overlay?.classList.add('hidden');
    Storage.setTutorialDone();
  }
};
