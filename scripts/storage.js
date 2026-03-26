/**
 * storage.js — localStorage abstraction layer
 * Replaces all Supabase calls with local persistence.
 * Keys used: mozaic_tiles, mozaic_season, mozaic_user, mozaic_streak,
 *   mozaic_achievements, mozaic_leaderboard, mozaic_daily,
 *   mozaic_archive, mozaic_rewards, mozaic_lang, mozaic_tutorial_done
 */

export const Storage = {

  // ── Tiles ──────────────────────────────────────────────────────────────────

  getTiles() {
    try {
      return JSON.parse(localStorage.getItem('mozaic_tiles') || '[]');
    } catch {
      return [];
    }
  },

  setTiles(tiles) {
    localStorage.setItem('mozaic_tiles', JSON.stringify(tiles));
  },

  addTile(tile) {
    const tiles = this.getTiles();
    tiles.push(tile);
    this.setTiles(tiles);
  },

  // ── Season ─────────────────────────────────────────────────────────────────

  getSeason() {
    try {
      const s = localStorage.getItem('mozaic_season');
      if (s) return JSON.parse(s);
    } catch { /* ignore */ }
    return null;
  },

  setSeason(season) {
    localStorage.setItem('mozaic_season', JSON.stringify(season));
  },

  // ── User ───────────────────────────────────────────────────────────────────

  getUser() {
    try {
      const u = localStorage.getItem('mozaic_user');
      if (u) return JSON.parse(u);
    } catch { /* ignore */ }
    // Default anonymous user
    return { name: 'Vizitator anonim', isAnon: true, isRegistered: false };
  },

  setUser(user) {
    localStorage.setItem('mozaic_user', JSON.stringify(user));
  },

  // ── Streak ─────────────────────────────────────────────────────────────────

  getStreak() {
    try {
      const s = localStorage.getItem('mozaic_streak');
      if (s) return JSON.parse(s);
    } catch { /* ignore */ }
    return { count: 0, lastDate: null };
  },

  setStreak(streak) {
    localStorage.setItem('mozaic_streak', JSON.stringify(streak));
  },

  // ── Achievements ───────────────────────────────────────────────────────────

  getAchievements() {
    try {
      return JSON.parse(localStorage.getItem('mozaic_achievements') || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Add an achievement if not already earned.
   * @returns {boolean} true if newly unlocked
   */
  addAchievement(id) {
    const achievements = this.getAchievements();
    if (!achievements.includes(id)) {
      achievements.push(id);
      localStorage.setItem('mozaic_achievements', JSON.stringify(achievements));
      return true; // newly unlocked
    }
    return false; // already had it
  },

  // ── Daily limit ────────────────────────────────────────────────────────────

  getDaily() {
    try {
      const d = localStorage.getItem('mozaic_daily');
      if (d) return JSON.parse(d);
    } catch { /* ignore */ }
    return { date: null, painted: false };
  },

  setDaily(daily) {
    localStorage.setItem('mozaic_daily', JSON.stringify(daily));
  },

  hasPlantedToday() {
    const daily = this.getDaily();
    const today = new Date().toDateString();
    return daily.date === today && daily.painted === true;
  },

  markPaintedToday() {
    const today = new Date().toDateString();
    this.setDaily({ date: today, painted: true });
  },

  // ── Archive ────────────────────────────────────────────────────────────────

  getArchive() {
    try {
      return JSON.parse(localStorage.getItem('mozaic_archive') || '[]');
    } catch {
      return [];
    }
  },

  addToArchive(season) {
    const archive = this.getArchive();
    archive.push(season);
    localStorage.setItem('mozaic_archive', JSON.stringify(archive));
  },

  // ── Rewards ────────────────────────────────────────────────────────────────

  getRewards() {
    try {
      return JSON.parse(localStorage.getItem('mozaic_rewards') || '[]');
    } catch {
      return [];
    }
  },

  addReward(reward) {
    const rewards = this.getRewards();
    rewards.push(reward);
    localStorage.setItem('mozaic_rewards', JSON.stringify(rewards));
  },

  // ── Leaderboard ────────────────────────────────────────────────────────────

  getLeaderboard() {
    try {
      const stored = localStorage.getItem('mozaic_leaderboard');
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    // Default mock data
    return [
      { name: 'Familia Popa',     tiles: 12, pieces: 1, streak: 7, stars: 1 },
      { name: 'Familia Ionescu',  tiles: 9,  pieces: 0, streak: 5, stars: 0 },
      { name: 'Familia Moldovan', tiles: 8,  pieces: 1, streak: 8, stars: 0 },
      { name: 'Familia Mureșan',  tiles: 6,  pieces: 0, streak: 3, stars: 1 },
      { name: 'Vizitator anonim', tiles: 4,  pieces: 0, streak: 0, stars: 0 },
      { name: 'Tu (test)',        tiles: 0,  pieces: 0, streak: 0, stars: 0 }
    ];
  },

  setLeaderboard(data) {
    localStorage.setItem('mozaic_leaderboard', JSON.stringify(data));
  },

  // ── Language ───────────────────────────────────────────────────────────────

  getLang() {
    return localStorage.getItem('mozaic_lang') || 'ro';
  },

  setLang(lang) {
    localStorage.setItem('mozaic_lang', lang);
  },

  // ── Tutorial ───────────────────────────────────────────────────────────────

  isTutorialDone() {
    return localStorage.getItem('mozaic_tutorial_done') === 'true';
  },

  setTutorialDone() {
    localStorage.setItem('mozaic_tutorial_done', 'true');
  },

  // ── Reset ──────────────────────────────────────────────────────────────────

  resetAll() {
    const keys = [
      'mozaic_tiles', 'mozaic_season', 'mozaic_user', 'mozaic_streak',
      'mozaic_achievements', 'mozaic_leaderboard', 'mozaic_daily',
      'mozaic_archive', 'mozaic_rewards', 'mozaic_lang', 'mozaic_tutorial_done'
    ];
    keys.forEach(k => localStorage.removeItem(k));
  }
};
