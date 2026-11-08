import sys, re
import json, os, datetime
src, out = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
VERSION = open(os.path.join(HERE, "VERSION")).read().strip()
BUILT = datetime.date.today().strftime("%b %-d, %Y")
AUDIO = json.load(open(os.path.join(HERE, "audio.json")))
import subprocess
GUIDE = None
_png = os.path.join(HERE, "src", "assets", "infographic.png")
if os.path.exists(_png) and os.path.exists(os.path.join(HERE, "infographic.json")):
    GUIDE = json.load(open(os.path.join(HERE, "infographic.json")))
    for args in (["-quality", "82", "infographic.webp"], ["-resize", "1200x", "-quality", "78", "infographic-thumb.webp"]):
        subprocess.run(["magick", _png] + args[:-1] + [os.path.join(HERE, "site", args[-1])], check=True)
s = open(src, encoding="utf-8").read()

I = lambda d: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
ICONS = {
 "learn": I('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
 "cards": I('<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>'),
 "mpep":  I('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
 "misses":I('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>'),
 "mock":  I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'),
 "practice": I('<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M6 7.2v9.6M6 12h4a4 4 0 0 0 4-4V8M15.8 12H14"/>'),
 "plan":  I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
}
SHORT = {"learn":"Learn","cards":"Cards","mpep":"MPEP","misses":"Misses","mock":"Timer","plan":"Plan","practice":"Practice"}
def navbtn(m):
    v, label = m.group(1), m.group(2)
    return f'<button role="tab" data-v="{v}" aria-label="{label}">{ICONS[v]}<span class="long">{label}</span><span class="short">{SHORT[v]}</span></button>'
s, n = re.subn(r'<button role="tab" data-v="(\w+)">([^<]+)</button>', navbtn, s)
assert n == 7, n

old_header = re.search(r'<div class="wrap">\s*<header>.*?</header>', s, re.S)
assert old_header
hero = f'''<header class="hero">
  <div class="hero-in">
    <p class="eyebrow">USPTO registration exam <span class="ver" title="Updated {BUILT}">v{VERSION}</span></p>
    <h1>Patent Bar Trainer</h1>
    <ul class="facts">
      <li><b>100</b> questions</li><li><b>6</b> hours</li><li><b>70%</b> to pass</li><li>Open MPEP</li>
    </ul>
    <button id="installBtn" type="button" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>Install app</button>
  </div>
</header>
<div class="wrap">'''
s = s[:old_header.start()] + hero + s[old_header.end():]

skin = r'''<style>
/* ---- Skin: hero band, raised surfaces, app-style navigation ---- */
:root{
  --paper:#f3f5f8; --sheet:#ffffff; --ink:#142030; --muted:#5b6878; --rule:#e2e7ed; --tint:#eaf1f8;
  --accent:#1f4e79; --accent-2:#2f6fa8; --on-accent:#ffffff; --hero1:#102f4e; --hero2:#24598a;
  --shadow-sm:0 1px 2px rgba(15,30,50,.06);
  --shadow:0 1px 2px rgba(15,30,50,.05),0 8px 24px -10px rgba(15,30,50,.16);
  --shadow-lg:0 2px 4px rgba(15,30,50,.05),0 22px 44px -16px rgba(15,30,50,.28);
  --r:14px;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#0d1217; --sheet:#161d25; --ink:#e6ebf1; --muted:#98a4b2; --rule:#26313c; --tint:#1a2b3c;
  --accent:#86b6e2; --accent-2:#a9cdf0; --on-accent:#0d1a28; --hero1:#0c1f33; --hero2:#183d61;
  --shadow-sm:0 1px 2px rgba(0,0,0,.4); --shadow:0 1px 2px rgba(0,0,0,.35),0 8px 24px -10px rgba(0,0,0,.6);
  --shadow-lg:0 2px 4px rgba(0,0,0,.35),0 22px 44px -16px rgba(0,0,0,.7)}}
:root[data-theme="dark"]{
  --paper:#0d1217; --sheet:#161d25; --ink:#e6ebf1; --muted:#98a4b2; --rule:#26313c; --tint:#1a2b3c;
  --accent:#86b6e2; --accent-2:#a9cdf0; --on-accent:#0d1a28; --hero1:#0c1f33; --hero2:#183d61;
  --shadow-sm:0 1px 2px rgba(0,0,0,.4); --shadow:0 1px 2px rgba(0,0,0,.35),0 8px 24px -10px rgba(0,0,0,.6);
  --shadow-lg:0 2px 4px rgba(0,0,0,.35),0 22px 44px -16px rgba(0,0,0,.7)}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-size:15.5px;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
body::before{background:var(--hero1)}

/* hero */
.hero{position:relative;overflow:hidden;color:#fff;
  background:radial-gradient(120% 160% at 100% 0%,var(--hero2) 0%,var(--hero1) 62%);
  padding:calc(env(safe-area-inset-top,0px) + 36px) max(16px,env(safe-area-inset-right,0px)) 72px max(16px,env(safe-area-inset-left,0px))}
.hero::after{content:"§";position:absolute;right:-.06em;top:-.2em;font:700 clamp(14rem,40vw,24rem)/1 var(--display);color:rgba(255,255,255,.06);pointer-events:none}
.hero-in{max-width:760px;margin:0 auto;position:relative;z-index:1}
.hero p.eyebrow{font:600 .72rem var(--body);letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.72);margin:0 0 10px}
.hero h1{font:700 clamp(2.1rem,7vw,3rem)/1.04 var(--display);letter-spacing:-.015em;color:#fff;margin:0}
.facts{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-wrap:wrap;gap:8px}
.facts li{font:500 .82rem var(--body);color:rgba(255,255,255,.86);background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);padding:5px 12px;border-radius:999px;backdrop-filter:blur(4px)}
.facts b{color:#fff;font-weight:700}
#installBtn{margin-top:20px;display:inline-flex;align-items:center;gap:8px;font:600 .88rem var(--body);color:#102f4e;background:#fff;border:0;border-radius:999px;padding:10px 18px 10px 14px;cursor:pointer;box-shadow:0 6px 18px -4px rgba(0,0,0,.35);transition:transform .1s}
#installBtn svg{width:17px;height:17px}
#installBtn:active{transform:scale(.97)}
#installBtn[hidden]{display:none}

/* layout + nav (desktop: floating pill straddling the hero edge) */
.wrap{position:relative;margin-top:-30px;padding-top:0;padding-bottom:56px}
nav{top:calc(env(safe-area-inset-top,0px) + 10px);margin:0 0 30px;padding:5px;gap:2px;border:1px solid var(--rule);border-radius:999px;
  background:color-mix(in srgb,var(--sheet) 88%,transparent);-webkit-backdrop-filter:saturate(1.5) blur(14px);backdrop-filter:saturate(1.5) blur(14px);box-shadow:var(--shadow);scrollbar-width:none}
nav::-webkit-scrollbar{display:none}
nav button{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:999px;font-weight:500;transition:background .15s,color .15s}
nav button svg{width:17px;height:17px;flex:0 0 auto}
nav button .long{display:none}
nav button:hover{color:var(--ink);background:var(--paper)}
nav button[aria-selected="true"]{background:var(--accent);color:var(--on-accent);box-shadow:0 4px 12px -4px color-mix(in srgb,var(--accent) 70%,transparent)}

section:not([hidden]){animation:rise .28s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}

/* type */
h2{font-size:1.7rem;letter-spacing:-.01em;line-height:1.15;margin:0 0 8px}
.lede{font-size:.96rem;line-height:1.6;margin-bottom:20px}
.label{letter-spacing:.1em}

/* controls */
.btn{border-radius:10px;padding:10px 18px;transition:transform .08s,background .15s,border-color .15s,box-shadow .15s,filter .15s}
.btn:hover{border-color:color-mix(in srgb,var(--accent) 40%,var(--rule))}
.btn:active{transform:scale(.97)}
.btn.primary{color:var(--on-accent);box-shadow:0 3px 10px -3px color-mix(in srgb,var(--accent) 65%,transparent)}
.btn.primary:hover{filter:brightness(1.08)}
.chip{padding:3px 10px;font-weight:600}
input:not([type=checkbox]):not([type=radio]),select,textarea{background:var(--sheet);border-radius:10px;padding:10px 12px;transition:border-color .15s,box-shadow .15s}
input:not([type=checkbox]):not([type=radio]):focus,select:focus,textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
#v-mpep input[type=search]{padding-left:38px!important;background:var(--sheet) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a8694' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E") no-repeat 12px center/18px}
.filter{margin-bottom:14px}
.seg{border-radius:999px;padding:3px;background:var(--paper);gap:2px}
.seg button{border-radius:999px;background:none;padding:7px 14px;transition:background .15s,color .15s}
.seg button[aria-pressed="true"]{background:var(--sheet);color:var(--ink);box-shadow:var(--shadow-sm);font-weight:600}

/* surfaces */
.card,.clock,form.log,.lesson{border-radius:var(--r);box-shadow:var(--shadow)}
.mods,#mpepList:not(:empty),#planList:not(:empty),#logList:not(:empty),.scores>div{background:var(--sheet);border:1px solid var(--rule);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden}
.mod,.ch,.week,.entry{padding-left:18px;padding-right:18px}
.mod:last-child,.ch:last-child,.week:last-child,.entry:last-child{border-bottom:0}
.mod{grid-template-columns:42px 1fr auto;padding-top:16px;padding-bottom:16px;transition:background .15s}
.mod:hover{background:var(--tint)}
.mod .n{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--tint);font:600 .92rem var(--mono)}
.mod:hover .n{background:var(--sheet)}
.ch,.week,.entry{padding-top:14px;padding-bottom:14px}
.ch .kw code{background:var(--tint);border-color:transparent;color:var(--accent);border-radius:6px;padding:2px 7px}
.week input,.deep input{accent-color:var(--stamp)}
.week.checked{background:color-mix(in srgb,var(--stamp-bg) 45%,transparent)}
.scores table th,.scores table td{padding:11px 14px}
.scores tbody tr:last-child td{border-bottom:0}

.listen{background:linear-gradient(135deg,var(--tint),var(--sheet));border-radius:var(--r);padding:16px 18px;box-shadow:var(--shadow-sm)}
.lesson .listen{background:var(--tint)}
.prog{gap:18px;margin-bottom:22px}
.bar{height:8px;border:0;border-radius:999px;background:color-mix(in srgb,var(--rule) 80%,var(--paper))}
.bar i{border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .4s ease}
.clock .bar{height:10px}
.boxes{gap:5px}
.boxes span{height:8px;border-radius:999px}
.boxes span i{border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--accent-2))}

.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
.stats div{background:var(--sheet);border:1px solid var(--rule);border-radius:12px;padding:12px 14px;box-shadow:var(--shadow-sm)}
.stats b{font-size:1.65rem;margin-top:2px;color:var(--ink)}

.card{padding:28px 24px;min-height:260px;box-shadow:var(--shadow-lg)}
.card .q{font-size:1.4rem}
.clock{padding:22px}
.big{font-size:3.6rem}
.counter .btn{border-radius:14px}
.lesson{padding:30px 28px}
.lesson h3{font-size:1.75rem}
.lesson .aside{background:var(--tint);border-radius:0 10px 10px 0}
.done .stamp{border-radius:6px}
.note{border-top:0;text-align:center;max-width:62ch;margin:36px auto 0;opacity:.9}

/* phones: bottom tab bar */
@media (max-width:720px){
  .hero{padding-bottom:30px;padding-top:calc(env(safe-area-inset-top,0px) + 26px)}
  .wrap{margin-top:0;padding-top:24px;padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))}
  nav{position:fixed;inset:auto 0 0 0;top:auto;margin:0;border-radius:0;border:0;border-top:1px solid var(--rule);
    display:grid;grid-template-columns:repeat(7,1fr);gap:0;overflow:visible;z-index:20;
    padding:6px max(4px,env(safe-area-inset-right,0px)) calc(6px + env(safe-area-inset-bottom,0px)) max(4px,env(safe-area-inset-left,0px));
    background:color-mix(in srgb,var(--sheet) 92%,transparent);box-shadow:0 -6px 24px -12px rgba(15,30,50,.25)}
  nav button{flex-direction:column;gap:3px;padding:4px 0 2px;font-size:.64rem;font-weight:600;letter-spacing:.01em;border-radius:12px;min-width:0}
  nav button .long{display:none}
  nav button .short{display:block}
  nav button svg{width:22px;height:22px;padding:4px 12px;box-sizing:content-box;border-radius:999px;transition:background .2s}
  nav button:hover{background:none}
  nav button[aria-selected="true"]{background:none;color:var(--accent);box-shadow:none}
  nav button[aria-selected="true"] svg{background:var(--tint)}
  h2{font-size:1.5rem}
  .card{padding:22px 18px}
  .lesson{padding:22px 18px}
  .clock{padding:18px}
  .mod,.ch,.week,.entry{padding-left:14px;padding-right:14px}
  .mod{grid-template-columns:38px 1fr auto;gap:10px}
}
#v-cards label.row{flex-wrap:nowrap;align-items:center;gap:10px}
#v-cards label.row input{accent-color:var(--accent);flex:0 0 auto}
.stats .label{white-space:nowrap}
@media (max-width:420px){.stats{gap:8px}.stats div{padding:10px 12px}.stats .label{font-size:.62rem;letter-spacing:.05em}.stats b{font-size:1.45rem}}
.hero .ver{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);color:#fff;font:600 .68rem var(--mono);letter-spacing:.02em;text-transform:none;vertical-align:1px}
.verline{font:500 .75rem var(--mono);color:var(--muted);text-align:center;margin-top:10px}
.listen.has-audio{display:grid;gap:12px;justify-content:stretch}
.listen .lhead{display:flex;justify-content:space-between;align-items:center;gap:12px}
.listen audio{width:100%;height:44px;border-radius:999px;color-scheme:light dark}
.btn.speed{padding:6px 12px;border-radius:999px;font:600 .82rem var(--mono);min-width:58px;flex:0 0 auto}
.guide{display:block;margin:0 0 18px;background:var(--sheet);border:1px solid var(--rule);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;text-decoration:none;color:inherit;transition:box-shadow .2s,transform .2s}
.guide:hover{box-shadow:var(--shadow-lg);transform:translateY(-1px)}
.guide img{display:block;width:100%;height:auto;aspect-ratio:1200/670;object-fit:cover;background:var(--tint);border-bottom:1px solid var(--rule)}
.guide .gbody{padding:14px 18px 16px;display:grid;gap:2px}
.guide .lt{font-weight:600}.guide .ld{color:var(--muted);font-size:.84rem}
.guide .gwarn{margin-top:10px;font-size:.82rem;line-height:1.5;background:var(--warn-bg);color:var(--ink);border-left:3px solid var(--warn);border-radius:0 8px 8px 0;padding:8px 12px}
.guide .gwarn b{color:var(--warn)}
@media (prefers-reduced-motion:reduce){section:not([hidden]){animation:none}}
</style>
'''
assert s.count("</style>") == 1
s = s.replace("</style>", "</style>\n" + skin, 1)

head = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#102f4e" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0c1f33" media="(prefers-color-scheme: dark)">
<meta name="description" content="USPTO registration exam study tool.">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
'''
js = '''
<script>
if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
(() => {
  const b = document.getElementById("installBtn");
  let deferred = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; b.hidden = false; });
  b.addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null; b.hidden = true;
  });
  addEventListener("appinstalled", () => { b.hidden = true; });
})();
</script>
</html>
'''

m = re.search(r'function listenCard\(n\)\{.*?<span class="chip">Queued</span>`\}</div>`\}', s, re.S)
assert m, "listenCard not found"
# The original function's first line declares e/lbl; everything after it is
# the NotebookLM-link fallback, which we keep for episodes without a file.
orig = m.group(0)
fallback = orig[orig.index('\n') + 1:]
player = (
 'const AUDIO_BASE=' + json.dumps(AUDIO["base"]) + ',AUDIO=' + json.dumps(AUDIO["files"]) + ';\n'
 'const SPEEDS=[1,1.25,1.5,1.75,2];const spd=()=>store.get("aspeed",1);\n'
 'function listenCard(n){const e=EPS[n],lbl=n===0?"Full-course podcast":"Lesson podcast",f=AUDIO[n];\n'
 '  if(e&&f)return`<div class="listen has-audio"><div class="lhead"><div style="min-width:0"><span class="label">${lbl}</span><div class="lt">${esc(e.name)}</div><div class="ld">${esc(e.len)}</div></div><button class="btn speed" type="button" data-speed aria-label="Playback speed">${spd()}×</button></div><audio data-ep="${n}" controls preload="metadata" src="${AUDIO_BASE+f}"></audio></div>`;\n'
 + fallback
)
if GUIDE:
    player += (
     '\nconst GUIDE=' + json.dumps(GUIDE) + ';\n'
     'function guideCard(){const v="?v=' + VERSION + '";return`<a class="guide" href="/infographic.webp${v}" target="_blank" rel="noopener">'
     '<img src="/infographic-thumb.webp${v}" alt="${esc(GUIDE.title)}" loading="lazy" width="1200" height="670">'
     '<div class="gbody"><span class="label">Visual overview</span><div class="lt">${esc(GUIDE.title)}</div>'
     '<div class="ld">Tap to open full size and zoom in</div>'
     '<div class="gwarn"><b>Heads up:</b> ${esc(GUIDE.source)}. ${esc(GUIDE.warning)}</div></div></a>`}'
    )
    assert s.count("${listenCard(0)}") == 1
    s = s.replace("${listenCard(0)}", "${listenCard(0)}${guideCard()}", 1)
s = s[:m.start()] + player + s[m.end():]

audio_js = r"""
<script>
(() => {
  // Speed button: one setting for every episode, remembered.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-speed]"); if (!b) return;
    const next = SPEEDS[(SPEEDS.indexOf(spd()) + 1) % SPEEDS.length];
    store.set("aspeed", next);
    document.querySelectorAll("audio[data-ep]").forEach(a => a.playbackRate = next);
    document.querySelectorAll("[data-speed]").forEach(x => x.textContent = next + "\u00d7");
  });
  // Resume each episode where you left off; one episode plays at a time.
  const pos = () => store.get("apos", {});
  let last = 0;
  const resume = (a) => {
    if (a.dataset.resumed) return; a.dataset.resumed = "1";
    const t = pos()[a.dataset.ep] || 0;
    if (t > 3 && t < a.duration - 3) a.currentTime = t;
    a.playbackRate = spd();
  };
  document.addEventListener("loadedmetadata", (e) => {
    const a = e.target; if (a.dataset && a.dataset.ep != null) resume(a);
  }, true);
  // Elements whose metadata loaded before this script ran.
  document.querySelectorAll("audio[data-ep]").forEach(a => { if (a.readyState >= 1) resume(a); });
  new MutationObserver(() => document.querySelectorAll("audio[data-ep]").forEach(a => { if (a.readyState >= 1) resume(a); }))
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener("play", (e) => {
    const a = e.target; if (!a.dataset || a.dataset.ep == null) return;
    a.playbackRate = spd();
    document.querySelectorAll("audio[data-ep]").forEach(o => { if (o !== a) o.pause(); });
  }, true);
  const save = (a, t) => { const p = pos(); p[a.dataset.ep] = t; store.set("apos", p); };
  document.addEventListener("timeupdate", (e) => {
    const a = e.target; if (!a.dataset || a.dataset.ep == null) return;
    if (Date.now() - last > 4000) { last = Date.now(); save(a, a.currentTime); }
  }, true);
  document.addEventListener("pause", (e) => { const a = e.target; if (a.dataset && a.dataset.ep != null) save(a, a.currentTime); }, true);
  document.addEventListener("ended", (e) => { const a = e.target; if (a.dataset && a.dataset.ep != null) save(a, 0); }, true);
})();
</script>
"""
s = s.replace('<p class="note">', '<p class="note">', 1)
note_end = s.index('</p>', s.index('<p class="note">'))
s = s[:note_end+4] + f'\n<p class="verline">Version {VERSION} · updated {BUILT}</p>' + s[note_end+4:]
def _read(*p): return open(os.path.join(HERE, "src", "practice", *p), encoding="utf-8").read()
practice = ("<style>\n" + _read("practice.css") + "</style>\n<script>\n" +
            "\n".join(_read(f) for f in ("dates.js", "drills.js", "trees.js", "practice.js")) + "\n</script>\n")
open(out, "w", encoding="utf-8").write(head + s + practice + audio_js + js)

print("ok")

# Keep the service worker's cache name in step with the app version so an
# update replaces the installed copy instead of serving the old one.
sw = os.path.join(HERE, "site", "sw.js")
t = open(sw, encoding="utf-8").read()
t = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "pbt-{VERSION}";', t, count=1)
open(sw, "w", encoding="utf-8").write(t)
