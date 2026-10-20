/* AI odhad ceny — hero tag toggle (auto / nehnuteľnosť) with rolling digits. */
(function () {
  'use strict';
  var root = document.querySelector('[data-tagdemo]'); if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tag = root.querySelector('.tag'), btns = root.querySelectorAll('[data-kind]');
  var from = root.querySelector('[data-tag-from]'), to = root.querySelector('[data-tag-to]');
  var label = root.querySelector('[data-tag-label]'), what = root.querySelector('[data-tag-what]');
  var data = {
    auto: { label: 'Orientačná výkupná cena', a: 11200, b: 12400, unit: '', what: 'Škoda Octavia · 2019 · 128 000 km' },
    byt: { label: 'Orientačná trhová cena', a: 189000, b: 198000, unit: '', what: '3-izbový byt · Ružinov · 74 m²' }
  };
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function roll(el, end) {
    if (reduce) { el.textContent = fmt(end); return; }
    var start = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0, t0 = performance.now(), d = 900;
    (function step(t) {
      var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(start + (end - start) * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var cur = 'auto', userTouched = false;
  function show(kind) {
    if (kind === cur) return; cur = kind;
    btns.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.kind === kind ? 'true' : 'false'); });
    root.classList.toggle('is-byt', kind === 'byt');
    var d = data[kind];
    tag.classList.add('is-flip');
    setTimeout(function () {
      label.textContent = d.label; what.textContent = d.what;
      tag.classList.remove('is-flip');
      roll(from, d.a); roll(to, d.b);
    }, reduce ? 0 : 300);
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { userTouched = true; show(b.dataset.kind); }); });
  if (!reduce) setInterval(function () { if (!userTouched && !document.hidden) show(cur === 'auto' ? 'byt' : 'auto'); }, 5200);
  // first roll on load
  if (!reduce) { from.textContent = '0'; to.textContent = '0'; setTimeout(function () { roll(from, 11200); roll(to, 12400); }, 600); }
})();

/* demo form: brand picker with "Iná značka…" falling back to a typed field */
(function () {
  var sel = document.querySelector('select[data-brand]'); if (!sel) return;
  var other = sel.parentNode.querySelector('.brand-other');
  sel.addEventListener('change', function () {
    var custom = sel.value === '__ina';
    other.hidden = !custom; other.required = custom;
    other.name = custom ? 'znacka' : ''; sel.name = custom ? '' : 'znacka';
    if (custom) other.focus();
  });
  var form = sel.closest('form');
  if (form) form.addEventListener('reset', function () { other.hidden = true; other.required = false; other.name = ''; sel.name = 'znacka'; });
})();
