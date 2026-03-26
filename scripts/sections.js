const SECTION_INDICES = [
  [0,1,2,3,4, 10,11,12,13,14, 20,21,22,23,24, 30,31,32,33,34, 40,41,42,43,44],
  [5,6,7,8,9, 15,16,17,18,19, 25,26,27,28,29, 35,36,37,38,39, 45,46,47,48,49],
  [50,51,52,53,54, 60,61,62,63,64, 70,71,72,73,74, 80,81,82,83,84, 90,91,92,93,94],
  [55,56,57,58,59, 65,66,67,68,69, 75,76,77,78,79, 85,86,87,88,89, 95,96,97,98,99]
];

export const Sections = {
  getSectionForTile(index) {
    for (let s = 0; s < SECTION_INDICES.length; s++) {
      if (SECTION_INDICES[s].includes(index)) return s;
    }
    return -1;
  },

  isSectionComplete(data, sectionId) {
    return SECTION_INDICES[sectionId].every(i => data[i] === true);
  },

  getCompletedSections(data) {
    return SECTION_INDICES
      .map((_, id) => id)
      .filter(id => this.isSectionComplete(data, id));
  },

  checkAndEmit(data, prevCompleted) {
    const current = this.getCompletedSections(data);
    const newlyCompleted = current.filter(id => !prevCompleted.includes(id));
    newlyCompleted.forEach(sectionId => {
      document.dispatchEvent(new CustomEvent('mosaic:sectionComplete', {
        detail: { sectionId, tiles: SECTION_INDICES[sectionId] }
      }));
    });
    if (newlyCompleted.length > 0) {
      localStorage.setItem('sections', JSON.stringify(current));
    }
    return current;
  },

  loadCompleted() {
    try {
      return JSON.parse(localStorage.getItem('sections') || '[]');
    } catch {
      return [];
    }
  }
};
