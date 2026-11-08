import sys, os, fitz
from concurrent.futures import ProcessPoolExecutor
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
def one(f):
    d = fitz.open(os.path.join(src, f))
    pages = [p.get_text() for p in d]
    imgs = sum(len(p.get_images()) for p in d)
    open(os.path.join(out, f[:-4] + ".txt"), "w").write("\f".join(pages))
    return f, len(pages), sum(len(t.split()) for t in pages), imgs
if __name__ == "__main__":
  with ProcessPoolExecutor() as ex:
      rows = sorted(ex.map(one, [f for f in os.listdir(src) if f.endswith(".pdf")]))
  tp = tw = 0
  for f, p, w, i in rows:
    tp += p; tw += w; print(f"{f:42s} {p:5d} pp {w:8d} words {i:4d} images")
  print(f"TOTAL {tp} pages, {tw} words")
