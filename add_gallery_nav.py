import glob
old = '<a href="projects.html" data-tab="projects">Projects</a>'
new = '<a href="gallery.html" data-tab="gallery">Gallery</a>\n    ' + old
n = 0
for f in glob.glob("*.html"):
    if f == "gallery.html":
        continue
    s = open(f, encoding="utf-8").read()
    if old in s and "gallery.html" not in s:
        open(f, "w", encoding="utf-8").write(s.replace(old, new))
        n += 1
print("nav updated in", n, "pages")
