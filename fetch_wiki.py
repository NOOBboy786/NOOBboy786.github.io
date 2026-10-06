import os, json, urllib.request, urllib.parse, io
from PIL import Image

API = "https://commons.wikimedia.org/w/api.php"
JOBS = [
    ("hero-palace.jpg", "Hawa Mahal Jaipur"),
    ("stepwell.jpg", "Chand Baori stepwell"),
    ("haveli.jpg", "haveli Shekhawati fresco"),
    ("temple.jpg", "Meenakshi Temple Madurai gopuram"),
    ("kerala.jpg", "Kerala traditional house nalukettu"),
    ("bamboo.jpg", "bamboo house construction"),
    ("earth.jpg", "mud house India"),
    ("lattice.jpg", "stone jali lattice window India"),
    ("courtyard.jpg", "courtyard house India"),
    ("green.jpg", "green building India terrace garden"),
]

def api(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "AtelierFractals/1.0 (portfolio)"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)

os.makedirs("assets/photo", exist_ok=True)
credits = []
for name, term in JOBS:
    try:
        data = api({"action": "query", "format": "json", "generator": "search",
                    "gsrsearch": term, "gsrnamespace": 6, "gsrlimit": 10,
                    "prop": "imageinfo", "iiprop": "url|extmetadata|size",
                    "iiurlwidth": 1000})
        pages = (data.get("query") or {}).get("pages") or {}
        best, bestw = None, 0
        for p in pages.values():
            ii = (p.get("imageinfo") or [{}])[0]
            w = ii.get("width", 0)
            u = ii.get("thumburl") or ii.get("url")
            if u and w and w >= 800 and w > bestw:
                best, bestw = ii, w
        if not best:
            raise ValueError("no suitable image found")
        req = urllib.request.Request(best["thumburl"] or best["url"],
                                     headers={"User-Agent": "AtelierFractals/1.0 (portfolio)"})
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw)); im.verify()
        im = Image.open(io.BytesIO(raw))
        if im.width < 400 or len(raw) < 15000:
            raise ValueError(f"too small {im.size}")
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        im.save(f"assets/photo/{name}", "JPEG", quality=86)
        meta = best.get("extmetadata", {})
        artist = (meta.get("Artist") or {}).get("value", "?")[:120]
        lic = (meta.get("LicenseShortName") or {}).get("value", "?")
        credits.append(f"- {name}: {best.get('descriptionurl','')} | {lic} | {artist}")
        print(f"OK {name} {im.size}")
    except Exception as e:
        print(f"FAIL {name}: {e}")
open("assets/photo/CREDITS.md", "w", encoding="utf-8").write(
    "# Photo credits (Wikimedia Commons)\n\n" + "\n".join(credits) + "\n")
print("credits written:", len(credits))
