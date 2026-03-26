/**
 * achievements.js — 9-achievement system
 * Each achievement has an id, icon, and condition description.
 * Achievements are stored via Storage and dispatched as custom events.
 */

import { Storage } from './storage.js';

/** Configuration for all 9 achievements. */
const ACHIEVEMENT_CONFIG = {
  first_tile:       { icon: '🎨', condition: 'Paint first tile' },
  first_piece:      { icon: '🧩', condition: 'Complete first piece' },
  last_tile_piece:  { icon: '🏁', condition: 'Last tile of a piece' },
  streak_3:         { icon: '🔥', condition: '3-day streak' },
  streak_7:         { icon: '🔥🔥', condition: '7-day streak' },
  all_pieces:       { icon: '👑', condition: 'All 4 pieces complete' },
  last_tile_overall:{ icon: '⭐', condition: 'Very last tile of puzzle' },
  registered:       { icon: '🏠', condition: 'Registered user' },
  comeback:         { icon: '💪', condition: 'Comeback after 3+ days' }
};

export const Achievements = {

  /** Return the full achievement config map. */
  getAll() {
    return { ...ACHIEVEMENT_CONFIG };
  },

  /** Return array of already-unlocked achievement IDs. */
  getUnlocked() {
    return Storage.getAchievements();
  },

  /**
   * Unlock a single achievement by id.
   * Dispatches mozaic:achievementUnlocked if it was newly earned.
   * @param {string} id
   * @returns {boolean} true if newly unlocked
   */
  unlock(id) {
    if (!ACHIEVEMENT_CONFIG[id]) {
      console.warn(`[Achievements] Unknown achievement id: ${id}`);
      return false;
    }
    const wasNew = Storage.addAchievement(id);
    if (wasNew) {
      const achievement = { id, ...ACHIEVEMENT_CONFIG[id] };
      document.dispatchEvent(new CustomEvent('mozaic:achievementUnlocked', {
        detail: { achievement }
      }));
    }
    return wasNew;
  },

  /**
   * Check and unlock achievements based on a game event.
   * @param {string} event  event name
   * @param {object} data   event-specific payload
   */
  check(event, data = {}) {
    const tiles    = Storage.getTiles();
    const unlocked = Storage.getAchievements();

    switch (event) {

      case 'tilePainted':
        // First ever tile
        if (tiles.length === 1) this.unlock('first_tile');
        break;

      case 'pieceComplete':
        // First piece ever completed
        if (!unlocked.includes('first_piece')) this.unlock('first_piece');
        // Last tile of any piece (the triggering tile was the last in the piece)
        this.unlock('last_tile_piece');
        // All 4 pieces complete?
        if (data.completedCount >= 4) this.unlock('all_pieces');
        break;

      case 'lastTile':
        this.unlock('last_tile_overall');
        break;

      case 'streakUpdate':
        if ((data.count || 0) >= 3) this.unlock('streak_3');
        if ((data.count || 0) >= 7) this.unlock('streak_7');
        break;

      case 'registered':
        this.unlock('registered');
        break;

      case 'comeback':
        this.unlock('comeback');
        break;

      default:
        break;
    }
  }
};
