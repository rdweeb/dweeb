(function(){
var DW = window.DW;
var P = {};
DW.particles = P;

var tint = '#f0c4f4';
var started = false;

// settings can change the colour
P.recolor = function(){
  if (DW.set) { tint = DW.set.tint('#f0c4f4'); }
};

P.start = function(){
  if (started) { return; }
  var cv = document.getElementById('fx');
  if (!cv || DW.reduce) { return; }
  started = true;

  var ctx = cv.getContext('2d');
  var count = 42;
  if (DW.low) { count = 14; }
  var ps = [];  // the particles
  var w = 0;
  var h = 0;
  var frame = 0;
  var maxDpr = 1.5;
  if (DW.low) { maxDpr = 1; }
  var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  function size(){
    w = window.innerWidth;
    h = window.innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function make(first){
    var y = h + 10;
    if (first) { y = Math.random() * h; }
    return {
      x: Math.random() * w,
      y: y,
      r: 0.6 + Math.random() * 2,  // size
      v: 0.12 + Math.random() * 0.35,  // speed
      ph: Math.random() * 6.28,  // wobble offset
      a: 0.15 + Math.random() * 0.45  // opacity
    };
  }

  size();
  for (var i = 0; i < count; i++) { ps.push(make(true)); }
  addEventListener('resize', size);

  function draw(t){
    requestAnimationFrame(draw);
    if (document.hidden || DW.gaming) { return; }

    // skip frames when the visualizer is struggling (never faster than every 2nd frame)
    var skip = 1;
    if (DW.vis.div) { skip = DW.vis.div(); }
    skip = Math.max(skip, 2);
    frame++;
    if ((frame - 1) % skip != 0) { return; }

    var S = DW.vis.state;
    var k = 0;
    if (DW.react) { k = DW.react.particles || 0; }  // how much they react to music
    var boost = 1 + (S.speed * 1.4 + S.level * 1.2 + S.pulse * 1.5) * k;

    ctx.clearRect(0, 0, w, h);
    if (!k) { return; }
    ctx.fillStyle = tint;

    var shown = count;
    if (DW.vis.lite) { shown = Math.floor(count / 2); }
    var lim = Math.round(shown * Math.min(1, k));

    for (var j = 0; j < lim; j++) {
      var p = ps[j];
      p.y -= p.v * boost * skip;
      p.x += Math.sin(t / 1800 + p.ph) * 0.18;
      if (p.y < -10) {
        p = make(false);
        ps[j] = p;
      }
      ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t / 600 + p.ph));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + S.pulse * 0.5 * k), 0, 6.283);
      ctx.fill();
    }

    // seasonal stuff (snow, leaves...) draws on top
    ctx.globalAlpha = 1;
    if (DW.season && DW.season.kind) { DW.season.draw(ctx, t, w, h, skip); }
  }
  requestAnimationFrame(draw);
};
})();
