import glob
FONT_OLD = "family=Inter:wght@400;500;600&display=swap"
FONT_NEW = "family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap"
GSAP = ('<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>\n'
        '<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>\n')
SITE = '<script src="site.js"></script>'
n = 0
for f in glob.glob("*.html"):
    s = open(f, encoding="utf-8").read()
    changed = False
    if FONT_OLD in s and "Space+Grotesk" not in s:
        s = s.replace(FONT_OLD, FONT_NEW)
        changed = True
    if SITE in s and "gsap.min.js" not in s:
        s = s.replace(SITE, GSAP + SITE)
        changed = True
    if changed:
        open(f, "w", encoding="utf-8").write(s)
        n += 1
print("updated", n, "pages")
