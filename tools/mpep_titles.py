import re, json, glob, os
CH = {"0100":"Secrecy, Access, National Security, and Foreign Filing","0200":"Types and Status of Application; Benefit and Priority Claims","0300":"Ownership and Assignment","0400":"Representative of Applicant or Owner","0500":"Receipt and Handling of Mail and Papers","0600":"Parts, Form, and Content of Application","0700":"Examination of Applications","0800":"Restriction in Applications Filed Under 35 U.S.C. 111; Double Patenting","0900":"Prior Art, Search, Classification, and Routing","1000":"Matters Decided by Various U.S. Patent and Trademark Office Officials","1100":"Statutory Invention Registration (SIR); Pre-Grant Publication (PGPub) and Preissuance Submissions","1200":"Appeal","1300":"Allowance and Issue","1400":"Correction of Patents","1500":"Design Patents","1600":"Plant Patents","1700":"Miscellaneous","1800":"Patent Cooperation Treaty","1900":"Protest","2000":"Duty of Disclosure","2100":"Patentability","2200":"Citation of Prior Art and Ex Parte Reexamination of Patents","2300":"Interference and Derivation Proceedings","2400":"Biotechnology","2500":"Maintenance Fees","2600":"Optional Inter Partes Reexamination","2700":"Patent Terms, Adjustments, and Extensions","2800":"Supplemental Examination","2900":"International Design Applications"}
toc = {s["sec"]: s for s in json.load(open("mpep/toc.json"))["sections"]}
HDR = re.compile(r'\n(\d{3,4}(?:\.\d+)*(?:\([a-z0-9]+\))*)\s{1,4}([A-Z“"\[][^\[]{2,320}?)\s*\[(?:R-\d\d\.\d{4}|Pre-AIA|Reserved)', re.S)
out = []
for f in sorted(glob.glob("mpep/txt/mpep-[0-2][0-9]00.txt")):
    ch = os.path.basename(f)[5:9]; t = open(f).read()
    t = re.sub(r'\n(?:Rev\. \d\d\.\d{4}, \w+ +\d{4}|\d{3,4}-\d+|§ ?[\d.()a-z]+|MANUAL OF PATENT EXAMINING PROCEDURE|[A-Z ,;:()\-.]{6,})(?=\n)', '', t.replace('\f', '\n'))
    body = t[t.find("[R-") - 400:]
    seen = set()
    for m in HDR.finditer(body):
        sec = m.group(1)
        if sec[:2] != ch[:2] or sec in seen or sec not in toc: continue
        title = re.sub(r'\s+', ' ', re.sub(r'-\n(?=[a-z])', '', m.group(2))).strip()
        if '\n\n' in m.group(2) or len(title) > 200: continue
        seen.add(sec); out.append({"ch": ch, "sec": sec, "title": title})
    # sections found only in the TOC keep their TOC title if it's short and clean
    for s, v in toc.items():
        if v["ch"] == ch and s not in seen and len(v["title"]) < 70: out.append(dict(v, toc=True))
bad = lambda ti: ti.startswith("[Reserved]") or ti.lower().startswith("form paragraph")
good = [s for s in out if not bad(s["title"])]
json.dump({"chapters": CH, "sections": good}, open("mpep/sections_clean.json", "w"))
print(len(out), "titled;", len(good), "usable;", sum(1 for s in good if s.get("toc")), "from TOC fallback")
idx = {s["sec"]: s["title"] for s in good}
for w in ["140","2159","2153.01(a)","2154.02(c)","2163","2154.02(b)","1412.02","706.07(f)","2106.04(a)(2)"]: print(f"  {w:<14}{idx.get(w,'*** missing ***')}")
