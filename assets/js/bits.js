/* AIVALM — design effects adapted from React Bits (reactbits.dev, MIT + Commons Clause),
   rewritten in plain JS for this static site, in the black / white / grey palette.
   - Blur Text   : headlines arrive word by word, from blur to sharp
   - Scroll Reveal: selected paragraphs light up word by word as you scroll
   - Count Up    : big numbers count up once when they come into view
   - Dot Grid    : quiet dot field behind the hero, dots move away from the cursor
   - Click Spark : a small spark around the pointer when a button is clicked
   - Text Pressure, Spotlight Card, Tilted Card, Circular Text, Animated List; Dot Grid also behind the dark booking section (FAQ)
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
  /* light: stone dots darkening to ash near the cursor; dark: graphite dots brightening towards white */
  function dotGrid(host, dark) {
    if (!host) return;
    var C0 = dark ? 58 : 228, C1 = dark ? 235 : 107;
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
        var c = Math.round(C0 + (C1 - C0) * d.h);
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
      if (e.target.closest('.demo, .panel, a, button, input, textarea, select, label')) return;
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

  /* ---------- 6. Text Pressure: the AIVALM wordmark in the footer leans towards the cursor ---------- */
  function textPressure() {
    var word = document.querySelector('.foot__word');
    if (!word || reduce || !fine) return;
    var letters = [];
    Array.prototype.slice.call(word.childNodes).forEach(function (n) {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      var frag = document.createDocumentFragment();
      n.textContent.trim().split('').forEach(function (ch) {
        var s = document.createElement('span'); s.className = 'tp'; s.textContent = ch;
        frag.appendChild(s); letters.push({ el: s, k: 0 });
      });
      word.replaceChild(frag, n);
    });
    if (!letters.length) return;
    word.classList.add('has-tp');
    var foot = word.closest('footer') || word, mx = -1e4, my = -1e4, raf = 0;
    function frame() {
      raf = 0; var busy = false;
      letters.forEach(function (l) {
        var r = l.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var d = Math.hypot(mx - cx, (my - cy) * 0.6), t = Math.max(0, 1 - d / (r.height * 1.4));
        l.k += (t - l.k) * 0.16;
        if (Math.abs(t - l.k) > 0.002) busy = true;
        l.el.style.transform = 'scale(' + (1 - l.k * 0.08).toFixed(3) + ',' + (1 + l.k * 0.22).toFixed(3) + ')';
        l.el.style.color = l.k > 0.01 ? 'rgb(' + Math.round(255 - l.k * 60) + ',' + Math.round(255 - l.k * 60) + ',' + Math.round(255 - l.k * 60) + ')' : '';
      });
      if (busy) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    foot.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; kick(); }, { passive: true });
    foot.addEventListener('pointerleave', function () { mx = my = -1e4; kick(); });
  }

  /* ---------- 7. Spotlight Card: a soft grey light follows the cursor over the safety facts ---------- */
  function spotlight() {
    if (!fine) return;
    Array.prototype.forEach.call(document.querySelectorAll('.fact, [data-spotlight]'), function (el) {
      el.classList.add('spot');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* ---------- 8. Tilted Card: the live-demo window tilts slightly with the cursor ---------- */
  function tilt() {
    if (reduce || !fine) return;
    Array.prototype.forEach.call(document.querySelectorAll('.demo, [data-tilt]'), function (el) {
      var MAX = +(el.dataset.tilt || 3), tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      el.parentElement.classList.add('tilt-host');
      function frame() {
        cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
        var a = Math.hypot(cx, cy);
        el.style.rotate = a < 0.01 ? '' : (cy / a).toFixed(4) + ' ' + (cx / a).toFixed(4) + ' 0 ' + a.toFixed(3) + 'deg';
        raf = (Math.abs(tx - cx) > 0.005 || Math.abs(ty - cy) > 0.005) ? requestAnimationFrame(frame) : 0;
      }
      function kick() { if (!raf) raf = requestAnimationFrame(frame); }
      el.addEventListener('pointermove', function (e) {
        /* stay still while the visitor is typing into the demo */
        if (el.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) { tx = ty = 0; kick(); return; }
        var r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * MAX;
        ty = -((e.clientY - r.top) / r.height - 0.5) * 2 * MAX;
        kick();
      }, { passive: true });
      el.addEventListener('pointerleave', function () { tx = ty = 0; kick(); });
      el.addEventListener('focusin', function () { tx = ty = 0; kick(); });
    });
  }

  /* ---------- 9. Circular Text: a slowly turning badge on the pilot card ---------- */
  function circularText() {
    var card = document.querySelector('.pplan__card');
    if (!card) return;
    var txt = 'PRVÝ MESIAC ZADARMO • LEN PRE 3 FIRMY • ';
    var b = document.createElement('div');
    b.className = 'ctext'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<svg viewBox="0 0 120 120"><defs><path id="ctext-p" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs>' +
      '<text><textPath href="#ctext-p" textLength="288" lengthAdjust="spacing">' + txt + '</textPath></text></svg>' +
      '<img src="assets/img/fleur.svg" alt="">';
    card.appendChild(b);
  }

  /* ---------- 11. Animated List: FAQ answers open and close smoothly ---------- */
  function faqAnim() {
    if (reduce) return;
    Array.prototype.forEach.call(document.querySelectorAll('.faq__item'), function (d) {
      var sum = d.querySelector('summary'), body = d.querySelector('summary ~ *');
      if (!sum || !body) return;
      var busy = null;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (busy) busy.cancel();
        var opening = !d.open || d.classList.contains('is-closing');
        d.classList.remove('is-closing');
        if (opening) d.open = true; else d.classList.add('is-closing');
        var h = body.scrollHeight;
        busy = body.animate(opening
          ? [{ height: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: h + 'px', opacity: 1, transform: 'none' }]
          : [{ height: h + 'px', opacity: 1, transform: 'none' }, { height: '0px', opacity: 0, transform: 'translateY(-6px)' }],
          { duration: opening ? 420 : 300, easing: 'cubic-bezier(.22,1,.36,1)' });
        body.style.overflow = 'hidden';
        busy.onfinish = function () {
          busy = null; body.style.overflow = '';
          if (!opening) { d.open = false; d.classList.remove('is-closing'); }
        };
      });
    });
  }

  /* ---------- 12. "Pre koho": industries pop in one by one; the ones with an arrow open the demo ---------- */
  function whoChips() {
    var ul = document.querySelector('[data-whochips]');
    if (!ul) return;
    Array.prototype.forEach.call(ul.children, function (li, i) { li.style.setProperty('--i', i); });
    if (!reduce && hasIO) {
      ul.classList.add('is-wait');
      onceVisible(ul, '0px 0px -12% 0px', function () { ul.classList.add('is-pop'); });
    }
    ul.addEventListener('click', function (e) {
      var a = e.target.closest('[data-ind-go]'); if (!a) return;
      var b = document.querySelector('[data-ind="' + a.dataset.indGo + '"]');
      if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
    });
  }

  /* ---------- 13. "Replix vám sedí, ak": a tap-through self check, ticks draw when checked ---------- */
  function fitQuiz() {
    var card = document.querySelector('[data-quiz]');
    if (!card) return;
    var items = [].slice.call(card.querySelectorAll('.fit__list li'));
    var res = card.querySelector('.fitq__res'), total = items.length;
    card.classList.add('fit--quiz');
    var hint = document.createElement('p');
    hint.className = 'fitq__hint';
    hint.innerHTML = '<span>Odkliknite, čo platí pre vás</span><b class="tnum" aria-live="polite">0 z ' + total + '</b>';
    card.querySelector('.fit__h').after(hint);
    var count = hint.querySelector('b');
    function update() {
      var n = items.filter(function (li) { return li.getAttribute('aria-checked') === 'true'; }).length;
      count.textContent = n + ' z ' + total;
      var ok = n >= 3;
      if (ok && res.hidden) { res.hidden = false; card.classList.add('is-fit'); }
      else if (!ok && !res.hidden) { res.hidden = true; card.classList.remove('is-fit'); }
      /* the "Skôr nie, ak" reasons are struck through only once the visitor has 3+ reasons it fits */
      var no = document.querySelector('[data-strike]');
      if (no) no.classList.toggle('is-struck', ok);
    }
    items.forEach(function (li, i) {
      li.setAttribute('role', 'checkbox'); li.setAttribute('aria-checked', 'false'); li.tabIndex = 0;
      li.style.setProperty('--i', i);
      function toggle() { li.setAttribute('aria-checked', li.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); update(); }
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    });
    if (!reduce && hasIO) {
      card.classList.add('is-wait');
      onceVisible(card, '0px 0px -18% 0px', function () { card.classList.add('is-drawn'); });
    } else card.classList.add('is-drawn');
  }

  /* ---------- 14. "Skôr nie, ak": the dashes stretch into a strike-through, one line after another ---------- */
  function fitStrike() {
    var card = document.querySelector('[data-strike]');
    if (!card) return;
    [].forEach.call(card.querySelectorAll('.fit__list li'), function (li, i) {
      li.style.setProperty('--i', i);
      var t = li.querySelector('span:last-child'), w = document.createElement('span');
      w.className = 'fs'; w.textContent = t.textContent; t.textContent = ''; t.appendChild(w); /* inline wrapper: the line runs through every wrapped row */
    });
    card.classList.add('fit--strike');   /* fitQuiz() adds .is-struck when 3+ items are checked */
  }

  /* ---------- 15. Orbit curtain: the meeting / partner buttons travel under a black curtain.
     First time on a page: the fleur appears, a planet circles it once on a tilted orbit, the orbit fades,
     the fleur grows with a soft glow behind it, the curtain lifts on the target (~3.5 s).
     Every later click: the short version (curtain, fleur, there). No storage is used: "once" = once per page load. */
  function orbitCurtain() {
    if (reduce || !window.gsap) return;
    var links = [].slice.call(document.querySelectorAll('.nav__cta[href^="#"], .offer__sent a[href="#rezervacia"]'));
    if (!links.length) return;
    var ov = document.createElement('div');
    ov.className = 'orbitc'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="orbitc__sys">' +
      '<div class="orbitc__glow"></div>' +
      '<svg class="orbitc__orbit" viewBox="-160 -160 320 320"><g transform="rotate(-9)"><ellipse cx="0" cy="0" rx="140" ry="16"/></g></svg>' +
      /* the near half of the ring is drawn again above the fleur, so the ring passes in front of it */
      '<svg class="orbitc__orbit orbitc__orbit--front" viewBox="-160 -160 320 320"><defs><clipPath id="orbitc-near"><rect x="-170" y="0" width="340" height="170"/></clipPath></defs>' +
      '<g transform="rotate(-9)"><ellipse cx="0" cy="0" rx="140" ry="16" clip-path="url(#orbitc-near)"/></g></svg>' +
      '<i class="orbitc__planet"></i>' +
      '<img class="orbitc__logo" src="assets/img/fleur.svg" alt="">' +
      '</div>';
    document.body.appendChild(ov);
    var sys = ov.querySelector('.orbitc__sys'), ell = ov.querySelectorAll('ellipse'), planet = ov.querySelector('.orbitc__planet'),
        logo = ov.querySelector('.orbitc__logo'), glow = ov.querySelector('.orbitc__glow');
    var LEN = ell[0].getTotalLength ? ell[0].getTotalLength() : 600, played = false, busy = false;
    var RX = 140, RY = 16, ROT = -9 * Math.PI / 180;

    function placePlanet(a) {        /* a: angle in radians on the tilted ellipse; behind the fleur on the far half */
      var x = RX * Math.cos(a), y = RY * Math.sin(a);
      var px = x * Math.cos(ROT) - y * Math.sin(ROT), py = x * Math.sin(ROT) + y * Math.cos(ROT);
      var k = sys.offsetWidth / 320;
      planet.style.transform = 'translate(' + (px * k).toFixed(2) + 'px,' + (py * k).toFixed(2) + 'px)';
      planet.style.zIndex = Math.sin(a) < 0 ? 1 : 4;
    }
    function jump(el, hash) {
      var y = el.getBoundingClientRect().top + window.scrollY - (el.classList.contains('story') ? 0 : 88);
      y = Math.max(0, Math.min(Math.round(y), document.documentElement.scrollHeight - window.innerHeight));
      var l = window.AIVALM && window.AIVALM.lenis;
      if (l) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
      if (window.ScrollTrigger) ScrollTrigger.update();
      try { history.replaceState(null, '', hash); } catch (e) {}
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      try { el.focus({ preventScroll: true }); } catch (e) {}
    }
    function run(el, hash) {
      busy = true;
      var full = !played; played = true;
      var l = window.AIVALM && window.AIVALM.lenis; if (l) l.stop();
      gsap.killTweensOf([ov, logo, ell, planet, glow]);
      gsap.set(ov, { yPercent: 100, autoAlpha: 1 });
      gsap.set(logo, { autoAlpha: 0, scale: .8 });
      gsap.set(glow, { autoAlpha: 0, scale: .5 });
      gsap.set(ell, { strokeDasharray: LEN, strokeDashoffset: LEN, autoAlpha: 1 });
      gsap.set(planet, { autoAlpha: 0 });
      var o = { a: 0 }; placePlanet(o.a);  /* the SVG ellipse stroke starts at angle 0, so the planet leads the line it draws */
      var tl = gsap.timeline({ onComplete: function () {
        gsap.set(ov, { autoAlpha: 0 }); busy = false; if (l) l.start();
      } });
      tl.to(ov, { yPercent: 0, duration: .55, ease: 'power3.inOut' })
        .to(logo, { autoAlpha: 1, scale: 1, duration: .45, ease: 'power2.out' }, .3);
      if (full) {
        tl.call(function () { jump(el, hash); }, null, .7)
          /* one full lap: the orbit draws itself behind the planet */
          .to(planet, { autoAlpha: 1, duration: .2 }, .62)
          .fromTo(ell, { strokeDashoffset: -LEN }, { strokeDashoffset: 0, duration: 1.55, ease: 'power1.inOut' }, .62)
          .to(o, { a: -Math.PI * 2, duration: 1.55, ease: 'power1.inOut', onUpdate: function () { placePlanet(o.a); } }, .62)
          /* orbit and planet leave, the fleur grows with a soft glow behind it */
          .to([ell, planet], { autoAlpha: 0, duration: .35, ease: 'power1.out' }, 2.2)
          .to(logo, { scale: 1.4, duration: .6, ease: 'power2.out' }, 2.2)
          .to(glow, { autoAlpha: 1, scale: 1, duration: .6, ease: 'power2.out' }, 2.2)
          .to(ov, { yPercent: -100, duration: .7, ease: 'power3.inOut' }, 2.8);
      } else {
        tl.call(function () { jump(el, hash); }, null, .6)
          .to(ov, { yPercent: -100, duration: .7, ease: 'power3.inOut' }, .85);
      }
    }
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var hash = a.getAttribute('href'), el = /^#[\w-]+$/.test(hash) && document.querySelector(hash);
        if (!el) return;
        e.preventDefault();               /* fx.js leaves prevented clicks alone (no glide) */
        if (!busy) run(el, hash);
      });
    });
  }

  /* scripts are deferred, so the DOM is ready; GSAP is loaded before this file */
  countUp();
  dotGrid(document.querySelector('.rhero, .phero2'), false);
  dotGrid(document.querySelector('#rezervacia'), true);
  clickSpark();
  textPressure();
  spotlight();
  tilt();
  circularText();
  faqAnim();
  orbitCurtain();
  whoChips();
  fitQuiz();
  fitStrike();
  /* stories.js (loaded after this file) pins sections above; build the scroll triggers once it has */
  if (document.readyState === 'complete') scrollReveal();
  else window.addEventListener('load', function () { scrollReveal(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
