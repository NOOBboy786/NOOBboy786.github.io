import time, urllib.request, urllib.parse, json, io
from PIL import Image

API = "https://commons.wikimedia.org/w/api.php"
JOBS = [
    ("hero-palace.jpg", "File:East facade of the Hawa Mahal, Jaipur.jpg"),
    ("lattice.jpg", "File:Carved stone window(jali) in qutub complex.jpg"),
    ("courtyard.jpg", "File:Ancestral House of Netaji Subhas Chandra Bose - Courtyard 01.jpg"),
    ("kerala.jpg", "File:Chazhur Kovilakam Nalukettu.JPG"),
    ("bamboo.jpg", "File:Bamboo house in Goalpara.jpg"),
    ("earth.jpg", "File:Mud house Restoration in west bengal India.jpg"),
    ("temple.jpg", "File:MEENAKSHI TEMPLE- WEST TOWER.jpg"),
    ("haveli.jpg", "File:Front Facade View of Shahpura House, Shekhawati, Rajputana.jpg"),
    ("stepwell.jpg", "File:Chand baori stepwell.jpg"),
]

def api(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "AtelierFractals/1.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)

credits = []
for name, title in JOBS:
    try:
        data = api({"action": "query", "format": "json", "titles": title,
                    "prop": "imageinfo", "iiprop": "url|extmetadata|size",
                    "iiurlwidth": 1000})
        pages = (data.get("query") or {}).get("pages") or {}
        p = next(iter(pages.values()))
        ii = (p.get("imageinfo") or [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        req = urllib.request.Request(url, headers={"User-Agent": "AtelierFractals/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw)); im.verify()
        im = Image.open(io.BytesIO(raw))
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        im.save(f"assets/photo/{name}", "JPEG", quality=86)
        meta = ii.get("extmetadata", {})
        artist = (meta.get("Artist") or {}).get("value", "?")[:120]
        lic = (meta.get("LicenseShortName") or {}).get("value", "?")
        credits.append(f"- {name}: {title} | {lic} | {artist}")
        print(f"OK {name} {im.size} <- {title[:60]}")
        time.sleep(1)
    except Exception as e:
        print(f"FAIL {name}: {e}")
open("assets/photo/CREDITS.md", "w", encoding="utf-8").write(
    "# Photo credits (Wikimedia Commons)\n\n" + "\n".join(credits) + "\n")
print("credits:", len(credits))
