import time, urllib.request, urllib.parse, json, io
from PIL import Image

API = "https://commons.wikimedia.org/w/api.php"
JOBS = [
    ("deck-fort.jpg", "File:Mehrangarh Fort 2, Jodhpur, Rajasthan, India.jpg", "Mehrangarh Fort, Jodhpur"),
    ("deck-ranakpur.jpg", "File:Pillars of Ranakpur Jain Temple 01.jpg", "Ranakpur pillars"),
    ("deck-humayun.jpg", "File:Humayun's Tomb, Delhi 1.jpg", "Humayun's Tomb, Delhi"),
    ("deck-cst.jpg", "File:Chhatrapati Shivaji Terminus, Mumbai.jpg", "CST Mumbai"),
    ("deck-sanchi.jpg", "File:Great Sanchi Stupa (3).jpg", "Great Stupa, Sanchi"),
    ("deck-lotus.jpg", "File:The Lotus temple in Delhi, India (7).jpg", "Lotus Temple, Delhi"),
]

def api(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "AtelierFractals/1.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)

lines = open("assets/photo/CREDITS.md", encoding="utf-8").read().rstrip("\n").split("\n")
for name, title, short in JOBS:
    try:
        data = api({"action": "query", "format": "json", "titles": title,
                    "prop": "imageinfo", "iiprop": "url|extmetadata|size",
                    "iiurlwidth": 1000})
        p = next(iter(((data.get("query") or {}).get("pages") or {}).values()))
        ii = (p.get("imageinfo") or [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        req = urllib.request.Request(url, headers={"User-Agent": "AtelierFractals/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw)); im.verify()
        im = Image.open(io.BytesIO(raw))
        if im.width < 400 or len(raw) < 15000:
            raise ValueError(f"too small {im.size}")
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        im.save(f"assets/photo/{name}", "JPEG", quality=86)
        meta = ii.get("extmetadata", {})
        artist = (meta.get("Artist") or {}).get("value", "?")[:120]
        lic = (meta.get("LicenseShortName") or {}).get("value", "?")
        lines.append(f"- {name} ({short}): {title} | {lic} | {artist}")
        print(f"OK {name} {im.size}")
        time.sleep(1)
    except Exception as e:
        print(f"FAIL {name}: {e}")
open("assets/photo/CREDITS.md", "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("credits:", len(lines) - 2)
