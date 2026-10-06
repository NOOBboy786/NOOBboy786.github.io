/* site.js — motion system (motioncraft stream 2: GSAP + ScrollTrigger scrollytelling).
   One scroll clock per path: GSAP ScrollTriggers when the CDN loads, else the
   vanilla rAF engine. Reduced-motion / coarse pointers get a static composition.
   Content is always visible without JS (see .js-motion gating in styles.css). */
(function () {
  "use strict";
  document.documentElement.classList.add("js-motion");
  document.body.classList.add("loaded");
  if (document.querySelector(".lab-tabs")) document.body.classList.add("has-tabs");

  /* active tab + year */
  var page = document.body.getAttribute("data-page");
  document.querySelectorAll(".tabs a").forEach(function (a) {
    if (a.getAttribute("data-tab") === page) { a.classList.add("active"); a.setAttribute("aria-current", "page"); }
  });
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  /* lab tabs (fractals page) */
  document.querySelectorAll(".lab-tabs").forEach(function (bar) {
    bar.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button"); if (!btn) return;
      bar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", "false"); });
      btn.setAttribute("aria-selected", "true");
      var scope = bar.parentElement;
      scope.querySelectorAll(".lab-panel").forEach(function (p) { p.classList.toggle("on", p.id === "panel-" + btn.dataset.lab); });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      window.dispatchEvent(new Event("resize"));
    });
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var track = document.querySelector(".story-track");

  function signatureDone() {
    window.__signatureProgress = 1;
    window.dispatchEvent(new Event("signature-progress"));
  }

  if (reduceMotion || coarse) {
    // static composed state: everything visible, tree fully grown
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    signatureDone();
    return;
  }

  var hasGsap = typeof window.gsap !== "undefined";
  var hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- reveals ---------- */
  if (hasST) {
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "power3.out", overwrite: true }); },
      once: true
    });
    gsap.set(".reveal", { opacity: 0, y: 26 });
    // clip-path birth for plates
    document.querySelectorAll(".plate").forEach(function (p) {
      gsap.fromTo(p, { clipPath: "inset(0 0 100% 0)" }, {
        clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "power3.inOut",
        scrollTrigger: { trigger: p, start: "top 82%", toggleActions: "play none none reverse" }
      });
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    document.querySelectorAll(".plate").forEach(function (p) {
      p.style.clipPath = "inset(0 0 100% 0)";
      p.style.transition = "clip-path 1.1s cubic-bezier(.22,.8,.24,1)";
    });
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.style.clipPath = "inset(0 0 0% 0)"; pio.unobserve(e.target); } });
    }, { threshold: 0.25 });
    document.querySelectorAll(".plate").forEach(function (p) { pio.observe(p); });
  }

  /* ---------- hero entrance ---------- */
  if (hasGsap) {
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".scene-hero .kicker", { opacity: 0, x: -24, duration: 0.7 }, 0.1)
      .fromTo(".scene-hero .mask-line > span", { yPercent: 110 }, { yPercent: 0, duration: 1.05, stagger: 0.12,
        onComplete: function () { gsap.set(".scene-hero .mask-line > span", { clearProps: "transform" }); } }, 0.2)
      .from(".scene-hero .lede", { opacity: 0, y: 24, duration: 0.8 }, 0.7)
      .from(".scene-hero .cta-row", { opacity: 0, y: 18, duration: 0.7 }, 0.9)
      .from(".scene-hero .plate-hero", { opacity: 0, scale: 0.92, rotate: 5, duration: 1.1, ease: "expo.out" }, 0.5);
  }

  /* ---------- parallax depth layers ---------- */
  if (hasST) {
    document.querySelectorAll(".scene").forEach(function (scene) {
      scene.querySelectorAll("[data-depth]").forEach(function (el) {
        var d = parseFloat(el.getAttribute("data-depth")) || 0;
        gsap.to(el, {
          y: (0.12 - d * 0.06) * 320, ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: 1 }
        });
      });
    });
    /* letter-spacing scrub on titles — driven by the story track (sticky children
       never move relative to the viewport, so element triggers would freeze) */
    function scrubTitles(p) {
      var q = Math.min(1, Math.max(0, p / 0.35));
      document.querySelectorAll(".scrub-title").forEach(function (el) {
        el.style.letterSpacing = (0.18 - q * 0.16).toFixed(3) + "em";
        el.style.opacity = (0.35 + q * 0.65).toFixed(2);
      });
    }
    /* pinned signature moment -> tree growth + title settle */
    if (track) {
      ScrollTrigger.create({
        trigger: track, start: "top 80%", end: "bottom 45%", scrub: 1,
        onUpdate: function (self) {
          window.__signatureProgress = self.progress;
          window.dispatchEvent(new Event("signature-progress"));
          scrubTitles(self.progress);
        }
      });
      scrubTitles(window.__signatureProgress || 0);
    }
  } else {
    /* vanilla rAF fallback (offline): single scroll clock */
    var ticking = false;
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
    var scrubs = Array.prototype.slice.call(document.querySelectorAll(".scrub-title"));
    var vh = window.innerHeight;
    function progressOf(el, start, end) {
      var r = el.getBoundingClientRect();
      return Math.min(1, Math.max(0, (start - r.top) / (end - start)));
    }
    function frame() {
      ticking = false;
      layers.forEach(function (el) {
        var scene = el.closest(".scene"); if (!scene) return;
        var r = scene.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        var d = parseFloat(el.getAttribute("data-depth")) || 0;
        el.style.transform = "translate3d(0," + ((r.top + r.height / 2 - vh / 2) * (d * 0.06 - 0.12)).toFixed(1) + "px,0)";
      });
      scrubs.forEach(function (el) {
        if (!track) {
          var r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          var p = 1 - Math.min(1, Math.max(0, (r.top - vh * 0.15) / (vh * 0.7)));
          el.style.letterSpacing = (0.02 + (1 - p) * 0.16).toFixed(3) + "em";
          el.style.opacity = (0.35 + p * 0.65).toFixed(2);
        }
      });
      if (track) {
        window.__signatureProgress = progressOf(track, vh * 0.9, -vh * 0.4);
        window.dispatchEvent(new Event("signature-progress"));
        var q = Math.min(1, Math.max(0, window.__signatureProgress / 0.35));
        scrubs.forEach(function (el) {
          el.style.letterSpacing = (0.18 - q * 0.16).toFixed(3) + "em";
          el.style.opacity = (0.35 + q * 0.65).toFixed(2);
        });
      }
    }
    function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();
  }
})();
