/**
 * season.js — Season state management with mock data
 * Manages the active season, countdown timer, and season transitions.
 */

import { Storage } from './storage.js';

const MOCK_SEASON = {
  id: 1,
  name: { ro: 'Sezonul Primăverii', en: 'Spring Season' },
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate:   new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  hiddenImageUrl: null,
  totalTiles: 100,
  totalPieces: 4,
  tilesPerPiece: 25
};

/**
 * Initialise season: load from storage or create mock season.
 * @returns {object} season object
 */
export function initSeason() {
  let season = Storage.getSeason();
  if (!season) {
    season = { ...MOCK_SEASON };
    Storage.setSeason(season);
  }
  return season;
}

/**
 * Return the current season from storage (falling back to mock).
 * @returns {object}
 */
export function getSeason() {
  return Storage.getSeason() || { ...MOCK_SEASON };
}

/**
 * Calculate time remaining until the season ends.
 * @returns {{ days: number, hours: number, minutes: number, seconds: number }}
 */
export function getTimeRemaining() {
  const season = getSeason();
  const end = new Date(season.endDate);
  const now = new Date();
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Returns true if the season is still active and not expired.
 * @returns {boolean}
 */
export function isSeasonActive() {
  const season = getSeason();
  if (season.status !== 'active') return false;
  return new Date() < new Date(season.endDate);
}

/**
 * End the current season, archive it, and dispatch an event.
 * @param {'completed'|'timeout'} reason
 */
export function endSeason(reason) {
  const season = getSeason();
  season.status = reason === 'completed' ? 'completed' : 'timeout';
  season.endedAt = new Date().toISOString();
  season.endReason = reason;
  Storage.setSeason(season);
  Storage.addToArchive({ ...season });
  document.dispatchEvent(new CustomEvent('mozaic:seasonEnd', { detail: { season, reason } }));
}

/**
 * Start a 1-second countdown interval; call onUpdate each tick.
 * Automatically ends the season when time runs out.
 * @param {function} onUpdate  called with { days, hours, minutes, seconds }
 * @returns {number} interval id (for clearInterval)
 */
export function startCountdown(onUpdate) {
  // Call immediately so there's no 1-second blank
  onUpdate(getTimeRemaining());

  const interval = setInterval(() => {
    const remaining = getTimeRemaining();
    onUpdate(remaining);

    if (!isSeasonActive()) {
      clearInterval(interval);
      endSeason('timeout');
    }
  }, 1000);

  return interval;
}
