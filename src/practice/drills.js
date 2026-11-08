// Deadline drills: endless randomized questions with worked answers.
// Every rule is from the MPEP section cited on the question.
var DRILLS = (function (PD) {
  var A = PD.addMonths, R = PD.roll, F = PD.fmt;
  var KINDS = [
    { id: "oa",      label: "Office action reply", cite: "MPEP 710.01(a), 710.02(e), 710.05" },
    { id: "ext",     label: "Extension fees",      cite: "37 CFR 1.136(a); MPEP 710.02(e)" },
    { id: "abandon", label: "Abandonment date",    cite: "MPEP 711.04(a)" },
    { id: "final",   label: "Final + advisory",    cite: "MPEP 706.07(f)" },
    { id: "maint",   label: "Maintenance fees",    cite: "37 CFR 1.362; MPEP 2506" },
    { id: "issue",   label: "Issue fee",           cite: "37 CFR 1.311(a); MPEP 1306" },
    { id: "appeal",  label: "Appeal brief",        cite: "37 CFR 41.37(a); MPEP 1205.01" },
    { id: "prov",    label: "Provisional → nonprovisional", cite: "35 U.S.C. 119(e); 37 CFR 1.7(b)" },
  ];

  // ---- randomness helpers -------------------------------------------------
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Random date; a quarter of the time near month-end, where short months bite.
  function randDate(y0, y1) {
    var y = ri(y0, y1), m = ri(1, 12), dm = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return PD.d(y, m, Math.random() < .25 ? ri(28, dm) : ri(1, 28));
  }
  // The Office mails on business days; filings (e.g. electronic) can be any day.
  function mailDate(y0, y1) { return R(randDate(y0, y1)).date; }
  // Prefer base dates whose deadline lands on a closed day or a short month,
  // because those are the cases the exam is built around.
  function interesting(gen, deadlineOf, p) {
    var best = gen();
    for (var i = 0; i < 40; i++) {
      var c = gen(), dl = deadlineOf(c);
      var tricky = PD.closedReason(dl) || dl.getUTCDate() !== c.getUTCDate();
      if (tricky) { best = c; if (Math.random() < p) return c; }
    }
    return Math.random() < p ? best : gen();
  }
  function dateChoices(correct, wrongs) {
    var seen = {}, out = [{ label: F(correct), correct: true }];
    seen[F(correct)] = 1;
    wrongs.forEach(function (w) { if (w && !seen[F(w)] && out.length < 4) { seen[F(w)] = 1; out.push({ label: F(w), correct: false }); } });
    var k = 1; while (out.length < 4) { var x = PD.addDays(correct, k % 2 ? k : -k); if (!seen[F(x)]) { seen[F(x)] = 1; out.push({ label: F(x), correct: false }); } k++; }
    return shuffle(out);
  }
  function li(items) { return "<ol>" + items.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol>"; }
  function monthsChoice(n, max, tooLateLabel) {
    var out = [];
    for (var i = 0; i <= max; i++) out.push({ label: i === 0 ? "No extension needed" : i + "-month extension", correct: n === i });
    out.push({ label: tooLateLabel || "Too late: abandoned", correct: n === -1 });
    return out;
  }
  // Smallest n (0..max) with filed <= roll(base + months(start+n)); -1 if none.
  function monthsNeeded(base, start, max, filed, steps) {
    for (var n = 0; n <= max; n++) {
      var raw = A(base, start + n), last = R(raw).date;
      steps && steps.push((n === 0 ? "Without an extension, the period ends " : "With a " + n + "-month extension, it ends ") + F(raw) +
        (PD.same(raw, last) ? "" : " → rolled to " + F(last) + " (office closed)") + ".");
      if (PD.cmp(filed, last) <= 0) return n;
    }
    return -1;
  }

  // MPEP 706.07(f): which date the extension clock runs from after a final rejection.
  // Returns {base, start, early, after3}: extensions end at base + (start + n) months.
  function finalClock(M, first, adv) {
    var early = PD.cmp(first, A(M, 2)) <= 0, after3 = PD.cmp(adv, A(M, 3)) > 0;
    return early && after3 ? { base: adv, start: 0, early: early, after3: after3 } : { base: M, start: 3, early: early, after3: after3 };
  }

  // ---- generators ---------------------------------------------------------
  var G = {};

  G.oa = function () {
    var mail = interesting(function () { return mailDate(2024, 2028); }, function (m) { return A(m, 3); }, .7);
    var raw = A(mail, 3), rn = PD.rollNote(raw);
    return {
      kind: "oa",
      facts: "A non-final Office action is mailed on <b>" + PD.fmtLong(mail) + "</b>, setting a 3-month shortened statutory period for reply.",
      prompt: "What is the last day to file a reply <b>without</b> paying an extension fee?",
      choices: dateChoices(rn.date, [raw, PD.addDays(raw, -1), PD.addDays(rn.date, 1), A(mail, 2), PD.d(raw.getUTCFullYear(), raw.getUTCMonth() + 1, new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth() + 1, 0)).getUTCDate())]),
      explain: li([
        "Count 3 months to the <b>corresponding day</b>: " + F(raw) + (raw.getUTCDate() !== mail.getUTCDate() ? " (that month has no day " + mail.getUTCDate() + ", so it ends on the last day of the month)" : "") + ".",
        rn.text,
      ]),
      cite: "MPEP 710.01(a) (counting months); 35 U.S.C. 21(b), 37 CFR 1.7, MPEP 710.05 (weekends and holidays)",
    };
  };

  G.ext = function () {
    var mail = mailDate(2024, 2028);
    var lo = A(mail, 3), hi = A(mail, 6);
    var span = (hi - lo) / PD.DAY;
    var filed = PD.addDays(lo, ri(-12, Math.round(span) + 10));
    var steps = [], n = monthsNeeded(mail, 3, 3, filed, steps);
    var verdict = n === -1
      ? "The reply came after the 6-month statutory limit, so no extension can save it: the application is abandoned (a petition to revive would be needed)."
      : n === 0 ? "The reply is within the shortened period, so no extension is needed."
      : "Applicant needs a <b>" + n + "-month</b> extension under 37 CFR 1.136(a), with its fee. It can be filed with the reply, even after the period ended.";
    return {
      kind: "ext",
      facts: "A non-final Office action mailed <b>" + PD.fmtLong(mail) + "</b> sets a 3-month shortened statutory period. Applicant files a reply on <b>" + PD.fmtLong(filed) + "</b>.",
      prompt: "What does applicant need for the reply to be timely?",
      choices: monthsChoice(n, 3),
      explain: li(steps.concat([
        "Extensions run from the <b>original</b> date, never from a weekend-shifted one, and can't go past 6 months from the mailing date (35 U.S.C. 133).",
        verdict,
      ])),
      cite: "37 CFR 1.136(a); MPEP 710.01(a), 710.02(e); 35 U.S.C. 133",
    };
  };

  G.abandon = function () {
    var mail = interesting(function () { return mailDate(2024, 2028); }, function (m) { return A(m, 3); }, .75);
    var raw = A(mail, 3), rn = PD.rollNote(raw), ab = PD.addDays(rn.date, 1);
    return {
      kind: "abandon",
      facts: "A non-final Office action is mailed on <b>" + PD.fmtLong(mail) + "</b> with a 3-month shortened statutory period. Applicant never replies and never requests an extension.",
      prompt: "What is the <b>date of abandonment</b>?",
      choices: dateChoices(ab, [rn.date, PD.addDays(raw, 1), raw, PD.addDays(A(mail, 6), 1)]),
      explain: li([
        "The period ends on " + F(raw) + ".",
        rn.text,
        "Abandonment happens <b>after midnight</b> of the last day of the period, so the date of abandonment is the next day: <b>" + F(ab) + "</b>. It doesn't matter if that day is a weekend.",
      ]),
      cite: "MPEP 711.04(a), 710.01(a), 710.05",
    };
  };

  G.final = function () {
    var M = mailDate(2024, 2027);
    var two = A(M, 2), three = A(M, 3), six = R(A(M, 6)).date;
    var early = Math.random() < .7;
    var first = early ? PD.addDays(M, ri(20, Math.round((two - M) / PD.DAY) - 5)) : PD.addDays(two, ri(5, 20));
    var after3 = early && Math.random() < .6;
    var adv = after3 ? PD.addDays(three, ri(3, 50)) : PD.addDays(first, ri(10, Math.max(12, Math.round((three - first) / PD.DAY) - 2)));
    if (PD.cmp(adv, three) > 0 && !after3) adv = PD.addDays(three, -2);
    adv = R(adv).date;
    var steps = [], clk = finalClock(M, first, adv), base = clk.base, start = clk.start;
    early = clk.early; after3 = clk.after3;
    var lastRaw = A(base, start), last = R(lastRaw).date;
    // the further reply (RCE, notice of appeal, or amendment)
    var lo = PD.addDays(last, -10), maxDays = Math.round((six - lo) / PD.DAY);
    var filed = PD.addDays(lo, ri(0, maxDays + 8));
    var n = monthsNeeded(base, start, 3, filed, steps);
    if (n !== -1 && PD.cmp(filed, six) > 0) n = -1;
    var rule = early && after3
      ? "The first reply came within 2 months <b>and</b> the advisory action was mailed after the 3-month date, so the shortened period expires on the advisory action's mailing date (" + F(adv) + "), and extension fees are counted <b>from that date</b>."
      : early
        ? "The first reply came within 2 months, but the advisory action was mailed <b>before</b> the 3-month date, so the period simply ends 3 months from the final rejection; extensions count from the final rejection's date."
        : "The first reply came <b>more than</b> 2 months after the final rejection, so the 2-month rule doesn't help: the period ends 3 months from the final rejection.";
    return {
      kind: "final",
      facts: "A final rejection is mailed <b>" + PD.fmtLong(M) + "</b> with a 3-month shortened statutory period. Applicant files a first reply on <b>" + PD.fmtLong(first) + "</b>. The examiner mails an advisory action on <b>" + PD.fmtLong(adv) + "</b>. Applicant then files a request for continued examination on <b>" + PD.fmtLong(filed) + "</b>.",
      prompt: "How many months of extension fees are due for the RCE to be timely?",
      choices: monthsChoice(n, 3),
      explain: li([rule].concat(steps, [
        "Hard stop: nothing can be filed after 6 months from the final rejection (" + F(six) + ", after any weekend roll).",
        n === -1 ? "This filing is too late. The application is abandoned." : n === 0 ? "No extension fee is due." : "A <b>" + n + "-month</b> extension fee is due.",
      ])),
      cite: "MPEP 706.07(f); 37 CFR 1.136(a)",
    };
  };

  G.maint = function () {
    var G0 = randDate(2008, 2022);
    while (G0.getUTCDay() !== 2) G0 = PD.addDays(G0, 1); // patents issue on Tuesdays
    var which = ri(1, 3), yrs = [3, 7, 11][which - 1];
    var open = A(G0, 12 * yrs), endRaw = A(G0, 12 * yrs + 6), end = R(endRaw).date;
    var graceRaw = A(G0, 12 * (yrs + 1)), grace = R(graceRaw).date;
    var t = pick(["early", "window", "windowEdge", "grace", "graceEdge", "late"]), pay;
    if (t === "early") pay = PD.addDays(open, -ri(3, 60));
    else if (t === "window") pay = PD.addDays(open, ri(0, 170));
    else if (t === "windowEdge") pay = Math.random() < .5 ? end : PD.addDays(end, 1);
    else if (t === "grace") pay = PD.addDays(end, ri(2, 170));
    else if (t === "graceEdge") pay = Math.random() < .5 ? grace : PD.addDays(grace, 1);
    else pay = PD.addDays(grace, ri(2, 60));
    var ans = PD.cmp(pay, open) < 0 ? 0 : PD.cmp(pay, end) <= 0 ? 1 : PD.cmp(pay, grace) <= 0 ? 2 : 3;
    var labels = ["Too early: it can't be paid yet", "On time, no surcharge", "Late, but OK with the surcharge", "Too late: the patent has expired"];
    var ord = ["1st", "2nd", "3rd"][which - 1];
    return {
      kind: "maint",
      facts: "A utility patent issued on <b>" + PD.fmtLong(G0) + "</b>. The owner tries to pay the <b>" + ord + " maintenance fee</b> on <b>" + PD.fmtLong(pay) + "</b>.",
      prompt: "What happens?",
      choices: labels.map(function (l, i) { return { label: l, correct: i === ans }; }),
      explain: li([
        "The " + ord + " fee window opens " + yrs + " years after issue: " + F(open) + ". It can't be paid before that (fees can't be paid in advance).",
        "No-surcharge window ends " + yrs + "½ years after issue: " + F(endRaw) + (PD.same(endRaw, end) ? "" : " → " + F(end) + " (office closed)") + ".",
        "The 6-month grace period, with surcharge, runs through the " + (yrs + 1) + "th anniversary: " + F(graceRaw) + (PD.same(graceRaw, grace) ? "" : " → " + F(grace) + " (office closed)") + ". Unpaid after that, the patent expires.",
        "Paid " + F(pay) + ": <b>" + labels[ans] + "</b>.",
      ]),
      cite: "35 U.S.C. 41(b); 37 CFR 1.362(d)–(e); MPEP 2506",
    };
  };

  G.issue = function () {
    var N = interesting(function () { return mailDate(2024, 2028); }, function (m) { return A(m, 3); }, .6);
    var raw = A(N, 3), rn = PD.rollNote(raw);
    var trap = A(N, 6);
    var ch = dateChoices(rn.date, [raw, A(N, 2), PD.addDays(rn.date, 1)]);
    ch = ch.filter(function (c) { return c.correct; }).concat(ch.filter(function (c) { return !c.correct; }).slice(0, 2));
    ch.push({ label: F(trap) + ", with extension fees", correct: false });
    return {
      kind: "issue",
      facts: "A Notice of Allowance and Fee(s) Due is mailed on <b>" + PD.fmtLong(N) + "</b>.",
      prompt: "What is the last day to pay the issue fee (and any publication fee)?",
      choices: shuffle(ch),
      explain: li([
        "The issue fee is due <b>3 months</b> from the notice's date: " + F(raw) + ".",
        rn.text,
        "This 3-month period is <b>not extendable</b>, so the extension-fee option is a trap. Miss it and the application is abandoned.",
      ]),
      cite: "37 CFR 1.311(a); MPEP 1306",
    };
  };

  G.appeal = function () {
    var P = randDate(2024, 2028);
    var filed = PD.addDays(A(P, 2), ri(-15, 95));
    var steps = [], n = monthsNeeded(P, 2, 3, filed, steps);
    if (n === -1) { filed = PD.addDays(A(P, 2), ri(-15, 60)); steps = []; n = monthsNeeded(P, 2, 3, filed, steps); }
    return {
      kind: "appeal",
      facts: "Applicant files a notice of appeal on <b>" + PD.fmtLong(P) + "</b> and files the appeal brief on <b>" + PD.fmtLong(filed) + "</b>.",
      prompt: "What extension, if any, is needed for the brief?",
      choices: monthsChoice(n, 3, "Not allowed: briefs can't be extended"),
      explain: li(["The brief is due <b>2 months from the notice of appeal</b>, not from the final rejection."].concat(steps, [
        "That 2-month period is extendable under 37 CFR 1.136(a), even if the brief is still within 3 months of the final rejection.",
        n === 0 ? "No extension needed." : "A <b>" + n + "-month</b> extension is needed.",
      ])),
      cite: "37 CFR 41.37(a); MPEP 1205.01",
    };
  };

  G.prov = function () {
    var P = interesting(function () { return randDate(2024, 2028); }, function (m) { return A(m, 12); }, .7);
    var raw = A(P, 12), rn = PD.rollNote(raw);
    return {
      kind: "prov",
      facts: "A provisional application is filed on <b>" + PD.fmtLong(P) + "</b>.",
      prompt: "What is the last day to file a nonprovisional that claims its benefit (no petition to restore)?",
      choices: dateChoices(rn.date, [raw, PD.addDays(raw, -1), A(P, 14), PD.addDays(rn.date, 1)]),
      explain: li([
        "The nonprovisional must be filed within <b>12 months</b> of the provisional: " + F(raw) + ".",
        rn.text + " 37 CFR 1.7(b) extends the provisional's pendency to that day.",
        "A petition to restore the benefit claim can stretch this to 14 months if the delay was unintentional, but that's a separate remedy.",
      ]),
      cite: "35 U.S.C. 119(e); 37 CFR 1.7(b), 1.78; MPEP 211.01(a)",
    };
  };

  function make(kind) {
    var k = kind && G[kind] ? kind : pick(KINDS).id;
    var q = G[k]();
    q.label = KINDS.filter(function (x) { return x.id === k; })[0].label;
    return q;
  }
  return { KINDS: KINDS, make: make, _G: G, _monthsNeeded: monthsNeeded, _finalClock: finalClock };
})(PD);
if (typeof module !== "undefined") module.exports = DRILLS;
