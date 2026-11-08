// Checks the date engine against the MPEP's own worked examples.
const PD = require("../src/practice/dates.js");
const assert = require("assert");
const D = (y, m, d) => PD.d(y, m, d), f = PD.fmt;
let n = 0; const eq = (a, b, msg) => { assert.strictEqual(f(a), f(b), msg); n++; };

// MPEP 710.01(a): Nov 30 + 3 months -> Feb 28 (29 in leap year); Feb 28 -> May 28, not May 31
eq(PD.addMonths(D(2022, 11, 30), 3), D(2023, 2, 28), "Nov 30 -> Feb 28");
eq(PD.addMonths(D(2023, 11, 30), 3), D(2024, 2, 29), "Nov 30 -> Feb 29 leap");
eq(PD.addMonths(D(2023, 2, 28), 3), D(2023, 5, 28), "Feb 28 -> May 28");
// Jan 31 + 3 -> Apr 30; 1-month extension -> May 31 (computed from the Office action date)
eq(PD.addMonths(D(2023, 1, 31), 3), D(2023, 4, 30), "Jan 31 -> Apr 30");
eq(PD.addMonths(D(2023, 1, 31), 4), D(2023, 5, 31), "Jan 31 +1 ext -> May 31");

// MPEP 711.04(a) abandonment examples (abandonment = day after the rolled last day)
const abandon = (mail) => PD.addDays(PD.roll(PD.addMonths(mail, 3)).date, 1);
eq(abandon(D(2019, 5, 15)), D(2019, 8, 16), "ex 1");
eq(abandon(D(2019, 5, 16)), D(2019, 8, 17), "ex 2 (Sat abandonment is fine)");
eq(abandon(D(2019, 5, 17)), D(2019, 8, 20), "ex 3 Sat -> Mon, abandon Tue");
eq(abandon(D(2019, 5, 31)), D(2019, 9, 4), "ex 4 Sat + Labor Day -> Tue, abandon Wed");

// Holidays incl. observed rules and Inauguration Day
assert.strictEqual(PD.holiday(D(2021, 12, 31)), "New Year's Day (observed)"); n++; // Jan 1 2022 = Sat
assert.strictEqual(PD.holiday(D(2023, 1, 2)), "New Year's Day (observed)"); n++;   // Jan 1 2023 = Sun
assert.strictEqual(PD.holiday(D(2026, 7, 3)), "Independence Day (observed)"); n++; // Jul 4 2026 = Sat
assert.ok(PD.holiday(D(2025, 1, 20))); n++;                                       // MLK + Inauguration 2025
assert.strictEqual(PD.holiday(D(2033, 1, 20)), "Inauguration Day"); n++;          // Thursday
assert.strictEqual(PD.holiday(D(2024, 11, 28)), "Thanksgiving Day"); n++;
assert.strictEqual(PD.holiday(D(2024, 5, 27)), "Memorial Day"); n++;
assert.strictEqual(PD.holiday(D(2024, 10, 14)), "Columbus Day"); n++;
assert.strictEqual(PD.holiday(D(2024, 6, 19)), "Juneteenth"); n++;
assert.strictEqual(PD.holiday(D(2024, 6, 18)), null); n++;
console.log("dates: " + n + " checks passed");
