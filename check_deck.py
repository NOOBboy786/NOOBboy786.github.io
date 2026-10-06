import urllib.request, urllib.parse, json
API = "https://commons.wikimedia.org/w/api.php"
QUERIES = ["Mehrangarh Fort Jodhpur", "Ranakpur Jain temple pillars",
           "Humayun Tomb Delhi", "Chhatrapati Shivaji Terminus Mumbai",
           "Great Stupa Sanchi", "Lotus Temple Delhi", "Mysore Palace"]
def api(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "AtelierFractals/1.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)
for q in QUERIES:
    print("=" * 20, q)
    try:
        data = api({"action": "query", "format": "json", "generator": "search",
                    "gsrsearch": q, "gsrnamespace": 6, "gsrlimit": 6,
                    "prop": "imageinfo", "iiprop": "size"})
        pages = (data.get("query") or {}).get("pages") or {}
        for p in sorted(pages.values(), key=lambda x: x.get("index", 0)):
            ii = (p.get("imageinfo") or [{}])[0]
            print(f"  - {p.get('title','?')} [{ii.get('width')}x{ii.get('height')}]")
    except Exception as e:
        print("  ERROR", e)
