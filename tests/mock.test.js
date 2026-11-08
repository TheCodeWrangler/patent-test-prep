global.PD = require("../src/practice/dates.js");
global.TREES = require("../src/practice/trees.js");
global.DRILLS = require("../src/practice/drills.js");
const MOCK = require("../src/practice/mock.js");
const assert = require("assert");
let n = 0;
// every tree has an exam stem; every scenario and sorter item becomes a valid question
for (const t of TREES) {
  assert.ok(MOCK.ASK[t.id], "no exam stem for tree " + t.id);
  for (const s of t.scenarios) { check(MOCK._treeQ(t, s)); }
  for (const it of t.sorter || []) { check(MOCK._sorterQ(t, it)); }
}
function check(q) {
  assert.strictEqual(q.choices.filter(c => c.correct).length, 1, "one correct: " + q.facts);
  assert.strictEqual(new Set(q.choices.map(c => c.label)).size, q.choices.length, "unique labels: " + q.facts);
  assert.ok(q.choices.length >= 2 && q.facts && q.prompt && q.explain && q.cite && q.cat && q.coach);
  if (q.coach.kind === "tree") {
    assert.ok(q.coach.steps.length >= 1);
    // every wrong choice is explained by a step
    q.choices.filter(c => !c.correct).forEach(c => assert.ok(q.coach.wrong[c.label], "unexplained wrong choice '" + c.label + "' in " + q.cat));
  }
  n++;
}
// full sessions: the right size, no repeated fact pattern, sensible mix
for (let i = 0; i < 200; i++) {
  const qs = MOCK.build(50);
  assert.strictEqual(qs.length, 50);
  qs.forEach(check);
  const facts = qs.filter(q => !q.cat.startsWith("Deadlines")).map(q => q.facts);
  assert.strictEqual(new Set(facts).size, facts.length, "repeat within an exam");
  assert.ok(qs.every(q => q.choices.length >= 3), "every exam question has 3+ choices");
}
console.log("mock: " + n + " questions checked");
