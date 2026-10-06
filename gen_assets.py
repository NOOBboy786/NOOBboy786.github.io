"""Render gallery artwork in the site's quiet-luxury palette. Run: python3 gen_assets.py"""
import numpy as np
from PIL import Image, ImageDraw

PAPER = (247, 242, 233); INK = (43, 38, 32); COGNAC = (154, 91, 46)
UMBER = (74, 58, 44); SAND = (227, 213, 189); GOLD = (214, 178, 124)

def ramp_img(counts, maxiter):
    """Map iteration counts through the luxury ramp."""
    stops = np.array([[29, 23, 18], UMBER, COGNAC, GOLD, PAPER], dtype=float)
    t = np.clip(counts / maxiter, 0, 1)
    pos = t * (len(stops) - 1)
    i0 = np.clip(pos.astype(int), 0, len(stops) - 2)
    f = (pos - i0)[..., None]
    rgb = stops[i0] * (1 - f) + stops[np.clip(i0 + 1, 0, len(stops) - 1)] * f
    rgb[counts >= maxiter] = (29, 23, 18)
    return rgb.astype(np.uint8)

def mandelbrot(w=900, h=600, cx=-0.65, cy=0.0, scale=2.6, maxiter=160):
    ys, xs = np.mgrid[0:h, 0:w]
    px = cx + (xs / w - 0.5) * scale * (w / h)
    py = cy + (ys / h - 0.5) * scale
    z = np.zeros_like(px, dtype=np.complex128)
    c = px + 1j * py
    out = np.full(px.shape, maxiter, dtype=int)
    mask = np.ones(px.shape, dtype=bool)
    for i in range(maxiter):
        z[mask] = z[mask] ** 2 + c[mask]
        escaped = np.abs(z) > 2
        out[mask & escaped] = i
        mask &= ~escaped
        if not mask.any():
            break
    return Image.fromarray(ramp_img(out, maxiter))

def julia(w=900, h=600, cnum=complex(-0.8, 0.156), scale=3.0, maxiter=160):
    ys, xs = np.mgrid[0:h, 0:w]
    z = (xs / w - 0.5) * scale + 1j * ((ys / h - 0.5) * scale)
    out = np.full(z.shape, maxiter, dtype=int)
    mask = np.ones(z.shape, dtype=bool)
    for i in range(maxiter):
        z[mask] = z[mask] ** 2 + cnum
        escaped = np.abs(z) > 2
        out[mask & escaped] = i
        mask &= ~escaped
        if not mask.any():
            break
    return Image.fromarray(ramp_img(out, maxiter))

def fern(w=800, h=1000, n=220000):
    img = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(img)
    maps = [(0, 0, 0, 0.16, 0, 0, 0.01), (0.85, 0.04, -0.04, 0.85, 0, 1.6, 0.85),
            (0.2, -0.26, 0.23, 0.22, 0, 1.6, 0.07), (-0.15, 0.28, 0.26, 0.24, 0, 0.44, 0.07)]
    probs = np.cumsum([m[6] for m in maps])
    x = y = 0.0
    cols = [INK, UMBER, COGNAC]
    for _ in range(n):
        r = np.random.random()
        m = maps[int(np.searchsorted(probs, r))]
        x, y = m[0] * x + m[1] * y + m[4], m[2] * x + m[3] * y + m[5]
        px = int((x + 2.5) / 5.2 * w)
        py = int(h - (y / 10.2) * h)
        if 0 <= px < w and 0 <= py < h:
            d.point((px, py), fill=cols[int(y * 3 / 10.2) % 3])
    return img

def ltree(w=900, h=900, iters=6):
    axiom, rules, ang = "X", {"X": "F+[[X]-X]-F[-FX]+X", "F": "FF"}, 22.5
    s = axiom
    for _ in range(iters):
        s = "".join(rules.get(ch, ch) for ch in s)
    img = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(img)
    import math
    segs, x, y, a, st = [], 0.0, 0.0, math.pi / 2, []
    rad = math.radians(ang)
    for ch in s:
        if ch in "F":
            nx, ny = x + math.cos(a), y + math.sin(a)
            segs.append((x, y, nx, ny)); x, y = nx, ny
        elif ch == "+": a += rad
        elif ch == "-": a -= rad
        elif ch == "[": st.append((x, y, a))
        elif ch == "]": x, y, a = st.pop()
    xs = [p for q in segs for p in (q[0], q[2])]
    ys = [p for q in segs for p in (q[1], q[3])]
    sc = min((w - 60) / (max(xs) - min(xs)), (h - 60) / (max(ys) - min(ys)))
    ox, oy = 30 - min(xs) * sc, h - 30 - min(ys) * sc - 0  # y grows downward on canvas
    # note: turtle y grows upward; flip
    for k, (x0, y0, x1, y1) in enumerate(segs):
        col = INK if k < len(segs) * 0.55 else (UMBER if k < len(segs) * 0.85 else COGNAC)
        d.line([ox + x0 * sc, oy - y0 * sc, ox + x1 * sc, oy - y1 * sc], fill=col, width=2)
    return img

if __name__ == "__main__":
    import os
    os.makedirs("assets", exist_ok=True)
    mandelbrot().save("assets/mandelbrot.png")
    print("mandelbrot.png ok")
    julia().save("assets/julia.png")
    print("julia.png ok")
    fern().save("assets/fern.png")
    print("fern.png ok")
    ltree().save("assets/tree.png")
    print("tree.png ok")
