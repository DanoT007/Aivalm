/* Replix – live demo in the hero.
   compose -> work (live steps, timer) -> offer (rendered from the webhook's JSON)
   If the webhook answers without an offer (old scenario, limit, slow AI, network), the visitor
   still gets the e-mail copy: we show the "mail" panel instead. Nothing here trusts HTML from
   the network: rows are parsed and rebuilt with textContent. */
(function () {
  'use strict';
  var root = document.querySelector('[data-demo]');
  if (!root || !window.AIVALM) return;
  var A = window.AIVALM, form = root.querySelector('[data-demo-form]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'aivalm-replix', COOLDOWN = 45000, WAIT = 75000;

  var SAMPLES = {
    stavebniny: ['Dopyt – materiál na garáž', 'Dobrý deň,\n\nstaviame garáž a prosím o cenovú ponuku na:\n– 220 ks pórobetónových tvárnic 30 cm\n– 12 vriec lepidla na pórobetón\n– 3 palety suchej betónovej zmesi\n\nDoprava do Senca. Ďakujem,\nMartin'],
    spojovaci: ['Cenová ponuka – spojovací materiál', 'Dobrý deň,\n\nprosím o nacenenie:\n– 2 000 ks skrutiek do dreva 5×60 TX\n– 500 ks hmoždiniek 8 mm\n– 40 ks závitových tyčí M10, 1 m\n– 10 bal. podložiek M10\n\nOdber budúci týždeň. Vďaka,\nPeter'],
    elektro: ['Dopyt – elektroinštalácia rodinný dom', 'Dobrý deň,\n\nposielam zoznam na elektroinštaláciu:\n– 300 m kábla CYKY-J 3×2,5\n– 150 m kábla CYKY-J 3×1,5\n– 40 ks zásuviek 230 V, biela\n– 12 ks ističov B16 jednopólových\n\nĎakujem za ponuku,\nTomáš'],
    papier: ['Dopyt – papier a hygiena pre novú pobočku', 'Dobrý deň,\n\notvárame novú pobočku a prosím o cenovú ponuku na:\n– 120 rís kancelárskeho papiera A4 80 g\n– 30 balení toaletného papiera 3-vrstvového\n– 15 kartónov papierových uterákov ZZ\n\nĎakujem,\nLucia']
  };

  var ta = form.querySelector('textarea[name=text]'), subj = form.querySelector('input[name=predmet]');
  var email = form.querySelector('input[name=email]');
  var touched = false;
  ta.addEventListener('input', function () { touched = true; });

  /* ---------- clock in the window bar ---------- */
  var clk = root.querySelector('[data-clock]');
  function hm(d) { return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bratislava' }); }
  function hms(d) { return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Bratislava' }); }
  if (clk) { clk.textContent = hm(new Date()); setInterval(function () { clk.textContent = hm(new Date()); }, 15000); }

  /* ---------- typing the sample (once on first view, and on industry switch) ---------- */
  var typing = null;
  function type(text, done) {
    clearInterval(typing);
    if (reduce) { ta.value = text; if (done) done(); return; }
    var i = 0, step = Math.max(2, Math.round(text.length / 70));
    ta.classList.add('is-typing');
    typing = setInterval(function () {
      i = Math.min(text.length, i + step);
      ta.value = text.slice(0, i);
      if (i >= text.length) { clearInterval(typing); typing = null; ta.classList.remove('is-typing'); if (done) done(); }
    }, 18);
  }
  function stopTyping() { if (typing) { clearInterval(typing); typing = null; ta.classList.remove('is-typing'); } }
  ['focus', 'pointerdown', 'keydown'].forEach(function (ev) { ta.addEventListener(ev, function () { if (typing) { stopTyping(); ta.value = SAMPLES[current][1]; } }); });

  var current = 'stavebniny';
  root.querySelectorAll('[data-ind]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.ind;
      if (touched && ta.value.trim() && k !== current && !confirm('Prepísať váš text ukážkovým dopytom?')) return;
      current = k; touched = false;
      root.querySelectorAll('[data-ind]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      subj.value = SAMPLES[k][0];
      type(SAMPLES[k][1]);
    });
  });
  if (!reduce && 'IntersectionObserver' in window) {
    var once = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return; once.disconnect();
      if (!touched) setTimeout(function () { if (!touched && document.activeElement !== ta) type(SAMPLES[current][1]); }, 700);
    }, { threshold: .4 });
    once.observe(ta);
  }

  /* "Vyskúšať na vlastnom dopyte": point at the demo.
     Desktop (demo already on screen): no scrolling, the black parts of the window pulse grey once.
     Phones: the usual glide down to the demo. Everywhere: the three window dots turn green and stay. */
  document.querySelectorAll('[data-demo-cue]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      root.classList.add('is-live');
      var r = root.getBoundingClientRect();
      var onScreen = r.top >= 0 && r.top < window.innerHeight * .4;
      if (window.innerWidth > 980 && onScreen) {
        e.preventDefault();
        if (reduce) return;
        root.classList.remove('is-cue'); void root.offsetWidth; root.classList.add('is-cue');
        setTimeout(function () { root.classList.remove('is-cue'); }, 1300);
      }
    });
  });

  /* ---------- panels ---------- */
  function show(state) {
    root.dataset.state = state;
    var p = root.querySelector('[data-panel="' + state + '"]');
    if (p) { try { p.focus({ preventScroll: true }); } catch (e) {} }
    if (window.innerWidth <= 900) {
      var r = root.getBoundingClientRect();
      if (r.top < 60 || r.top > window.innerHeight * .5) {
        var y = window.scrollY + r.top - 84;
        if (A.lenis) A.lenis.scrollTo(y, { duration: .8 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
  }

  /* ---------- work panel: live steps ---------- */
  var timerIv = null, stepTo = [];
  function chipsFrom(text) {
    return text.split(/\n/).map(function (l) { return l.replace(/^\s*(?:[-–•*·]|\d+[.)](?=\s))\s*/, '').trim(); })
      .filter(function (l) { return /\d/.test(l) && l.length > 3 && l.length < 90 && !/^(dobr|ďakuj|dakuj|s pozdrav)/i.test(l); })
      .slice(0, 6);
  }
  function startWork(text) {
    var steps = root.querySelectorAll('.wsteps li');
    steps.forEach(function (li) { li.className = ''; });
    var box = root.querySelector('[data-chips]'); box.innerHTML = '';
    chipsFrom(text).forEach(function (c) { var s = document.createElement('span'); s.textContent = c; box.appendChild(s); });
    root.querySelector('[data-got]').textContent = hms(new Date());
    var t0 = performance.now(), tEl = root.querySelector('[data-timer]');
    clearInterval(timerIv);
    timerIv = setInterval(function () { tEl.textContent = ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s'; }, 100);
    var at = [0, 900, 4200, 9000, 14000];
    stepTo.forEach(clearTimeout); stepTo = [];
    at.forEach(function (ms, i) {
      stepTo.push(setTimeout(function () {
        steps.forEach(function (li, j) { li.className = j < i ? 'is-done' : j === i ? 'is-on' : ''; });
      }, ms));
    });
    return t0;
  }
  function stopWork() { clearInterval(timerIv); stepTo.forEach(clearTimeout); stepTo = []; }

  /* ---------- offer panel ---------- */
  var eur = new Intl.NumberFormat('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(n) { return eur.format(n) + ' €'; }
  function set(k, v) { root.querySelectorAll('[data-o="' + k + '"]').forEach(function (el) { el.textContent = v; }); }
  function rows(html) {
    var out = [];
    try {
      var doc = new DOMParser().parseFromString('<table><tbody>' + String(html || '') + '</tbody></table>', 'text/html');
      doc.querySelectorAll('tr').forEach(function (tr) {
        var td = tr.querySelectorAll('td'); if (td.length < 2) return;
        var sp = td[0].querySelector('span'), detail = sp ? sp.textContent.trim() : '';
        if (sp) sp.remove();
        out.push({ name: td[0].textContent.trim(), detail: detail, sum: td[1].textContent.trim() });
      });
    } catch (e) {}
    return out;
  }
  function renderOffer(j, secs) {
    set('id', 'č. ' + (j.id || 'R-ukážka'));
    set('cas', secs.toFixed(0) + ' s');
    set('zhrnutie', j.zhrnutie ? 'AI rozpoznala ' + (j.pocet || '') + ' ' + plural(+j.pocet || 0) + '. ' + j.zhrnutie : '');
    set('odpoved', j.odpoved || '');
    var box = root.querySelector('[data-o="riadky"]'); box.innerHTML = '';
    rows(j.riadky).forEach(function (r, i) {
      var d = document.createElement('div'); d.className = 'orow'; d.style.setProperty('--d', (i * 90) + 'ms');
      var l = document.createElement('div'), n = document.createElement('b'), s = document.createElement('span'), v = document.createElement('strong');
      n.textContent = r.name; s.textContent = r.detail; v.textContent = r.sum;
      if (/overenie/i.test(r.sum)) d.classList.add('orow--flag');
      l.append(n, s); d.append(l, v); box.appendChild(d);
    });
    var suma = +j.suma || 0, dph = +j.dph || 0, ob = j.obdobie || '';
    set('obdobie', ob); set('obdobie2', ob);
    set('suma', money(suma)); set('dph', money(dph));
    countTo(root.querySelector('[data-o="spolu"]'), suma + dph);
    set('podmienky', j.podmienky || '');
    var warn = root.querySelector('[data-o="warn"]'), msgs = [];
    if (+j.neznamych > 0) msgs.push('Niektoré položky Replix v cenníku nenašiel. Neodhaduje ich, označil ich obchodníkovi na doplnenie.');
    if (+j.podozrive) msgs.push('V dopyte boli pokyny pre systém. Replix ich ignoroval a obchodníka na to upozornil.');
    warn.textContent = msgs.join(' '); warn.hidden = !msgs.length;
    root.querySelector('[data-sent]').hidden = true;
    root.querySelector('[data-approve]').hidden = false;
  }
  function plural(n) { return n === 1 ? 'položku' : n > 1 && n < 5 ? 'položky' : 'položiek'; }
  function countTo(el, to) {
    if (reduce) { el.textContent = money(to); return; }
    var t0 = performance.now();
    (function f(t) { var k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = money(to * e); if (k < 1) requestAnimationFrame(f); })(t0);
  }

  root.querySelector('[data-approve]').addEventListener('click', function () {
    this.hidden = true;
    var s = root.querySelector('[data-sent]'); s.hidden = false;
    root.classList.add('is-approved');
  });
  root.querySelectorAll('[data-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      root.classList.remove('is-approved'); stopWork(); show('compose');
      try { ta.focus({ preventScroll: true }); ta.select(); } catch (e) {}
    });
  });

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    stopTyping();
    if (!A.validate(form)) return;
    var st = form.querySelector('.form__status'); st.textContent = '';
    if (form.querySelector('[name=pozicia]').value) return;
    try { var last = +localStorage.getItem(KEY) || 0; if (Date.now() - last < COOLDOWN) { st.textContent = 'Ukážku ste odoslali pred chvíľou. Skúste to znova o minútu.'; return; } } catch (err) {}
    var data = { email: email.value.trim(), predmet: subj.value.trim(), text: ta.value.trim(), stranka: 'index.html' };
    root.querySelectorAll('[data-echo=email]').forEach(function (el) { el.textContent = data.email; });
    var btn = form.querySelector('[type=submit]'); btn.disabled = true;
    var t0 = startWork(data.text);
    show('work');
    try { localStorage.setItem(KEY, String(Date.now())); } catch (err) {}

    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var guard = setTimeout(function () { if (ctrl) ctrl.abort(); }, WAIT);
    var body = new URLSearchParams(); Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
    fetch(A.HOOKS.replix, { method: 'POST', body: body, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (x) {} return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        clearTimeout(guard);
        var j = res.j || {}, secs = (performance.now() - t0) / 1000;
        if (!res.ok) throw new Error('http');
        if (j.typ === 'ponuka' && j.riadky) {
          root.querySelectorAll('.wsteps li').forEach(function (li) { li.className = 'is-done'; });
          stopWork();
          renderOffer(j, secs);
          setTimeout(function () { show('offer'); }, reduce ? 0 : 450);
        } else if (j.typ === 'nedopyt') {
          stopWork(); set('zhrnutie2', j.zhrnutie || 'Zákazník nežiada cenovú ponuku.'); show('nedopyt');
        } else { stopWork(); show('mail'); }
      })
      .catch(function (err) {
        clearTimeout(guard); stopWork();
        if (err && err.name === 'AbortError') { show('mail'); return; }
        show('compose');
        try { localStorage.removeItem(KEY); } catch (x) {}
        st.innerHTML = 'Odoslanie sa nepodarilo. Skúste to znova alebo napíšte na <a href="mailto:aivalm.agent@gmail.com">aivalm.agent@gmail.com</a>.';
      })
      .then(function () { btn.disabled = false; });
  });
})();
