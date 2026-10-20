/* AIVALM — shared behaviour: nav, reveals, forms, booking. */
(function () {
  'use strict';

  var HOOKS = {
    booking: 'https://hook.eu1.make.com/0di8queev6d1cqlisd70lujsswaiui8l',
    partner: 'https://hook.eu1.make.com/42gkuqfpp97f332ughqe4usm2sgsddxc',
    sample:  'https://hook.eu1.make.com/qti8okd8zj63vuswcwzynva3lnas2urd',
    carDemo: 'https://hook.eu1.make.com/j4tyo99jquy94mc4gl5uyji6myot9l4o'
  };
  window.AIVALM = { HOOKS: HOOKS };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var tog = nav.querySelector('.nav__toggle');
    if (tog) tog.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('.nav__panel a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        if (tog) tog.setAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('menu-open');
      });
    });
  }

  /* ---------- section entrances (staggered per section) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var group = en.target.querySelectorAll('[data-rise]');
        group.forEach(function (el, i) {
          el.style.transition = 'opacity 800ms cubic-bezier(.22,1,.36,1) ' + (i * 80) + 'ms, transform 800ms cubic-bezier(.22,1,.36,1) ' + (i * 80) + 'ms';
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('[data-group]').forEach(function (g) { io.observe(g); });
  } else {
    document.querySelectorAll('[data-rise]').forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  /* ---------- pricing card: reveal, draw checks, count the price up once ---------- */
  document.querySelectorAll('[data-pplan]').forEach(function (card) {
    var nums = card.querySelectorAll('[data-count]');
    function go() {
      card.classList.add('is-in');
      if (reduce) return;
      nums.forEach(function (n) {
        var to = +n.dataset.count, t0 = null;
        function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1300); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }
        n.textContent = '0'; requestAnimationFrame(step);
      });
    }
    if (!('IntersectionObserver' in window)) { go(); return; }
    var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { o.disconnect(); go(); } }, { rootMargin: '0px 0px -20% 0px' });
    o.observe(card);
  });

  /* ---------- looping UI sequences ([data-loop] with children [data-at=n]) ---------- */
  document.querySelectorAll('[data-loop]').forEach(function (box) {
    var n = +box.dataset.loop || 4, ms = +box.dataset.loopMs || 1600, s = 0, items = box.querySelectorAll('[data-at]');
    function paint() { items.forEach(function (el) { el.classList.toggle('is-on', +el.dataset.at <= s); }); }
    if (reduce) { s = n - 1; paint(); return; }
    paint();
    var vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(box);
    setInterval(function () { if (!vis || document.hidden) return; s = (s + 1) % (n + 1); if (s === n) return; paint(); }, ms);
  });

  /* ---------- helpers ---------- */
  function post(url, data) {
    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) { if (data[k] !== undefined && data[k] !== null) body.append(k, data[k]); });
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 40000) : null;
    return fetch(url, { method: 'POST', body: body, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (timer) clearTimeout(timer);
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) {}
          return { ok: r.ok, status: r.status, json: j, text: t };
        });
      });
  }
  window.AIVALM.post = post;

  function setErr(field, msg) {
    var wrap = field.closest('.field');
    var old = wrap && wrap.querySelector('.err');
    if (old) old.remove();
    field.removeAttribute('aria-invalid');
    if (!msg) return;
    field.setAttribute('aria-invalid', 'true');
    var p = document.createElement('p');
    p.className = 'err'; p.id = (field.id || field.name) + '-err'; p.textContent = msg;
    field.setAttribute('aria-describedby', p.id);
    if (wrap) wrap.appendChild(p);
  }
  function validate(form) {
    var first = null;
    form.querySelectorAll('[required]').forEach(function (f) {
      var v = (f.value || '').trim(), msg = '';
      if (!v) msg = f.dataset.msg || 'Toto pole je povinné.';
      else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Skontrolujte e-mail, chýba v ňom zavináč alebo doména.';
      else if (f.type === 'tel' && v.replace(/[^\d]/g, '').length < 9) msg = 'Telefón má mať aspoň 9 číslic.';
      setErr(f, msg);
      if (msg && !first) first = f;
    });
    if (first) first.focus();
    return !first;
  }
  window.AIVALM.validate = validate;
  window.AIVALM.setErr = setErr;

  function formData(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    o.stranka = location.pathname.replace(/^\//, '') || 'index.html';
    Object.keys(o).forEach(function (k) { if (o[k] === '' && k !== 'pozicia') delete o[k]; });
    if (!o.pozicia) delete o.pozicia;
    return o;
  }

  /* ---------- generic webhook forms (partnership, e-mail sample, car demo) ---------- */
  document.querySelectorAll('form[data-hook]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var data = formData(form);
      if (data.pozicia) return; // honeypot
      var key = 'aivalm-' + form.dataset.hook;
      try {
        var last = +localStorage.getItem(key) || 0;
        if (form.dataset.cooldown && Date.now() - last < +form.dataset.cooldown * 1000) {
          var st0 = form.querySelector('.form__status');
          if (st0) st0.textContent = 'Toto ste už odoslali pred chvíľou. Skúste to znova o pár minút.';
          return;
        }
      } catch (err) {}
      var btn = form.querySelector('[type=submit]');
      var label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = btn.dataset.busy || 'Odosielam…'; }
      var status = form.querySelector('.form__status');
      if (status) status.textContent = '';
      post(HOOKS[form.dataset.hook], data).then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        try { localStorage.setItem(key, String(Date.now())); } catch (err) {}
        var box = form.closest('[data-done]') || form.parentElement;
        box.classList.add('is-done');
        var d = box.querySelector('.done');
        if (d) { d.setAttribute('tabindex', '-1'); d.focus({ preventScroll: true }); }
        var em = box.querySelector('[data-echo=email]');
        if (em && data.email) em.textContent = data.email;
      }).catch(function () {
        if (status) status.innerHTML = 'Odoslanie sa nepodarilo. Skúste to znova, alebo napíšte priamo na <a href="mailto:aivalm.agent@gmail.com">aivalm.agent@gmail.com</a> alebo zavolajte na <a href="tel:+421948475484">+421 948 475 484</a>.';
      }).then(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
      });
    });
  });

  /* ---------- booking ---------- */
  var TZ = 'Europe/Bratislava';
  var DAYS_AHEAD = 10;            // working days offered
  var FIRST = 9 * 60, END = 18 * 60, STEP = 30, LEAD_MIN = 180; // minutes; last meeting must end by 18:00
  var DN = ['ne', 'po', 'ut', 'st', 'št', 'pi', 'so'];
  var DL = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];

  function parts(d) {
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    var o = {}; f.formatToParts(d).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute };
  }
  function offsetMin(y, m, d, h, mi) { // minutes Bratislava is ahead of UTC at that wall time
    var guess = Date.UTC(y, m - 1, d, h, mi);
    var p = parts(new Date(guess));
    var asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    return Math.round((asUtc - guess) / 60000);
  }
  function wallToDate(y, m, d, mins) {
    var h = Math.floor(mins / 60), mi = mins % 60;
    var off = offsetMin(y, m, d, h, mi);
    return new Date(Date.UTC(y, m - 1, d, h, mi) - off * 60000);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function workDays() {
    var now = parts(new Date());
    // earliest bookable day is tomorrow (never today)
    var list = [], cur = new Date(Date.UTC(now.y, now.m - 1, now.d, 12) + 86400000);
    while (list.length < DAYS_AHEAD) {
      var wd = cur.getUTCDay();
      if (wd !== 0 && wd !== 6) list.push({ y: cur.getUTCFullYear(), m: cur.getUTCMonth() + 1, d: cur.getUTCDate(), wd: wd });
      cur = new Date(cur.getTime() + 86400000);
    }
    return list;
  }

  document.querySelectorAll('[data-booking]').forEach(function (root) {
    var daysEl = root.querySelector('.days');
    var slotsEl = root.querySelector('.slots');
    var pickEl = root.querySelector('.pick');
    var form = root.querySelector('form');
    var tInput = form.querySelector('input[name=t]');
    var days = workDays();
    var busy = null, loaded = false, selDay = null, selT = null;
    var whereEl = root.querySelector('.book__where'), addrEl = root.querySelector('.book__addr'), addrIn = form.querySelector('input[name=adresa]');
    function mode() { var r = form.querySelector('input[name=forma]:checked'); return r ? r.value : 'online'; }
    function dur() { return mode() === 'osobne' ? 60 : 30; }
    function lastStart() { return END - dur(); }
    function syncWhere() {
      var os = mode() === 'osobne', uvas = os && (form.querySelector('input[name=miesto]:checked') || {}).value === 'u-vas';
      if (whereEl) whereEl.hidden = !os;
      if (addrEl) addrEl.hidden = !uvas;
      if (addrIn) { addrIn.required = uvas; if (!uvas) setErr(addrIn, ''); }
    }
    form.querySelectorAll('input[name=forma], input[name=miesto]').forEach(function (r) {
      r.addEventListener('change', function () {
        syncWhere();
        if (r.name === 'forma') {
          if (selT) { var d = selT; var tt = +d.slice(11, 13) * 60 + +d.slice(14, 16); var dt = wallToDate(+d.slice(0, 4), +d.slice(5, 7), +d.slice(8, 10), tt);
            if (tt > lastStart() || busyAt(dt)) { selT = null; tInput.value = ''; pickEl.textContent = ''; } }
          if (loaded) renderDays();
        }
      });
    });
    syncWhere();

    function busyAt(start) {
      if (!busy) return false;
      var s = start.getTime(), e = s + dur() * 60000;
      return busy.some(function (b) { return b[0] < e && b[1] > s; });
    }
    function dayHasFree(day) {
      for (var t = FIRST; t <= lastStart(); t += STEP) {
        var dt = wallToDate(day.y, day.m, day.d, t);
        if (dt.getTime() - Date.now() >= LEAD_MIN * 60000 && !busyAt(dt)) return true;
      }
      return false;
    }
    function renderDays() {
      daysEl.innerHTML = '';
      var firstFree = null;
      days.forEach(function (day, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'day';
        b.innerHTML = '<span>' + DN[day.wd] + '</span><b>' + day.d + '.' + day.m + '.</b>';
        b.setAttribute('aria-label', DL[day.wd] + ' ' + day.d + '. ' + day.m + '.');
        var free = dayHasFree(day);
        if (!free) b.disabled = true;
        else if (firstFree === null) firstFree = i;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { selectDay(i); });
        daysEl.appendChild(b);
      });
      if (selDay === null || !dayHasFree(days[selDay])) selectDay(firstFree === null ? 0 : firstFree);
      else selectDay(selDay);
    }
    function selectDay(i) {
      selDay = i;
      daysEl.querySelectorAll('.day').forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      renderSlots();
    }
    function renderSlots() {
      slotsEl.innerHTML = '';
      if (!loaded) { for (var k = 0; k < 8; k++) { var s = document.createElement('div'); s.className = 'skeleton'; slotsEl.appendChild(s); } return; }
      var day = days[selDay], any = false;
      for (var t = FIRST; t <= lastStart(); t += STEP) {
        var dt = wallToDate(day.y, day.m, day.d, t);
        if (dt.getTime() - Date.now() < LEAD_MIN * 60000) continue;
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'slot';
        var label = Math.floor(t / 60) + ':' + pad(t % 60);
        b.textContent = label;
        var val = day.y + '-' + pad(day.m) + '-' + pad(day.d) + 'T' + pad(Math.floor(t / 60)) + ':' + pad(t % 60);
        b.dataset.t = val;
        var isBusy = busyAt(dt);
        if (isBusy) { b.disabled = true; b.setAttribute('aria-label', label + ', obsadené'); }
        else any = true;
        b.setAttribute('aria-pressed', val === selT ? 'true' : 'false');
        b.addEventListener('click', function () { choose(this.dataset.t, this.textContent); });
        slotsEl.appendChild(b);
      }
      if (!any) { var m = document.createElement('p'); m.className = 'slots__msg'; m.textContent = 'Tento deň je už plný. Vyberte si iný.'; slotsEl.appendChild(m); }
    }
    function choose(val, label) {
      selT = val; tInput.value = val;
      slotsEl.querySelectorAll('.slot').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.t === val ? 'true' : 'false'); });
      var day = days[selDay];
      pickEl.textContent = 'Vybraný termín: ' + DL[day.wd] + ' ' + day.d + '. ' + day.m + '. o ' + label;
      var err = root.querySelector('.slot-err'); if (err) err.textContent = '';
    }
    function load() {
      var from = new Date(), to = wallToDate(days[days.length - 1].y, days[days.length - 1].m, days[days.length - 1].d, 24 * 60);
      post(HOOKS.booking, { a: 'sloty', od: from.toISOString(), do: to.toISOString() }).then(function (res) {
        if (res.json && typeof res.json.s === 'string') {
          var s = res.json.s ? res.json.s.split(',') : [], e = res.json.e ? res.json.e.split(',') : [];
          busy = s.map(function (x, i) { return [new Date(x).getTime(), new Date(e[i]).getTime()]; }).filter(function (b) { return !isNaN(b[0]) && !isNaN(b[1]); });
        } else busy = [];
      }).catch(function () { busy = []; }).then(function () { loaded = true; renderDays(); });
    }
    renderDays();
    var started = false;
    function start() { if (!started) { started = true; load(); } }
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '600px 0px' });
      o.observe(root);
    } else start();

    // preselect product from ?produkt= or data attribute
    var sel = form.querySelector('select[name=produkt]');
    var q = new URLSearchParams(location.search).get('produkt');
    if (sel && q) sel.value = q;

    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var slotErr = root.querySelector('.slot-err');
      var ok = validate(form);
      if (!selT) { if (slotErr) slotErr.textContent = 'Vyberte si deň a čas stretnutia.'; if (ok) slotsEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); return; }
      if (!ok) return;
      var data = formData(form);
      if (data.pozicia) return;
      data.a = 'rezervuj';
      if (data.forma !== 'osobne') { delete data.miesto; delete data.adresa; }
      else if (data.miesto !== 'u-vas') delete data.adresa;
      var btn = form.querySelector('[type=submit]'), label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Odosielam…';
      var status = form.querySelector('.form__status'); status.textContent = '';
      post(HOOKS.booking, data).then(function (res) {
        var j = res.json || {};
        if (res.ok && (j.ok === 1 || j.ok === '1' || j.ok === true)) {
          root.classList.add('is-done');
          var d = root.querySelector('.done');
          root.querySelector('[data-echo=termin]').textContent = j.termin || pickEl.textContent.replace('Vybraný termín: ', '');
          root.querySelector('[data-echo=email]').textContent = data.email;
          var kde = root.querySelector('[data-echo=kde]'); if (kde) kde.textContent = data.forma === 'osobne' ? 'Potvrdenie s miestom stretnutia' : 'Odkaz na Google Meet';
          d.setAttribute('tabindex', '-1'); d.focus({ preventScroll: false });
        } else if (j.dovod === 'obsadene') {
          status.textContent = 'Tento čas si medzitým niekto rezervoval. Vyberte si prosím iný.';
          busy = (busy || []).concat([[wallToDate(+selT.slice(0, 4), +selT.slice(5, 7), +selT.slice(8, 10), +selT.slice(11, 13) * 60 + +selT.slice(14, 16)).getTime(), 0]]);
          busy[busy.length - 1][1] = busy[busy.length - 1][0] + dur() * 60000;
          selT = null; tInput.value = ''; pickEl.textContent = ''; renderSlots();
        } else {
          throw new Error('bad');
        }
      }).catch(function () {
        status.innerHTML = 'Rezervácia sa nepodarila. Skúste to znova, alebo napíšte na <a href="mailto:aivalm.agent@gmail.com">aivalm.agent@gmail.com</a> alebo zavolajte na <a href="tel:+421948475484">+421 948 475 484</a> a termín dohodneme ručne.';
      }).then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });
})();
