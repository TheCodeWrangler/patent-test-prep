const TREES = require("../src/practice/trees.js");
const assert = require("assert");
let n = 0;
for (const t of TREES) {
  // every option points at a real node or leaf; every node and leaf is reachable
  const reach = new Set([t.start]), q = [t.start];
  while (q.length) { const id = q.shift(), nd = t.nodes[id]; if (!nd) continue;
    for (const o of nd.options) { assert.ok(t.nodes[o.next] || t.leaves[o.next], t.id + ": dangling " + o.next); if (!reach.has(o.next)) { reach.add(o.next); q.push(o.next); } } }
  for (const id of [...Object.keys(t.nodes), ...Object.keys(t.leaves)]) assert.ok(reach.has(id), t.id + ": unreachable " + id);
  for (const id in t.nodes) assert.ok(t.nodes[id].cite && t.nodes[id].help, t.id + "." + id + " needs cite/help");
  // every scenario walks cleanly to a leaf using exactly its path entries
  const leaves = {};
  t.scenarios.forEach((s, i) => {
    let id = t.start; const used = [];
    while (t.nodes[id]) { assert.ok(id in s.path, `${t.id} #${i}: no answer for ${id}`); used.push(id); id = t.nodes[id].options[s.path[id]].next; }
    assert.deepStrictEqual(used.sort(), Object.keys(s.path).sort(), `${t.id} #${i}: unused path entries`);
    leaves[id] = (leaves[id] || 0) + 1; n++;
    console.log(`  ${t.id} #${i} -> ${id.padEnd(6)} ${t.leaves[id].title}`);
  });
  console.log(`${t.id}: ${t.scenarios.length} scenarios cover ${Object.keys(leaves).length}/${Object.keys(t.leaves).length} outcomes`);
}
for (const t of TREES) if (t.sorter) {
  const nb = t.sorterCfg ? t.sorterCfg.buckets.length : 2;
  t.sorter.forEach((it, i) => { const a = it.a != null ? it.a : (it.ok ? 0 : 1); assert.ok(Number.isInteger(a) && a >= 0 && a < nb && it.why && it.cite, t.id + " sorter #" + i); });
  if (t.sorterCfg) for (let b = 0; b < nb; b++) assert.ok(t.sorter.some(it => it.a === b), t.id + ": bucket " + b + " has no items");
  console.log(t.id + " sorter: " + t.sorter.length + " items, " + nb + " buckets");
}
console.log("trees: " + n + " scenarios valid");
