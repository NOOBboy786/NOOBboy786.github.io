import glob, re
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    for a in re.findall(r"<article class=\"beat.*?</article>", s, re.S):
        kids = re.findall(r"<(p|h3|div|ul|ol)", a)
        if kids[:2] != ["p", "div"]:
            print(f, "->", kids)
print("sweep done")
