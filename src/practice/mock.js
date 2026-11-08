// Mock exam: builds a timed, exam-format question set from the trees, sorters and deadline drills.
// Pure data (no DOM), so tests can check every question it can produce.
var MOCK = (function (TREES, DRILLS) {
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // The question stem for each tree's outcome, phrased the way the exam asks it.
  var ASK = {
    aia: "Which version of 35 U.S.C. 102 and 103 governs?",
    p102: "Is the disclosure prior art to the claimed invention?",
    elig: "What is the correct result under 35 U.S.C. 101?",
    dp: "Which statement about double patenting is correct?",
    recap: "What is the proper course of action for the examiner?",
    obv: "Which conclusion is most consistent with the MPEP?",
    s112a: "What is the correct result under 35 U.S.C. 112(a)?",
    mpf: "How should the examiner treat the limitation?",
    ptab: "What is the most likely outcome?",
    conflict: "Which statement is correct under the USPTO Rules of Professional Conduct?",
    ids: "Will the examiner consider the IDS?",
    revive: "What is the proper course of action?",
    filing: "What filing date, if any, is the application entitled to?",
    reexam: "What happens with the reexamination request?",
  };
  var SORT_ASK = {
    elig: "In the eligibility analysis, how should this additional element be treated?",
    obv: "Which KSR rationale best describes this reasoning?",
    conflict: "Under the USPTO Rules of Professional Conduct, this conduct is:",
  };
  var ELIG = ["Helps eligibility (integration or significantly more)", "Doesn't help eligibility"];

  // Correct answer plus up to three distinct wrong ones, shuffled.
  function opts(right, others) {
    var seen = {}, out = [{ label: right, correct: true }]; seen[right] = 1;
    shuffle(others).forEach(function (o) { if (!seen[o] && out.length < 4) { seen[o] = 1; out.push({ label: o, correct: false }); } });
    return shuffle(out);
  }
  function leafOf(t, sc) { var id = t.start; while (t.nodes[id]) id = t.nodes[id].options[sc.path[id]].next; return id; }

  function strip(h) { return String(h).replace(/<[^>]+>/g, ""); }
  // Leaves reachable from a node (or a leaf itself).
  function reach(t, id, acc) {
    acc = acc || {};
    if (t.leaves[id]) { acc[id] = 1; return acc; }
    t.nodes[id].options.forEach(function (o) { reach(t, o.next, acc); });
    return acc;
  }

  // Coaching for a fact pattern: the questions to ask in order, and the step that rules out each wrong answer.
  function treeQ(t, sc) {
    var id = t.start, steps = [], out = {};
    while (t.nodes[id]) {
      var nd = t.nodes[id], k = sc.path[id];
      steps.push({ q: strip(nd.q), a: nd.options[k].label, cite: nd.cite });
      nd.options.forEach(function (o, i) {
        if (i === k) return;
        Object.keys(reach(t, o.next)).forEach(function (lf) { if (!(lf in out)) out[lf] = steps.length; });
      });
      id = nd.options[k].next;
    }
    var leaf = t.leaves[id];
    var titles = Object.keys(t.leaves).map(function (k) { return t.leaves[k].title; });
    var choices = opts(leaf.title, titles);
    var why = {};
    choices.forEach(function (c) {
      if (c.correct) return;
      var lf = Object.keys(t.leaves).filter(function (k) { return t.leaves[k].title === c.label && k in out; })[0];
      if (lf) why[c.label] = "Ruled out at step " + out[lf] + ": " + steps[out[lf] - 1].a.replace(/^./, function (x) { return x.toLowerCase(); }) + ".";
    });
    return { cat: t.title, facts: sc.facts, prompt: ASK[t.id] || "What is the correct result?",
      choices: choices, explain: "<p>" + sc.why + "</p><p>" + leaf.text + "</p>", cite: leaf.cite,
      coach: { kind: "tree", frame: t.title + " (" + t.cite + ")", steps: steps, wrong: why,
               look: t.cite } };
  }
  var SORT_HOW = {
    elig: "Compare the element to the MPEP's lists: what integrates (improvement to computer or technology, particular machine, transformation, particular treatment) versus what doesn't (generic computer, extra-solution activity, field of use).",
    obv: "Ask what the reasoning relies on: an explicit suggestion in the art (G)? A swap of equivalents (B)? A finite list of options (E)? Market pressure (F)? Same technique, similar device (C), or a base that was ready for it (D)? Combining parts that keep their functions (A)?",
    conflict: "Find the specific Part 11 rule. Words like \"shall\" mean required, \"shall not\" means prohibited, and the listed exceptions (\"except that…\", \"may\") are permitted.",
  };
  function sorterQ(t, it) {
    var b = t.sorterCfg ? t.sorterCfg.buckets : ELIG, a = it.a != null ? it.a : it.ok ? 0 : 1;
    return { cat: t.sorterCfg ? t.sorterCfg.title : "Prong Two sorter", facts: it.t, prompt: SORT_ASK[t.id] || "Which applies?",
      choices: opts(b[a], b), explain: "<p>" + it.why + "</p>", cite: it.cite,
      coach: { kind: "sort", how: SORT_HOW[t.id] || "", look: it.cite } };
  }
  function drillQ() {
    var q = DRILLS.make();
    return { cat: "Deadlines: " + q.label, facts: q.facts, prompt: q.prompt, choices: q.choices, explain: q.explain, cite: q.cite,
      coach: { kind: "date", look: q.cite } };
  }

  // The same four moves solve every deadline question.
  var DATE_METHOD = [
    "Find the <b>trigger</b>: what event starts the clock (mailing date, grant, service, priority date)? Ignore dates that don't matter; the exam plants them.",
    "Find the <b>period</b> and whether it's extendable.",
    "Count months to the <b>same day number</b>; if the month is too short, use its last day.",
    "Check whether the end date is a <b>weekend or federal holiday</b>; if so, move to the next business day. But extensions count from the original date, not the rolled one.",
  ];
  // About 55% fact patterns, 30% deadlines, 15% sorter items; no repeats within one exam.
  function build(n) {
    var sc = [], so = [];
    TREES.forEach(function (t) {
      t.scenarios.forEach(function (s) { sc.push([t, s]); });
      if (t.sorterCfg && t.sorterCfg.buckets.length > 2) t.sorter.forEach(function (it) { so.push([t, it]); }); // exam questions have 3+ choices
    });
    sc = shuffle(sc); so = shuffle(so);
    var nt = Math.min(sc.length, Math.round(n * .55)), ns = Math.min(so.length, Math.round(n * .15)), nd = n - nt - ns, out = [];
    for (var i = 0; i < nt; i++) out.push(treeQ(sc[i][0], sc[i][1]));
    for (i = 0; i < ns; i++) out.push(sorterQ(so[i][0], so[i][1]));
    for (i = 0; i < nd; i++) out.push(drillQ());
    return shuffle(out);
  }
  return { build: build, ASK: ASK, _treeQ: treeQ, _sorterQ: sorterQ, DATE_METHOD: DATE_METHOD };
})(TREES, DRILLS);
if (typeof module !== "undefined") module.exports = MOCK;
