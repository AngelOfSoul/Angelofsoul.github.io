/**
 * certificate.js — Generates a parchment-style certificate on HTML5 Canvas.
 * Supports tier1 (last tile) and tier2 (most tiles / season timeout).
 */

import { Storage } from './storage.js';
import { I18n }    from './i18n.js';

/** Site credit shown at the bottom of every certificate. */
const CERTIFICATE_CREDIT = 'Mozaicul Calnicului — mozaiculsatului.ro';

export const Certificate = {

  /**
   * Draw the certificate onto #certificate-canvas and bind the download button.
   * @param {{ name: string }}  user
   * @param {object}            season
   * @param {'tier1'|'tier2'}   tier
   */
  generate(user, season, tier) {
    const canvas = document.getElementById('certificate-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = 600, H = 400;
    canvas.width  = W;
    canvas.height = H;

    // ── Parchment background ────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0,   '#f5e6c8');
    bgGrad.addColorStop(0.5, '#ede0b0');
    bgGrad.addColorStop(1,   '#f5e6c8');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Aged texture (random dots) ──────────────────────────────────────────
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.025})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(180,140,60,${Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }

    // ── Outer gold border ───────────────────────────────────────────────────
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth   = 10;
    ctx.strokeRect(8, 8, W - 16, H - 16);

    // ── Inner thin border ───────────────────────────────────────────────────
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth   = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // ── Corner ornaments ────────────────────────────────────────────────────
    this._drawCornerOrnaments(ctx, W, H);

    // ── Horizontal rule under title ─────────────────────────────────────────
    ctx.save();
    const lineGrad = ctx.createLinearGradient(50, 0, W - 50, 0);
    lineGrad.addColorStop(0,   'transparent');
    lineGrad.addColorStop(0.2, '#b8860b');
    lineGrad.addColorStop(0.8, '#b8860b');
    lineGrad.addColorStop(1,   'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, 118);
    ctx.lineTo(W - 50, 118);
    ctx.stroke();
    ctx.restore();

    // ── Title block ─────────────────────────────────────────────────────────
    ctx.textAlign = 'center';

    ctx.fillStyle = '#5d3a1a';
    ctx.font      = 'bold 22px Georgia, "Times New Roman", serif';
    ctx.fillText('MOZAICUL CALNICULUI', W / 2, 65);

    ctx.fillStyle = '#8b6914';
    ctx.font      = 'italic 13px Georgia, "Times New Roman", serif';
    ctx.fillText(I18n.t('certificate_title') + '  /  Certificate of Honour', W / 2, 92);

    // ── Family name ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#2c1810';
    ctx.font      = 'bold 30px Georgia, "Times New Roman", serif';
    ctx.fillText(user.name || 'Familia', W / 2, 158);

    // ── Main body text ───────────────────────────────────────────────────────
    ctx.font      = '15px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#4a2f0d';

    const mainTextRo = tier === 'tier1'
      ? 'a descoperit ultimul pătrat al Mozaicului Calnicului'
      : 'a contribuit cel mai mult la Mozaicul Calnicului';

    const mainTextEn = tier === 'tier1'
      ? 'has discovered the last tile of the Village Mosaic'
      : 'contributed the most to the Village Mosaic';

    ctx.fillText(mainTextRo, W / 2, 198);

    ctx.font      = 'italic 13px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#6b4c2a';
    ctx.fillText(mainTextEn, W / 2, 220);

    // ── Horizontal rule ──────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(80, 238);
    ctx.lineTo(W - 80, 238);
    ctx.stroke();
    ctx.restore();

    // ── Season info ──────────────────────────────────────────────────────────
    const lang = I18n.getLang();
    const seasonName = season.name
      ? (typeof season.name === 'object' ? (season.name[lang] || season.name.ro) : season.name)
      : 'Sezon 1';

    const dateStr = new Date().toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

    ctx.font      = 'italic 14px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#8b6914';
    ctx.fillText(`${seasonName}  —  ${dateStr}`, W / 2, 270);

    // ── Tier badge ───────────────────────────────────────────────────────────
    const tierLabel = tier === 'tier1' ? '⭐ Steaua Satului' : '🎨 Pictorul Satului';
    ctx.font      = 'bold 16px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#b8860b';
    ctx.fillText(tierLabel, W / 2, 310);

    // ── Bottom ornamental divider ─────────────────────────────────────────────
    ctx.font      = '20px Georgia, serif';
    ctx.fillStyle = '#b8860b';
    ctx.fillText('✦  ✦  ✦', W / 2, 348);

    // ── Signature line ────────────────────────────────────────────────────────
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 80, 376);
    ctx.lineTo(W / 2 + 80, 376);
    ctx.stroke();
    ctx.font      = '11px Georgia, serif';
    ctx.fillStyle = '#8b6914';
    ctx.fillText(CERTIFICATE_CREDIT, W / 2, 390);

    // ── Save data URL to rewards ──────────────────────────────────────────────
    try {
      const dataUrl = canvas.toDataURL('image/png');
      Storage.addReward({
        type:     'certificate',
        seasonId: season.id,
        data:     { dataUrl, userName: user.name, tier, timestamp: Date.now() }
      });
    } catch (e) {
      console.warn('[Certificate] Could not save data URL:', e);
    }

    // ── Bind download button ──────────────────────────────────────────────────
    const dlBtn = document.getElementById('download-certificate');
    if (dlBtn) {
      dlBtn.onclick = () => {
        const link      = document.createElement('a');
        link.download   = `mozaic-certificate-${(user.name || 'anonim').replace(/\s+/g, '-')}.png`;
        link.href       = canvas.toDataURL('image/png');
        link.click();
      };
    }
  },

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Draw a decorative floral ornament in each corner.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} W  canvas width
   * @param {number} H  canvas height
   */
  _drawCornerOrnaments(ctx, W, H) {
    const positions = [
      { x: 36,     y: 36,     rotate: 0 },
      { x: W - 36, y: 36,     rotate: Math.PI / 2 },
      { x: 36,     y: H - 36, rotate: -Math.PI / 2 },
      { x: W - 36, y: H - 36, rotate: Math.PI }
    ];

    ctx.fillStyle = '#b8860b';
    ctx.font      = '22px Georgia, serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    positions.forEach(({ x, y }) => {
      ctx.fillText('❧', x, y);
    });

    ctx.textBaseline = 'alphabetic';
  }
};
