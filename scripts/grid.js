import {Storage} from './storage.js';
import {update} from './progress.js';
import {show} from './feedback.js';
import {t} from './i18n.js';

const SIZE = 100;
let gridTileElements = [];

export function initGrid() {
  const c = document.getElementById('grid');
  let data = Storage.get();
  if (data.length !== SIZE) data = new Array(SIZE).fill(false);

  function render() {
    c.innerHTML = '';
    gridTileElements = [];
    data.forEach((f, i) => {
      const el = document.createElement('div');
      el.className = 'tile' + (f ? ' filled' : '');
      el.dataset.index = i;
      el.onclick = () => {
        if (f) return;
        data[i] = true;
        Storage.set(data);
        show(t('tile'));
        const filled = data.filter(x => x).length;
        document.dispatchEvent(new CustomEvent('mosaic:tileFilled', {
          detail: { index: i, filled, total: SIZE }
        }));
        if (filled === SIZE) {
          render();
          document.dispatchEvent(new CustomEvent('mosaic:gameComplete', {
            detail: { allTiles: [...document.querySelectorAll('.tile')] }
          }));
        } else {
          render();
        }
      };
      c.appendChild(el);
      gridTileElements.push(el);
    });
    const filled = data.filter(x => x).length;
    update(filled, SIZE);
  }

  render();
}

export function resetGrid() {
  const data = new Array(SIZE).fill(false);
  Storage.set(data);
  const c = document.getElementById('grid');
  gridTileElements = [];
  c.innerHTML = '';
  initGrid();
}

export function getTileElements() {
  return [...document.querySelectorAll('.tile')];
}
