(function () {
  var DW = window.DW, P = (DW.particles = {});

  var tint = '#f0c4f4';
  P.recolor = function () { tint = DW.set ? DW.set.tint('#f0c4f4') : tint; };
  P.start = function () {
    var cv = document.getElementById('fx');
    if (!cv || DW.reduce) return;
    var ctx = cv.getContext('2d');
    var N = DW.low ? 14 : 42, ps = [], w = 0, h = 0, f = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, DW.low ? 1 : 1.5);

    function size() {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mk(first) {
      return { x: Math.random() * w, y: first ? Math.random() * h : h + 10, r: 0.6 + Math.random() * 2,
               v: 0.12 + Math.random() * 0.35, ph: Math.random() * 6.28, a: 0.15 + Math.random() * 0.45 };
    }
    size();
    for (var i = 0; i < N; i++) ps.push(mk(true));
    addEventListener('resize', size);

    function draw(t) {
      requestAnimationFrame(draw);
      if (document.hidden || DW.gaming) return;
      var d = Math.max(DW.vis.div ? DW.vis.div() : 1, 2);
      if (f++ % d) return;
      var S = DW.vis.state, k = DW.react.particles || 0;
      var boost = 1 + (S.speed * 1.4 + S.level * 1.2 + S.pulse * 1.5) * k;
      ctx.clearRect(0, 0, w, h);
      if (!k) return;
      ctx.fillStyle = tint;
      var lim = Math.round((DW.vis.lite ? N >> 1 : N) * Math.min(1, k));
      for (var i = 0; i < lim; i++) {
        var p = ps[i];
        p.y -= p.v * boost * d;
        p.x += Math.sin(t / 1800 + p.ph) * 0.18;
        if (p.y < -10) ps[i] = p = mk(false);
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t / 600 + p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + S.pulse * 0.5 * k), 0, 6.283);
        ctx.fill();
      }
      if (DW.season && DW.season.kind) DW.season.draw(ctx, t, w, h, d);
    }
    requestAnimationFrame(draw);
  };
})();

