// USPTO date arithmetic. All dates are UTC midnight Date objects so time
// zones never shift a day. Rules and citations:
//   - Periods end on the corresponding day of the month; if the month is
//     shorter, the last day of that month (MPEP 710.01(a)).
//   - Extensions run from the ORIGINAL date, not a weekend-shifted one
//     (MPEP 710.01(a): "April 30 may have been a Saturday ... has no effect").
//   - A last day on Saturday, Sunday or a D.C. federal holiday moves to the
//     next business day (35 U.S.C. 21(b), 37 CFR 1.7, MPEP 710.05).
//   - Holidays: 5 U.S.C. 6103(a); Sunday holiday -> Monday also a holiday;
//     Saturday holiday -> preceding Friday (MPEP 710.05); Inauguration Day,
//     Jan 20 every 4 years, Sunday -> Monday (5 U.S.C. 6103(c)).
var PD = (function () {
  var DAY = 864e5;
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function d(y, m, day) { return new Date(Date.UTC(y, m - 1, day)); }
  function dim(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); } // m is 1-based
  function addDays(x, n) { return new Date(x.getTime() + n * DAY); }
  function addMonths(x, n) {
    var y = x.getUTCFullYear(), m = x.getUTCMonth() + 1 + n;
    y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1;
    return d(y, m, Math.min(x.getUTCDate(), dim(y, m)));
  }
  function same(a, b) { return a.getTime() === b.getTime(); }
  function cmp(a, b) { return a.getTime() - b.getTime(); }
  function nthWeekday(y, m, wd, n) { // n-th weekday of month; n = -1 for last
    if (n > 0) { var f = d(y, m, 1); return addDays(f, (wd - f.getUTCDay() + 7) % 7 + 7 * (n - 1)); }
    var l = d(y, m, dim(y, m)); return addDays(l, -((l.getUTCDay() - wd + 7) % 7));
  }

  var cache = {};
  function holidaysOf(y) {
    if (cache[y]) return cache[y];
    var list = [];
    function fixed(m, day, name) {
      var h = d(y, m, day); list.push([h, name]);
      if (h.getUTCDay() === 0) list.push([addDays(h, 1), name + " (observed)"]);
      if (h.getUTCDay() === 6) list.push([addDays(h, -1), name + " (observed)"]);
    }
    fixed(1, 1, "New Year's Day");
    list.push([nthWeekday(y, 1, 1, 3), "Martin Luther King Jr. Day"]);
    list.push([nthWeekday(y, 2, 1, 3), "Washington's Birthday"]);
    list.push([nthWeekday(y, 5, 1, -1), "Memorial Day"]);
    fixed(6, 19, "Juneteenth");
    fixed(7, 4, "Independence Day");
    list.push([nthWeekday(y, 9, 1, 1), "Labor Day"]);
    list.push([nthWeekday(y, 10, 1, 2), "Columbus Day"]);
    fixed(11, 11, "Veterans Day");
    list.push([nthWeekday(y, 11, 4, 4), "Thanksgiving Day"]);
    fixed(12, 25, "Christmas Day");
    if (y % 4 === 1) { var inaug = d(y, 1, 20); list.push([inaug.getUTCDay() === 0 ? addDays(inaug, 1) : inaug, "Inauguration Day"]); }
    return (cache[y] = list);
  }
  function holiday(x) { // name or null; checks next year too (Jan 1 on Saturday -> Dec 31)
    var ys = [x.getUTCFullYear(), x.getUTCFullYear() + 1];
    for (var i = 0; i < ys.length; i++) {
      var l = holidaysOf(ys[i]);
      for (var j = 0; j < l.length; j++) if (same(l[j][0], x)) return l[j][1];
    }
    return null;
  }
  function closedReason(x) {
    var wd = x.getUTCDay();
    if (wd === 0 || wd === 6) return WD[wd];
    return holiday(x);
  }
  // Next business day on or after x, plus the reasons for each skipped day.
  function roll(x) {
    var skipped = [], r = x, why;
    while ((why = closedReason(r))) { skipped.push([r, why]); r = addDays(r, 1); }
    return { date: r, skipped: skipped };
  }
  function fmt(x) { return WD[x.getUTCDay()].slice(0, 3) + ", " + MON[x.getUTCMonth()] + " " + x.getUTCDate() + ", " + x.getUTCFullYear(); }
  function fmtLong(x) { return WD[x.getUTCDay()] + ", " + MON[x.getUTCMonth()] + " " + x.getUTCDate() + ", " + x.getUTCFullYear(); }
  // Explain a roll in words: "Aug 17 is a Saturday, so the last day moves to Mon, Aug 19."
  function rollNote(raw) {
    var r = roll(raw);
    if (!r.skipped.length) return { date: r.date, text: fmt(raw) + " is a business day." };
    var why = r.skipped.map(function (s) { return fmt(s[0]) + " (" + s[1] + ")"; }).join(", ");
    return { date: r.date, text: "The office is closed on " + why + ", so the deadline moves to " + fmt(r.date) + "." };
  }
  return { d: d, addDays: addDays, addMonths: addMonths, same: same, cmp: cmp, holiday: holiday,
           closedReason: closedReason, roll: roll, rollNote: rollNote, fmt: fmt, fmtLong: fmtLong, DAY: DAY };
})();
if (typeof module !== "undefined") module.exports = PD;
