/* AIVALM — design effects adapted from React Bits (reactbits.dev, MIT + Commons Clause),
   rewritten in plain JS for this static site, in the black / white / grey palette.
   - Blur Text   : headlines arrive word by word, from blur to sharp
   - Scroll Reveal: selected paragraphs light up word by word as you scroll
   - Count Up    : big numbers count up once when they come into view
   - Dot Grid    : quiet dot field behind the hero, dots move away from the cursor
   - Click Spark : a small spark around the pointer when a button is clicked
   Every effect is skipped (content shown in its final state) with prefers-reduced-motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- helper: wrap every word of an element in <span class="bw">, keeping inner markup ---------- */
  function splitWords(el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/([ \t\n\r]+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            /* regular whitespace stays a text node; &nbsp; is not \s here on purpose, so "2&nbsp;minút" stays one word */
            if (/^[ \t\n\r]+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'bw'; s.textContent = p;
            frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !/^(svg|br|img)$/i.test(n.tagName)) walk(n);
      });
    })(el);
    return words;
  }
  function onceVisible(el, margin, fn) {
    if (!hasIO) { fn(); return; }
    var o = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { o.disconnect(); fn(); }
    }, { rootMargin: margin || '0px 0px -12% 0px' });
    o.observe(el);
  }

  /* ---------- 1. Blur Text: hero headline + section titles ---------- */
  if (!reduce) {
    var heads = document.querySelectorAll('.rhero__h, .phero2__h, main h2:not(.demo__title):not(.sr-only)');
    Array.prototype.forEach.call(heads, function (h) {
      if (h.closest('[data-panel], .demo')) return;
      h.removeAttribute('data-rise');           /* the words animate instead of the whole block */
      h.style.opacity = '1'; h.style.transform = 'none';
      var words = splitWords(h), hero = !!h.closest('.hero');
      words.forEach(function (w, i) { w.style.setProperty('--d', (i * (hero ? 70 : 55) + (hero ? 120 : 0)) + 'ms'); });
      h.classList.add('bits-blur');
      if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('is-in'); }); });
      else onceVisible(h, '0px 0px -10% 0px', function () { h.classList.add('is-in'); });
    });
  }

  /* ---------- 2. Scroll Reveal: paragraphs marked [data-reveal] brighten word by word with scroll ---------- */
  function scrollReveal() {
    var paras = document.querySelectorAll('[data-reveal]');
    if (!paras.length) return;
    if (reduce || !window.gsap || !window.ScrollTrigger) return; /* text stays fully visible */
    gsap.registerPlugin(ScrollTrigger);
    Array.prototype.forEach.call(paras, function (p) {
      p.removeAttribute('data-rise');
      p.style.opacity = '1'; p.style.transform = 'none';
      var words = splitWords(p);
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', duration: 0.3, stagger: 0.1,
        scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 50%', scrub: 0.5, refreshPriority: -10 } /* measured after the pinned stories above */
      });
    });
  }

  /* ---------- 3. Count Up: [data-countup] numbers like "48 000 €" count from 0 once ---------- */
  function countUp() {
    var fmt = new Intl.NumberFormat('sk-SK', { maximumFractionDigits: 0 });
    Array.prototype.forEach.call(document.querySelectorAll('[data-countup]'), function (el) {
      if (reduce) return;
      onceVisible(el, '0px 0px -15% 0px', function () {
        /* read the value only now: the calculator may have changed it in the meantime */
        var m = el.textContent.match(/^(\D*?)(\d(?:[\d\s\u00a0\u202f]*\d)?)(.*)$/);
        if (!m) return;
        var pre = m[1], to = +m[2].replace(/\D/g, ''), post = m[3];
        if (!to) return;
        var start = el.textContent, t0 = null, dur = 1400;
        (function step(t) {
          if (el.textContent !== start && t0 !== null) return;  /* something else (e.g. the calculator) took over */
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
          el.textContent = pre + fmt.format(Math.round(to * e)) + post;
          start = el.textContent;
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    });
  }

  /* ---------- 4. Dot Grid behind the hero ---------- */
  function dotGrid() {
    var host = document.querySelector('.rhero, .phero2');
    if (!host) return;
    var cv = document.createElement('canvas');
    cv.className = 'dotgrid'; cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, host.firstChild);
    host.classList.add('has-dotgrid');
    var ctx = cv.getContext('2d'), dpr = 1, W = 0, H = 0, dots = [];
    var GAP = 30, R = 1.5, PUSH = 150, MAXOFF = 16;
    var mouse = { x: -9999, y: -9999 }, running = false, visible = true;

    function layout() {
      var r = host.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      dots = [];
      var cols = Math.floor(W / GAP), rows = Math.floor(H / GAP);
      var ox = (W - (cols - 1) * GAP) / 2, oy = (H - (rows - 1) * GAP) / 2;
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++)
        dots.push({ x: ox + x * GAP, y: oy + y * GAP, dx: 0, dy: 0, vx: 0, vy: 0, h: 0 });
      draw();
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        /* stone #E4E4E4 at rest, towards ash #6B6B6B near the cursor */
        var c = Math.round(228 - 121 * d.h);
        ctx.fillStyle = 'rgb(' + c + ',' + c + ',' + c + ')';
        ctx.beginPath();
        ctx.arc(d.x + d.dx, d.y + d.dy, R + d.h * 0.8, 0, 6.2832);
        ctx.fill();
      }
    }
    function tick() {
      var moving = false;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i], tx = 0, ty = 0, th = 0;
        var ex = d.x - mouse.x, ey = d.y - mouse.y, dist = Math.sqrt(ex * ex + ey * ey);
        if (dist < PUSH) {
          var f = 1 - dist / PUSH; f = f * f;
          tx = dist ? ex / dist * MAXOFF * f : 0; ty = dist ? ey / dist * MAXOFF * f : 0; th = f;
        }
        d.vx = (d.vx + (tx - d.dx) * 0.14) * 0.76;
        d.vy = (d.vy + (ty - d.dy) * 0.14) * 0.76;
        d.dx += d.vx; d.dy += d.vy;
        d.h += (th - d.h) * 0.18;
        if (Math.abs(d.vx) > 0.02 || Math.abs(d.vy) > 0.02 || Math.abs(th - d.h) > 0.004 || Math.abs(d.dx - tx) > 0.05) moving = true;
      }
      draw();
      if (moving && visible) requestAnimationFrame(tick); else running = false;
    }
    function kick() { if (!running && visible) { running = true; requestAnimationFrame(tick); } }

    layout();
    if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); }).observe(host);
    else window.addEventListener('resize', layout);
    if (reduce || !fine) return;                  /* static dots on touch / reduced motion */

    if (hasIO) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(host);
    host.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; kick();
    }, { passive: true });
    host.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; kick(); });
    /* click: a soft shockwave through the grid */
    host.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.demo, a, button, input, textarea, select, label')) return;
      var r = cv.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
      dots.forEach(function (d) {
        var ex = d.x - cx, ey = d.y - cy, dist = Math.sqrt(ex * ex + ey * ey);
        if (dist < 260 && dist > 0) { var f = (1 - dist / 260) * 9; d.vx += ex / dist * f; d.vy += ey / dist * f; }
      });
      kick();
    });
  }

  /* ---------- 5. Click Spark on buttons ---------- */
  function clickSpark() {
    if (reduce) return;
    var cv = document.createElement('canvas');
    cv.className = 'sparks'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), sparks = [], raf = 0, dpr = 1;
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    }
    size(); window.addEventListener('resize', size);
    var N = 8, RAD = 22, LEN = 9, DUR = 420;
    function frame(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      sparks = sparks.filter(function (s) {
        var k = (now - s.t) / DUR; if (k >= 1) return false;
        var e = 1 - Math.pow(1 - k, 3), dist = e * RAD, len = LEN * (1 - e);
        ctx.strokeStyle = s.c; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x + dist * s.cos, s.y + dist * s.sin);
        ctx.lineTo(s.x + (dist + len) * s.cos, s.y + (dist + len) * s.sin);
        ctx.stroke();
        return true;
      });
      if (sparks.length) raf = requestAnimationFrame(frame);
      else { raf = 0; cv.classList.remove('is-on'); }
    }
    document.addEventListener('click', function (e) {
      if (!e.detail) return;                     /* keyboard activation: no pointer position */
      var b = e.target.closest('.btn, .ind, .slot, .day, .pilot-pill');
      if (!b || b.disabled) return;
      /* the spark sits around the pointer, so it takes the colour that reads on the button itself */
      var c = getComputedStyle(b).color;
      var t = performance.now();
      for (var i = 0; i < N; i++) {
        var a = (Math.PI * 2 * i) / N;
        sparks.push({ x: e.clientX, y: e.clientY, cos: Math.cos(a), sin: Math.sin(a), t: t, c: c });
      }
      cv.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(frame);
    });
  }

  /* scripts are deferred, so the DOM is ready; GSAP is loaded before this file */
  countUp();
  dotGrid();
  clickSpark();
  /* stories.js (loaded after this file) pins sections above; build the scroll triggers once it has */
  if (document.readyState === 'complete') scrollReveal();
  else window.addEventListener('load', function () { scrollReveal(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
