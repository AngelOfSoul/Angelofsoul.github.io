import {Storage} from './storage.js';import {update} from './progress.js';import {show} from './feedback.js';import {t} from './i18n.js';
const SIZE=100;
export function initGrid(){
const c=document.getElementById('grid');
let data=Storage.get(); if(data.length!==SIZE)data=new Array(SIZE).fill(false);
function render(){
c.innerHTML='';
data.forEach((f,i)=>{
let el=document.createElement('div');
el.className='tile'+(f?' filled':'');
el.onclick=()=>{if(f)return;data[i]=true;Storage.set(data);show(t('tile'));render();};
c.appendChild(el);
});
let filled=data.filter(x=>x).length;
update(filled,SIZE);
}
render();
}