/* deck.js — 7-card hero fan. Click any card (or dot/arrow keys) to bring it
   front with crossfade + tilt; auto-turns every 6s until you interact.
   GSAP Flip animates the reorder; instant-swap fallback without GSAP;
   static list without JS (see .deck-card defaults in styles.css). */
(function () {
  "use strict";
  var deck = document.getElementById("deck");
  if (!deck) return;
  var cards = Array.prototype.slice.call(deck.querySelectorAll(".deck-card"));
  var dotsBox = document.querySelector(".deck-dots");
  var N = cards.length;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var hasFlip = hasGsap && typeof window.Flip !== "undefined";
  var front = 0, timer = null, paused = false, resumeT = null;

  /* slot geometry for offset k in [-3..3]: fan left/right of front */
  function slot(k) {
    var a = Math.abs(k);
    return {
      x: k * 54, y: a * 16, rotation: k * 6.5,
      scale: 1 - a * 0.055, opacity: 1 - a * 0.1,
      filter: "brightness(" + (1 - a * 0.07).toFixed(2) + ")",
      zIndex: 20 - a
    };
  }
  function offsetOf(i) {
    var k = (i - front) % N;
    if (k > 3) k -= N;
    if (k < -3) k += N;
    return k;
  }

  function applyInstant() {
    cards.forEach(function (c, i) {
      var s = slot(offsetOf(i));
      c.style.transform = "translate(" + s.x + "px," + s.y + "px) rotate(" + s.rotation + "deg) scale(" + s.scale + ")";
      c.style.opacity = s.opacity;
      c.style.filter = s.filter;
      c.style.zIndex = s.zIndex;
    });
    syncDots();
  }

  function go(n, manual) {
    n = ((n % N) + N) % N;
    if (n === front) return;
    var incoming = cards[n];
    if (hasGsap && hasFlip && !reduceMotion) {
      var state = Flip.getState(cards);
      front = n;
      cards.forEach(function (c, i) {
        var s = slot(offsetOf(i));
        c.style.zIndex = s.zIndex;
        gsap.set(c, { x: s.x, y: s.y, rotation: s.rotation, scale: s.scale, opacity: s.opacity, filter: s.filter });
      });
      Flip.from(state, { duration: 0.75, ease: "power3.inOut", absolute: true });
      gsap.fromTo(incoming,
        { opacity: 0.25, rotation: "+=9" },
        { opacity: 1, rotation: "-=0", duration: 0.75, ease: "power3.out", clearProps: "opacity" });
    } else {
      front = n;
      applyInstant();
    }
    syncDots();
    if (manual) restartAuto();
  }

  /* dots */
  var dots = cards.map(function (c, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Show card " + (i + 1) + ": " + c.getAttribute("data-title"));
    b.addEventListener("click", function () { go(i, true); });
    dotsBox.appendChild(b);
    return b;
  });
  function syncDots() {
    dots.forEach(function (b, i) {
      if (i === front) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    var cap = deck.parentElement.querySelector(".deck-hint");
    if (cap) cap.textContent = "Now showing " + (front + 1) + " of " + N + " — " + cards[front].getAttribute("data-title") + ". Click any card.";
  }

  /* clicks + keys */
  cards.forEach(function (c, i) {
    c.addEventListener("click", function () { go(i, true); });
  });
  deck.setAttribute("tabindex", "0");
  deck.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { go(front + 1, true); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(front - 1, true); e.preventDefault(); }
  });

  /* auto-turn */
  function tick() {
    if (!paused && !document.hidden && !reduceMotion) go(front + 1, false);
  }
  function restartAuto() {
    if (timer) clearInterval(timer);
    if (!reduceMotion) timer = setInterval(tick, 6000);
  }
  var wrap = deck.parentElement;
  function pause() { paused = true; if (resumeT) clearTimeout(resumeT); }
  function unpause() {
    if (resumeT) clearTimeout(resumeT);
    resumeT = setTimeout(function () { paused = false; }, 2000);
  }
  wrap.addEventListener("pointerenter", pause);
  wrap.addEventListener("pointerleave", unpause);
  wrap.addEventListener("focusin", pause);
  wrap.addEventListener("focusout", unpause);

  /* init */
  if (hasGsap && !reduceMotion) {
    cards.forEach(function (c, i) {
      var s = slot(offsetOf(i));
      gsap.set(c, { x: s.x, y: s.y, rotation: s.rotation, scale: s.scale, opacity: s.opacity, filter: s.filter, zIndex: s.zIndex });
    });
  } else {
    applyInstant();
  }
  syncDots();
  restartAuto();
})();
