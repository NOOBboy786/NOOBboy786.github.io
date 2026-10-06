import glob
REPS = [
    ('href="styles.css"', 'href="styles.css?v=3"'),
    ('src="site.js"', 'src="site.js?v=3"'),
    ('src="fractals.js"', 'src="fractals.js?v=3"'),
    ('src="github.js"', 'src="github.js?v=3"'),
]
n = 0
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    changed = False
    for old, new in REPS:
        if old in s and new not in s:
            s = s.replace(old, new)
            changed = True
    if changed:
        open(f, "w", encoding="utf-8").write(s)
        n += 1
print("cache-busted", n, "pages")
