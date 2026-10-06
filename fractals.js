/* fractals.js — three live instruments, no libraries.
   1) Escape-time (Mandelbrot / Julia)  2) IFS chaos game  3) L-system turtle.
   Also grows the index hero tree from scroll progress. All canvases degrade
   to a <noscript>-adjacent fallback note when JS is unavailable. */
(function () {
  "use strict";

  /* ---------- shared helpers ---------- */
  function fitCanvas(cv, w, h) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = h * dpr;
    cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    cv.style.aspectRatio = w + " / " + h;
    return cv.getContext("2d");
  }
  // luxury ramp: umber -> cognac -> sand -> ivory
  var RAMP = [[29,23,18],[74,58,44],[154,91,46],[214,178,124],[247,242,233]];
  function rampColor(t) {
    t = Math.min(1, Math.max(0, t));
    var seg = t * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(seg)), f = seg - i;
    var a = RAMP[i], b = RAMP[i + 1];
    return "rgb(" + Math.round(a[0]+(b[0]-a[0])*f) + "," + Math.round(a[1]+(b[1]-a[1])*f) + "," + Math.round(a[2]+(b[2]-a[2])*f) + ")";
  }

  /* ---------- hero tree (index signature moment) ---------- */
  (function heroTree() {
    var cv = document.getElementById("heroTree"); if (!cv) return;
    var ctx = fitCanvas(cv, 520, 640);
    var progress = 0;
    function branch(x, y, len, ang, w, depth, grow) {
      if (depth <= 0 || len < 2) return;
      var seg = Math.min(1, grow * (depth + 2));
      if (seg <= 0) return;
      var nx = x + Math.cos(ang) * len * seg, ny = y - Math.sin(ang) * len * seg;
      ctx.strokeStyle = depth > 5 ? "#4a3a2c" : (depth > 2 ? "#7c4522" : "#9a5b2e");
      ctx.lineWidth = Math.max(1, w * seg); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
      if (seg < 1) return;
      var sway = Math.sin(depth * 2.1) * 0.12;
      branch(nx, ny, len * 0.76, ang + 0.42 + sway, w * 0.68, depth - 1, grow * 1.35 - 0.18);
      branch(nx, ny, len * 0.76, ang - 0.42 + sway, w * 0.68, depth - 1, grow * 1.35 - 0.18);
      if (depth % 3 === 0) branch(nx, ny, len * 0.6, ang + sway * 2, w * 0.5, depth - 2, grow * 1.3 - 0.2);
    }
    function draw() {
      ctx.clearRect(0, 0, 520, 640);
      ctx.fillStyle = "#f7f2e9"; ctx.fillRect(0, 0, 520, 640);
      ctx.strokeStyle = "rgba(43,38,32,.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 600); ctx.lineTo(520, 600); ctx.stroke(); // ground rule
      branch(260, 600, 120, Math.PI / 2, 11, 9, 0.12 + progress * 1.05);
    }
    window.addEventListener("signature-progress", function () {
      var p = (typeof window.__signatureProgress === "number") ? window.__signatureProgress : 1;
      if (Math.abs(p - progress) > 0.002) { progress = p; requestAnimationFrame(draw); }
    });
    progress = (typeof window.__signatureProgress === "number") ? window.__signatureProgress : 0;
    draw();
  })();

  /* ---------- 1) ESCAPE-TIME ---------- */
  (function escapeTime() {
    var cv = document.getElementById("escapeCanvas"); if (!cv) return;
    var W = 560, H = 380, ctx = fitCanvas(cv, W, H);
    var img = ctx.createImageData(W, H);
    var state = { mode: "mandelbrot", cx: -0.65, cy: 0, scale: 2.6, maxIter: 120, jx: -0.8, jy: 0.156, anim: false, t: 0, row: 0, rendering: false };

    function renderChunk() {
      var rows = 24, done = 0;
      while (done < rows && state.row < H) {
        var y = state.row++;
        for (var x = 0; x < W; x++) {
          var zx, zy, px, py;
          if (state.mode === "mandelbrot") {
            px = state.cx + (x / W - 0.5) * state.scale * (W / H) * 1.0;
            py = state.cy + (y / H - 0.5) * state.scale;
            zx = 0; zy = 0;
          } else {
            zx = state.cx + (x / W - 0.5) * state.scale;
            zy = state.cy + (y / H - 0.5) * state.scale;
            px = state.jx; py = state.jy;
          }
          var i = 0, zx2, zy2;
          while (i < state.maxIter && (zx * zx + zy * zy) < 4) {
            zx2 = zx * zx - zy * zy + px; zy = 2 * zx * zy + py; zx = zx2; i++;
          }
          var idx = (y * W + x) * 4;
          if (i >= state.maxIter) { img.data[idx]=29; img.data[idx+1]=23; img.data[idx+2]=18; img.data[idx+3]=255; }
          else {
            var c = rampColor(i / state.maxIter).match(/\d+/g);
            img.data[idx]=+c[0]; img.data[idx+1]=+c[1]; img.data[idx+2]=+c[2]; img.data[idx+3]=255;
          }
        }
        done++;
      }
      ctx.putImageData(img, 0, 0);
      if (state.row < H) requestAnimationFrame(renderChunk);
      else state.rendering = false;
    }
    function render() { state.row = 0; if (!state.rendering) { state.rendering = true; requestAnimationFrame(renderChunk); } }

    // controls
    function bind(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener("input", fn); }
    bind("escIter", function (e) { state.maxIter = +e.target.value; document.getElementById("escIterVal").textContent = state.maxIter; render(); });
    var modeSel = document.getElementById("escMode");
    if (modeSel) modeSel.addEventListener("change", function () {
      state.mode = modeSel.value;
      document.getElementById("juliaCtl").style.display = state.mode === "julia" ? "" : "none";
      state.cx = -0.65; state.cy = 0; state.scale = state.mode === "julia" ? 3.0 : 2.6; render();
    });
    bind("jx", function (e) { state.jx = +e.target.value; render(); });
    bind("jy", function (e) { state.jy = +e.target.value; render(); });
    var animBtn = document.getElementById("escAnimate");
    if (animBtn) animBtn.addEventListener("click", function () {
      state.anim = !state.anim; animBtn.textContent = state.anim ? "Pause orbit" : "Animate c";
      if (state.anim) {
        if (modeSel) { modeSel.value = "julia"; state.mode = "julia"; document.getElementById("juliaCtl").style.display = ""; }
        (function orbit() {
          if (!state.anim) return;
          state.t += 0.03; state.jx = 0.7885 * Math.cos(state.t); state.jy = 0.7885 * Math.sin(state.t);
          render(); setTimeout(function () { requestAnimationFrame(orbit); }, 450);
        })();
      }
    });
    cv.addEventListener("click", function (ev) {
      var r = cv.getBoundingClientRect();
      var fx = (ev.clientX - r.left) / r.width - 0.5, fy = (ev.clientY - r.top) / r.height - 0.5;
      state.cx += fx * state.scale; state.cy += fy * state.scale;
      state.scale *= ev.shiftKey ? 2 : 0.5; render();
    });
    function zbtn(id, f) { var b = document.getElementById(id); if (b) b.addEventListener("click", function () { f(); render(); }); }
    zbtn("escZoomIn", function () { state.scale *= 0.5; });
    zbtn("escZoomOut", function () { state.scale *= 2; });
    zbtn("escReset", function () { state.cx = -0.65; state.cy = 0; state.scale = state.mode === "julia" ? 3.0 : 2.6; });
    render();
  })();

  /* ---------- 2) IFS chaos game ---------- */
  (function ifs() {
    var cv = document.getElementById("ifsCanvas"); if (!cv) return;
    var W = 560, H = 380, ctx = fitCanvas(cv, W, H);
    var SETS = {
      fern: { maps: [[0,0,0,0.16,0,0,0.85],[0.85,0.04,-0.04,0.85,0,1.6,0.85],[0.2,-0.26,0.23,0.22,0,1.6,0.07],[-0.15,0.28,0.26,0.24,0,0.44,0.07]], bounds: [-2.5, 10.5, -0.5, 10.2] },
      sierpinski: { maps: [[0.5,0,0,0.5,0,0,0.34],[0.5,0,0,0.5,0.5,0,0.33],[0.5,0,0,0.5,0.25,0.5,0.33]], bounds: [0, 1, 0, 1] },
      dragon: { maps: [[0.5,-0.5,0.5,0.5,0,0,0.5],[ -0.5,-0.5,0.5,-0.5,1,0.5,0.5]], bounds: [-0.6, 1.2, -0.4, 1.1] }
    };
    var name = "fern", x = 0, y = 0, plotted = 0, running = false;
    function mapSet() { return SETS[name]; }
    function plot() {
      var s = mapSet(), n = 1400, b = s.bounds;
      ctx.fillStyle = "rgba(247,220,170,.85)";
      for (var k = 0; k < n; k++) {
        var r = Math.random(), acc = 0, m = s.maps[0], j;
        for (j = 0; j < s.maps.length; j++) { acc += s.maps[j][6]; if (r <= acc) { m = s.maps[j]; break; } }
        var nx = m[0]*x + m[1]*y + m[4], ny = m[2]*x + m[3]*y + m[5]; x = nx; y = ny;
        var px = (x - b[0]) / (b[1] - b[0]) * W, py = H - (y - b[2]) / (b[3] - b[2]) * H;
        ctx.fillRect(px, py, 1.3, 1.3);
      }
      plotted += n;
      var counter = document.getElementById("ifsCount"); if (counter) counter.textContent = plotted.toLocaleString("en-IN");
      if (running && plotted < 90000) requestAnimationFrame(plot); else running = false;
    }
    function restart() {
      ctx.fillStyle = "#1d1712"; ctx.fillRect(0, 0, W, H);
      x = 0; y = 0; plotted = 0; running = true; plot();
    }
    var sel = document.getElementById("ifsSet");
    if (sel) sel.addEventListener("change", function () { name = sel.value; restart(); });
    var again = document.getElementById("ifsRestart"); if (again) again.addEventListener("click", restart);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { restart(); o.disconnect(); } }, { threshold: 0.3 }).observe(cv);
    } else restart();
  })();

  /* ---------- 3) L-SYSTEM turtle ---------- */
  (function lsys() {
    var cv = document.getElementById("lsysCanvas"); if (!cv) return;
    var W = 560, H = 380, ctx = fitCanvas(cv, W, H);
    var PRESETS = {
      tree: { axiom: "X", rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" }, angle: 22.5, iters: 5 },
      koch: { axiom: "F--F--F", rules: { F: "F+F--F+F" }, angle: 60, iters: 4 },
      hilbert: { axiom: "X", rules: { X: "-YF+XFX+FY-", Y: "+XF-YFY-FX+" }, angle: 90, iters: 5 },
      sierpinski: { axiom: "F-G-G", rules: { F: "F-G+F+G-F", G: "GG" }, angle: 120, iters: 6 }
    };
    var preset = "tree", maxIter = 5, angle = 22.5, segs = [], shown = 0, playing = false;

    function expand() {
      var p = PRESETS[preset], s = p.axiom;
      var n = Math.min(maxIter, preset === "koch" ? 5 : preset === "hilbert" ? 6 : 7);
      for (var i = 0; i < n; i++) {
        var out = "";
        for (var j = 0; j < s.length; j++) { var ch = s[j]; out += p.rules[ch] || ch; }
        s = out; if (s.length > 400000) break;
      }
      // turtle dry-run for bounds
      var pts = [], x = 0, y = 0, a = -Math.PI / 2, stack = [];
      var rad = angle * Math.PI / 180;
      for (var k = 0; k < s.length; k++) {
        var c = s[k];
        if (c === "F" || c === "G") {
          var nx = x + Math.cos(a), ny = y + Math.sin(a);
          pts.push([x, y, nx, ny]); x = nx; y = ny;
        } else if (c === "+") a += rad; else if (c === "-") a -= rad;
        else if (c === "[") stack.push([x, y, a]); else if (c === "]") { var st = stack.pop(); x = st[0]; y = st[1]; a = st[2]; }
      }
      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      pts.forEach(function (q) {
        minX = Math.min(minX, q[0], q[2]); maxX = Math.max(maxX, q[0], q[2]);
        minY = Math.min(minY, q[1], q[3]); maxY = Math.max(maxY, q[1], q[3]);
      });
      var sc = Math.min((W - 40) / Math.max(1e-6, maxX - minX), (H - 40) / Math.max(1e-6, maxY - minY));
      var ox = 20 - minX * sc, oy = 20 - minY * sc;
      segs = pts.map(function (q) { return [ox + q[0] * sc, oy + q[1] * sc, ox + q[2] * sc, oy + q[3] * sc]; });
      shown = 0;
    }
    function paint() {
      ctx.fillStyle = "#1d1712"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#e8c98f"; ctx.lineWidth = preset === "tree" ? 1.4 : 1.1;
      ctx.beginPath();
      for (var i = 0; i < shown && i < segs.length; i++) { var q = segs[i]; ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); }
      ctx.stroke();
      var counter = document.getElementById("lsysCount");
      if (counter) counter.textContent = Math.min(shown, segs.length).toLocaleString("en-IN") + " / " + segs.length.toLocaleString("en-IN");
    }
    function animate() {
      var step = Math.max(60, Math.floor(segs.length / 90));
      shown += step; if (shown >= segs.length) { shown = segs.length; playing = false; paint(); syncBtn(); return; }
      paint(); requestAnimationFrame(animate);
    }
    var growBtn = document.getElementById("lsysGrow");
    function syncBtn() { if (growBtn) growBtn.textContent = playing ? "Growing…" : "Grow"; }
    function redraw() { expand(); paint(); }
    var ps = document.getElementById("lsysPreset");
    if (ps) ps.addEventListener("change", function () {
      preset = ps.value; maxIter = PRESETS[preset].iters; angle = PRESETS[preset].angle;
      var iv = document.getElementById("lsysIter"); if (iv) { iv.value = maxIter; }
      var ivv = document.getElementById("lsysIterVal"); if (ivv) ivv.textContent = maxIter;
      playing = false; redraw();
    });
    var it = document.getElementById("lsysIter");
    if (it) it.addEventListener("input", function () {
      maxIter = +it.value; document.getElementById("lsysIterVal").textContent = maxIter; playing = false; redraw();
    });
    var an = document.getElementById("lsysAngle");
    if (an) an.addEventListener("input", function () {
      angle = +an.value; document.getElementById("lsysAngleVal").textContent = angle + "°"; playing = false; redraw();
    });
    if (growBtn) growBtn.addEventListener("click", function () {
      if (playing) return; shown = 0; playing = true; syncBtn(); animate();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { redraw(); o.disconnect(); } }, { threshold: 0.3 }).observe(cv);
    } else redraw();
  })();
})();
