/* AIVALM — scroll stories ("Ako to funguje v praxi").
   Modes:
   - flow   : slide-like stage; nodes accumulate, hand-drawn arrows draw between them (desktop);
              one node at a time on phones.
   - scenes : text column + visual stage; each step replaces the previous one.
   Without JS or with reduced motion the section keeps .is-static and shows every step. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* small live details outside stories */
  document.querySelectorAll('[data-ticker]').forEach(function (el) {
    if (reduce) { el.textContent = '0:47'; return; }
    var s = 0; setInterval(function () { s = (s + 1) % 600; el.textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }, 1000);
  });

  if (reduce) return;

  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  // hand-drawn arrows: computed from node boxes, so they connect at any screen size
  // <path class="arrow" data-step="1" data-link="a>b" data-sides="bottom>left" data-bend=".5" data-gap="14">
  function anchor(r, side, gap) {
    var pts = {
      top: [r.left + r.width / 2, r.top - gap, 0, -1], bottom: [r.left + r.width / 2, r.bottom + gap, 0, 1],
      left: [r.left - gap, r.top + r.height / 2, -1, 0], right: [r.right + gap, r.top + r.height / 2, 1, 0]
    };
    var m = /^(top|bottom|left|right)(?:@([\d.]+))?$/.exec(side), p = pts[m[1]].slice();
    if (m[2] !== undefined) { var f = +m[2]; if (m[1] === 'top' || m[1] === 'bottom') p[0] = r.left + r.width * f; else p[1] = r.top + r.height * f; }
    return p;
  }
  function layoutArrows(root) {
    var svg = root.querySelector('.stage__svg.desk'); if (!svg) return;
    var stage = root.querySelector('.stage'), sr = stage.getBoundingClientRect();
    if (!sr.width) return;
    svg.setAttribute('viewBox', '0 0 ' + sr.width.toFixed(0) + ' ' + sr.height.toFixed(0));
    svg.querySelectorAll('path.head').forEach(function (h) { h.remove(); });
    svg.querySelectorAll('path.arrow[data-link]').forEach(function (p) {
      var ids = p.dataset.link.split('>'), sides = (p.dataset.sides || 'right>left').split('>');
      var a = root.querySelector('[data-id="' + ids[0] + '"]'), b = root.querySelector('[data-id="' + ids[1] + '"]');
      if (!a || !b) return;
      function rel(el) { var r = el.getBoundingClientRect(); return { left: r.left - sr.left, top: r.top - sr.top, right: r.right - sr.left, bottom: r.bottom - sr.top, width: r.width, height: r.height }; }
      // measure without transforms applied by GSAP
      var ta = a.style.transform, tb = b.style.transform; a.style.transform = ''; b.style.transform = '';
      var gap = +(p.dataset.gap || 14);
      var A = anchor(rel(a.querySelector('[data-anchor]') || a), sides[0], gap), B = anchor(rel(b.querySelector('[data-anchor]') || b), sides[1], gap + 6);
      a.style.transform = ta; b.style.transform = tb;
      var dist = Math.hypot(B[0] - A[0], B[1] - A[1]);
      p.classList.toggle('is-tiny', dist < 34);
      var sameSide = sides[0].split('@')[0] === sides[1].split('@')[0];
      if (sameSide) {
        // C-shaped detour (e.g. left>left): always a curve with a fixed minimum bulge, so it never collapses into a stub
        var bulge = Math.max(72, dist * +(p.dataset.bend || .45));
        var k1 = [A[0] + A[2] * bulge, A[1] + A[3] * bulge], k2 = [B[0] + B[2] * bulge, B[1] + B[3] * bulge];
        p.setAttribute('d', 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' C' + k1[0].toFixed(1) + ' ' + k1[1].toFixed(1) + ', ' + k2[0].toFixed(1) + ' ' + k2[1].toFixed(1) + ', ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1));
        p.classList.remove('is-tiny');
        return;
      }
      if (dist < 110) {
        // short hop: a curve has no room and smears into a blob, so draw a clean straight arrow
        if (/^bottom/.test(sides[0]) && /^top/.test(sides[1]) && Math.abs(B[0] - A[0]) < 90) { var mx = (A[0] + B[0]) / 2; A[0] = mx; B[0] = mx; }
        p.setAttribute('d', 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' L' + B[0].toFixed(1) + ' ' + B[1].toFixed(1));
        return;
      }
      var d = dist * +(p.dataset.bend || .45);
      var c1 = [A[0] + A[2] * d, A[1] + A[3] * d], c2 = [B[0] + B[2] * d, B[1] + B[3] * d];
      p.setAttribute('d', 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ', ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ', ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1));
    });
    addHeads(svg);
  }
  function addHeads(svg) {
    svg.querySelectorAll('path.arrow:not(.head)').forEach(function (p) {
      var L = p.getTotalLength(); if (!L || p.classList.contains('is-tiny')) return;
      var a = p.getPointAtLength(L), b = p.getPointAtLength(Math.max(0, L - Math.min(14, L / 3)));
      var ang = Math.atan2(a.y - b.y, a.x - b.x), len = Math.max(11, Math.min(22, L * 0.32)), spread = 0.6;
      var l = { x: a.x - len * Math.cos(ang - spread), y: a.y - len * Math.sin(ang - spread) };
      var r = { x: a.x - len * Math.cos(ang + spread), y: a.y - len * Math.sin(ang + spread) };
      var h = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      h.setAttribute('d', 'M' + l.x.toFixed(1) + ' ' + l.y.toFixed(1) + ' L' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' L' + r.x.toFixed(1) + ' ' + r.y.toFixed(1));
      h.setAttribute('class', 'arrow head');
      h.dataset.step = p.dataset.step;
      p.after(h);
    });
  }

  // effects that run inside a node right after it appears
  function fx(tl, node, at) {
    node.querySelectorAll('[data-fx=ticks]').forEach(function (list) {
      var items = list.querySelectorAll('li');
      tl.fromTo(items, { opacity: .28 }, { opacity: 1, duration: .25, stagger: .3, ease: 'none' }, at + .15);
      tl.fromTo(list.querySelectorAll('.tick'), { '--fill': 0 }, { '--fill': 1, duration: .25, stagger: .3, ease: 'power2.out' }, at + .15);
    });
    node.querySelectorAll('[data-fx=pop]').forEach(function (el) {
      var kids = el.children.length > 1 ? el.children : [el];
      tl.fromTo(kids, { autoAlpha: 0, y: 14, scale: .97 }, { autoAlpha: 1, y: 0, scale: 1, duration: .35, stagger: .22, ease: 'power3.out' }, at + .2);
    });
    node.querySelectorAll('[data-fx=ring]').forEach(function (el) {
      tl.fromTo(el, { rotation: 0 }, { keyframes: [{ rotation: -14 }, { rotation: 12 }, { rotation: -9 }, { rotation: 6 }, { rotation: 0 }], duration: .7, ease: 'none' }, at + .1);
    });
    node.querySelectorAll('[data-count]').forEach(function (el) {
      var o = { v: +(el.dataset.from || 0) }, to = +el.dataset.count, suf = el.dataset.suffix || '';
      tl.to(o, { v: to, duration: .7, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v) + suf; } }, at + .2);
    });
    node.querySelectorAll('[data-fx=type]').forEach(function (el) {
      var full = el.dataset.text || el.textContent, o = { n: 0 };
      el.dataset.text = full;
      tl.to(o, { n: full.length, duration: .55, ease: 'none', onUpdate: function () { el.textContent = full.slice(0, Math.round(o.n)) || ' '; } }, at + .1);
    });
    node.querySelectorAll('[data-fx=press]').forEach(function (el) {
      tl.to(el, { scale: .93, duration: .12, ease: 'power2.in' }, at + .55)
        .to(el, { scale: 1, duration: .2, ease: 'power3.out' }, at + .67)
        .set(el, { attr: { 'data-state': 'done' } }, at + .67);
    });
    node.querySelectorAll('[data-fx=sweep]').forEach(function (el) {
      tl.fromTo(el, { rotation: 0, svgOrigin: el.dataset.origin || '50 50' }, { rotation: 360, duration: .8, ease: 'power1.inOut' }, at + .15);
    });
    node.querySelectorAll('[data-fx=fan]').forEach(function (el) {
      tl.fromTo(el.children, { autoAlpha: 0, x: 60, rotation: 6 }, { autoAlpha: 1, x: 0, rotation: function (i) { return (i % 2 ? 1 : -1) * (1 + i * .6); }, duration: .3, stagger: .12, ease: 'power3.out' }, at + .15);
    });
    node.querySelectorAll('[data-fx=swing]').forEach(function (el) {
      tl.fromTo(el, { rotation: -38, y: -60, autoAlpha: 0 }, { keyframes: [{ rotation: 22, y: 0, autoAlpha: 1, duration: .35 }, { rotation: -12, duration: .25 }, { rotation: 6, duration: .2 }, { rotation: -2, duration: .15 }, { rotation: 0, duration: .12 }], ease: 'sine.inOut' }, at + .05);
    });
  }

  function progress(tl, root, i, at) {
    var bar = root.querySelectorAll('.story__progress b')[i];
    if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'none' }, at);
  }

  document.querySelectorAll('.story').forEach(function (root) {
    root.classList.remove('is-static');
    var mode = root.dataset.story || 'flow', only = root.dataset.only || '';
    var pin = root.querySelector('.story__pin');
    var desk = root.querySelector('.stage__svg.desk');
    var nodes = Array.prototype.slice.call(root.querySelectorAll('[data-step]:not(path)'));
    var steps = 0; nodes.forEach(function (n) { steps = Math.max(steps, +n.dataset.step + 1); });
    var mm;
    function setup() {
    mm = gsap.matchMedia();
    if (mode === 'flow') {
      mm.add('(min-width: 821px)', function () {
        layoutArrows(root);
        var stageNodes = root.querySelectorAll('.stage > .node');
        stageNodes.forEach(function (n) { var ty = parseFloat(getComputedStyle(n).getPropertyValue('--ty')); gsap.set(n, { xPercent: -50, yPercent: isNaN(ty) ? -50 : ty, x: 0, y: 0 }); });
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        gsap.set(nodes.filter(function (n) { return n.dataset.step !== '0'; }), { autoAlpha: 0, y: 26 });
        var arrows = desk ? desk.querySelectorAll('path.arrow') : [];
        gsap.set(arrows, { drawSVG: '0%' });
        for (var i = 0; i < steps; i++) {
          var at = i * 1.4;
          var shafts = root.querySelectorAll('path.arrow:not(.head)[data-step="' + i + '"]');
          var heads = root.querySelectorAll('path.arrow.head[data-step="' + i + '"]');
          var t0 = at;
          if (shafts.length) { tl.to(shafts, { drawSVG: '100%', duration: .5, ease: 'power1.inOut' }, at); tl.to(heads, { drawSVG: '100%', duration: .15, ease: 'none' }, at + .5); t0 = at + .55; }
          var ns = root.querySelectorAll('.stage > [data-step="' + i + '"]');
          if (i > 0) tl.to(ns, { autoAlpha: 1, y: 0, duration: .45 }, t0);
          ns.forEach(function (n) { fx(tl, n, t0); });
          progress(tl, root, i, at);
        }
        tl.to({}, { duration: .6 });
        ScrollTrigger.create({ trigger: root, pin: pin, start: 'top top', end: '+=' + (steps * 85) + '%', scrub: .7, anticipatePin: 1, animation: tl, invalidateOnRefresh: true });
      });
      if (only !== 'desktop') mm.add('(max-width: 820px)', function () {
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        var ns = root.querySelectorAll('.stage > [data-step]');
        gsap.set(ns, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
        gsap.set(Array.prototype.filter.call(ns, function (n) { return n.dataset.step !== '0'; }), { autoAlpha: 0, y: 40 });
        for (var i = 0; i < steps; i++) {
          var at = i * 1.6;
          var cur = root.querySelectorAll('.stage > [data-step="' + i + '"]');
          if (i > 0) tl.to(cur, { autoAlpha: 1, y: 0, duration: .45 }, at);
          cur.forEach(function (n) { fx(tl, n, at); });
          if (i < steps - 1) tl.to(cur, { autoAlpha: 0, y: -40, duration: .35, ease: 'power2.in' }, at + 1.25);
          progress(tl, root, i, at);
        }
        tl.to({}, { duration: .4 });
        ScrollTrigger.create({ trigger: root, pin: pin, start: 'top top', end: '+=' + (steps * 100) + '%', scrub: .6, anticipatePin: 1, animation: tl, invalidateOnRefresh: true });
      });
    } else { // scenes
      mm.add(only === 'mobile' ? '(max-width: 820px)' : only === 'desktop' ? '(min-width: 821px)' : '(min-width: 0px)', function () {
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        var texts = root.querySelectorAll('.scene-t'), scenes = root.querySelectorAll('.scene');
        var later = function (el) { return el.dataset.step !== '0'; };
        gsap.set(Array.prototype.filter.call(texts, later).concat(Array.prototype.filter.call(scenes, later)), { autoAlpha: 0 });
        gsap.set(Array.prototype.filter.call(texts, later), { y: 30 });
        for (var i = 0; i < steps; i++) {
          var at = i * 1.6;
          var t = root.querySelectorAll('.scene-t[data-step="' + i + '"]'), s = root.querySelectorAll('.scene[data-step="' + i + '"]');
          if (i > 0) {
            tl.to(t, { autoAlpha: 1, y: 0, duration: .4 }, at);
            tl.fromTo(s, { autoAlpha: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .45 }, at);
          }
          s.forEach(function (n) { fx(tl, n, at); });
          if (i < steps - 1) {
            tl.to(t, { autoAlpha: 0, y: -30, duration: .3, ease: 'power2.in' }, at + 1.3);
            tl.to(s, { autoAlpha: 0, scale: 1.03, duration: .3, ease: 'power2.in' }, at + 1.3);
          }
          progress(tl, root, i, at);
        }
        tl.to({}, { duration: .4 });
        ScrollTrigger.create({ trigger: root, pin: pin, start: 'top top', end: '+=' + (steps * 95) + '%', scrub: .7, anticipatePin: 1, animation: tl, invalidateOnRefresh: true });
      });
    }
    }
    setup();
    // rebuild on real width changes so arrows reconnect to the new layout
    var lastW = window.innerWidth, rt;
    window.addEventListener('resize', function () {
      if (Math.abs(window.innerWidth - lastW) < 40) return;
      clearTimeout(rt);
      rt = setTimeout(function () { lastW = window.innerWidth; mm.revert(); setup(); ScrollTrigger.refresh(); }, 250);
    });
  });

  // "21x" odds: the number counts up and the two bars grow while the block scrolls into view
  document.querySelectorAll('[data-odds]').forEach(function (box) {
    var sec = box.closest('section') || box, num = sec.querySelector('[data-odds-count]');
    var bars = box.querySelectorAll('.odds__row i b'), o = { v: 1 };
    gsap.set(bars, { scaleX: 0 });
    if (num) num.textContent = '1';
    var tl = gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 88%', end: 'top 40%', scrub: .6 } });
    tl.to(bars[1], { scaleX: 1, duration: .25, ease: 'none' }, 0)
      .to(bars[0], { scaleX: 1, duration: 1, ease: 'power1.out' }, 0)
      .to(o, { v: 21, duration: 1, ease: 'power1.out', onUpdate: function () { if (num) num.textContent = Math.round(o.v); } }, 0);
  });

  // response-time bars ("kto pošle cenu prvý"): each bar grows to its data-w while the block scrolls in,
  // the winner's badge pops at the end
  document.querySelectorAll('[data-tbars]').forEach(function (box) {
    var rows = box.querySelectorAll('.tbars__row'), badge = box.querySelector('.tbars__row--win strong');
    var tl = gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 85%', end: 'top 30%', scrub: .6 } });
    rows.forEach(function (r, i) {
      var b = r.querySelector('i b'), w = +(r.dataset.w || 1);
      gsap.set(b, { scaleX: 0 }); gsap.set(r, { autoAlpha: .25 });
      tl.to(r, { autoAlpha: 1, duration: .15 }, i * .12).to(b, { scaleX: w, duration: .5, ease: 'power1.out' }, i * .12);
    });
    if (badge) { gsap.set(badge, { autoAlpha: 0, x: -8 }); tl.to(badge, { autoAlpha: 1, x: 0, duration: .2 }, .75); }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
