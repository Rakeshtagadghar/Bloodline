const state = {
  dataset: null,
  errors: [],
  selectedId: null,
  searchQuery: "",
  viewport: { x: -320, y: -70, scale: 1 },
  dragging: null
};

const els = {
  loadValid: document.querySelector("#load-valid"),
  loadInvalid: document.querySelector("#load-invalid"),
  search: document.querySelector("#search"),
  searchResults: document.querySelector("#search-results"),
  datasetStatus: document.querySelector("#dataset-status"),
  viewportReadout: document.querySelector("#viewport-readout"),
  errorPanel: document.querySelector("#error-panel"),
  errorList: document.querySelector("#error-list"),
  treeStage: document.querySelector("#tree-stage"),
  world: document.querySelector("#world"),
  detailsEmpty: document.querySelector("#details-empty"),
  detailsContent: document.querySelector("#details-content"),
  detailName: document.querySelector("#detail-name"),
  detailMeta: document.querySelector("#detail-meta"),
  detailParents: document.querySelector("#detail-parents"),
  detailChildren: document.querySelector("#detail-children"),
  detailPartners: document.querySelector("#detail-partners")
};

function validateDataset(dataset) {
  const issues = [];
  if (!dataset || typeof dataset !== "object") {
    return [{ path: "$", message: "Dataset must be an object" }];
  }
  for (const key of ["meta", "people", "relationships", "ui"]) {
    if (!(key in dataset)) {
      issues.push({ path: key, message: `Missing required field: ${key}` });
    }
  }
  if (!Array.isArray(dataset.people)) {
    issues.push({ path: "people", message: "people must be an array" });
    return issues;
  }
  if (!Array.isArray(dataset.relationships)) {
    issues.push({ path: "relationships", message: "relationships must be an array" });
    return issues;
  }
  const personIds = new Set(dataset.people.map((p) => p.id));
  for (const [index, rel] of dataset.relationships.entries()) {
    if (rel.type === "parent") {
      if (!rel.parentId || !rel.childId) {
        issues.push({ path: `relationships[${index}]`, message: "parent relationship requires parentId and childId" });
      }
      if (rel.parentId && !personIds.has(rel.parentId)) {
        issues.push({ path: `relationships[${index}].parentId`, message: `Unknown person: ${rel.parentId}` });
      }
      if (rel.childId && !personIds.has(rel.childId)) {
        issues.push({ path: `relationships[${index}].childId`, message: `Unknown person: ${rel.childId}` });
      }
    }
    if (rel.type === "partner") {
      if (!rel.from || !rel.to) {
        issues.push({ path: `relationships[${index}]`, message: "partner relationship requires from and to" });
      }
    }
  }
  if (dataset.ui?.defaultRootPersonId && !personIds.has(dataset.ui.defaultRootPersonId)) {
    issues.push({
      path: "ui.defaultRootPersonId",
      message: `Unknown root person: ${dataset.ui.defaultRootPersonId}`
    });
  }
  return issues;
}

function buildGraph(dataset) {
  const people = new Map(dataset.people.map((p) => [p.id, p]));
  const parentsByChild = new Map();
  const childrenByParent = new Map();
  const partnersByPerson = new Map();

  const ensureSet = (map, key) => {
    if (!map.has(key)) {
      map.set(key, new Set());
    }
    return map.get(key);
  };

  for (const personId of people.keys()) {
    ensureSet(parentsByChild, personId);
    ensureSet(childrenByParent, personId);
    ensureSet(partnersByPerson, personId);
  }

  for (const rel of dataset.relationships) {
    if (rel.type === "parent" && rel.parentId && rel.childId) {
      ensureSet(childrenByParent, rel.parentId).add(rel.childId);
      ensureSet(parentsByChild, rel.childId).add(rel.parentId);
    }
    if (rel.type === "partner" && rel.from && rel.to) {
      ensureSet(partnersByPerson, rel.from).add(rel.to);
      ensureSet(partnersByPerson, rel.to).add(rel.from);
    }
  }

  return { people, parentsByChild, childrenByParent, partnersByPerson };
}

