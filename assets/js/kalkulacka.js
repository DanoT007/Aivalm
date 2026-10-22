/* Replix – kalkulačka výnosov: dopyty/mes × priemerná objednávka × % stratených */
(function(){
  var root=document.querySelector('[data-rcalc]'); if(!root) return;
  var fmt=new Intl.NumberFormat('sk-SK',{maximumFractionDigits:0});
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st={q:300,o:800,l:20}, shown={m:48000,y:576000,d:60}, raf;
  function $(id){return document.getElementById(id);}
  function pct(r){var v=(+r.value-+r.min)/(+r.max-+r.min)*100;r.style.setProperty('--p',Math.max(0,Math.min(100,v))+'%');}
  function paint(){
    $('rc-out-m').textContent=fmt.format(Math.round(shown.m))+' €';
    $('rc-out-y').textContent=fmt.format(Math.round(shown.y))+' €';
    $('rc-out-d').textContent=fmt.format(Math.round(shown.d));
  }
  function calc(){
    var d=st.q*st.l/100, m=d*st.o, t={m:m,y:m*12,d:d};
    cancelAnimationFrame(raf);
    if(reduce){shown=t;paint();return;}
    var f={m:shown.m,y:shown.y,d:shown.d}, t0=performance.now();
    (function step(now){
      var k=Math.min(1,((now||performance.now())-t0)/450), e=1-Math.pow(1-k,3);
      for(var key in t) shown[key]=f[key]+(t[key]-f[key])*e;
      paint(); if(k<1) raf=requestAnimationFrame(step);
    })();
  }
  [['q','rc-n-q','rc-r-q'],['o','rc-n-o','rc-r-o'],['l','rc-n-l','rc-r-l']].forEach(function(p){
    var k=p[0], n=$(p[1]), r=$(p[2]);
    st[k]=+r.value; pct(r);
    r.addEventListener('input',function(){st[k]=+r.value;n.value=r.value;pct(r);calc();});
    n.addEventListener('input',function(){var v=Math.max(0,+n.value||0);if(k==='l')v=Math.min(100,v);if(k==='o'&&v>+r.max){v=+r.max;n.value=v;}st[k]=v;r.value=v;pct(r);calc();});
    if(k==='o') n.addEventListener('change',function(){var v=Math.min(+r.max,Math.max(+r.min,+n.value||+r.min));n.value=v;st[k]=v;r.value=v;pct(r);calc();});
  });
  calc();
})();
