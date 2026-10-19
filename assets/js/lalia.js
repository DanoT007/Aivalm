/* AIVALM — home hero: the fleur-de-lis film scrubbed by scroll (canvas image sequence, no looping).
   Desktop: the hero pins briefly while the 6 s film plays forward/backward with the scroll.
   Phones: the film plays while the card travels through the screen. */
(function () {
  'use strict';
  var box = document.querySelector('[data-lalia]'); if (!box) return;
  var cv = box.querySelector('canvas'), ctx = cv.getContext('2d'), poster = box.querySelector('.lalia__poster');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger || !ctx) return; /* poster stays */
  gsap.registerPlugin(ScrollTrigger);
  var N = 96, small = Math.min(window.innerWidth, 900) * (window.devicePixelRatio || 1) < 1100 || window.innerWidth < 820;
  var dir = 'assets/img/lalia/' + (small ? 'm' : 'd') + '/';
  var imgs = new Array(N), loaded = new Array(N), cur = -1, want = 0;
  function src(i) { return dir + ('00' + (i + 1)).slice(-3) + '.webp'; }
  function size() {
    var r = box.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cur = -1; draw(want);
  }
  function nearest(i) { for (var d = 0; d < N; d++) { if (loaded[i - d]) return i - d; if (loaded[i + d]) return i + d; } return -1; }
  function draw(i) {
    want = i; var k = loaded[i] ? i : nearest(i); if (k < 0 || k === cur) return;
    var im = imgs[k], cw = cv.width, ch = cv.height, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    var w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h); cur = k;
    if (!box.classList.contains('is-live')) box.classList.add('is-live');
  }
  /* load the first frame now, the rest in a spread order so scrubbing is usable early */
  var order = [0]; for (var step = 32; step >= 1; step = step / 2 | 0) { for (var j = 0; j < N; j += step) if (order.indexOf(j) < 0) order.push(j); if (step === 1) break; }
  var q = 0, active = 0;
  function pump() {
    while (active < 6 && q < order.length) {
      (function (i) {
        var im = new Image(); active++; im.decoding = 'async';
        im.onload = function () { loaded[i] = true; active--; if (i === want || cur < 0 || Math.abs(i - want) < Math.abs(cur - want)) { cur = -1; draw(want); } pump(); };
        im.onerror = function () { active--; pump(); };
        im.src = src(i); imgs[i] = im;
      })(order[q++]);
    }
  }
  pump();
  window.addEventListener('resize', function () { size(); });
  size();
  var o = { f: 0 };
  function update() { draw(Math.round(o.f)); }
  var hero = document.querySelector('[data-lalia-hero]');
  var mm = gsap.matchMedia();
  mm.add('(min-width: 981px) and (min-height: 640px)', function () {
    gsap.to(o, { f: N - 1, ease: 'none', onUpdate: update,
      scrollTrigger: { trigger: hero, start: 'top 76px', end: '+=110%', pin: true, scrub: .5, anticipatePin: 1, invalidateOnRefresh: true } });
  });
  mm.add('(max-width: 980px), (max-height: 639px)', function () {
    gsap.to(o, { f: N - 1, ease: 'none', onUpdate: update,
      scrollTrigger: { trigger: box, start: 0, end: 'bottom 15%', scrub: .5, invalidateOnRefresh: true } });
  });
})();
