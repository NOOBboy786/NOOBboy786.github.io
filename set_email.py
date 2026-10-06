import glob
n = 0
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    if "you@example.com" in s:
        open(f, "w", encoding="utf-8").write(s.replace("you@example.com", "sagnikrays@gmail.com"))
        n += 1
print("email updated in", n, "pages")
