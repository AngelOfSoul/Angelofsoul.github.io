import { supabase } from "./supabase.js";

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#tree")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
  }));

const g = svg.append("g");

async function load() {
  const { data: families } = await supabase
    .from("families")
    .select("id, slug, display_name, visibility");

  const { data: linksRaw } = await supabase
    .from("v_family_connections")
    .select("*");

  const nodes = families.map(f => ({
    id: f.slug,
    name: f.display_name,
    visibility: f.visibility
  }));

  const links = linksRaw.map(l => ({
    source: l.source,
    target: l.target
  }));

  draw(nodes, links);
  autoSync(nodes);
}

function draw(nodes, links) {
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = g.selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link");

  const node = g.selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", d => "node " + d.visibility)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
    );

  node.append("circle").attr("r", 20);

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
}

function autoSync(nodes) {
  const selected = localStorage.getItem("selectedFamily");
  if (!selected) return;

  setTimeout(() => {
    d3.selectAll(".node")
      .filter(d => d.id === selected)
      .select("circle")
      .classed("highlight", true);

    localStorage.removeItem("selectedFamily");
  }, 800);
}

function dragstarted(event, d) {
  d.fx = d.x; d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x; d.fy = event.y;
}

function dragended(event, d) {
  d.fx = null; d.fy = null;
}

load();
