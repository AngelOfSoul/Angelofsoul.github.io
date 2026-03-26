const ACHIEVEMENTS = [
  {
    id: 'first_tile',
    icon: '🌱',
    name: 'First Step',
    nameRo: 'Primul Pas',
    description: 'Fill your first tile',
    descriptionRo: 'Completeaza primul patrat',
    check: ({ filled }) => filled >= 1
  },
  {
    id: 'ten_tiles',
    icon: '🔟',
    name: 'Getting Started',
    nameRo: 'Inceput Bun',
    description: 'Fill 10 tiles',
    descriptionRo: 'Completeaza 10 patrate',
    check: ({ filled }) => filled >= 10
  },
  {
    id: 'section_one',
    icon: '🗺️',
    name: 'Section Master',
    nameRo: 'Maestru de Sectiune',
    description: 'Complete any section',
    descriptionRo: 'Completeaza orice sectiune',
    check: ({ sections }) => sections.length >= 1
  },
  {
    id: 'all_sections',
    icon: '🌍',
    name: 'Full Board',
    nameRo: 'Tabla Completa',
    description: 'Complete all 4 sections',
    descriptionRo: 'Completeaza toate 4 sectiunile',
    check: ({ sections }) => sections.length >= 4
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: 'On Fire',
    nameRo: 'In Flacari',
    description: 'Reach a 3-day streak',
    descriptionRo: 'Atinge un streak de 3 zile',
    check: ({ streak }) => streak >= 3
  },
  {
    id: 'streak_7',
    icon: '⚡',
    name: 'Week Warrior',
    nameRo: 'Razboinicul Saptamanii',
    description: 'Reach a 7-day streak',
    descriptionRo: 'Atinge un streak de 7 zile',
    check: ({ streak }) => streak >= 7
  },
  {
    id: 'streak_30',
    icon: '👑',
    name: 'Legendary',
    nameRo: 'Legendar',
    description: 'Reach a 30-day streak',
    descriptionRo: 'Atinge un streak de 30 de zile',
    check: ({ streak }) => streak >= 30
  },
  {
    id: 'complete',
    icon: '🎉',
    name: 'Mosaic Complete',
    nameRo: 'Mozaic Complet',
    description: 'Fill all 100 tiles',
    descriptionRo: 'Completeaza toate 100 de patrate',
    check: ({ filled }) => filled >= 100
  }
];

export const Achievements = {
  check(state) {
    const unlocked = this.getUnlocked();
    const newlyUnlocked = [];

    ACHIEVEMENTS.forEach(a => {
      if (!unlocked.includes(a.id) && a.check(state)) {
        unlocked.push(a.id);
        newlyUnlocked.push(a);
        document.dispatchEvent(new CustomEvent('mosaic:achievementUnlocked', {
          detail: { achievement: a }
        }));
      }
    });

    if (newlyUnlocked.length > 0) {
      localStorage.setItem('achievements', JSON.stringify(unlocked));
    }

    return newlyUnlocked;
  },

  getUnlocked() {
    try {
      return JSON.parse(localStorage.getItem('achievements') || '[]');
    } catch {
      return [];
    }
  },

  getAll() {
    return ACHIEVEMENTS;
  }
};
