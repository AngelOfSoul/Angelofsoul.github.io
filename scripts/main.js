import {initGrid} from './grid.js';import {setLang} from './i18n.js';
document.getElementById('lang-en').onclick=()=>setLang('en');
document.getElementById('lang-ro').onclick=()=>setLang('ro');
initGrid();