/**
 * i18n.js — Bilingual translation system (Romanian / English)
 * Usage: I18n.setLang('ro' | 'en'), I18n.t('key')
 */

export const translations = {
  ro: {
    // ── Mode selection ──────────────────────────────────────────────────────
    mode_puzzle_title:    'Puzzle Viu',
    mode_puzzle_desc:     'Dezvăluie imaginea ascunsă a satului împreună cu comunitatea!',
    mode_teritorii_title: 'Teritorii',
    mode_teritorii_desc:  'Revendică teritorii pentru familia ta!',
    mode_coming_soon:     'În curând',
    enter_mode:           'Intră în joc',

    // ── Game UI ─────────────────────────────────────────────────────────────
    season_label:         'Sezon',
    time_remaining:       'Timp rămas',
    tiles_painted:        'Dale pictate',
    your_streak:          'Seria ta',
    paint_tile:           'Pictează o dală',
    daily_limit_reached:  'Limită zilnică atinsă!',
    daily_limit_msg:      '⏳ Ai pictat deja azi. Revino mâine pentru o nouă dală!',
    register_push:        'Înregistrează-te pentru a-ți salva progresul și a apărea în clasament!',
    anonymous_tile:       'Vizitator anonim',

    // ── Tutorial ────────────────────────────────────────────────────────────
    tutorial_step1_title: 'Bun venit la Mozaicul Calnicului!',
    tutorial_step1_desc:  'Acesta este un puzzle comunitar. Împreună, locuitorii satului Calnic și prietenii lor vor dezvălui o imagine ascunsă, o dală pe zi.',
    tutorial_step2_title: 'Cum pictezi o dală',
    tutorial_step2_desc:  'Alege o culoare din paleta de culori, apoi apasă pe orice pătrat gol din grilă. Poți picta o singură dală pe zi!',
    tutorial_step3_title: 'Recompense și realizări',
    tutorial_step3_desc:  'Câștigă titluri, certificate și medalii participând zilnic. Completează bucăți din mozaic pentru recompense speciale!',
    tutorial_step4_title: 'Gata să începi!',
    tutorial_step4_desc:  'Apasă pe un pătrat gol pentru a-ți lăsa amprenta în istoria Calnicului. Mult succes!',
    skip:                 'Sari peste',
    next:                 'Următorul',
    start_painting:       'Începe să pictezi!',

    // ── Rewards ─────────────────────────────────────────────────────────────
    reward_tier1_title:   'Ai pus ultimul pătrat al mozaicului acestui sezon!',
    steaua_satului:       'Steaua Satului',
    pergamentul:          'Pergamentul Onoarei',
    lumanarea_memoriei:   'Lumânarea Memoriei',
    reward_tier2_title:   'Cel mai activ contributor al sezonului!',
    pictorul_satului:     'Pictorul Satului',
    reward_tier3_title:   'Cea mai lungă serie consecutivă!',
    fidelul:              'Fidelul Satului',
    reward_tier4_title:   'Câștigător în mai multe sezoane!',
    ctitorul:             'Ctitorul',
    pagina_extinsa:       'Pagină Extinsă de Profil',

    // ── Leaderboard ─────────────────────────────────────────────────────────
    leaderboard_title:    'Clasament',
    tab_tiles:            'Cele mai multe dale',
    tab_pieces:           'Bucăți descoperite',
    tab_streak:           'Cel mai lung streak',
    hall_of_fame:         'Galeria Onoarei',
    rank:                 'Loc',
    family:               'Familie',
    score:                'Scor',

    // ── Help ────────────────────────────────────────────────────────────────
    help_title:           'Ajutor',
    tab_how_to_play:      'Cum joci',
    tab_rewards:          'Recompense',
    tab_current_season:   'Sezon curent',
    how_to_play_text:     'Mozaicul Satului este un puzzle comunitar unde fiecare participant poate picta o dală pe zi. Alege o culoare din paleta de jos, apasă pe un pătrat gol și lasă-ți amprenta în istoria Calnicului. Completează bucăți întregi din mozaic pentru a debloca recompense speciale. Revino în fiecare zi pentru a-ți menține seria și a urca în clasament!',
    rewards_text:         '⭐ Steaua Satului — Ultimul pătrat al mozaicului\n🎨 Pictorul Satului — Cel mai activ când sezonul expiră\n🔥 Fidelul Satului — Cea mai lungă serie zilnică\n👑 Ctitorul — Câștigător în 2+ sezoane consecutive',

    // ── Last tile ───────────────────────────────────────────────────────────
    last_tile_piece:      'Ai completat mozaicul acestui sezon!',
    you_receive:          'Primești',
    congratulations:      'Felicitări!',
    leave_memory:         'Lasă un mesaj pentru comunitate:',
    memory_placeholder:   'Scrie câteva cuvinte pentru Calnic...',
    memory_submit:        'Salvează amintirea',

    // ── Achievements ────────────────────────────────────────────────────────
    achievement_first_tile:   '🎨 Prima dală pictată!',
    achievement_first_piece:  '🧩 Parte din prima bucată completă!',
    achievement_streak3:      '🔥 3 zile consecutive!',
    achievement_streak7:      '🔥🔥 7 zile consecutive!',
    achievement_all_pieces:   '👑 Toate 4 bucățile complete!',
    achievement_last_tile:    '⭐ Ultima dală a mozaicului!',
    achievement_registered:   '🏠 Utilizator înregistrat!',
    achievement_comeback:     '💪 Revenire după 3+ zile!',
    achievement_dedicated:    '🌟 Participant dedicat!',

    // ── Piece names ─────────────────────────────────────────────────────────
    piece_0: 'Colț NV',
    piece_1: 'Colț NE',
    piece_2: 'Colț SV',
    piece_3: 'Colț SE',

    // ── Certificate ─────────────────────────────────────────────────────────
    certificate_tier1_text: 'a descoperit ultimul pătrat al Mozaicului Calnicului',
    certificate_tier2_text: 'a contribuit cel mai mult la Mozaicul Calnicului',
    certificate_title:      'Certificat de Onoare',
    certificate_subtitle:   'Mozaicul Calnicului',

    // ── Errors ──────────────────────────────────────────────────────────────
    error_already_painted: 'Această dală a fost deja pictată!',
    error_daily_limit:     'Ai atins limita zilnică. Revino mâine!',
    error_not_your_tile:   'Nu poți modifica dala altei familii!'
  },

  en: {
    // ── Mode selection ──────────────────────────────────────────────────────
    mode_puzzle_title:    'Living Puzzle',
    mode_puzzle_desc:     'Reveal the village hidden image together with the community!',
    mode_teritorii_title: 'Territories',
    mode_teritorii_desc:  'Claim territories for your family!',
    mode_coming_soon:     'Coming soon',
    enter_mode:           'Enter game',

    // ── Game UI ─────────────────────────────────────────────────────────────
    season_label:         'Season',
    time_remaining:       'Time remaining',
    tiles_painted:        'Tiles painted',
    your_streak:          'Your streak',
    paint_tile:           'Paint a tile',
    daily_limit_reached:  'Daily limit reached!',
    daily_limit_msg:      '⏳ You already painted today. Come back tomorrow for a new tile!',
    register_push:        'Register to save your progress and appear on the leaderboard!',
    anonymous_tile:       'Anonymous visitor',

    // ── Tutorial ────────────────────────────────────────────────────────────
    tutorial_step1_title: 'Welcome to the Village Mosaic!',
    tutorial_step1_desc:  'This is a community puzzle. Together, the residents of Calnic village and their friends will reveal a hidden image — one tile per day.',
    tutorial_step2_title: 'How to paint a tile',
    tutorial_step2_desc:  'Choose a colour from the palette below, then click any empty square on the grid. You can paint one tile per day!',
    tutorial_step3_title: 'Rewards & achievements',
    tutorial_step3_desc:  'Earn titles, certificates and medals by participating daily. Complete mosaic pieces for special rewards!',
    tutorial_step4_title: 'Ready to start!',
    tutorial_step4_desc:  'Click any empty square to leave your mark in Calnic\'s history. Good luck!',
    skip:                 'Skip',
    next:                 'Next',
    start_painting:       'Start painting!',

    // ── Rewards ─────────────────────────────────────────────────────────────
    reward_tier1_title:   'You placed the last tile of this season\'s mosaic!',
    steaua_satului:       'Village Star',
    pergamentul:          'Certificate of Honour',
    lumanarea_memoriei:   'Memory Candle',
    reward_tier2_title:   'Most active contributor of the season!',
    pictorul_satului:     'Village Painter',
    reward_tier3_title:   'Longest consecutive streak!',
    fidelul:              'Village Faithful',
    reward_tier4_title:   'Winner across multiple seasons!',
    ctitorul:             'The Builder',
    pagina_extinsa:       'Extended Profile Page',

    // ── Leaderboard ─────────────────────────────────────────────────────────
    leaderboard_title:    'Leaderboard',
    tab_tiles:            'Most Tiles',
    tab_pieces:           'Pieces Discovered',
    tab_streak:           'Longest Streak',
    hall_of_fame:         'Hall of Fame',
    rank:                 'Rank',
    family:               'Family',
    score:                'Score',

    // ── Help ────────────────────────────────────────────────────────────────
    help_title:           'Help',
    tab_how_to_play:      'How to play',
    tab_rewards:          'Rewards',
    tab_current_season:   'Current season',
    how_to_play_text:     'Village Mosaic is a community puzzle where each participant can paint one tile per day. Choose a colour from the palette below, click an empty square, and leave your mark in Calnic\'s history. Complete full mosaic pieces to unlock special rewards. Come back every day to maintain your streak and climb the leaderboard!',
    rewards_text:         '⭐ Village Star — Last tile of the mosaic\n🎨 Village Painter — Most active when season expires\n🔥 Village Faithful — Longest daily streak\n👑 The Builder — Winner in 2+ consecutive seasons',

    // ── Last tile ───────────────────────────────────────────────────────────
    last_tile_piece:      'You completed this season\'s mosaic!',
    you_receive:          'You receive',
    congratulations:      'Congratulations!',
    leave_memory:         'Leave a message for the community:',
    memory_placeholder:   'Write a few words for Calnic...',
    memory_submit:        'Save memory',

    // ── Achievements ────────────────────────────────────────────────────────
    achievement_first_tile:   '🎨 First tile painted!',
    achievement_first_piece:  '🧩 Part of the first completed piece!',
    achievement_streak3:      '🔥 3 days in a row!',
    achievement_streak7:      '🔥🔥 7 days in a row!',
    achievement_all_pieces:   '👑 All 4 pieces complete!',
    achievement_last_tile:    '⭐ The very last tile!',
    achievement_registered:   '🏠 Registered user!',
    achievement_comeback:     '💪 Comeback after 3+ days!',
    achievement_dedicated:    '🌟 Dedicated participant!',

    // ── Piece names ─────────────────────────────────────────────────────────
    piece_0: 'NW Corner',
    piece_1: 'NE Corner',
    piece_2: 'SW Corner',
    piece_3: 'SE Corner',

    // ── Certificate ─────────────────────────────────────────────────────────
    certificate_tier1_text: 'has discovered the last tile of the Village Mosaic',
    certificate_tier2_text: 'contributed the most to the Village Mosaic',
    certificate_title:      'Certificate of Honour',
    certificate_subtitle:   'Village Mosaic of Calnic',

    // ── Errors ──────────────────────────────────────────────────────────────
    error_already_painted: 'This tile has already been painted!',
    error_daily_limit:     'You\'ve reached your daily limit. Come back tomorrow!',
    error_not_your_tile:   'You cannot modify another family\'s tile!'
  }
};

export class I18n {
  static _lang = 'ro';

  static setLang(lang) {
    if (lang === 'ro' || lang === 'en') {
      this._lang = lang;
    }
  }

  static getLang() {
    return this._lang;
  }

  /**
   * Translate a key. Falls back to the key itself if not found.
   * @param {string} key
   * @returns {string}
   */
  static t(key) {
    const dict = translations[this._lang] || translations.ro;
    if (dict[key] !== undefined) return dict[key];
    // Fallback to Romanian
    if (translations.ro[key] !== undefined) return translations.ro[key];
    // Last resort: return the key itself
    return key;
  }
}
