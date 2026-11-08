# Writes src/practice/mpep-index.js from MPEP section headings.
# Pipeline (MPEP E9 R-01.2024 zip from uspto.gov/web/offices/pac/mpep/):
#   extract_mpep_text.py raw/ txt/  ->  mpep_toc.py  ->  mpep_titles.py  ->  this script
import json, sys, collections
src, out, tocf = sys.argv[1], sys.argv[2], sys.argv[3]   # sections_clean.json, output, toc.json
D = json.load(open(src))
secs = [s for s in D["sections"] if not s.get("toc")]          # body headings only: verified titles
count = collections.Counter(s["title"].lower() for s in secs)
GENERIC = ("introduction", "definitions", "forms", "general", "scope", "applicability")
keep = [s for s in secs if count[s["title"].lower()] == 1 and len(s["title"]) >= 12
        and not s["title"].lower().startswith(GENERIC) and "[Reserved]" not in s["title"]]
idx = {s["sec"]: s["title"] for s in keep}
SIT = [
 ("A reply deadline falls on a Saturday. Where's the rule that moves it?", "710.05"),
 ("How is the due date of a 3-month shortened statutory period computed?", "710.01(a)"),
 ("Applicant missed a deadline unintentionally and wants the application revived.", "711.03(c)"),
 ("Applicant wants to file an IDS after a final rejection.", "609.04(b)"),
 ("A terminal disclaimer is needed to overcome a double patenting rejection.", "1490"),
 ("A joint inventor was left off a pending application.", "602.01(c)"),
 ("The printed patent contains an error the Office made.", "1480"),
 ("The issued patent has a minor typo the applicant made.", "1481"),
 ("The patentee wants to broaden the claims through reissue.", "1412.03"),
 ("Reissue claims drop a limitation that was added to get the original claims allowed.", "1412.02"),
 ("After a final rejection, applicant wants examination to continue with an RCE.", "706.07(h)"),
 ("What must an appeal brief contain?", "1205.02"),
 ("Applicant wants to file a notice of appeal.", "1204"),
 ("Applicant files an amendment after the notice of appeal.", "1206"),
 ("May a third party request ex parte reexamination?", "2212"),
 ("When can the 2nd maintenance fee be paid without a surcharge?", "2506"),
 ("How much patent term adjustment is earned for USPTO delays?", "2731"),
 ("Does the applicant qualify for micro entity fees?", "509.04"),
 ("A nonprovisional needs to claim the benefit of a provisional.", "211.01(a)"),
 ("The examiner restricts between a process of making and the product made.", "806.05(f)"),
 ("A product-by-process claim is rejected over a prior art product.", "2113"),
 ("A claim uses \"means for\" language.", "2181"),
 ("Is the experimentation needed to practice the invention \"undue\"?", "2164.01(a)"),
 ("Which rationales support a prima facie case of obviousness (KSR)?", "2143"),
 ("Applicant has evidence of commercial success to rebut obviousness.", "716.01(a)"),
 ("Who owes the duty of disclosure to the Office?", "2001.01"),
 ("Entering the U.S. national stage from a PCT application.", "1893.01"),
 ("What is the filing date of a U.S. national stage application?", "1893.03(b)"),
 ("Appointing a power of attorney in an application filed after September 16, 2012.", "402.02(a)"),
 ("Applicant wants faster examination via a petition to make special.", "708.02"),
 ("Scheduling an interview with the examiner.", "713"),
 ("Applicant wants to expressly abandon the application.", "711.01"),
 ("What goes in a request for supplemental examination?", "2811"),
 ("An applicant alleges that an earlier applicant derived the invention from them.", "2310"),
 ("A design claim is rejected as purely functional.", "1504.01(c)"),
 ("A reference doesn't expressly disclose a feature, but the feature necessarily results.", "2112"),
 ("Is a thesis shelved in a university library a printed publication?", "2128"),
 ("Pre-AIA: the inventor's product was offered for sale before the critical date.", "2133.03(b)"),
 ("Pre-AIA: was a public use really experimental?", "2133.03(e)"),
 ("A claim recites \"selected from the group consisting of...\"", "2117"),
 ("A claim excludes an element (\"free of X\").", "2173.05(i)"),
 ("A claim uses relative terms like \"about\" or \"substantially\".", "2173.05(b)"),
 ("Under the AIA, can the inventor's own earlier patent be prior art?", "2152.02(f)"),
 ("The inventor published the invention 6 months before filing (AIA).", "2153.01(a)"),
 ("A commonly owned, earlier-filed U.S. application is cited against the claims.", "2154.02(c)"),
 ("Does the claim recite an abstract idea, and which grouping?", "2106.04(a)(2)"),
 ("Does the AIA apply to a continuation filed in 2015?", "2159"),
 ("What is the period for reply to a final rejection?", "706.07(f)"),
 ("Paying the issue fee after allowance.", "1306"),
 ("How long after a foreign filing can a U.S. nonprovisional still claim priority?", "213.03"),
 ("An amended claim may lack written description support.", "2163"),
 ("Does the specification disclose the best mode?", "2165"),
 ("The examiner makes an examiner's amendment at allowance.", "1302.04"),
 ("Two applications by the same inventor claim the same invention.", "804"),
]
# Situation answers may use TOC titles (each was checked by hand against the TOC).
title_of = {s["sec"]: s["title"] for s in json.load(open(tocf))["sections"]}
title_of.update({s["sec"]: s["title"] for s in secs})
missing = [s for _, s in SIT if s not in title_of]
assert not missing, missing
data = {"chapters": D["chapters"],
        "sections": [[s["sec"], s["title"]] for s in keep],
        "situations": [[q, s, title_of[s]] for q, s in SIT]}
open(out, "w").write("// Generated by tools/build_mpep_index.py from MPEP E9 R-01.2024 section headings. Do not edit.\nvar MPEP_INDEX = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\nif (typeof module !== \"undefined\") module.exports = MPEP_INDEX;\n")
print(len(keep), "sections,", len(SIT), "situations ->", out)
