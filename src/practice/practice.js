// Practice tab: decision-tree scenarios, tree explorer, Prong Two sorter,
// and deadline drills. Uses the app's globals: $, esc, store, log, renderLog.
(function () {
  var S = { tab: "trees", mode: "home", kind: "all" };       // UI state (not persisted)
  var P = store.get("practice", { sc: {}, nd: {}, dr: {} }); // progress (persisted)
  function save() { store.set("practice", P); }
  function treeById(id) { return TREES.filter(function (t) { return t.id === id; })[0]; }
  function strip(h) { return String(h).replace(/<[^>]+>/g, ""); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function root() { return $("#practiceArea"); }
  function addMiss(topic, sec, rule) {
    if (typeof log === "undefined") return;
    log.push({ id: Date.now(), topic: topic, sec: sec, term: "", rule: rule, t: Date.now() });
    store.set("log", log);
  }
  // The MPEP section in a citation like "37 CFR 1.136(a); MPEP 710.02(e)" -> "710.02(e)".
  function firstSec(cite) { var m = String(cite).match(/MPEP\s+(\d{3,4}(?:\.\d+)?(?:\([a-z0-9]+\))*)/); return m ? m[1] : ""; }
  var ICON_BACK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  function back(label) { return '<button class="pr-back" data-act="home">' + ICON_BACK + esc(label || "Practice") + "</button>"; }

  // ---------- home ----------------------------------------------------------
  function weakSpots() {
    var out = [];
    Object.keys(P.nd).forEach(function (k) {
      var v = P.nd[k], parts = k.split("."), t = treeById(parts[0]);
      if (!t || !t.nodes[parts[1]] || v[0] < 2 || !v[1]) return;
      out.push({ tree: t, node: parts[1], seen: v[0], rate: v[1] / v[0] });
    });
    return out.sort(function (a, b) { return b.rate - a.rate || b.seen - a.seen; }).slice(0, 3);
  }
  function home() {
    var h = '<h2>Practice</h2><p class="lede">Run the MPEP\'s decision logic on real fact patterns, and drill deadlines until they\'re automatic. Every step cites the MPEP section it comes from.</p>' +
      '<div class="seg pr-tabs" role="group" aria-label="Practice type"><button data-tab="trees" aria-pressed="' + (S.tab === "trees") + '">Decision trees</button><button data-tab="drills" aria-pressed="' + (S.tab === "drills") + '">Deadline drills</button></div>';
    if (S.tab === "trees") {
      var ws = weakSpots();
      if (ws.length) {
        h += '<div class="pr-weak"><span class="label">Your weak spots</span>' + ws.map(function (w) {
          return '<button class="pr-weakrow" data-weak="' + w.tree.id + "." + w.node + '"><span><b>' + esc(w.tree.title) + "</b> · " + esc(strip(w.tree.nodes[w.node].q).slice(0, 90)) + '</span><span class="chip bad tnum">' + Math.round(w.rate * 100) + "% missed</span></button>";
        }).join("") + "</div>";
      }
      h += TREES.map(function (t) {
        var done = P.sc[t.id] || {}, solved = Object.keys(done).filter(function (k) { return done[k]; }).length;
        return '<div class="pr-tree"><div><div class="pr-tree-t">' + esc(t.title) + '</div><div class="pr-tree-s">' + esc(t.sub) + ' · <span class="sec">' + esc(t.cite) + "</span></div></div>" +
          '<div class="bar pr-bar"><i style="width:' + Math.round(100 * solved / t.scenarios.length) + '%"></i></div>' +
          '<div class="pr-tree-meta tnum">' + solved + " of " + t.scenarios.length + " scenarios solved without a miss</div>" +
          '<div class="row"><button class="btn primary" data-run="' + t.id + '">Practice scenarios</button><button class="btn" data-explore="' + t.id + '">Explore the tree</button>' +
          (t.sorter ? '<button class="btn" data-sorter="' + t.id + '">Prong Two sorter</button>' : "") + "</div></div>";
      }).join("");
    } else {
      h += drillHtml();
    }
    root().innerHTML = h;
  }

  // ---------- scenarios -----------------------------------------------------
  function startRun(treeId, onlyNode) {
    var t = treeById(treeId), idx = t.scenarios.map(function (_, i) { return i; });
    if (onlyNode) idx = idx.filter(function (i) { return onlyNode in t.scenarios[i].path; });
    var done = P.sc[t.id] || {};
    idx = shuffle(idx).sort(function (a, b) { return (done[a] ? 1 : 0) - (done[b] ? 1 : 0); }); // unsolved first
    S.mode = "run"; S.run = { t: t, order: idx, pos: 0, focus: onlyNode || null };
    newScenario();
  }
  function newScenario() {
    var r = S.run; r.sc = r.t.scenarios[r.order[r.pos % r.order.length]]; r.node = r.t.start; r.steps = []; r.wrong = null; r.leaf = null;
    draw();
  }
  function runHtml() {
    var r = S.run, t = r.t, sc = r.sc;
    var h = back("All trees") + '<div class="pr-head"><h2>' + esc(t.title) + '</h2><span class="label tnum">Scenario ' + (r.pos % r.order.length + 1) + " of " + r.order.length + (r.focus ? " · focused practice" : "") + "</span></div>" +
      '<div class="pr-facts"><span class="label">Fact pattern</span><p>' + esc(sc.facts) + "</p></div>";
    var shown = r.wrong ? r.steps.slice(0, -1) : r.steps;
    if (shown.length) {
      h += '<ol class="pr-path">' + shown.map(function (s) {
        return '<li class="' + (s.ok ? "ok" : "no") + '"><span class="pr-mark" aria-hidden="true">' + (s.ok ? "✓" : "✗") + "</span><span>" + esc(strip(t.nodes[s.node].q)) + ' <b>' + esc(t.nodes[s.node].options[s.right].label) + "</b></span></li>";
      }).join("") + "</ol>";
    }
    if (r.leaf) {
      var L = t.leaves[r.leaf], misses = r.steps.filter(function (s) { return !s.ok; }).length;
      h += '<div class="pr-leaf ' + L.verdict + '" aria-live="polite"><span class="label">Outcome</span><div class="pr-leaf-t">' + esc(L.title) + "</div><p>" + L.text + "</p><p><b>Why:</b> " + esc(sc.why) + '</p><div class="sec">' + esc(L.cite) + "</div></div>" +
        '<div class="pr-score tnum">' + (misses ? r.steps.length - misses + " of " + r.steps.length + " steps right" : "Clean run: every step right") + "</div>" +
        '<div class="row"><button class="btn primary" data-act="next">Next scenario</button>' +
        (misses ? '<button class="btn" data-act="logmiss">Add to miss log</button>' : "") + '<button class="btn" data-act="home">Done</button></div>';
      return h;
    }
    var nd = t.nodes[r.node];
    h += '<div class="pr-node"><div class="pr-q">' + nd.q + "</div>";
    if (r.wrong) {
      var right = sc.path[r.node];
      h += '<div class="pr-opts">' + nd.options.map(function (o, i) {
        return '<button class="pr-opt ' + (i === right ? "right" : i === r.wrong.pick ? "wrong" : "") + '" disabled>' + esc(o.label) + "</button>";
      }).join("") + "</div>" +
        '<div class="pr-fb" aria-live="polite"><b>Not quite.</b> These facts point to <b>' + esc(nd.options[right].label) + "</b>.<p>" + nd.help + '</p><div class="sec">' + esc(nd.cite) + "</div></div>" +
        '<button class="btn primary" data-act="cont">Continue</button>';
    } else {
      h += '<div class="pr-opts">' + nd.options.map(function (o, i) { return '<button class="pr-opt" data-opt="' + i + '">' + esc(o.label) + "</button>"; }).join("") + "</div>" +
        '<details class="pr-hint"><summary>Hint</summary><p>' + nd.help + '</p><div class="sec">' + esc(nd.cite) + "</div></details>";
    }
    return h + "</div>";
  }
  function answer(i) {
    var r = S.run, right = r.sc.path[r.node], key = r.t.id + "." + r.node;
    var v = P.nd[key] || [0, 0]; v[0]++; if (i !== right) v[1]++; P.nd[key] = v; save();
    r.steps.push({ node: r.node, ok: i === right, right: right });
    if (i !== right) { r.wrong = { pick: i }; draw(); return; }
    advance();
  }
  function advance() {
    var r = S.run, next = r.t.nodes[r.node].options[r.sc.path[r.node]].next;
    r.wrong = null;
    if (r.t.leaves[next]) {
      r.leaf = next;
      var clean = r.steps.every(function (s) { return s.ok; }), k = r.order[r.pos % r.order.length];
      P.sc[r.t.id] = P.sc[r.t.id] || {}; if (clean) P.sc[r.t.id][k] = true; save();
    } else r.node = next;
    draw();
  }

  // ---------- explorer ------------------------------------------------------
  function outline(t, id, seen) {
    if (t.leaves[id]) return '<span class="pr-o-leaf ' + t.leaves[id].verdict + '">' + esc(t.leaves[id].title) + "</span>";
    var nd = t.nodes[id];
    return '<div class="pr-o-q">' + nd.q + ' <span class="sec">' + esc(nd.cite) + "</span></div><ul>" + nd.options.map(function (o) {
      return "<li><span class=\"pr-o-a\">" + esc(o.label) + " →</span> " + outline(t, o.next) + "</li>";
    }).join("") + "</ul>";
  }
  function exploreHtml() {
    var x = S.ex, t = x.t, id = x.trail[x.trail.length - 1];
    var h = back("All trees") + '<div class="pr-head"><h2>' + esc(t.title) + '</h2><span class="label">Explore mode</span></div>';
    if (x.trail.length > 1) h += '<button class="btn pr-up" data-act="up">' + ICON_BACK + "Previous step</button>";
    if (t.leaves[id]) {
      var L = t.leaves[id];
      h += '<div class="pr-leaf ' + L.verdict + '"><span class="label">Outcome</span><div class="pr-leaf-t">' + esc(L.title) + "</div><p>" + L.text + '</p><div class="sec">' + esc(L.cite) + "</div></div>" +
        '<div class="row"><button class="btn primary" data-act="restart">Start over</button></div>';
    } else {
      var nd = t.nodes[id];
      h += '<div class="pr-node"><div class="pr-q">' + nd.q + '</div><p class="pr-help">' + nd.help + '</p><div class="sec">' + esc(nd.cite) + '</div><div class="pr-opts">' +
        nd.options.map(function (o, i) { return '<button class="pr-opt" data-go="' + i + '">' + esc(o.label) + "</button>"; }).join("") + "</div></div>";
    }
    h += '<details class="pr-outline"><summary>See the whole tree</summary>' + outline(t, t.start) + "</details>";
    return h;
  }

  // ---------- sorter --------------------------------------------------------
  function sorterHtml() {
    var z = S.sort, it = z.items[z.pos % z.items.length];
    var h = back("All trees") + '<div class="pr-head"><h2>Prong Two sorter</h2><span class="label tnum">' + z.ok + " / " + z.n + " right</span></div>" +
      '<p class="lede">Does this additional element help the claim (integrate the exception, or add significantly more), or not?</p>' +
      '<div class="pr-node"><div class="pr-q">' + esc(it.t) + "</div>";
    if (z.ans == null) {
      h += '<div class="pr-opts two"><button class="pr-opt" data-sort="1">Helps eligibility</button><button class="pr-opt" data-sort="0">Doesn\'t help</button></div>';
    } else {
      var ok = (z.ans === 1) === it.ok;
      h += '<div class="pr-fb ' + (ok ? "good" : "") + '" aria-live="polite"><b>' + (ok ? "Right." : "Not quite.") + "</b> " + (it.ok ? "It helps: " : "It doesn't help: ") + esc(it.why) + '<div class="sec">' + esc(it.cite) + '</div></div><button class="btn primary" data-act="snext">Next</button>';
    }
    return h + "</div>";
  }

  // ---------- drills --------------------------------------------------------
  function drillHtml() {
    if (!S.q) S.q = DRILLS.make(S.kind === "all" ? null : S.kind);
    var q = S.q, st = P.dr;
    var chips = '<div class="pr-kinds" role="group" aria-label="Drill type">' + [{ id: "all", label: "Mixed" }].concat(DRILLS.KINDS).map(function (k) {
      var s = st[k.id]; return '<button class="pr-kind" data-kind="' + k.id + '" aria-pressed="' + (S.kind === k.id) + '">' + esc(k.label) + (s && s[0] ? ' <span class="tnum">' + Math.round(100 * s[1] / s[0]) + "%</span>" : "") + "</button>";
    }).join("") + "</div>";
    var h = chips + '<div class="pr-node pr-drill"><div class="pr-drill-top"><span class="chip">' + esc(q.label) + '</span><span class="label tnum">' + (S.sess ? S.sess.ok + " / " + S.sess.n + " this session" : "") + "</span></div>" +
      '<p class="pr-facts-inline">' + q.facts + '</p><div class="pr-q">' + q.prompt + "</div>";
    if (S.picked == null) {
      h += '<div class="pr-opts">' + q.choices.map(function (c, i) { return '<button class="pr-opt" data-pick="' + i + '">' + esc(c.label) + "</button>"; }).join("") + "</div>";
    } else {
      var ok = q.choices[S.picked].correct;
      h += '<div class="pr-opts">' + q.choices.map(function (c, i) {
        return '<button class="pr-opt ' + (c.correct ? "right" : i === S.picked ? "wrong" : "") + '" disabled>' + esc(c.label) + "</button>";
      }).join("") + "</div>" +
        '<div class="pr-fb ' + (ok ? "good" : "") + '" aria-live="polite"><b>' + (ok ? "Correct." : "Not quite.") + '</b><div class="pr-steps">' + q.explain + '</div><div class="sec">' + esc(q.cite) + "</div></div>" +
        '<div class="row"><button class="btn primary" data-act="dnext">Next question</button>' + (ok ? "" : '<button class="btn" data-act="dlog">Add to miss log</button>') + "</div>";
    }
    return h + "</div>";
  }
  function pick(i) {
    var q = S.q, ok = q.choices[i].correct, s = P.dr[q.kind] || [0, 0], a = P.dr.all || [0, 0];
    s[0]++; a[0]++; if (ok) { s[1]++; a[1]++; } P.dr[q.kind] = s; P.dr.all = a; save();
    S.sess = S.sess || { n: 0, ok: 0 }; S.sess.n++; if (ok) S.sess.ok++;
    S.picked = i; draw();
  }

  // ---------- render + events ----------------------------------------------
  function draw() {
    var el = root(); if (!el) return;
    if (S.mode === "run") el.innerHTML = runHtml();
    else if (S.mode === "explore") el.innerHTML = exploreHtml();
    else if (S.mode === "sort") el.innerHTML = sorterHtml();
    else home();
  }
  function top() { var n = $("#v-practice"); if (n && n.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: "smooth" }); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#practiceArea button"); if (!b) return;
    var d = b.dataset;
    if (d.tab) { S.tab = d.tab; S.mode = "home"; draw(); }
    else if (d.run) { startRun(d.run); top(); }
    else if (d.weak) { var p = d.weak.split("."); startRun(p[0], p[1]); top(); }
    else if (d.explore) { S.mode = "explore"; S.ex = { t: treeById(d.explore), trail: [treeById(d.explore).start] }; draw(); top(); }
    else if (d.sorter) { S.mode = "sort"; S.sort = { items: shuffle(treeById(d.sorter).sorter), pos: 0, n: 0, ok: 0, ans: null }; draw(); top(); }
    else if (d.opt != null) answer(+d.opt);
    else if (d.go != null) { var x = S.ex, cur = x.trail[x.trail.length - 1]; x.trail.push(x.t.nodes[cur].options[+d.go].next); draw(); }
    else if (d.sort != null) { var z = S.sort, it = z.items[z.pos % z.items.length]; z.ans = +d.sort; z.n++; if ((z.ans === 1) === it.ok) z.ok++; draw(); }
    else if (d.kind) { S.kind = d.kind; S.q = null; S.picked = null; draw(); }
    else if (d.pick != null) pick(+d.pick);
    else if (d.act === "home") { S.mode = "home"; draw(); top(); }
    else if (d.act === "cont") advance();
    else if (d.act === "next") { S.run.pos++; newScenario(); top(); }
    else if (d.act === "up") { S.ex.trail.pop(); draw(); }
    else if (d.act === "restart") { S.ex.trail = [S.ex.t.start]; draw(); }
    else if (d.act === "snext") { S.sort.pos++; S.sort.ans = null; draw(); }
    else if (d.act === "dnext") { S.q = null; S.picked = null; draw(); }
    else if (d.act === "logmiss") {
      var r = S.run, miss = r.steps.filter(function (s) { return !s.ok; })[0], nd = r.t.nodes[miss.node];
      addMiss(r.t.title + ": " + strip(nd.q).slice(0, 80), firstSec(nd.cite), "Facts: " + r.sc.facts.slice(0, 140) + "… Right answer: " + nd.options[miss.right].label + ". " + r.sc.why);
      b.textContent = "Added to miss log"; b.disabled = true;
    } else if (d.act === "dlog") {
      var q = S.q; addMiss(q.label + ": " + strip(q.prompt), firstSec(q.cite), strip(q.facts) + " Answer: " + q.choices.filter(function (c) { return c.correct; })[0].label + ".");
      b.textContent = "Added to miss log"; b.disabled = true;
    }
  });
  window.renderPractice = function () { draw(); };
  if (location.hash === "#practice") draw();
})();