function computeLayout(dataset) {
  const graph = buildGraph(dataset);
  const rootId = dataset.ui.defaultRootPersonId;
  const depthById = new Map([[rootId, 0]]);
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift();
    const depth = depthById.get(id) ?? 0;
    for (const partner of [...(graph.partnersByPerson.get(id) ?? [])].sort()) {
      if (!depthById.has(partner)) {
        depthById.set(partner, depth);
        queue.push(partner);
      }
    }
    for (const child of [...(graph.childrenByParent.get(id) ?? [])].sort()) {
      const nextDepth = depth + 1;
      if (!depthById.has(child) || nextDepth < depthById.get(child)) {
        depthById.set(child, nextDepth);
        queue.push(child);
      }
    }
  }

  const levels = new Map();
  for (const [id, depth] of depthById.entries()) {
    const list = levels.get(depth) ?? [];
    list.push(id);
    levels.set(depth, list);
  }
  for (const list of levels.values()) {
    list.sort();
  }

  const nodes = [];
  for (const depth of [...levels.keys()].sort((a, b) => a - b)) {
    const ids = levels.get(depth);
    const startX = -((ids.length - 1) * 220) / 2;
    ids.forEach((id, index) => {
      nodes.push({ id, x: startX + index * 220, y: depth * 160, width: 150, height: 74, depth });
    });
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const rel of dataset.relationships) {
    if (rel.type === "partner" && byId.has(rel.from) && byId.has(rel.to)) {
      const a = byId.get(rel.from);
      const b = byId.get(rel.to);
      if (a.depth === b.depth) {
        const center = (a.x + b.x) / 2;
        a.x = center - 90;
        b.x = center + 90;
      }
    }
  }

  const edges = [];
  for (const rel of dataset.relationships) {
    if (rel.type === "parent" && byId.has(rel.parentId) && byId.has(rel.childId)) {
      edges.push({ from: rel.parentId, to: rel.childId, type: "parent" });
    }
    if (rel.type === "partner" && byId.has(rel.from) && byId.has(rel.to)) {
      edges.push({ from: rel.from, to: rel.to, type: "partner" });
    }
  }

  return { graph, nodes, byId, edges };
}

function computeHighlights(selectedId, graph) {
  if (!selectedId) {
    return { related: new Set(), direct: new Set() };
  }
  const related = new Set();
  const direct = new Set();
  const walk = (getNext) => {
    const queue = [...(getNext(selectedId) ?? [])];
    while (queue.length) {
      const id = queue.shift();
      if (!id || related.has(id)) continue;
      related.add(id);
      for (const next of getNext(id) ?? []) queue.push(next);
    }
  };
  for (const id of graph.parentsByChild.get(selectedId) ?? []) direct.add(id);
  for (const id of graph.childrenByParent.get(selectedId) ?? []) direct.add(id);
  for (const id of graph.partnersByPerson.get(selectedId) ?? []) direct.add(id);
  walk((id) => graph.parentsByChild.get(id));
  walk((id) => graph.childrenByParent.get(id));
  for (const id of direct) related.add(id);
  return { related, direct };
}

function updateViewportReadout() {
  els.viewportReadout.textContent = `x:${state.viewport.x.toFixed(0)} y:${state.viewport.y.toFixed(0)} z:${state.viewport.scale.toFixed(2)}`;
}

function applyWorldTransform() {
  els.world.style.transform = `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.scale})`;
  updateViewportReadout();
}

function centerOnNode(node) {
  const rect = els.treeStage.getBoundingClientRect();
  state.viewport.x = rect.width / 2 - node.x * state.viewport.scale;
  state.viewport.y = rect.height / 2 - node.y * state.viewport.scale;
  applyWorldTransform();
}

function setSelectedPerson(personId, { center = false } = {}) {
  state.selectedId = personId;
  const layout = state.layout;
  if (!layout) return;
  if (center) {
    const node = layout.byId.get(personId);
    if (node) centerOnNode(node);
  }
  render();
}

function renderDetails() {
  if (!state.dataset || !state.selectedId) {
    els.detailsEmpty.hidden = false;
    els.detailsContent.hidden = true;
    return;
  }
  const layout = state.layout;
  const person = layout.graph.people.get(state.selectedId);
  if (!person) return;
  const parents = [...(layout.graph.parentsByChild.get(person.id) ?? [])]
    .map((id) => layout.graph.people.get(id)?.name ?? id)
    .sort();
  const children = [...(layout.graph.childrenByParent.get(person.id) ?? [])]
    .map((id) => layout.graph.people.get(id)?.name ?? id)
    .sort();
  const partners = [...(layout.graph.partnersByPerson.get(person.id) ?? [])]
    .map((id) => layout.graph.people.get(id)?.name ?? id)
    .sort();

  els.detailsEmpty.hidden = true;
  els.detailsContent.hidden = false;
  els.detailName.textContent = person.name;
  els.detailMeta.textContent = person.display?.styleTitle ?? "No title recorded";

  const fillList = (el, values) => {
    el.innerHTML = "";
    if (values.length === 0) {
      const li = document.createElement("li");
      li.textContent = "None";
      el.append(li);
      return;
    }
    for (const value of values) {
      const li = document.createElement("li");
      li.textContent = value;
      el.append(li);
    }
  };
  fillList(els.detailParents, parents);
  fillList(els.detailChildren, children);
  fillList(els.detailPartners, partners);
}

function renderSearchResults() {
  els.searchResults.innerHTML = "";
  if (!state.dataset || !state.searchQuery.trim()) {
    return;
  }
  const query = state.searchQuery.trim().toLowerCase();
  const matches = state.dataset.people
    .filter((person) => person.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 6);

  for (const person of matches) {
    const pill = document.createElement("div");
    pill.className = "search-pill";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = person.name;
    button.setAttribute("data-testid", `search-result-${person.id}`);
    button.addEventListener("click", () => setSelectedPerson(person.id, { center: true }));
    pill.append(button);
    els.searchResults.append(pill);
  }
}

