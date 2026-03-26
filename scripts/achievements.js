const ACHIEVEMENTS = [
  {
    id: 'first_tile',
    icon: '🌱',
    name: 'First Step',
    description: 'Fill your first tile',
    nameKey: 'ach_first_tile_name',
    descKey: 'ach_first_tile_desc',
    check: ({ filled }) => filled >= 1
  },
  {
    id: 'ten_tiles',
    icon: '🔟',
    name: 'Getting Started',
    description: 'Fill 10 tiles',
    nameKey: 'ach_ten_tiles_name',
    descKey: 'ach_ten_tiles_desc',
    check: ({ filled }) => filled >= 10
  },
  {
    id: 'section_one',
    icon: '🗺️',
    name: 'Section Master',
    description: 'Complete any section',
    nameKey: 'ach_section_one_name',
    descKey: 'ach_section_one_desc',
    check: ({ sections }) => sections.length >= 1
  },
  {
    id: 'all_sections',
    icon: '🌍',
    name: 'Full Board',
    description: 'Complete all 4 sections',
    nameKey: 'ach_all_sections_name',
    descKey: 'ach_all_sections_desc',
    check: ({ sections }) => sections.length >= 4
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: 'On Fire',
    description: 'Reach a 3-day streak',
    nameKey: 'ach_streak_3_name',
    descKey: 'ach_streak_3_desc',
    check: ({ streak }) => streak >= 3
  },
  {
    id: 'streak_7',
    icon: '⚡',
    name: 'Week Warrior',
    description: 'Reach a 7-day streak',
    nameKey: 'ach_streak_7_name',
    descKey: 'ach_streak_7_desc',
    check: ({ streak }) => streak >= 7
  },
  {
    id: 'streak_30',
    icon: '👑',
    name: 'Legendary',
    description: 'Reach a 30-day streak',
    nameKey: 'ach_streak_30_name',
    descKey: 'ach_streak_30_desc',
    check: ({ streak }) => streak >= 30
  },
  {
    id: 'complete',
    icon: '🎉',
    name: 'Mosaic Complete',
    description: 'Fill all 100 tiles',
    nameKey: 'ach_complete_name',
    descKey: 'ach_complete_desc',
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
