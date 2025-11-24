// ASCII Background Animation
// Ported from: https://play.ertdfgcvb.xyz/
// Moiré explorer by ertdfgcvb

(function() {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'ascii-bg';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');

    // Settings
    const density = ' ..._-:=+abcXW@#ÑÑÑ';
    const fontSize = 14; // Adjust for resolution/performance
    const font = `${fontSize}px "FT System Mono", monospace`;
    
    let cols, rows;
    let charSize = { w: 0, h: fontSize };
    let mode = 0;
    
    // Math helpers
    const { sin, cos, atan2, floor, min, PI, hypot } = Math;
    const vec2 = (x, y) => ({x, y});
    const dist = (v1, v2) => hypot(v1.x - v2.x, v1.y - v2.y);
    const mulN = (v, n) => ({x: v.x * n, y: v.y * n});
    const map = (v, i1, i2, o1, o2) => o1 + (o2 - o1) * ((v - i1) / (i2 - i1));

    // Resize handler
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.font = font;
        
        // Measure 'W' for max width estimate in monospace
        const metrics = ctx.measureText('W');
        charSize.w = Math.ceil(metrics.width);
        
        cols = Math.ceil(canvas.width / charSize.w);
        rows = Math.ceil(canvas.height / charSize.h);
    }

    window.addEventListener('resize', resize);
    resize();

    // Interaction
    window.addEventListener('click', (e) => {
        // Toggle mode on click, unless clicking a link or button
        if (!e.target.closest('a, button, .lightbox')) {
            mode = (mode + 1) % 3;
        }
    }, { passive: true });

    // Main render loop
    function render(timestamp) {
        const t = timestamp * 0.0003; // Scale time to match original speed approx
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Style
        ctx.fillStyle = 'rgba(225, 255, 237, 0.15)'; // Mint color with low opacity
        ctx.font = font;

        const m = min(cols, rows);
        const aspect = cols / rows;

        // Pre-calculate frame values
        const centerA = mulN(vec2(cos(t*3), sin(t*7)), 0.5);
        const centerB = mulN(vec2(cos(t*5), sin(t*4)), 0.5);
        
        const aMod = map(cos(t*2.12), -1, 1, 6, 60);
        const bMod = map(cos(t*3.33), -1, 1, 6, 60);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // Normalize coordinates
                let stX = 2.0 * (x - cols / 2) / m;
                let stY = 2.0 * (y - rows / 2) / m;
                stX *= (canvas.width / canvas.height); // Aspect correction

                const st = { x: stX, y: stY };

                let A_val, B_val;

                if (mode % 2 === 0) {
                    A_val = atan2(centerA.y - st.y, centerA.x - st.x);
                } else {
                    A_val = dist(st, centerA);
                }

                if (mode === 0) {
                    B_val = atan2(centerB.y - st.y, centerB.x - st.x);
                } else {
                    B_val = dist(st, centerB);
                }

                const a = cos(A_val * aMod);
                const b = cos(B_val * bMod);

                const i = ((a * b) + 1) / 2;
                const idx = floor(i * density.length);
                
                const char = density[Math.max(0, Math.min(idx, density.length - 1))];

                if (char !== ' ') {
                    ctx.fillText(char, x * charSize.w, y * charSize.h);
                }
            }
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();

