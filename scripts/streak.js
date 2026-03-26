/**
 * streak.js — Daily streak tracking system
 * Increments on consecutive days, resets on missed days,
 * fires custom events for milestones and comebacks.
 */

import { Storage } from './storage.js';

/** Milliseconds in one calendar day. */
const MS_PER_DAY = 86_400_000;

export const Streak = {

  /**
   * Return current streak data { count, lastDate }.
   * @returns {{ count: number, lastDate: string|null }}
   */
  get() {
    return Storage.getStreak();
  },

  /**
   * Update the streak for today's activity.
   * - Same day   → no change (already counted)
   * - Yesterday  → increment (consecutive)
   * - First time → count = 1
   * - Gap ≥ 3d   → reset + fire comeback event
   * - Other gap  → reset to 1
   * Dispatches mozaic:streakUpdate and mozaic:streakMilestone on milestones.
   * @returns {{ count: number, lastDate: string }}
   */
  update() {
    const streak    = Storage.getStreak();
    const today     = new Date().toDateString();
    const yesterday = new Date(Date.now() - MS_PER_DAY).toDateString();

    if (streak.lastDate === today) {
      // Already counted today — return unchanged
      return streak;
    }

    if (streak.lastDate === null) {
      // Very first activity ever
      streak.count    = 1;
      streak.lastDate = today;
    } else if (streak.lastDate === yesterday) {
      // Consecutive day — extend the streak
      streak.count++;
      streak.lastDate = today;
    } else {
      // Missed at least one day
      const lastDate   = new Date(streak.lastDate);
      const daysMissed = Math.floor((new Date() - lastDate) / MS_PER_DAY);

      if (daysMissed >= 3) {
        // Comeback achievement trigger
        document.dispatchEvent(new CustomEvent('mozaic:comebackDetected'));
      }
      streak.count    = 1;
      streak.lastDate = today;
    }

    Storage.setStreak(streak);

    // Broadcast update
    document.dispatchEvent(new CustomEvent('mozaic:streakUpdate', {
      detail: { count: streak.count }
    }));

    // Milestone notifications (3, 7, 14, 30 days)
    if ([3, 7, 14, 30].includes(streak.count)) {
      document.dispatchEvent(new CustomEvent('mozaic:streakMilestone', {
        detail: { count: streak.count }
      }));
    }

    return streak;
  },

  /**
   * Reset streak to zero (e.g. for testing).
   */
  reset() {
    Storage.setStreak({ count: 0, lastDate: null });
    document.getElementById('streak-count') && (document.getElementById('streak-count').textContent = '0');
  }
};
