import glob
n = 0
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    t = s.replace("styles.css?v=3", "styles.css?v=4").replace("site.js?v=3", "site.js?v=4")
    if t != s:
        open(f, "w", encoding="utf-8").write(t)
        n += 1
print("bumped", n, "pages")
