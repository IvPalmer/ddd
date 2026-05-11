// Pretext-style Variable Typographic ASCII Hero
// Canvas-rendered particle system with brightness field
// Replaces the previous WebGL hero shader

(function () {
  const canvas = document.getElementById('hero-ascii-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const FONT_SIZE = 14;
  const LINE_HEIGHT = 16;
  const CHAR_W = 8.43; // Approx monospace char width at 14px
  const FONT_FAMILY = '"FT System Mono", "SFMono-Regular", Menlo, Consolas, monospace';

  let COLS, ROWS;
  const SIM_W = 320;
  let SIM_H;

  const PARTICLE_N = 180;
  const SPRITE_R = 18;
  const ATTRACTOR_R = 16;
  const LARGE_ATTRACTOR_R = 40;
  const ATTRACTOR_FORCE_1 = 0.22;
  const ATTRACTOR_FORCE_2 = 0.06;
  const MOUSE_FORCE = 0.30;
  const FIELD_DECAY = 0.82;
  const FIELD_OVERSAMPLE = 2;

  let FIELD_COLS, FIELD_ROWS, FIELD_SCALE_X, FIELD_SCALE_Y;
  let brightnessField;
  const particles = [];

  let mouseSimX = -999, mouseSimY = -999, mouseActive = false;

  // Character density ramp
  const RAMP = ' .,:;!+-=*#@%&';
  const RAMP_LEN = RAMP.length;

  // Font strings for each brightness band (minimize ctx.font switches)
  const FONT_BANDS = [
    `300 ${FONT_SIZE}px ${FONT_FAMILY}`,
    `300 ${FONT_SIZE}px ${FONT_FAMILY}`,
    `italic 300 ${FONT_SIZE}px ${FONT_FAMILY}`,
    `500 ${FONT_SIZE}px ${FONT_FAMILY}`,
    `italic 500 ${FONT_SIZE}px ${FONT_FAMILY}`,
    `700 ${FONT_SIZE}px ${FONT_FAMILY}`,
    `italic 700 ${FONT_SIZE}px ${FONT_FAMILY}`,
  ];

  // Pre-build lookup: brightness byte -> { char, fontIndex, alpha }
  const lookup = new Array(256);
  for (let b = 0; b < 256; b++) {
    const br = b / 255;
    if (br < 0.025) { lookup[b] = null; continue; }
    const ci = Math.min(RAMP_LEN - 1, (br * RAMP_LEN) | 0);
    let fi;
    if (br < 0.15) fi = 0;
    else if (br < 0.30) fi = b % 5 === 0 ? 2 : 1;
    else if (br < 0.55) fi = b % 4 === 0 ? 4 : 3;
    else fi = b % 6 === 0 ? 6 : 5;
    lookup[b] = { char: RAMP[ci], fi, alpha: Math.max(0.06, Math.min(0.95, br * 1.15)) };
  }

  // Brightness field stamp
  function spriteAlpha(d) {
    if (d >= 1) return 0;
    return d <= 0.35 ? 0.5 + (0.18 - 0.5) * (d / 0.35) : 0.18 * (1 - (d - 0.35) / 0.65);
  }

  function createStamp(rpx) {
    const frx = rpx * FIELD_SCALE_X, fry = rpx * FIELD_SCALE_Y;
    const rx = Math.ceil(frx), ry = Math.ceil(fry);
    const sx = rx * 2 + 1;
    const v = new Float32Array(sx * (ry * 2 + 1));
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++)
        v[(y + ry) * sx + (x + rx)] = spriteAlpha(Math.sqrt((x / frx) ** 2 + (y / fry) ** 2));
    return { rx, ry, sx, v };
  }

  function splat(cx, cy, s) {
    const gcx = Math.round(cx * FIELD_SCALE_X), gcy = Math.round(cy * FIELD_SCALE_Y);
    for (let y = -s.ry; y <= s.ry; y++) {
      const gy = gcy + y;
      if (gy < 0 || gy >= FIELD_ROWS) continue;
      const fro = gy * FIELD_COLS, sro = (y + s.ry) * s.sx;
      for (let x = -s.rx; x <= s.rx; x++) {
        const gx = gcx + x;
        if (gx < 0 || gx >= FIELD_COLS) continue;
        const val = s.v[sro + x + s.rx];
        if (val > 0) {
          const fi = fro + gx;
          brightnessField[fi] = Math.min(1, brightnessField[fi] + val);
        }
      }
    }
  }

  let pStamp, laStamp, saStamp, mStamp;
  let dpr = 1;

  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    COLS = Math.floor(w / CHAR_W);
    ROWS = Math.floor(h / LINE_HEIGHT);
    SIM_H = Math.round(SIM_W * (ROWS * LINE_HEIGHT) / (COLS * CHAR_W));

    FIELD_COLS = COLS * FIELD_OVERSAMPLE;
    FIELD_ROWS = ROWS * FIELD_OVERSAMPLE;
    FIELD_SCALE_X = FIELD_COLS / SIM_W;
    FIELD_SCALE_Y = FIELD_ROWS / SIM_H;
    brightnessField = new Float32Array(FIELD_COLS * FIELD_ROWS);

    pStamp = createStamp(SPRITE_R);
    laStamp = createStamp(LARGE_ATTRACTOR_R);
    saStamp = createStamp(ATTRACTOR_R);
    mStamp = createStamp(LARGE_ATTRACTOR_R * 1.3);

    particles.length = 0;
    for (let i = 0; i < PARTICLE_N; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 60 + 25;
      particles.push({
        x: SIM_W / 2 + Math.cos(a) * r,
        y: SIM_H / 2 + Math.sin(a) * r,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
      });
    }
  }

  init();
  window.addEventListener('resize', init);

  // Mouse interaction — listen on document since canvas has pointer-events: none
  document.addEventListener('mousemove', (e) => {
    mouseSimX = (e.clientX / window.innerWidth) * SIM_W;
    mouseSimY = (e.clientY / window.innerHeight) * SIM_H;
    mouseActive = true;
  });
  document.addEventListener('mouseleave', () => { mouseActive = false; });

  // Read CSS variable for text color
  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--color-text').trim() || '#e1ffed';

  // Parse color for rgba usage
  let r = 225, g = 255, b = 237;
  if (textColor.startsWith('#') && textColor.length === 7) {
    r = parseInt(textColor.slice(1, 3), 16);
    g = parseInt(textColor.slice(3, 5), 16);
    b = parseInt(textColor.slice(5, 7), 16);
  }

  const invOS2 = 1 / (FIELD_OVERSAMPLE * FIELD_OVERSAMPLE);

  function render(now) {
    if (prefersReducedMotion) {
      // Static render for reduced motion preference
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }

    const w = canvas.width / dpr, h = canvas.height / dpr;

    // Attractor orbits
    const a1x = Math.cos(now * 0.0007) * SIM_W * 0.25 + SIM_W * 0.5;
    const a1y = Math.sin(now * 0.0011) * SIM_H * 0.30 + SIM_H * 0.5;
    const a2x = Math.cos(now * 0.0013 + Math.PI) * SIM_W * 0.20 + SIM_W * 0.5;
    const a2y = Math.sin(now * 0.0009 + Math.PI) * SIM_H * 0.25 + SIM_H * 0.5;

    // Particle physics
    for (let i = 0; i < PARTICLE_N; i++) {
      const p = particles[i];
      const d1x = a1x - p.x, d1y = a1y - p.y;
      const d2x = a2x - p.x, d2y = a2y - p.y;
      const dist1 = d1x * d1x + d1y * d1y;
      const dist2 = d2x * d2x + d2y * d2y;
      let ax, ay, f;

      if (mouseActive) {
        const dmx = mouseSimX - p.x, dmy = mouseSimY - p.y;
        const distM = dmx * dmx + dmy * dmy;
        if (distM < dist1 && distM < dist2) { ax = dmx; ay = dmy; f = MOUSE_FORCE; }
        else if (dist1 < dist2) { ax = d1x; ay = d1y; f = ATTRACTOR_FORCE_1; }
        else { ax = d2x; ay = d2y; f = ATTRACTOR_FORCE_2; }
      } else {
        if (dist1 < dist2) { ax = d1x; ay = d1y; f = ATTRACTOR_FORCE_1; }
        else { ax = d2x; ay = d2y; f = ATTRACTOR_FORCE_2; }
      }

      const dist = Math.sqrt(ax * ax + ay * ay) + 1;
      p.vx += ax / dist * f;
      p.vy += ay / dist * f;
      p.vx += (Math.random() - 0.5) * 0.25;
      p.vy += (Math.random() - 0.5) * 0.25;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -SPRITE_R) p.x += SIM_W + SPRITE_R * 2;
      if (p.x > SIM_W + SPRITE_R) p.x -= SIM_W + SPRITE_R * 2;
      if (p.y < -SPRITE_R) p.y += SIM_H + SPRITE_R * 2;
      if (p.y > SIM_H + SPRITE_R) p.y -= SIM_H + SPRITE_R * 2;
    }

    // Decay brightness field
    for (let i = 0, len = brightnessField.length; i < len; i++) brightnessField[i] *= FIELD_DECAY;

    // Splat particles and attractors
    for (let i = 0; i < PARTICLE_N; i++) splat(particles[i].x, particles[i].y, pStamp);
    splat(a1x, a1y, laStamp);
    splat(a2x, a2y, saStamp);
    if (mouseActive) splat(mouseSimX, mouseSimY, mStamp);

    // Canvas render
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = 'top';

    // Batch characters by font index
    const batches = [[], [], [], [], [], [], []];

    for (let row = 0; row < ROWS; row++) {
      const frs = row * FIELD_OVERSAMPLE * FIELD_COLS;
      const py = row * LINE_HEIGHT;

      for (let col = 0; col < COLS; col++) {
        const fcs = col * FIELD_OVERSAMPLE;
        let br = 0;
        for (let sy = 0; sy < FIELD_OVERSAMPLE; sy++) {
          const sro = frs + sy * FIELD_COLS + fcs;
          for (let sx = 0; sx < FIELD_OVERSAMPLE; sx++) br += brightnessField[sro + sx];
        }
        br *= invOS2;

        const byte = Math.min(255, (br * 255) | 0);
        const entry = lookup[byte];
        if (entry === null) continue;

        batches[entry.fi].push(col * CHAR_W, py, entry.char, entry.alpha);
      }
    }

    // Draw batches (one ctx.font switch per band)
    for (let fi = 0; fi < 7; fi++) {
      const batch = batches[fi];
      if (batch.length === 0) continue;
      ctx.font = FONT_BANDS[fi];

      for (let i = 0; i < batch.length; i += 4) {
        ctx.fillStyle = `rgba(${r},${g},${b},${batch[i + 3].toFixed(2)})`;
        ctx.fillText(batch[i + 2], batch[i], batch[i + 1]);
      }
    }

    ctx.restore();
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
