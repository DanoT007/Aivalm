/* Replix – kalkulačky: potenciálne zisky + ušetrený čas, prepínané tabmi */
(function(){
  var fmt=new Intl.NumberFormat('sk-SK',{maximumFractionDigits:0});
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RATE=14, REVIEW=2; // €/h vrátane odvodov, minúty na kontrolu ponuky s Replixom
  var models={
    zisk:function(v){var d=v[0]*v[2]/100,m=d*v[1];return {m:[m,' €'],y:[m*12,' €'],d:[d,'']};},
    cas:function(v){var w=v[0]*v[2]/60,h=v[0]*Math.max(0,v[2]-REVIEW)/60;return {h:[h,' h'],p:[h/Math.max(1,v[1]),' h'],e:[h*RATE,' €'],w:[w,' h']};}
  };
  function pct(r){var v=(+r.value-+r.min)/(+r.max-+r.min)*100;r.style.setProperty('--p',Math.max(0,Math.min(100,v))+'%');}
  [].forEach.call(document.querySelectorAll('[data-rcalc]'),function(root){
    var model=models[root.getAttribute('data-rcalc')]; if(!model) return;
    var fields=[].slice.call(root.querySelectorAll('.rcalc__f')), outs={}, shown=null, raf;
    [].forEach.call(root.querySelectorAll('[data-o]'),function(el){outs[el.getAttribute('data-o')]=el;});
    function vals(){return fields.map(function(f){return +f.querySelector('[data-r]').value;});}
    function paint(t){for(var k in t) outs[k].textContent=fmt.format(Math.round(t[k][0]))+t[k][1];}
    function calc(){
      var t=model(vals()); cancelAnimationFrame(raf);
      if(reduce||!shown){shown=t;paint(t);return;}
      var f=shown,t0=performance.now();
      (function step(now){
        var k=Math.min(1,((now||performance.now())-t0)/450),e=1-Math.pow(1-k,3),c={};
        for(var key in t) c[key]=[f[key][0]+(t[key][0]-f[key][0])*e,t[key][1]];
        shown=c; paint(c); if(k<1) raf=requestAnimationFrame(step);
      })();
    }
    fields.forEach(function(f){
      var n=f.querySelector('[data-n]'), r=f.querySelector('[data-r]'); pct(r);
      r.addEventListener('input',function(){n.value=r.value;pct(r);calc();});
      n.addEventListener('input',function(){var v=Math.max(0,+n.value||0);if(v>+r.max){v=+r.max;n.value=v;}r.value=v;pct(r);calc();});
      n.addEventListener('change',function(){var v=Math.min(+r.max,Math.max(+r.min,+n.value||+r.min));n.value=v;r.value=v;pct(r);calc();});
    });
    calc();
  });
  var tabs=[].slice.call(document.querySelectorAll('.rtabs__b'));
  function sel(b,focus){tabs.forEach(function(t){var on=t===b;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on;});if(focus)b.focus();}
  tabs.forEach(function(b,i){
    b.addEventListener('click',function(){sel(b);});
    b.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();sel(tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length],true);}});
  });
})();
