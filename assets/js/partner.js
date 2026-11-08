/* Partnerský program – income chart, partner-type picker, "Ako to funguje" story, card hover counts. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- income chart: month columns grow one after another ---------- */
  var chart = document.querySelector('[data-pchart]');
  if (chart) {
    var go = function () { chart.classList.add('is-in'); };
    if (reduce || !('IntersectionObserver' in window)) go();
    else {
      chart.classList.add('is-ready');
      var o = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { o.disconnect(); setTimeout(go, 350); }
      }, { threshold: .35 });
      o.observe(chart);
    }
  }

  /* ---------- partner-type picker (tabs) + preselect the form ---------- */
  var pick = document.querySelector('[data-ppick]');
  if (pick) {
    var tabs = [].slice.call(pick.querySelectorAll('[role=tab]'));
    var sel = function (t, focus) {
      tabs.forEach(function (b) {
        var on = b === t;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
      if (window.matchMedia('(max-width:900px)').matches) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, j = -1;
        if (k === 'ArrowDown' || k === 'ArrowRight') j = (i + 1) % n;
        if (k === 'ArrowUp' || k === 'ArrowLeft') j = (i + n - 1) % n;
        if (k === 'Home') j = 0; if (k === 'End') j = n - 1;
        if (j > -1) { e.preventDefault(); sel(tabs[j], true); }
      });
    });
    pick.addEventListener('click', function (e) {
      var a = e.target.closest('[data-pick]'); if (!a) return;
      var r = document.querySelector('input[name=typ][value="' + a.dataset.pick + '"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  }

  /* ---------- card percentages count up again on hover ---------- */
  if (fine && !reduce) {
    [].forEach.call(document.querySelectorAll('[data-hovercount]'), function (el) {
      var node = el.firstChild; if (!node || node.nodeType !== 3) return;
      var m = node.textContent.match(/(\d+)(.*)/); if (!m) return;
      var to = +m[1], rest = m[2], raf = 0;
      el.closest('.pmodel').addEventListener('pointerenter', function () {
        cancelAnimationFrame(raf); var t0 = performance.now();
        (function step(t) {
          var k = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - k, 3);
          node.textContent = Math.round(to * e) + rest;
          if (k < 1) raf = requestAnimationFrame(step);
        })(t0);
      });
    });
  }

  /* ---------- "Ako to funguje": pinned scroll story with four small scenes ---------- */
  var sx = document.querySelector('[data-psx]');
  if (!sx || reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.innerHeight < 560) return; /* too short to pin comfortably: keep the static layout */

  var $ = function (s, r) { return (r || sx).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || sx).querySelectorAll(s)); };
  var steps = $$('.psx__step'), scenes = $$('.psx__scene'), bars = $$('.psx__prog b');
  sx.classList.add('is-pinned');

  /* typing helper for the form scene */
  function typer(el) {
    var full = el.dataset.type, o = { n: 0 };
    return { el: el, o: o, full: full, set: function () {
      var n = Math.round(o.n); el.textContent = full.slice(0, n);
      el.classList.toggle('is-typing', n > 0 && n < full.length);
    } };
  }
  var fields = $$('[data-scene="0"] .psx-field span');
  var t1 = typer(fields[0]), t2 = typer(fields[1]);
  t1.set(); t2.set();
  var cells = $$('.psx-cal__grid i'), barI = $$('.psx-bar i'), sw = $$('.psx-pay__sw span');

  gsap.set(scenes, { autoAlpha: 0 });
  gsap.set(scenes[0], { autoAlpha: 1 });
  gsap.set($('[data-scene="0"] .psx-stamp'), { autoAlpha: 0, scale: .6, rotate: -8 });
  gsap.set($$('[data-scene="1"] .psx-bub, [data-scene="1"] .psx-typing, [data-scene="1"] .psx-call'), { autoAlpha: 0, y: 14 });
  gsap.set($('[data-scene="2"] .psx-stamp'), { autoAlpha: 0, scale: .6, rotate: 6 });
  gsap.set(cells, { '--f': 0 });
  gsap.set(barI, { height: '0%' });

  var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  /* 0: the contact is typed, sent, and stamped as yours */
  tl.addLabel('s0')
    .to(t1.o, { n: t1.full.length, duration: .9, ease: 'none', onUpdate: t1.set })
    .to(t2.o, { n: t2.full.length, duration: .8, ease: 'none', onUpdate: t2.set })
    .to($('.psx-send'), { scale: .92, duration: .12, yoyo: true, repeat: 1 })
    .to($('[data-scene="0"] .psx-form'), { y: -10, duration: .3 }, '<')
    .to($('[data-scene="0"] .psx-stamp'), { autoAlpha: 1, scale: 1, rotate: -3, duration: .4, ease: 'back.out(2)' })
    .to({}, { duration: .5 })
  /* 1: one message to the director, a reply, then the call */
    .addLabel('s1')
    .to(scenes[0], { autoAlpha: 0, y: -30, duration: .4, ease: 'power2.in' })
    .fromTo(scenes[1], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .4 })
    .to($('.psx-bub--out'), { autoAlpha: 1, y: 0, duration: .35 })
    .to($('.psx-typing'), { autoAlpha: 1, y: 0, duration: .25 })
    .to($('.psx-typing'), { autoAlpha: 0, height: 0, margin: 0, padding: 0, duration: .25 }, '+=.35')
    .to($('.psx-bub--in'), { autoAlpha: 1, y: 0, duration: .35 })
    .to($('.psx-call'), { autoAlpha: 1, y: 0, duration: .4, ease: 'back.out(1.8)' })
    .to({}, { duration: .5 })
  /* 2: the free month fills day by day */
    .addLabel('s2')
    .to(scenes[1], { autoAlpha: 0, y: -30, duration: .4, ease: 'power2.in' })
    .fromTo(scenes[2], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .4 })
    .to(cells, { '--f': 1, duration: .18, stagger: .045, ease: 'back.out(2)' })
    .to($('[data-scene="2"] .psx-stamp'), { autoAlpha: 1, scale: 1, rotate: 2, duration: .4, ease: 'back.out(2)' })
    .to({}, { duration: .5 })
  /* 3: your share arrives month after month; switch to 30 % and the bars grow */
    .addLabel('s3')
    .to(scenes[2], { autoAlpha: 0, y: -30, duration: .4, ease: 'power2.in' })
    .fromTo(scenes[3], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .4 })
    .to(barI, { height: '26%', duration: .3, stagger: .12, ease: 'back.out(1.6)' })
    .call(function () { sw[0].classList.add('is-on'); sw[1].classList.remove('is-on'); }, null, '+=.15')
    .to({}, { duration: .25 })
    .call(function () { var f = tl.scrollTrigger && tl.scrollTrigger.direction < 0; sw[0].classList.toggle('is-on', f); sw[1].classList.toggle('is-on', !f); })
    .to(barI, { height: '78%', duration: .5, stagger: .05, ease: 'power3.out' })
    .to({}, { duration: .6 })
    .addLabel('end');

  var labels = ['s0', 's1', 's2', 's3', 'end'].map(function (l) { return tl.labels[l]; });
  var current = -1;
  function paint(p) {
    var t = p * tl.duration(), i = 0;
    while (i < 3 && t >= labels[i + 1]) i++;
    if (i !== current) { current = i; steps.forEach(function (s, j) { s.classList.toggle('is-on', j === i); }); }
    bars.forEach(function (b, j) {
      var k = Math.max(0, Math.min(1, (t - labels[j]) / (labels[j + 1] - labels[j])));
      b.style.transform = 'scaleX(' + k.toFixed(3) + ')';
    });
  }
  ScrollTrigger.create({
    trigger: sx, pin: true, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 3.4); },
    scrub: .6, animation: tl, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: function (st) { paint(st.progress); }
  });
  paint(0);
  /* clicking a step jumps to it */
  steps.forEach(function (s, i) {
    s.style.cursor = 'pointer';
    s.addEventListener('click', function () {
      var st = tl.scrollTrigger; if (!st) return;
      var y = st.start + (st.end - st.start) * ((labels[i] + .01) / tl.duration()) + (i ? (labels[i + 1] - labels[i]) / tl.duration() * (st.end - st.start) * .55 : 0);
      if (window.AIVALM && window.AIVALM.lenis) window.AIVALM.lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
