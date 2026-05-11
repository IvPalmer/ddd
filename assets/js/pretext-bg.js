// DDD Logo Ghosts — moiré-textured logos floating across the page
// Original moiré animation from ertdfgcvb, masked to DDD logo shapes.
// Characters fade near page elements.

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var LOGO_SRC = './assets/logo-symbol-green@256.png';
  var MS = 128;
  var FADE_DIST = 60;
  var density = ' ..._-:=+abcXW@#';

  // Three logo ghosts — each orbits on its own smooth path
  var GHOSTS = [
    { ax: 0.35, ay: 0.30, fxA: 0.11, fyA: 0.07, fxB: 0.08, fyB: 0.13, px: 0,   py: 0,   size: 380, sX: 1.0,  sY: 1.0  },
    { ax: 0.30, ay: 0.25, fxA: 0.07, fyA: 0.10, fxB: 0.13, fyB: 0.06, px: 2.1, py: 1.3, size: 310, sX: 1.1,  sY: 0.93 },
    { ax: 0.32, ay: 0.33, fxA: 0.09, fyA: 0.06, fxB: 0.05, fyB: 0.11, px: 4.0, py: 2.8, size: 350, sX: 0.93, sY: 1.07 },
  ];

  var logoImg = new Image();
  logoImg.src = LOGO_SRC;
  logoImg.onload = function () {
    document.fonts.ready.then(function () { go(logoImg); });
  };

  function go(img) {
    // Soft mask
    var c = document.createElement('canvas');
    c.width = MS; c.height = MS;
    var cCtx = c.getContext('2d');
    cCtx.drawImage(img, 0, 0, MS, MS);
    var data = cCtx.getImageData(0, 0, MS, MS).data;
    var hard = new Uint8Array(MS * MS);
    for (var i = 0; i < MS * MS; i++) hard[i] = data[i * 4 + 3] > 80 ? 1 : 0;

    var soft = new Float32Array(MS * MS);
    var blur = 4;
    for (var y = 0; y < MS; y++) {
      for (var x = 0; x < MS; x++) {
        var sum = 0, wt = 0;
        for (var dy = -blur; dy <= blur; dy++) {
          for (var dx = -blur; dx <= blur; dx++) {
            var nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < MS && ny >= 0 && ny < MS) {
              var d = Math.sqrt(dx * dx + dy * dy);
              if (d <= blur) { var w = 1 - d / blur; sum += hard[ny * MS + nx] * w; wt += w; }
            }
          }
        }
        soft[y * MS + x] = wt > 0 ? sum / wt : 0;
      }
    }

    // Hide hero
    var hc = document.getElementById('hero-ascii-canvas');
    if (hc) hc.style.display = 'none';

    var vpW = window.innerWidth, vpH = window.innerHeight;
    var canvas = document.createElement('canvas');
    canvas.id = 'ascii-bg';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var fontSize = 14;
    var font = fontSize + 'px "FT System Mono", monospace';
    var charW = 0, charH = fontSize;
    var cols, rows;

    function resize() {
      vpW = window.innerWidth; vpH = window.innerHeight;
      canvas.width = vpW; canvas.height = vpH;
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
      ctx.font = font;
      charW = Math.ceil(ctx.measureText('W').width);
      cols = Math.ceil(vpW / charW);
      rows = Math.ceil(vpH / charH);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Element rects
    var elRects = [];
    var rt = 10;
    function refreshRects() {
      elRects = [];
      var all = document.querySelectorAll(
        '.site-header, #idea h2, .project-intro, .section-aside__block, ' +
        '.sets-header, .set-card, .set-meta > *, .big-date-text, ' +
        '.radio-images, .radio-message, .detail-block, .collaborators-section, ' +
        '.footer-contact, .footer-socials, .site-footer .footer-inner > p'
      );
      for (var i = 0; i < all.length; i++) {
        var b = all[i].getBoundingClientRect();
        if (b.width > 0 && b.height > 0)
          elRects.push({ l: b.left, t: b.top, r: b.right, b: b.bottom });
      }
    }

    function nearestDist(px, py) {
      var best = 9999;
      for (var i = 0; i < elRects.length; i++) {
        var r = elRects[i];
        var dx = Math.max(r.l - px, 0, px - r.r);
        var dy = Math.max(r.t - py, 0, py - r.b);
        var d = (dx === 0 && dy === 0) ? 0 : Math.sqrt(dx * dx + dy * dy);
        if (d < best) best = d;
      }
      return best;
    }

    function sampleMask(lx, ly, ghost) {
      lx /= ghost.sX; ly /= ghost.sY;
      var mx = Math.floor((lx / ghost.size + 0.5) * MS);
      var my = Math.floor((ly / ghost.size + 0.5) * MS);
      if (mx < 0 || mx >= MS || my < 0 || my >= MS) return 0;
      return soft[my * MS + mx];
    }

    // Math helpers from original moiré
    var sin = Math.sin, cos = Math.cos, atan2 = Math.atan2, floor = Math.floor, min = Math.min, hypot = Math.hypot;
    var vec2 = function (x, y) { return { x: x, y: y }; };
    var vDist = function (a, b) { return hypot(a.x - b.x, a.y - b.y); };
    var mulN = function (v, n) { return { x: v.x * n, y: v.y * n }; };
    var mapV = function (v, i1, i2, o1, o2) { return o1 + (o2 - o1) * ((v - i1) / (i2 - i1)); };

    var mode = 0;
    document.addEventListener('click', function (e) {
      if (!e.target.closest('a, button, .lightbox, .nav-toggle, input, textarea, header, nav'))
        mode = (mode + 1) % 3;
    }, { passive: true });

    function render(timestamp) {
      requestAnimationFrame(render);
      var t = timestamp * 0.0003;

      rt += 0.016;
      if (rt > 0.3) { rt = 0; refreshRects(); }

      ctx.clearRect(0, 0, vpW, vpH);
      ctx.fillStyle = 'rgba(225, 255, 237, 0.18)';
      ctx.font = font;

      var m = min(cols, rows);

      // Moiré centers (from original)
      var centerA = mulN(vec2(cos(t * 3), sin(t * 7)), 0.5);
      var centerB = mulN(vec2(cos(t * 5), sin(t * 4)), 0.5);
      var aMod = mapV(cos(t * 2.12), -1, 1, 6, 60);
      var bMod = mapV(cos(t * 3.33), -1, 1, 6, 60);

      // Ghost positions — smooth orbits with two-frequency paths
      var ghosts = [];
      for (var gi = 0; gi < GHOSTS.length; gi++) {
        var g = GHOSTS[gi];
        var gx = vpW * (0.5 + g.ax * sin(t * g.fxA * 10 + g.px) * cos(t * g.fxB * 10 + g.px * 0.7));
        var gy = vpH * (0.5 + g.ay * cos(t * g.fyA * 10 + g.py) * sin(t * g.fyB * 10 + g.py * 0.6));
        var rot = sin(t * 0.8 + gi * 2.1) * 0.4 + cos(t * 0.5 + gi * 1.3) * 0.2;
        ghosts.push({ cx: gx, cy: gy, rot: rot, size: g.size, sX: g.sX, sY: g.sY });
      }

      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var px = x * charW + charW * 0.5;
          var py = y * charH + charH * 0.5;

          // Check if this cell is inside any ghost logo
          var maskVal = 0;
          for (var gi = 0; gi < ghosts.length; gi++) {
            var gh = ghosts[gi];
            var dx = px - gh.cx, dy = py - gh.cy;
            var halfS = gh.size * 0.65;
            if (Math.abs(dx) > halfS || Math.abs(dy) > halfS) continue;

            var cosR = cos(-gh.rot), sinR = sin(-gh.rot);
            var lx = dx * cosR - dy * sinR;
            var ly = dx * sinR + dy * cosR;

            var s = sampleMask(lx, ly, gh);
            if (s > maskVal) maskVal = s;
          }

          if (maskVal < 0.02) continue;

          // Fade near elements
          var dist = nearestDist(px, py);
          if (dist < FADE_DIST) {
            maskVal *= dist / FADE_DIST;
            if (maskVal < 0.02) continue;
          }

          // Moiré pattern (from original)
          var stX = 2.0 * (x - cols / 2) / m;
          var stY = 2.0 * (y - rows / 2) / m;
          stX *= (vpW / vpH);
          var st = { x: stX, y: stY };

          var A_val, B_val;
          if (mode % 2 === 0) A_val = atan2(centerA.y - st.y, centerA.x - st.x);
          else A_val = vDist(st, centerA);
          if (mode === 0) B_val = atan2(centerB.y - st.y, centerB.x - st.x);
          else B_val = vDist(st, centerB);

          var a = cos(A_val * aMod);
          var b = cos(B_val * bMod);
          var intensity = ((a * b) + 1) / 2;

          // Combine moiré intensity with mask
          var finalI = intensity * maskVal;
          var idx = floor(finalI * density.length);
          var ch = density[Math.max(0, Math.min(idx, density.length - 1))];
          if (ch === ' ') continue;

          var alpha = Math.min(0.25, finalI * 0.3);
          ctx.fillStyle = 'rgba(225,255,237,' + alpha.toFixed(3) + ')';
          ctx.fillText(ch, x * charW, y * charH);
        }
      }
    }

    requestAnimationFrame(render);
  }
})();
