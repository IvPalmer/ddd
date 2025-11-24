// ASCII Background Animation
// Ported from: https://play.ertdfgcvb.xyz/
// Original author: ertdfgcvb
// Title: Sin Sin

(function() {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'ascii-bg';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');

    // Settings
    const pattern = '┌┘└┐╰╮╭╯';
    const fontSize = 14; // Adjust for resolution/performance
    const font = `${fontSize}px "FT System Mono", monospace`;
    
    let cols, rows;
    let charSize = { w: 0, h: fontSize };
    let mode = 0; // Keeping mode variable for future extensibility/compatibility, though this pattern is single-mode
    
    // Math helpers
    const { sin, round, abs } = Math;

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

    // Interaction - keeping simple click handler to prevent errors if clicked
    const toggleMode = (e) => {
        if (!e.target.closest('a, button, .lightbox, .nav-toggle, input, textarea, .map-link')) {
            // Effect has no modes, but we keep the interaction hook
        }
    };

    window.addEventListener('click', toggleMode, { passive: true });
    window.addEventListener('touchend', () => {}, { passive: true });

    // Main render loop
    function render(timestamp) {
        const t = timestamp * 0.0005; // Time scale matching original
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Style - Opacity 0.12 as requested ("mesma opacidade")
        ctx.fillStyle = 'rgba(225, 255, 237, 0.12)'; 
        ctx.font = font;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                
                const o = sin(y * x * sin(t) * 0.003 + y * 0.01 + t) * 20;
                const i = round(abs(x + y + o)) % pattern.length;
                
                const char = pattern[i];

                if (char) {
                    ctx.fillText(char, x * charSize.w, y * charSize.h);
                }
            }
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
