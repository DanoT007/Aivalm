/* Partnerský program – income chart: month columns grow one after another when the chart comes into view. */
(function () {
  'use strict';
  var chart = document.querySelector('[data-pchart]');
  if (!chart) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go() { chart.classList.add('is-in'); }
  if (reduce || !('IntersectionObserver' in window)) { go(); return; }
  chart.classList.add('is-ready');
  var o = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { o.disconnect(); setTimeout(go, 350); }
  }, { threshold: .35 });
  o.observe(chart);
})();
