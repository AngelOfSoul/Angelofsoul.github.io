function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

export const Streak = {
  update() {
    const today = toDateStr(new Date());
    const prev = this.get();
    let { count, lastDate } = prev;

    if (lastDate === today) return;

    const prevCount = count;
    if (lastDate === yesterday()) {
      count += 1;
    } else {
      count = 1;
    }
    lastDate = today;

    localStorage.setItem('streak_count', String(count));
    localStorage.setItem('streak_last_date', lastDate);

    if (count !== prevCount) {
      document.dispatchEvent(new CustomEvent('mosaic:streakUpdate', {
        detail: { count }
      }));
    }
  },

  get() {
    const count = parseInt(localStorage.getItem('streak_count') || '0', 10);
    const lastDate = localStorage.getItem('streak_last_date') || '';
    return { count, lastDate };
  },

  reset() {
    localStorage.removeItem('streak_count');
    localStorage.removeItem('streak_last_date');
  }
};
