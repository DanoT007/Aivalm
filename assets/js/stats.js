/* Návštevnosť – PostHog (EU), cookieless: nič sa neukladá do prehliadača návštevníka,
   preto web nepotrebuje cookie lištu. Meria sa iba: zobrazenie stránky, odchod zo stránky
   a pár krokov smerom k stretnutiu. Žiadne hodnoty z formulárov (e-mail, text dopytu) sa neposielajú.
   Vlastné návštevy: otvorte raz aivalm.com/?ja=1 (vypnúť: ?ja=0) – v tomto prehliadači sa potom nemeria. */
(function () {
  'use strict';
  var KEY = 'aivalm-ja';
  var q = new URLSearchParams(location.search).get('ja');
  try {
    if (q === '1') localStorage.setItem(KEY, '1');
    if (q === '0') localStorage.removeItem(KEY);
    if (localStorage.getItem(KEY) === '1') { window.aivTrack = function () {}; return; }
  } catch (e) {}
  if (!/(^|\.)aivalm\.com$/.test(location.hostname)) { window.aivTrack = function () {}; return; }

  /* oficiálny PostHog loader (array.js z eu-assets) */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init('phc_tUPzFaTHvX2FJRE9cY2BpBuAZPUCRJtatHvDeF7BBb7p', {
    api_host: 'https://eu.i.posthog.com',
    ui_host: 'https://eu.posthog.com',
    cookieless_mode: 'always',
    persistence: 'memory',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    disable_surveys: true,
    capture_exceptions: false,
    advanced_disable_flags: true
  });

  window.aivTrack = function (name, props) { try { posthog.capture(name, props || {}); } catch (e) {} };

  /* kliky na kroky k stretnutiu (bez textu formulárov) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a, button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/#rezervacia$/.test(href)) aivTrack('klik_stretnutie', { kde: a.classList.contains('nav__cta') ? 'menu' : 'stranka' });
    else if (a.hasAttribute('data-demo-cue')) aivTrack('klik_vyskusat_ukazku');
    else if (/^mailto:/.test(href)) aivTrack('klik_email');
    else if (/^tel:/.test(href)) aivTrack('klik_telefon');
    else if (/#formular$/.test(href)) aivTrack('klik_chcem_byt_partnerom');
  }, true);

  /* partnerský formulár hlási úspech udalosťou z site.js */
  document.addEventListener('aivalm:sent', function (e) {
    var f = e.target && e.target.dataset ? e.target.dataset.hook : '';
    aivTrack(f === 'partner' ? 'partner_formular_odoslany' : 'formular_odoslany', { typ: e.detail && e.detail.typ ? e.detail.typ : undefined });
  });
})();