function renderErrors() {
  const hasErrors = state.errors.length > 0;
  els.errorPanel.hidden = !hasErrors;
  els.errorList.innerHTML = "";
  if (!hasErrors) return;
  for (const issue of state.errors) {
    const li = document.createElement("li");
    li.textContent = `${issue.path}: ${issue.message}`;
    els.errorList.append(li);
  }
}

function renderTree() {
  els.world.innerHTML = "";
  if (!state.layout) {
    return;
  }
  const { nodes, byId, edges, graph } = state.layout;
  const highlights = computeHighlights(state.selectedId, graph);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "edge-layer");
  svg.setAttribute("viewBox", "-1000 -400 2000 1600");
  svg.setAttribute("preserveAspectRatio", "none");

  for (const edge of edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) continue;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("class", `edge ${edge.type}`);
    svg.append(line);
  }

  els.world.append(svg);

  for (const node of nodes) {
    const person = graph.people.get(node.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "node";
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.setAttribute("data-testid", `node-${node.id}`);
    button.setAttribute("aria-label", `Person ${person.name}`);
    button.setAttribute("aria-pressed", String(state.selectedId === node.id));
    if (state.selectedId === node.id) button.classList.add("selected");
    if (state.selectedId && node.id !== state.selectedId && highlights.related.has(node.id)) {
      button.classList.add("highlight");
    }
    if (state.searchQuery.trim()) {
      const matches = person.name.toLowerCase().includes(state.searchQuery.trim().toLowerCase());
      if (!matches) button.classList.add("dimmed");
    }

    const name = document.createElement("span");
    name.className = "node-name";
    name.textContent = person.name;
    const title = document.createElement("span");
    title.className = "node-title";
    title.textContent = person.display?.styleTitle ?? "House Member";
    button.append(name, title);
    button.addEventListener("click", () => setSelectedPerson(node.id));
    els.world.append(button);
  }
}

function render() {
  renderErrors();
  renderSearchResults();
  renderTree();
  renderDetails();
  applyWorldTransform();
}

async function loadDataset(path) {
  const response = await fetch(path, { cache: "no-store" });
  const dataset = await response.json();
  const issues = validateDataset(dataset);
  state.errors = issues;

  if (issues.length > 0) {
    state.dataset = null;
    state.layout = null;
    state.selectedId = null;
    els.datasetStatus.textContent = `Invalid dataset (${issues.length} issue${issues.length === 1 ? "" : "s"})`;
    render();
    return;
  }

  state.dataset = dataset;
  state.layout = computeLayout(dataset);
  state.selectedId = dataset.ui.defaultRootPersonId;
  state.errors = [];
  els.datasetStatus.textContent = `Loaded: ${dataset.meta.displayName}`;
  centerOnNode(state.layout.byId.get(state.selectedId));
  render();
}

els.loadValid.addEventListener("click", () => void loadDataset("/data/family.valid.json"));
els.loadInvalid.addEventListener("click", () => void loadDataset("/data/family.invalid.json"));
els.search.addEventListener("input", (event) => {
  state.searchQuery = event.currentTarget.value;
  render();
});

els.treeStage.addEventListener("pointerdown", (event) => {
  if (event.target !== els.treeStage && event.target !== els.world) {
    return;
  }
  els.treeStage.classList.add("dragging");
  state.dragging = { x: event.clientX, y: event.clientY, vx: state.viewport.x, vy: state.viewport.y };
  els.treeStage.setPointerCapture(event.pointerId);
});

els.treeStage.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  const dx = event.clientX - state.dragging.x;
  const dy = event.clientY - state.dragging.y;
  state.viewport.x = state.dragging.vx + dx;
  state.viewport.y = state.dragging.vy + dy;
  applyWorldTransform();
});

const endDrag = () => {
  state.dragging = null;
  els.treeStage.classList.remove("dragging");
};

els.treeStage.addEventListener("pointerup", endDrag);
els.treeStage.addEventListener("pointercancel", endDrag);

els.treeStage.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const rect = els.treeStage.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const nextScale = Math.min(2.5, Math.max(0.5, state.viewport.scale * (event.deltaY < 0 ? 1.08 : 0.92)));
    const worldX = (mouseX - state.viewport.x) / state.viewport.scale;
    const worldY = (mouseY - state.viewport.y) / state.viewport.scale;
    state.viewport.scale = nextScale;
    state.viewport.x = mouseX - worldX * nextScale;
    state.viewport.y = mouseY - worldY * nextScale;
    applyWorldTransform();
  },
  { passive: false }
);

updateViewportReadout();
void loadDataset("/data/family.valid.json");
