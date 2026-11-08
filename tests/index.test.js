const M = require("../src/practice/mpep-index.js");
const assert = require("assert");
const chOf = s => { const n = s.match(/^\d+/)[0]; return n.length === 3 ? "0" + n[0] + "00" : n.slice(0, 2) + "00"; };
let n = 0;
for (const [sec, title] of M.sections) { assert.ok(M.chapters[chOf(sec)], "no chapter for " + sec); assert.ok(title.length >= 12); n++; }
assert.strictEqual(new Set(M.sections.map(s => s[1].toLowerCase())).size, M.sections.length, "titles must be unique");
for (const [q, sec, title] of M.situations) { assert.ok(q && title && M.chapters[chOf(sec)], sec); n++; }
assert.strictEqual(Object.keys(M.chapters).length, 29);
console.log("index: " + M.sections.length + " sections, " + M.situations.length + " situations, " + n + " checks passed");
