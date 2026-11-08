const PD = require("../src/practice/dates.js");
global.PD = PD;
const DRILLS = require("../src/practice/drills.js");
const assert = require("assert");
let n = 0;
// fuzz: every generator, many times: exactly one correct, unique labels, >= 4 choices, has explanation
for (const k of DRILLS.KINDS) {
  const dist = {};
  for (let i = 0; i < 3000; i++) {
    const q = DRILLS.make(k.id);
    const correct = q.choices.filter(c => c.correct);
    assert.strictEqual(correct.length, 1, k.id + ": exactly one correct\n" + JSON.stringify(q, null, 1));
    assert.strictEqual(new Set(q.choices.map(c => c.label)).size, q.choices.length, k.id + ": unique labels " + JSON.stringify(q.choices));
    assert.ok(q.choices.length >= 4 && q.explain && q.facts && q.cite);
    dist[correct[0].label.replace(/^\w{3}, .*/, "date")] = (dist[correct[0].label.replace(/^\w{3}, .*/, "date")] || 0) + 1;
    n++;
  }
  console.log(k.id.padEnd(8), JSON.stringify(dist));
}
// spot checks of the month logic against MPEP 710.01(a) / 1205.01 examples
const D = PD.d, mn = DRILLS._monthsNeeded;
assert.strictEqual(mn(D(2023,1,31), 3, 3, D(2023,5,31)), 1); n++;   // Jan 31 OA, reply May 31 -> 1 month
assert.strictEqual(mn(D(2023,1,31), 3, 3, D(2023,4,30)), 0); n++;
assert.strictEqual(mn(D(2023,1,31), 3, 3, D(2023,8,1)), -1); n++;  // past Jul 31 (6 months)
// Aug 17 2019 was a Saturday: reply on Mon Aug 19 needs no extension
assert.strictEqual(mn(D(2019,5,17), 3, 3, D(2019,8,19)), 0); n++;
assert.strictEqual(mn(D(2019,5,17), 3, 3, D(2019,8,20)), 1); n++;
console.log("drills: " + n + " checks passed");
// MPEP 706.07(f) worked cases (final mailed Mon Jan 8, 2024; 3-month date Apr 8)
{
  const fc = DRILLS._finalClock, M = D(2024,1,8);
  const months = (first, adv, filed) => { const c = fc(M, first, adv); return mn(c.base, c.start, 3, filed); };
  // first reply within 2 months, advisory AFTER Apr 8 -> period ends on advisory date, fees from it
  assert.strictEqual(months(D(2024,2,20), D(2024,4,15), D(2024,4,15)), 0); n++;
  assert.strictEqual(months(D(2024,2,20), D(2024,4,15), D(2024,5,10)), 1); n++; // May 15 covers it
  // advisory BEFORE Apr 8 -> counts from Jan 8: May 8 (1), Jun 8 is a Saturday -> Jun 10 (2)
  assert.strictEqual(months(D(2024,2,20), D(2024,4,1), D(2024,5,10)), 2); n++;
  // first reply AFTER 2 months -> 2-month rule doesn't apply, even with a late advisory
  assert.strictEqual(months(D(2024,3,20), D(2024,4,15), D(2024,5,10)), 2); n++;
  console.log("final-rejection cases passed; total " + n);
}
// PCT answers are generated only on business days (no weekend rule needed)
for (let i = 0; i < 4000; i++) {
  const q = i % 2 ? DRILLS._G.pct() : DRILLS._G.ptab(); const c = q.choices.find(c => c.correct).label;
  const [, mon, day, yr] = c.match(/^\w{3}, (\w{3}) (\d+), (\d{4})/);
  const d = PD.d(+yr, ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(mon) + 1, +day);
  assert.ok(!PD.closedReason(d), "PCT/PTAB answer on a closed day: " + c); n++;
}
console.log("pct/ptab business-day check passed; total " + n);

// PTAB spot checks: rules applied to fixed dates
{
  const A = PD.addMonths, D = PD.d;
  assert.strictEqual(PD.fmt(A(D(2025,5,13), 9)), PD.fmt(D(2026,2,13))); n++;   // PGR: grant Tue May 13 2025 -> Fri Feb 13 2026
  assert.strictEqual(PD.fmt(PD.addDays(D(2025,3,3), 63)), PD.fmt(D(2025,5,5))); n++; // appeal: 63 days
  for (let i = 0; i < 3000; i++) { const q = DRILLS._G.ptab(); assert.ok(/\d/.test(q.explain) && q.cite.length > 5); n++; }
  console.log("ptab spot checks passed; total " + n);
}
