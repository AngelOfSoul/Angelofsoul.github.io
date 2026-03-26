/**
 * leaderboard.js — Mock leaderboard system backed by localStorage.
 * Supports three ranking modes: by tiles, by pieces, by streak.
 */

import { Storage } from './storage.js';

const DEFAULT_FAMILIES = [
  { name: 'Familia Popa',     tiles: 12, pieces: 1, streak: 7,  stars: 1 },
  { name: 'Familia Ionescu',  tiles: 9,  pieces: 0, streak: 5,  stars: 0 },
  { name: 'Familia Moldovan', tiles: 8,  pieces: 1, streak: 8,  stars: 0 },
  { name: 'Familia Mureșan',  tiles: 6,  pieces: 0, streak: 3,  stars: 1 },
  { name: 'Vizitator anonim', tiles: 4,  pieces: 0, streak: 0,  stars: 0 },
  { name: 'Tu (test)',        tiles: 0,  pieces: 0, streak: 0,  stars: 0 }
];

export const Leaderboard = {

  /**
   * Return raw leaderboard array (from storage or default).
   * @returns {object[]}
   */
  getData() {
    const stored = Storage.getLeaderboard();
    // Ensure all required fields exist on every entry
    return stored.map(e => ({
      name:   e.name   || 'Anonim',
      tiles:  e.tiles  || 0,
      pieces: e.pieces || 0,
      streak: e.streak || 0,
      stars:  e.stars  || 0
    }));
  },

  /**
   * Update (or insert) the current user's leaderboard entry.
   * @param {{ name: string }} user
   * @param {number} tiles    total tiles painted this season
   * @param {number} streak   current streak
   * @returns {object[]}  updated leaderboard
   */
  updateUserEntry(user, tiles, streak) {
    const data = this.getData();
    const idx  = data.findIndex(e => e.name === user.name);

    if (idx !== -1) {
      data[idx].tiles  = tiles;
      data[idx].streak = streak;
    } else {
      data.push({ name: user.name, tiles, pieces: 0, streak, stars: 0 });
    }

    Storage.setLeaderboard(data);
    return data;
  },

  /**
   * Increment pieces count for a user (called when a piece is completed).
   * @param {{ name: string }} user
   */
  incrementPieces(user) {
    const data = this.getData();
    const idx  = data.findIndex(e => e.name === user.name);
    if (idx !== -1) {
      data[idx].pieces = (data[idx].pieces || 0) + 1;
    } else {
      data.push({ name: user.name, tiles: 0, pieces: 1, streak: 0, stars: 0 });
    }
    Storage.setLeaderboard(data);
  },

  /**
   * Return leaderboard sorted by tiles (descending).
   * @returns {object[]}
   */
  getByTiles() {
    return [...this.getData()].sort((a, b) => b.tiles - a.tiles);
  },

  /**
   * Return leaderboard sorted by pieces (descending).
   * @returns {object[]}
   */
  getByPieces() {
    return [...this.getData()].sort((a, b) => b.pieces - a.pieces);
  },

  /**
   * Return leaderboard sorted by streak (descending).
   * @returns {object[]}
   */
  getByStreak() {
    return [...this.getData()].sort((a, b) => b.streak - a.streak);
  },

  /**
   * Return only entries with at least one star (Hall of Fame).
   * @returns {object[]}
   */
  getHallOfFame() {
    return this.getData().filter(e => e.stars > 0);
  },

  /**
   * Award a star to the top entry by tiles (Tier-2 end-of-season).
   */
  awardStarToTopTiles() {
    const data  = this.getData();
    const sorted = [...data].sort((a, b) => b.tiles - a.tiles);
    if (sorted[0]) {
      const idx = data.findIndex(e => e.name === sorted[0].name);
      if (idx !== -1) {
        data[idx].stars = (data[idx].stars || 0) + 1;
        Storage.setLeaderboard(data);
      }
    }
  }
};
