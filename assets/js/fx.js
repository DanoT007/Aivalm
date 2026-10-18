/* AIVALM — site-wide feel: smooth scroll (Lenis), custom cursor, magnetic buttons,
   spotlight, marquee, text scramble, page curtain. Everything degrades to native behaviour. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasG = !!window.gsap;
  if (hasG && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- every page opens at its top (or at its #anchor) ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (hasG && window.ScrollTrigger && ScrollTrigger.clearScrollMemory) ScrollTrigger.clearScrollMemory('manual');
  function toStart() {
    var el = location.hash && /^#[\w-]+$/.test(location.hash) ? document.querySelector(location.hash) : null;
    var y = el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 76) : 0;
    window.scrollTo(0, y);
    if (window.AIVALM && window.AIVALM.lenis) window.AIVALM.lenis.scrollTo(y, { immediate: true, force: true });
  }
  window.scrollTo(0, 0);
  window.addEventListener('load', function () { toStart(); setTimeout(toStart, 60); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) toStart(); });

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  var touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!reduce && !touch && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, wheelMultiplier: 1, touchMultiplier: 1.4 });
    window.AIVALM = window.AIVALM || {}; window.AIVALM.lenis = lenis;
    if (hasG) {
      lenis.on('scroll', function () { if (window.ScrollTrigger) ScrollTrigger.update(); });
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    }
  }

  /* ---------- premium in-page glide: every same-page anchor eases out, travels, eases in ----------
     Duration scales with distance (about 1.9 s for one screen, 3-3.5 s for long trips).
     Pinned scroll stories on the way are faded out and crossed at a fraction of the speed, so their
     step animations don't flicker past; they fade back in already in their final state. */
  var glide = null, root = document.documentElement;
  function setY(y) { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }
  function targetY(el) {
    var y = el.getBoundingClientRect().top + window.scrollY;
    if (!el.classList.contains('story')) y -= 88; /* clear the sticky nav; stories pin at their own top */
    return Math.max(0, Math.min(Math.round(y), root.scrollHeight - window.innerHeight));
  }
  function pinZones(lo, hi) {
    if (!window.ScrollTrigger) return [];
    return ScrollTrigger.getAll().filter(function (st) { return st.pin && st.enabled !== false && st.end > lo && st.start < hi; })
      .map(function (st) { return { st: st, el: st.trigger, a: Math.max(st.start, lo), b: Math.min(st.end, hi), on: false }; })
      .sort(function (p, q) { return p.a - q.a; });
  }
  function buildMap(from, to, zones) {
    var dir = to >= from ? 1 : -1, segs = [], pos = from, total = 0;
    (dir > 0 ? zones : zones.slice().reverse()).forEach(function (z) {
      var s = dir > 0 ? z.a : z.b, e = dir > 0 ? z.b : z.a;
      if ((s - pos) * dir > 0) segs.push({ s: pos, e: s, w: 1 });
      if (e !== s) segs.push({ s: s, e: e, w: .12 });
      pos = e;
    });
    if ((to - pos) * dir > 0) segs.push({ s: pos, e: to, w: 1 });
    segs.forEach(function (g) { g.len = Math.abs(g.e - g.s) * g.w; g.c0 = total; total += g.len; });
    return { segs: segs, total: total };
  }
  function mapY(m, d) {
    for (var i = 0; i < m.segs.length; i++) {
      var g = m.segs[i];
      if (d <= g.c0 + g.len || i === m.segs.length - 1) { var f = g.len ? (d - g.c0) / g.len : 1; return g.s + (g.e - g.s) * Math.min(1, Math.max(0, f)); }
    }
    return m.segs.length ? m.segs[m.segs.length - 1].e : 0;
  }
  function settle(z) {
    if (window.ScrollTrigger) ScrollTrigger.update();
    var tw = z.st.getTween && z.st.getTween(); if (tw) tw.progress(1);
    z.el.classList.remove('is-skipping'); z.on = false;
  }
  function endGlide() {
    if (!glide) return;
    cancelAnimationFrame(glide.raf); clearTimeout(glide.dog);
    glide.zones.forEach(function (z) { if (z.on) settle(z); });
    root.classList.remove('is-gliding'); glide = null;
  }
  function glideTo(el, hash) {
    endGlide();
    var from = window.scrollY, to = targetY(el), vh = window.innerHeight;
    var focus = function () { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); try { el.focus({ preventScroll: true }); } catch (e) {} };
    if (hash) history.replaceState(null, '', hash);
    if (reduce || Math.abs(to - from) < 2) { setY(to); focus(); return; }
    var zones = pinZones(Math.min(from, to), Math.max(from, to)), m = buildMap(from, to, zones);
    var dur = Math.max(900, Math.min(3500, 590 + 1310 * Math.sqrt(m.total / vh))), t0 = performance.now(), dir = to > from ? 1 : -1;
    glide = { raf: 0, zones: zones };
    root.classList.add('is-gliding');
    /* safety net: if frames stall (busy device, background tab) still land on the target */
    glide.dog = setTimeout(function () { if (glide) { endGlide(); setY(to); focus(); } }, dur + 400);
    (function step(now) {
      if (!glide) return;
      var p = Math.min(1, (now - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var y = mapY(m, e * m.total);
      setY(y);
      zones.forEach(function (z) {
        var on = y > z.st.start - (dir > 0 ? .45 : .1) * vh && y < z.st.end + (dir > 0 ? .1 : .45) * vh;
        if (on && !z.on) { z.el.classList.add('is-skipping'); z.on = true; }
        else if (!on && z.on) settle(z);
      });
      if (p < 1) glide.raf = requestAnimationFrame(step); else { endGlide(); focus(); }
    })(t0);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, endGlide, { passive: true }); });
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href*="#"]'); if (!a || a.classList.contains('skip')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !/^#[\w-]+$/.test(url.hash)) return;
    var el = document.querySelector(url.hash); if (!el) return;
    e.preventDefault();
    glideTo(el, url.hash);
  });
  window.AIVALM = window.AIVALM || {}; window.AIVALM.glideTo = glideTo;

  /* ---------- page curtain ---------- */
  var curtain = document.querySelector('.curtain');
  if (curtain && !reduce) {
    var came = false; try { came = sessionStorage.getItem('aivalm-curtain') === '1'; sessionStorage.removeItem('aivalm-curtain'); } catch (e) {}
    if (came) {
      curtain.classList.add('is-cover');
      requestAnimationFrame(function () { requestAnimationFrame(function () { curtain.classList.remove('is-cover'); curtain.classList.add('is-leave'); }); });
      setTimeout(function () { curtain.classList.remove('is-leave'); }, touch ? 820 : 900);
    }
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || url.pathname === location.pathname) return;
      e.preventDefault();
      try { sessionStorage.setItem('aivalm-curtain', '1'); } catch (er) {}
      curtain.classList.add('is-enter');
      setTimeout(function () { location.href = a.href; }, touch ? 560 : 520);
    });
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) curtain.classList.remove('is-enter', 'is-cover'); });
  }

  if (reduce) return;

  /* ---------- custom cursor ---------- */
  if (fine) {
    var dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cur-dot'; ring.className = 'cur-ring'; ring.innerHTML = '<span></span>';
    document.body.append(dot, ring);
    document.documentElement.classList.add('has-cursor');
    var label = ring.firstChild, mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;
    var root = document.documentElement, bgCache = new WeakMap(), pending = false;
    function isDark(el) {
      for (var n = el; n && n !== document; n = n.parentElement) {
        if (bgCache.has(n)) return bgCache.get(n);
        var bg = getComputedStyle(n).backgroundColor, m = bg.match(/[\d.]+/g);
        if (m && (m.length < 4 || +m[3] > .5)) {
          var lum = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255, d = lum < .45;
          bgCache.set(n, d); return d;
        }
      }
      return false;
    }
    function tone() {
      pending = false;
      var el = document.elementFromPoint(mx, my);
      root.classList.toggle('cur-dark', !!el && isDark(el));
    }
    addEventListener('scroll', function () { if (!pending) { pending = true; requestAnimationFrame(tone); } }, { passive: true });
    addEventListener('pointermove', function (e) {
      if (!pending) { pending = true; requestAnimationFrame(tone); }
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; document.documentElement.classList.add('cur-on'); }
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });
    document.addEventListener('pointerleave', function () { document.documentElement.classList.remove('cur-on'); shown = false; });
    (function loop() {
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
    var HOVER = 'a, button, [data-cursor], input, select, textarea, label, .slot, .day, .chip';
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest(HOVER); if (!t) return;
      var txt = t.closest('[data-cursor]') ? t.closest('[data-cursor]').dataset.cursor : '';
      ring.classList.toggle('is-label', !!txt); label.textContent = txt;
      ring.classList.toggle('is-text', /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      ring.classList.add('is-hover');
    });
    document.addEventListener('pointerout', function (e) {
      var t = e.target.closest(HOVER); if (!t) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      ring.classList.remove('is-hover', 'is-label', 'is-text');
    });
    addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
    addEventListener('pointerup', function () { ring.classList.remove('is-down'); });

    /* magnetic buttons */
    document.querySelectorAll('.btn, [data-magnet]').forEach(function (el) {
      var s = el.classList.contains('door__go') ? .35 : .22;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * s).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * s).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = '0 0'; });
    });

    /* spotlight */
    document.querySelectorAll('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- text scramble on hover ---------- */
  var CH = 'AIVLM01#%/=+*<>';
  document.querySelectorAll('[data-scramble]').forEach(function (el) {
    var host = el.closest('a, [data-cursor]') || el, orig = el.textContent, busy = false;
    host.addEventListener('pointerenter', function () {
      if (busy) return; busy = true;
      var f = 0, total = 18;
      (function step() {
        el.textContent = orig.split('').map(function (c, i) {
          if (c === ' ') return ' ';
          return i < (f / total) * orig.length ? c : CH[Math.floor(Math.random() * CH.length)];
        }).join('');
        if (++f <= total) requestAnimationFrame(step); else { el.textContent = orig; busy = false; }
      })();
    });
  });

  /* ---------- marquee driven by scroll velocity ---------- */
  document.querySelectorAll('[data-marquee]').forEach(function (m) {
    var track = m.querySelector('.marquee__track'); if (!track) return;
    track.innerHTML += track.innerHTML;
    var x = 0, base = parseFloat(m.dataset.marquee) || 60, dir = 1, vel = 0, w = 0;
    function measure() { w = track.scrollWidth / 2; }
    measure(); addEventListener('resize', measure);
    if (lenis) lenis.on('scroll', function (e) { vel = e.velocity || 0; if (vel) dir = vel > 0 ? 1 : -1; });
    var last = performance.now();
    (function loop(t) {
      var dt = Math.min(64, t - last) / 1000; last = t;
      x -= (base + Math.abs(vel) * 18) * dt * dir;
      if (x <= -w) x += w; if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + Math.max(-8, Math.min(8, -vel * .35)).toFixed(2) + 'deg)';
      vel *= .92;
      requestAnimationFrame(loop);
    })(last);
  });

  /* ---------- scroll-scrubbed statement: words light up ---------- */
  if (hasG && window.ScrollTrigger) {
    document.querySelectorAll('[data-words]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
      gsap.fromTo(el.querySelectorAll('.w'), { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: .6 } });
    });
    /* parallax helpers */
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.dataset.parallax) || 60;
      gsap.fromTo(el, { y: -amt }, { y: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }
})();
