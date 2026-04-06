
/* SAFE TREE UI */
document.addEventListener("mouseover",e=>{
if(e.target.classList.contains("tree-node")){
e.target.classList.add("active-line");
}
});

document.addEventListener("mouseout",e=>{
if(e.target.classList.contains("tree-node")){
e.target.classList.remove("active-line");
}
});
