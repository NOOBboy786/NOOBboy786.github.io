import os, urllib.request, io
from PIL import Image

JOBS = [
    ("hero-palace.jpg", "amber,palace,india", 1600, 900),
    ("stepwell.jpg", "stepwell,india", 900, 700),
    ("haveli.jpg", "haveli,jaipur", 900, 700),
    ("temple.jpg", "tamil,temple", 900, 700),
    ("kerala.jpg", "kerala,house", 900, 700),
    ("bamboo.jpg", "bamboo,house", 900, 700),
    ("earth.jpg", "mud,house", 900, 700),
    ("lattice.jpg", "lattice,window", 900, 700),
    ("courtyard.jpg", "courtyard,india", 900, 700),
    ("green.jpg", "green,building", 900, 700),
]
os.makedirs("assets/photo", exist_ok=True)
ok, bad = [], []
for name, kw, w, h in JOBS:
    url = f"https://loremflickr.com/{w}/{h}/{kw}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=40) as r:
            data = r.read()
        im = Image.open(io.BytesIO(data))
        im.verify()
        im = Image.open(io.BytesIO(data))
        if im.width < 400 or len(data) < 15000:
            raise ValueError(f"too small: {im.size} {len(data)}b")
        open(f"assets/photo/{name}", "wb").write(data)
        ok.append(f"{name} {im.size} {len(data)//1024}KB")
    except Exception as e:
        bad.append(f"{name}: {e}")
print("OK:")
print("\n".join(ok))
print("FAILED:")
print("\n".join(bad) if bad else "none")
