import glob
n = 0
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    if "YOUR NAME" in s:
        open(f, "w", encoding="utf-8").write(s.replace("YOUR NAME", "Sagnik Ray"))
        n += 1
print("renamed in", n, "pages")
