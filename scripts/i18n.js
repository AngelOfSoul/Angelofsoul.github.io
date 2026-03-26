let lang = localStorage.getItem('lang') || 'en';

const d = {
  en: {
    tile: '+1 Tile',
    section_complete: 'Section {n} Complete ✓',
    streak_label: '🔥 {n} day streak',
    day_streak: 'day streak',
    achievements: 'Achievements',
    win_title: '🎉 Mosaic Complete!',
    win_subtitle: 'You filled all 100 tiles!',
    reset: 'Reset',
    close: 'Close',
    game_title: 'Mosaic',
    // Achievement names and descriptions
    ach_first_tile_name: 'First Step',
    ach_first_tile_desc: 'Fill your first tile',
    ach_ten_tiles_name: 'Getting Started',
    ach_ten_tiles_desc: 'Fill 10 tiles',
    ach_section_one_name: 'Section Master',
    ach_section_one_desc: 'Complete any section',
    ach_all_sections_name: 'Full Board',
    ach_all_sections_desc: 'Complete all 4 sections',
    ach_streak_3_name: 'On Fire',
    ach_streak_3_desc: 'Reach a 3-day streak',
    ach_streak_7_name: 'Week Warrior',
    ach_streak_7_desc: 'Reach a 7-day streak',
    ach_streak_30_name: 'Legendary',
    ach_streak_30_desc: 'Reach a 30-day streak',
    ach_complete_name: 'Mosaic Complete',
    ach_complete_desc: 'Fill all 100 tiles'
  },
  ro: {
    tile: '+1 Piesa',
    section_complete: 'Sectiunea {n} Completa ✓',
    streak_label: '🔥 {n} zile streak',
    day_streak: 'zile streak',
    achievements: 'Realizari',
    win_title: '🎉 Mozaic Complet!',
    win_subtitle: 'Ai completat toate 100 de piese!',
    reset: 'Resetare',
    close: 'Inchide',
    game_title: 'Mozaic',
    // Achievement names and descriptions
    ach_first_tile_name: 'Primul Pas',
    ach_first_tile_desc: 'Completeaza primul patrat',
    ach_ten_tiles_name: 'Inceput Bun',
    ach_ten_tiles_desc: 'Completeaza 10 patrate',
    ach_section_one_name: 'Maestru de Sectiune',
    ach_section_one_desc: 'Completeaza orice sectiune',
    ach_all_sections_name: 'Tabla Completa',
    ach_all_sections_desc: 'Completeaza toate 4 sectiunile',
    ach_streak_3_name: 'In Flacari',
    ach_streak_3_desc: 'Atinge un streak de 3 zile',
    ach_streak_7_name: 'Razboinicul Saptamanii',
    ach_streak_7_desc: 'Atinge un streak de 7 zile',
    ach_streak_30_name: 'Legendar',
    ach_streak_30_desc: 'Atinge un streak de 30 de zile',
    ach_complete_name: 'Mozaic Complet',
    ach_complete_desc: 'Completeaza toate 100 de patrate'
  }
};

export function setLang(l) {
  lang = l;
  localStorage.setItem('lang', l);
  applyI18n();
}

export function getLang() {
  return lang;
}

export function t(k, vars) {
  let str = (d[lang] && d[lang][k]) ? d[lang][k] : (d['en'][k] || k);
  if (vars) {
    Object.keys(vars).forEach(key => {
      str = str.replace(new RegExp(`\\{${key}\\}`, 'g'), vars[key]);
    });
  }
  return str;
}

export function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
}
