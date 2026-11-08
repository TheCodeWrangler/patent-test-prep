// Coach + mock exam. The coach teaches each topic in stages (learn → worked example → guided →
// exam-style check → spaced review); the mock exam is the timed, exam-format test, optionally coached.
// Uses the app's globals: esc, store, log; and TREES, DRILLS, MOCK, COACH_LESSONS, DATE_FACTS.
var COACHUI = (function () {
  var C = store.get("coach", { t: {}, mock: [] });            // persisted: per-topic stage/review, mock history
  function save() { store.set("coach", C); }
  var S = { view: "home" };                                   // UI state
  var BUDGET = 216;                                           // seconds per question on the real exam (6 h / 100)
  var DAY = 864e5, STAGES = ["Learn", "Worked example", "Guided practice", "Exam-style check", "Mastered"];
  function tree(id) { return TREES.filter(function (t) { return t.id === id; })[0]; }
  function lesson(id) { return COACH_LESSONS.filter(function (l) { return l.id === id; })[0]; }
  function title(id) { return id === "dates" ? "Deadlines and time periods" : tree(id).title; }
  function st(id) { return C.t[id] || (C.t[id] = { stage: 0, iv: 0, due: 0, ex: 0 }); }
  function strip(h) { return String(h).replace(/<[^>]+>/g, ""); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function mmss(s) { s = Math.max(0, Math.round(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (x < 10 ? "0" : "") + x; }
  function addMiss(topic, cite, rule) {
    if (typeof log === "undefined") return;
    var m = String(cite).match(/MPEP\s+(\d{3,4}(?:\.\d+)?(?:\([a-z0-9]+\))*)/);
    log.push({ id: Date.now() + Math.random(), topic: topic, sec: m ? m[1] : "", term: "", rule: rule, t: Date.now() });
    store.set("log", log);
  }
  function redraw() { window.renderPractice && window.renderPractice(); }
  function back() { return '<button class="pr-back" data-co="home"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Coach</button>'; }

  // ---------- what to do next ----------------------------------------------
  function nextUp() {
    var now = Date.now(), ids = COACH_LESSONS.map(function (l) { return l.id; });
    var due = ids.filter(function (id) { var s = st(id); return s.stage === 4 && s.due <= now; })[0];
    if (due) return { id: due, why: "Time for a quick review so " + title(due) + " sticks. Spacing reviews out is what moves things into long-term memory." };
    var cur = ids.filter(function (id) { var s = st(id); return s.stage > 0 && s.stage < 4; })[0];
    if (cur) return { id: cur, why: "Pick up where you left off." };
    var fresh = ids.filter(function (id) { return st(id).stage === 0; })[0];
    if (fresh) return { id: fresh, why: "Next topic, in order of how much it's worth on the exam." };
    return null;
  }
  function mastered() { return COACH_LESSONS.filter(function (l) { return st(l.id).stage === 4; }).length; }

  function homeHtml() {
    var n = nextUp(), m = mastered(), tot = COACH_LESSONS.length, last = C.mock[C.mock.length - 1];
    var h = '<p class="lede">Learn each topic the way that sticks: see the rule, watch it applied, apply it yourself with help, then answer exam-style questions on the clock. Misses send you back to practice, and mastered topics come back for spaced review.</p>';
    h += '<div class="pr-co-next">';
    if (n) {
      var s = st(n.id);
      h += '<span class="label">Your next step</span><div class="pr-tree-t">' + esc(title(n.id)) + '</div><div class="pr-tree-s">' + esc(s.stage === 4 ? "Spaced review" : STAGES[s.stage]) + " · " + esc(n.why) + '</div><button class="btn primary" data-co="go" data-id="' + n.id + '">Start</button>';
    } else {
      h += '<span class="label">Every topic mastered</span><div class="pr-tree-s">Now take full timed mock exams. Aim for 80% or better (the pass mark is 70%) before booking the real thing.</div><button class="btn primary" data-co="mock">Mock exam</button>';
    }
    h += "</div>";
    h += '<div class="pr-co-ready"><div class="pr-head"><h3>Readiness</h3><span class="label tnum">' + m + " of " + tot + ' topics mastered</span></div><div class="bar pr-bar"><i style="width:' + Math.round(100 * m / tot) + '%"></i></div>' +
      '<p class="pr-help">' + (last ? "Last mock exam: <b>" + last.ok + " / " + last.n + " (" + Math.round(100 * last.ok / last.n) + "%)</b>" + (last.timed ? ", timed" : ", coached") + "." : "No mock exam yet.") +
      " These topics are the reasoning-heavy core, not the whole exam. See the note at the bottom.</p></div>";
    h += '<div class="pr-co-list">' + COACH_LESSONS.map(function (l) {
      var s = st(l.id), lab = s.stage === 4 ? (s.due <= Date.now() ? "Review due" : "Mastered") : STAGES[s.stage];
      return '<button class="pr-weakrow" data-co="go" data-id="' + l.id + '"><span><b>' + esc(title(l.id)) + '</b></span><span class="chip ' + (s.stage === 4 ? (s.due <= Date.now() ? "warn" : "good") : "") + '">' + esc(lab) + "</span></button>";
    }).join("") + "</div>";
    h += '<div class="row" style="margin-top:14px"><button class="btn" data-co="mock">Mock exam</button></div>';
    h += '<p class="pr-help pr-co-note"><b>What this covers, honestly:</b> these lessons teach the rule-application topics the exam leans on hardest, plus PTAB trials and ethics from the official source list. The exam draws from the whole MPEP, so also use the Learn and Cards tabs for the other chapters, Find it fast for lookup speed, and if you can, a large bank of exam-style practice questions.</p>';
    return h;
  }

  // ---------- stages --------------------------------------------------------
  function go(id) {
    var s = st(id);
    S.id = id; S.stage = s.stage === 4 ? 3 : s.stage; S.review = s.stage === 4; S.w = null; S.g = null; S.x = null;
    S.view = "topic"; redraw();
  }
  function learnHtml(id) {
    var L = lesson(id), t = id === "dates" ? null : tree(id), h = "";
    h += '<div class="pr-co-card"><span class="label">Why it matters</span><p>' + L.why + "</p></div>";
    if (t) {
      h += '<div class="pr-co-card"><span class="label">The questions to ask, in order</span><p class="pr-help">This is the whole analysis. Each question either ends it or sends you to the next. Read it once now; you\'ll practice it next.</p><ol class="pr-co-steps">' +
        order(t).map(function (nid) { var nd = t.nodes[nid]; return "<li><b>" + strip(nd.q) + "</b><div class=\"pr-help\">" + nd.help + ' <span class="sec">' + esc(nd.cite) + "</span></div></li>"; }).join("") + "</ol></div>";
    } else {
      h += '<div class="pr-co-card"><span class="label">The method (use it every time)</span><ol class="pr-co-steps">' + MOCK.DATE_METHOD.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol></div>" +
        '<div class="pr-co-card"><span class="label">The periods to know</span><table class="pr-co-tab">' + DATE_FACTS.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + ' <span class="sec">' + esc(r[2]) + "</span></td></tr>"; }).join("") + "</table></div>";
    }
    h += '<div class="pr-co-card"><span class="label">Traps the exam sets</span><ul>' + L.traps.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
    h += '<div class="pr-co-card"><span class="label">How to find it in the MPEP during the exam</span><p class="pr-help">Search the PDF for:</p><p>' + L.search.map(function (x) { return '<code class="pr-co-q">' + esc(x) + "</code>"; }).join(" ") + "</p></div>";
    return h + '<button class="btn primary" data-co="adv">Show me a worked example</button>';
  }
  // Nodes in the order first reached (breadth-first from the start).
  function order(t) { var seen = [t.start], q = [t.start]; while (q.length) { var nd = t.nodes[q.shift()]; nd.options.forEach(function (o) { if (t.nodes[o.next] && seen.indexOf(o.next) < 0) { seen.push(o.next); q.push(o.next); } }); } return seen; }

  // Worked example: steps revealed one at a time, so you predict before you see each answer.
  function workedHtml(id) {
    if (!S.w) {
      if (id === "dates") { var q = DRILLS.make(); S.w = { q: q, shown: 0, steps: MOCK.DATE_METHOD.length }; }
      else { var t = tree(id), sc = t.scenarios[st(id).ex++ % t.scenarios.length]; save(); S.w = { q: MOCK._treeQ(t, sc), shown: 0 }; S.w.steps = S.w.q.coach.steps.length; }
    }
    var w = S.w, q = w.q, h = '<p class="lede">Read the facts. At each step, decide your answer in your head <b>before</b> tapping to reveal it. Predicting first is what makes it stick.</p>';
    h += '<div class="pr-facts"><span class="label">Facts</span><p>' + q.facts + '</p></div><div class="pr-q">' + q.prompt + "</div><ol class=\"pr-co-steps\">";
    for (var i = 0; i < w.steps; i++) {
      if (i > w.shown) break;
      if (id === "dates") h += "<li>" + MOCK.DATE_METHOD[i] + "</li>";
      else { var s = q.coach.steps[i]; h += "<li><b>" + esc(s.q) + "</b>" + (i < w.shown ? '<div class="pr-co-a">→ ' + esc(s.a) + ' <span class="sec">' + esc(s.cite) + "</span></div>" : "") + "</li>"; }
    }
    h += "</ol>";
    if (w.shown < w.steps) h += '<button class="btn primary" data-co="reveal">' + (id === "dates" ? "Next step" : "Reveal this step's answer") + "</button>";
    else {
      var right = q.choices.filter(function (c) { return c.correct; })[0].label;
      h += '<div class="pr-fb good"><b>Answer: ' + esc(right) + "</b>" + (id === "dates" ? '<div class="pr-steps">' + q.explain + "</div>" : q.explain) + '<div class="sec">' + esc(q.cite) + '</div></div><button class="btn primary" data-co="adv">Now you try, with help</button>';
    }
    return h;
  }

  // Guided practice: you answer each step; a miss shows why before you continue.
  function guidedHtml(id) {
    if (!S.g) S.g = { n: 0, of: 3, ok: 0, cur: null };
    var g = S.g;
    if (!g.cur) g.cur = newGuided(id);
    var c = g.cur, h = '<div class="pr-head"><span class="label">Guided practice · ' + (g.n + 1) + " of " + g.of + "</span></div>";
    if (id === "dates") {
      h += '<div class="pr-co-card pr-co-mini"><span class="label">Method</span><ol class="pr-co-steps">' + MOCK.DATE_METHOD.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol></div>";
      h += '<div class="pr-facts"><p>' + c.q.facts + '</p></div><div class="pr-q">' + c.q.prompt + "</div>" + choicesHtml(c.q, c.pick, "gpick");
      if (c.pick != null) h += '<div class="pr-fb ' + (c.q.choices[c.pick].correct ? "good" : "") + '"><b>' + (c.q.choices[c.pick].correct ? "Right." : "Not quite.") + '</b><div class="pr-steps">' + c.q.explain + '</div></div><button class="btn primary" data-co="gnext">Continue</button>';
      return h;
    }
    var t = tree(id), nd = t.nodes[c.node];
    h += '<div class="pr-facts"><p>' + c.sc.facts + "</p></div>";
    if (c.done) {
      var lf = t.leaves[c.node];
      h += '<div class="pr-leaf ' + lf.verdict + '"><div class="pr-leaf-t">' + esc(lf.title) + "</div><p>" + c.sc.why + "</p></div>" +
        '<p class="pr-score">' + (c.miss ? "You slipped on " + c.miss + " step" + (c.miss > 1 ? "s" : "") + ". That's what practice is for." : "Every step right.") + '</p><button class="btn primary" data-co="gnext">Continue</button>';
      return h;
    }
    h += '<div class="pr-node"><div class="pr-q">' + nd.q + "</div>";
    if (c.fb == null) h += '<details class="pr-hint"><summary>Hint</summary><p>' + nd.help + "</p></details>";
    h += '<div class="pr-opts">' + nd.options.map(function (o, i) {
      var cls = c.fb == null ? "" : i === c.sc.path[c.node] ? "right" : i === c.fb ? "wrong" : "";
      return '<button class="pr-opt ' + cls + '" data-co="gstep" data-i="' + i + '"' + (c.fb != null ? " disabled" : "") + ">" + esc(o.label) + "</button>";
    }).join("") + "</div>";
    if (c.fb != null) h += '<div class="pr-fb"><b>Not quite.</b><p>' + nd.help + '</p><div class="sec">' + esc(nd.cite) + '</div></div><button class="btn primary" data-co="gcont">Continue</button>';
    return h + "</div>";
  }
  function newGuided(id) {
    if (id === "dates") return { q: DRILLS.make(), pick: null };
    var t = tree(id), sc = t.scenarios[st(id).ex++ % t.scenarios.length]; save();
    return { sc: sc, node: t.start, fb: null, miss: 0, done: false };
  }

  // ---------- exam-format questions with coaching ----------------------------
  function choicesHtml(q, pick, act) {
    return '<div class="pr-opts">' + q.choices.map(function (c, i) {
      var cls = pick == null ? "" : c.correct ? "right" : i === pick ? "wrong" : "";
      return '<button class="pr-opt ' + cls + '" data-co="' + act + '" data-i="' + i + '"' + (pick != null ? " disabled" : "") + "><b>" + "ABCDE"[i] + ".</b> " + esc(c.label) + "</button>";
    }).join("") + "</div>";
  }
  // The coaching shown after an exam-format answer.
  function coachHtml(q, pick, secs) {
    var ok = q.choices[pick].correct, right = q.choices.filter(function (c) { return c.correct; })[0].label, k = q.coach, h = "";
    h += '<div class="pr-fb ' + (ok ? "good" : "") + '"><b>' + (ok ? "Correct." : "The answer is " + esc(right) + ".") + "</b>" + (k.kind === "date" ? '<div class="pr-steps">' + q.explain + "</div>" : q.explain) + '<div class="sec">' + esc(q.cite) + "</div></div>";
    h += '<div class="pr-co-card"><span class="label">How to think it through</span>';
    if (k.kind === "tree") {
      h += "<p class=\"pr-help\">Recognize the topic (" + esc(k.frame) + "), then ask these in order:</p><ol class=\"pr-co-steps\">" + k.steps.map(function (s) { return "<li>" + esc(s.q) + '<div class="pr-co-a">→ ' + esc(s.a) + "</div></li>"; }).join("") + "</ol>";
      var wr = q.choices.filter(function (c) { return !c.correct && k.wrong[c.label]; });
      if (wr.length) h += '<p class="pr-help"><b>Eliminating the other choices:</b></p><ul>' + wr.map(function (c) { return "<li><b>" + esc(c.label) + ":</b> " + esc(k.wrong[c.label]) + "</li>"; }).join("") + "</ul>";
    } else if (k.kind === "date") {
      h += '<ol class="pr-co-steps">' + MOCK.DATE_METHOD.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>";
    } else h += "<p>" + esc(k.how) + "</p>";
    h += '<p class="pr-help"><b>Where to look:</b> <span class="sec">' + esc(k.look) + "</span></p>";
    h += '<p class="pr-help"><b>Time:</b> ' + timeNote(ok, secs) + "</p></div>";
    return h;
  }
  function timeNote(ok, s) {
    var t = mmss(s) + " (budget about 3½ minutes). ";
    if (!ok && s < 60) return t + "Fast and wrong usually means a misread. Read the question's last sentence first, then the facts, and watch for NOT and EXCEPT.";
    if (ok && s > BUDGET) return t + "Right, but slow. On the exam, once you pass about 3 minutes, choose your best answer, flag it, and move on.";
    if (!ok && s > BUDGET) return t + "Over budget and missed. Don't hunt in the MPEP without a target: pick the step you're unsure of and search for that rule's section.";
    return t + (ok ? "Good pace." : "Pace was fine; the reasoning is what to review. Walk through the steps above.");
  }

  // Exam-style check (5 questions; 3 for a review). Pass = 4/5 (or 2/3).
  function checkHtml(id) {
    if (!S.x) {
      var n = S.review ? 3 : 5, qs;
      if (id === "dates") { qs = []; for (var i = 0; i < n; i++) qs.push(dq()); }
      else { var t = tree(id); qs = shuffle(t.scenarios).slice(0, n).map(function (sc) { return MOCK._treeQ(t, sc); }); }
      S.x = { qs: qs, i: 0, ok: 0, pick: null, t0: Date.now(), secs: 0 };
    }
    var x = S.x, q = x.qs[x.i];
    if (x.i >= x.qs.length) return checkDone(id);
    var h = '<div class="pr-head"><span class="label">' + (S.review ? "Spaced review" : "Exam-style check") + " · question " + (x.i + 1) + " of " + x.qs.length + '</span><span class="label tnum" id="coClock"></span></div>' +
      (x.i === 0 && x.pick == null ? '<p class="lede">Exam format: no step-by-step help. Answer, and the coach walks you through it afterward.</p>' : "") +
      '<div class="pr-node"><p class="pr-facts-inline">' + q.facts + '</p><div class="pr-q">' + q.prompt + "</div>" + choicesHtml(q, x.pick, "xpick");
    if (x.pick != null) h += coachHtml(q, x.pick, x.secs) + '<button class="btn primary" data-co="xnext">' + (x.i + 1 < x.qs.length ? "Next question" : "See result") + "</button>";
    return h + "</div>";
  }
  function dq() { var q = DRILLS.make(); return { cat: "Deadlines: " + q.label, facts: q.facts, prompt: q.prompt, choices: q.choices, explain: q.explain, cite: q.cite, coach: { kind: "date", look: q.cite } }; }
  function checkDone(id) {
    var x = S.x, need = S.review ? 2 : 4, pass = x.ok >= need, s = st(id);
    if (!x.recorded) {
      x.recorded = true;
      if (pass) { s.iv = s.stage === 4 ? Math.min(60, (s.iv || 3) * 2) : 3; s.stage = 4; s.due = Date.now() + s.iv * DAY; }
      else { s.stage = 2; s.iv = 0; }
      save();
    }
    return '<div class="pr-leaf ' + (pass ? "good" : "bad") + '"><div class="pr-leaf-t">' + x.ok + " of " + x.qs.length + (pass ? ": mastered" : ": not yet") + "</div><p>" +
      (pass ? "Nice work. This topic comes back for a short review in " + s.iv + " days, then at longer and longer gaps." :
        "No problem: you'll do another round of guided practice and then try the check again. Misses are added to your miss log.") +
      '</p></div><button class="btn primary" data-co="home">Back to the coach</button>';
  }

  // ---------- mock exam -----------------------------------------------------
  function mockHomeHtml() {
    var h = back() + '<h2>Mock exam</h2><p class="lede">Exam-format questions drawn from every topic: fact patterns, deadlines, KSR rationales and ethics. The real exam is two 3-hour sessions of 50 questions, about 3½ minutes each.</p>' +
      '<div class="pr-co-card"><span class="label">Coached</span><p class="pr-help">One question at a time with a per-question clock. After each answer you see how to reason through it, why the other choices are wrong, and how your time compared. Start here.</p><div class="row"><button class="btn primary" data-co="mstart" data-n="10" data-c="1">10 questions</button><button class="btn" data-co="mstart" data-n="25" data-c="1">25 questions</button></div></div>' +
      '<div class="pr-co-card"><span class="label">Timed, like the real thing</span><p class="pr-help">No feedback until the end. Flag questions, jump around, change answers, and watch the pace meter. Full review with coaching afterward.</p><div class="row"><button class="btn primary" data-co="mstart" data-n="50" data-c="0">50 questions · 3 hours</button><button class="btn" data-co="mstart" data-n="25" data-c="0">25 · 90 min</button><button class="btn" data-co="mstart" data-n="10" data-c="0">10 · 36 min</button></div></div>';
    if (C.mock.length) h += '<div class="pr-co-card"><span class="label">Your history</span><ul>' + C.mock.slice(-6).reverse().map(function (m) {
      return "<li>" + new Date(m.d).toLocaleDateString() + ": <b>" + m.ok + " / " + m.n + " (" + Math.round(100 * m.ok / m.n) + "%)</b> " + (m.timed ? "timed, " + mmss(m.used) + " used" : "coached") + "</li>";
    }).join("") + "</ul></div>";
    return h;
  }
  function mockHtml() {
    var m = S.m; if (!m) return mockHomeHtml();
    if (m.done) return mockResultHtml();
    var q = m.qs[m.pos], h = back();
    if (m.coached) {
      h += '<div class="pr-head"><span class="label">Coached mock · ' + (m.pos + 1) + " of " + m.qs.length + '</span><span class="label tnum" id="coClock"></span></div>' +
        '<div class="pr-node"><span class="chip">' + esc(q.cat) + '</span><p class="pr-facts-inline">' + q.facts + '</p><div class="pr-q">' + q.prompt + "</div>" + choicesHtml(q, m.ans[m.pos], "mcpick");
      if (m.ans[m.pos] != null) h += coachHtml(q, m.ans[m.pos], m.secs[m.pos]) + '<button class="btn primary" data-co="mcnext">' + (m.pos + 1 < m.qs.length ? "Next question" : "See results") + "</button>";
      return h + "</div>";
    }
    var answered = m.ans.filter(function (a) { return a != null; }).length;
    h += '<div class="pr-mk-bar"><span class="tnum" id="coClock"></span><span class="tnum" id="coPace"></span><span class="label tnum">' + answered + " / " + m.qs.length + " answered</span></div>";
    if (m.review) {
      var un = [], fl = [];
      m.qs.forEach(function (_, i) { if (m.ans[i] == null) un.push(i); if (m.flag[i]) fl.push(i); });
      h += '<div class="pr-co-card"><span class="label">Before you submit</span><p>' + un.length + " unanswered, " + fl.length + " flagged. There's no penalty for guessing, so answer everything.</p>" + grid(m) +
        '<div class="row"><button class="btn primary" data-co="msubmit">Submit exam</button><button class="btn" data-co="mback">Keep working</button></div></div>';
      return h;
    }
    h += '<div class="pr-node"><div class="pr-drill-top"><span class="label">Question ' + (m.pos + 1) + '</span><button class="btn pr-flag" data-co="mflag" aria-pressed="' + !!m.flag[m.pos] + '">' + (m.flag[m.pos] ? "Flagged" : "Flag for review") + "</button></div>" +
      '<p class="pr-facts-inline">' + q.facts + '</p><div class="pr-q">' + q.prompt + '</div><div class="pr-opts">' + q.choices.map(function (c, i) {
        return '<button class="pr-opt" data-co="mpick" data-i="' + i + '" aria-pressed="' + (m.ans[m.pos] === i) + '"><b>' + "ABCDE"[i] + ".</b> " + esc(c.label) + "</button>";
      }).join("") + "</div>" +
      '<div class="row"><button class="btn" data-co="mprev"' + (m.pos ? "" : " disabled") + '>Previous</button><button class="btn" data-co="mnext"' + (m.pos + 1 < m.qs.length ? "" : " disabled") + '>Next</button><button class="btn primary" data-co="mreview">Review and submit</button></div></div>' + grid(m);
    return h;
  }
  function grid(m) {
    return '<div class="pr-mk-grid" aria-label="Jump to question">' + m.qs.map(function (_, i) {
      return '<button data-co="mgo" data-i="' + i + '" class="' + (m.ans[i] != null ? "done " : "") + (m.flag[i] ? "flag " : "") + (i === m.pos ? "cur" : "") + '">' + (i + 1) + "</button>";
    }).join("") + "</div>";
  }
  function finishMock() {
    var m = S.m; if (m.done) return;
    m.done = true; m.used = (Date.now() - m.t0) / 1000; stopTick();
    m.ok = m.qs.filter(function (q, i) { return m.ans[i] != null && q.choices[m.ans[i]].correct; }).length;
    C.mock.push({ d: Date.now(), n: m.qs.length, ok: m.ok, used: Math.round(m.used), timed: !m.coached }); save();
  }
  function mockResultHtml() {
    var m = S.m, pct = Math.round(100 * m.ok / m.qs.length), cats = {};
    m.qs.forEach(function (q, i) { var c = cats[q.cat] || (cats[q.cat] = [0, 0]); c[0]++; if (m.ans[i] != null && q.choices[m.ans[i]].correct) c[1]++; });
    var rows = Object.keys(cats).sort(function (a, b) { return cats[a][1] / cats[a][0] - cats[b][1] / cats[b][0]; });
    var h = back() + '<div class="pr-leaf ' + (pct >= 70 ? "good" : "bad") + '"><div class="pr-leaf-t">' + m.ok + " / " + m.qs.length + " (" + pct + "%)</div><p>" +
      (pct >= 80 ? "Above the 70% pass mark with a margin. Keep it there across several full-length exams." : pct >= 70 ? "Just over the pass mark. Aim for 80% in practice; exam-day nerves cost a few points." : "Below the 70% pass mark. Work the weakest topics below in the Coach, then try again.") +
      (m.coached ? "" : " Time used: " + mmss(m.used) + " of " + mmss(m.limit) + ".") + "</p></div>";
    h += '<div class="pr-co-card"><span class="label">By topic, weakest first</span><table class="pr-co-tab">' + rows.map(function (c) { return "<tr><th>" + esc(c) + '</th><td class="tnum">' + cats[c][1] + " / " + cats[c][0] + "</td></tr>"; }).join("") + "</table></div>";
    var miss = m.qs.map(function (q, i) { return i; }).filter(function (i) { return m.ans[i] == null || !m.qs[i].choices[m.ans[i]].correct; });
    if (miss.length) {
      h += '<div class="pr-co-card"><span class="label">Review your misses</span>' + miss.map(function (i) {
        var q = m.qs[i];
        return '<details class="pr-outline"><summary>Q' + (i + 1) + " · " + esc(q.cat) + (m.ans[i] == null ? " (unanswered)" : "") + "</summary><p>" + q.facts + "</p><p><b>" + q.prompt + "</b></p>" +
          (m.ans[i] != null ? coachHtml(q, m.ans[i], m.secs[i] || 0) : '<div class="pr-fb"><b>Answer: ' + esc(q.choices.filter(function (c) { return c.correct; })[0].label) + "</b>" + q.explain + "</div>") + "</details>";
      }).join("") + '<div class="row"><button class="btn" data-co="mlog">Add all misses to miss log</button></div></div>';
    }
    return h + '<div class="row"><button class="btn primary" data-co="mhome">Another mock exam</button></div>';
  }

  // ---------- clock ---------------------------------------------------------
  var tick = null;
  function startTick() { stopTick(); tick = setInterval(onTick, 1000); onTick(); }
  function stopTick() { if (tick) clearInterval(tick); tick = null; }
  function onTick() {
    var el = document.getElementById("coClock"), now = Date.now();
    if (S.view === "mock" && S.m && !S.m.done) {
      var m = S.m;
      if (m.coached) { if (el && m.ans[m.pos] == null) el.textContent = "This question: " + mmss((now - m.q0) / 1000); return; }
      var left = m.limit - (now - m.t0) / 1000;
      if (left <= 0) { finishMock(); redraw(); return; }
      if (el) el.textContent = "Time left " + mmss(left);
      var pe = document.getElementById("coPace");
      if (pe) {
        var answered = m.ans.filter(function (a) { return a != null; }).length, expected = answered * m.limit / m.qs.length, used = (now - m.t0) / 1000, d = expected - used;
        pe.textContent = Math.abs(d) < 60 ? "On pace" : d > 0 ? "Ahead " + mmss(d) : "Behind " + mmss(-d);
        pe.className = "tnum " + (d < -60 ? "pr-behind" : "");
      }
      return;
    }
    if (S.view === "topic" && S.x && el && S.x.pick == null) el.textContent = "This question: " + mmss((now - S.x.t0) / 1000);
  }

  // ---------- public --------------------------------------------------------
  function html() {
    if (S.view === "mock") return mockHtml();
    if (S.view !== "topic") return homeHtml();
    var id = S.id, s = st(id), stage = S.stage;
    var steps = '<ol class="pr-co-stages">' + STAGES.slice(0, 4).map(function (n, i) { return '<li class="' + (i < stage ? "done" : i === stage ? "cur" : "") + '">' + n + "</li>"; }).join("") + "</ol>";
    var h = back() + '<h2>' + esc(title(id)) + "</h2>" + (S.review ? "" : steps);
    if (stage === 0) h += learnHtml(id);
    else if (stage === 1) h += workedHtml(id);
    else if (stage === 2) h += guidedHtml(id);
    else h += checkHtml(id);
    if (stage > 0) h += '<details class="pr-outline"><summary>Reread the lesson</summary>' + learnHtml(id).replace(/<button[^>]*>[^<]*<\/button>$/, "") + "</details>";
    return h;
  }
  function advance() { var s = st(S.id); S.stage++; if (S.stage > s.stage && s.stage < 4) s.stage = S.stage; save(); S.w = null; S.g = null; S.x = null; }
  function click(b) {
    var d = b.dataset, a = d.co; if (!a) return false;
    if (a === "home") { S.view = "home"; S.m && S.m.done && (S.m = null); stopTick(); }
    else if (a === "go") go(d.id);
    else if (a === "adv") advance();
    else if (a === "reveal") S.w.shown++;
    else if (a === "gstep") {
      var c = S.g.cur, t = tree(S.id), nd = t.nodes[c.node], i = +d.i;
      if (i === c.sc.path[c.node]) { c.node = nd.options[i].next; if (t.leaves[c.node]) c.done = true; }
      else { c.fb = i; c.miss++; addMiss(t.title + ": " + strip(nd.q).slice(0, 80), nd.cite, "Facts: " + c.sc.facts.slice(0, 140) + "… Right answer: " + nd.options[c.sc.path[c.node]].label + "."); }
    }
    else if (a === "gcont") { var c2 = S.g.cur, t2 = tree(S.id); c2.node = t2.nodes[c2.node].options[c2.sc.path[c2.node]].next; c2.fb = null; if (t2.leaves[c2.node]) c2.done = true; }
    else if (a === "gpick") { S.g.cur.pick = +d.i; }
    else if (a === "gnext") { S.g.n++; S.g.cur = null; if (S.g.n >= S.g.of) advance(); }
    else if (a === "xpick") {
      var x = S.x, q = x.qs[x.i]; x.pick = +d.i; x.secs = (Date.now() - x.t0) / 1000;
      if (q.choices[x.pick].correct) x.ok++; else addMiss(q.cat + ": " + strip(q.prompt), q.cite, strip(q.facts).slice(0, 160) + " Answer: " + q.choices.filter(function (c) { return c.correct; })[0].label + ".");
    }
    else if (a === "xnext") { S.x.i++; S.x.pick = null; S.x.t0 = Date.now(); }
    else if (a === "mock") { S.view = "mock"; S.m = null; }
    else if (a === "mhome") { S.m = null; }
    else if (a === "mstart") {
      var n = +d.n; S.view = "mock";
      S.m = { qs: MOCK.build(n), ans: [], flag: [], secs: [], pos: 0, coached: d.c === "1", t0: Date.now(), q0: Date.now(), limit: n * BUDGET, done: false };
      startTick();
    }
    else if (a === "mcpick") { var m = S.m; m.ans[m.pos] = +d.i; m.secs[m.pos] = (Date.now() - m.q0) / 1000; }
    else if (a === "mcnext") { var m2 = S.m; if (m2.pos + 1 < m2.qs.length) { m2.pos++; m2.q0 = Date.now(); } else finishMock(); }
    else if (a === "mpick") { var m3 = S.m; m3.secs[m3.pos] = (m3.secs[m3.pos] || 0) + (Date.now() - m3.q0) / 1000; m3.q0 = Date.now(); m3.ans[m3.pos] = +d.i; }
    else if (a === "mprev" || a === "mnext" || a === "mgo") { var m4 = S.m; m4.secs[m4.pos] = (m4.secs[m4.pos] || 0) + (Date.now() - m4.q0) / 1000; m4.q0 = Date.now(); m4.pos = a === "mgo" ? +d.i : m4.pos + (a === "mnext" ? 1 : -1); m4.review = false; }
    else if (a === "mflag") { S.m.flag[S.m.pos] = !S.m.flag[S.m.pos]; }
    else if (a === "mreview") { S.m.review = true; }
    else if (a === "mback") { S.m.review = false; }
    else if (a === "msubmit") finishMock();
    else if (a === "mlog") {
      var mm = S.m; mm.qs.forEach(function (q, i) { if (mm.ans[i] == null || !q.choices[mm.ans[i]].correct) addMiss(q.cat + ": " + strip(q.prompt), q.cite, strip(q.facts).slice(0, 160) + " Answer: " + q.choices.filter(function (c) { return c.correct; })[0].label + "."); });
      b.textContent = "Added to miss log"; b.disabled = true; return true;
    }
    else return false;
    redraw();
    if (S.x || (S.m && !S.m.done)) { if (!tick) startTick(); else onTick(); }
    var top = document.getElementById("v-practice"); if (top && top.getBoundingClientRect().top < 0 && /go|adv|xnext|mcnext|mstart|mgo|mnext|mprev|gnext|home|mock/.test(a)) window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }
  return { html: html, click: click, after: function () { if ((S.x && S.x.pick == null) || (S.m && !S.m.done)) { if (!tick) startTick(); else onTick(); } } };
})();
