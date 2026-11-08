import re, json, glob, os
out = {"chapters": {}, "sections": []}
NUM = re.compile(r'^(\d{3,4}(?:\.\d+)*(?:\([a-z0-9]+\))*)\s*$')
for f in sorted(glob.glob("mpep/txt/mpep-[0-2][0-9]00.txt")):
    ch = os.path.basename(f)[5:9]
    t = open(f).read()
    toc = t[:t.find("[R-")]
    lines = [l.strip() for l in toc.split("\n")]
    m = re.match(r'Chapter\s+\d+\s+(.*)', lines[0])
    out["chapters"][ch] = m.group(1).strip() if m else "?"
    buf = []
    for i, l in enumerate(lines[1:], 1):
        if not l or l.startswith("Rev. ") or re.match(r'^\d{3,4}-\d+$', l) or l.startswith("\f"): continue
        if l.startswith("-") and re.match(r'^-\d', l): continue          # second half of a range like 704.02-704.09
        mm = NUM.match(l)
        if mm:
            title = re.sub(r'\s+', ' ', " ".join(buf)).strip()
            if title: out["sections"].append({"ch": ch, "sec": mm.group(1), "title": title})
            buf = []
        else:
            buf.append(l)
json.dump(out, open("mpep/toc.json", "w"))
S = out["sections"]
print(len(S), "sections")
for ch, ti in out["chapters"].items(): print(ch, ti[:70], sum(1 for s in S if s["ch"] == ch))
import random; random.seed(3)
for s in random.sample(S, 8): print("  ", s)
