import { supabase } from "./supabase.js";

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#tree")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const g = svg.append("g");

svg.call(
  d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
  })
);

let currentNodes = [];
let currentLinks = [];

async function loadData() {
  const { data: families } = await supabase
    .from("families")
    .select("id, slug, display_name, visibility");

  const { data: linksRaw } = await supabase
    .from("v_family_connections")
    .select("*");

  currentNodes = (families || []).map(f => ({
    id: f.slug,
    name: f.display_name,
    visibility: f.visibility
  }));

  currentLinks = (linksRaw || []).map(l => ({
    source: l.source,
    target: l.target
  }));

  render();
}

function render() {
  g.selectAll("*").remove();

  const simulation = d3.forceSimulation(currentNodes)
    .force("link", d3.forceLink(currentLinks).id(d => d.id).distance(140))
    .force("charge", d3.forceManyBody().strength(-350))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = g.selectAll(".link")
    .data(currentLinks)
    .enter()
    .append("line")
    .attr("class", "link");

  const node = g.selectAll(".node")
    .data(currentNodes)
    .enter()
    .append("g")
    .attr("class", d => "node " + d.visibility)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
    );

  node.append("circle")
    .attr("r", 20);

  node.append("text")
    .text(d => d.name)
    .attr("x", 25)
    .attr("y", 5);

  node.on("click", (event, d) => {
    if (d.visibility === "private") {
      alert("Privat");
    } else {
      window.location.href = `familie.html?slug=${d.id}`;
    }
  });

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  autoFocus(node);
}

function autoFocus(nodeSelection) {
  const selected = localStorage.getItem("selectedFamily");
  if (!selected) return;

  setTimeout(() => {
    const node = nodeSelection.filter(d => d.id === selected);

    if (!node.empty()) {
      node.select("circle")
        .attr("stroke", "gold")
        .attr("stroke-width", 5);

      const d = node.datum();

      const transform = d3.zoomIdentity
        .translate(width / 2 - d.x, height / 2 - d.y)
        .scale(1.2);

      svg.transition().duration(800).call(
        d3.zoom().transform,
        transform
      );
    }

    localStorage.removeItem("selectedFamily");
  }, 800);
}

// AUTO REFRESH
setInterval(loadData, 5000);

loadData();

function dragstarted(event, d) {
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  d.fx = null;
  d.fy = null;
}
