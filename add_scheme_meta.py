import glob
TAG = '<meta name="color-scheme" content="light dark">'
ANCHOR = '<meta name="viewport"'
n = 0
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    if TAG not in s and ANCHOR in s:
        s = s.replace(ANCHOR, TAG + "\n" + ANCHOR, 1)
        open(f, "w", encoding="utf-8").write(s)
        n += 1
print("meta added to", n, "pages")
