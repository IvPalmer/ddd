/**
 * Text Scramble Effect - Per Character
 * Inspired by ertdfgcvb.xyz
 * Applies scrambling to each individual character on hover with continuous wave pattern
 */

(function() {
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return;
  }

  // ASCII characters to use for scrambling (inspired by ertdfgcvb.xyz)
  const chars = '█▓▒░@%#+=*ºø¤§$&[]{}()<>|/\\~^_-.,;:!?¦¨ª«¬®¯°±²³´µ¶·¸¹»¼½¾';
  
  class CharScramble {
    constructor(span, originalChar, charIndex) {
      this.span = span;
      this.originalChar = originalChar;
      this.charIndex = charIndex; // Position in the character set for wave pattern
      this.frameRequest = null;
      this.frame = 0;
      this.duration = 24; // Faster completion for lower CPU time
      this.isScrambling = false;
    }

    start() {
      if (this.isScrambling) return;
      this.isScrambling = true;
      this.frame = 0;
      this.scramble();
    }

    scramble() {
      if (this.frame < this.duration) {
        // Use continuous wave pattern instead of random
        this.span.textContent = this.waveChar();
        this.frame++;
        this.frameRequest = requestAnimationFrame(() => this.scramble());
      } else {
        // Return to original
        this.span.textContent = this.originalChar;
        this.isScrambling = false;
      }
    }

    waveChar() {
      // Create a continuous wave by cycling through chars based on frame + position
      const offset = this.charIndex * 3; // Offset based on character position
      const index = (this.frame + offset) % chars.length;
      return chars[index];
    }

    stop() {
      cancelAnimationFrame(this.frameRequest);
      this.span.textContent = this.originalChar;
      this.isScrambling = false;
    }
  }

  function setupScrambler(span, char, index) {
      span.style.display = 'inline';
      span.style.transform = 'translate3d(0, 0, 0)';
      span.style.backfaceVisibility = 'hidden';
      span.style.willChange = 'contents';
      
      const scrambler = new CharScramble(span, char, index);
      
      span.addEventListener('mouseenter', () => {
        scrambler.start();
      });
      
      span.addEventListener('touchstart', (e) => {
        scrambler.start();
      }, { passive: true });

      return scrambler;
  }

  // Wrap each character in a span and apply scramble effect, preserving HTML structure
  function wrapCharacters(element) {
    // Skip if already wrapped
    if (element.dataset.scrambleWrapped) return;
    element.dataset.scrambleWrapped = 'true';
    
    const allScramblers = [];
    
    function processNode(node) {
        if (node.nodeType === 3) { // Text node
            const text = node.nodeValue;
            // Skip empty text nodes that are just whitespace layout formatting
            if (!text.trim()) return;
            
            const fragment = document.createDocumentFragment();
            const chars = text.split('');
            
            chars.forEach((char, index) => {
                const span = document.createElement('span');
                span.textContent = char;
                
                if (char.trim()) {
                    const s = setupScrambler(span, char, index);
                    allScramblers.push(s);
                } else {
                    // Just a space, no scramble needed but style to match
                    span.style.display = 'inline';
                }
                
                fragment.appendChild(span);
            });
            node.parentNode.replaceChild(fragment, node);
        } else if (node.nodeType === 1) { // Element node
            // Skip scripts, styles, and already interactive elements that might break
            if (['SCRIPT', 'STYLE', 'svg', 'IMG'].includes(node.tagName)) return;
            
            // Recurse into children
            Array.from(node.childNodes).forEach(child => processNode(child));
        }
    }

    Array.from(element.childNodes).forEach(child => processNode(child));

    // Only apply full-container touch effect to headings and special elements
    // to avoid massive glitching on long paragraphs
    if (element.matches('h1, h2, h3, .hero-heading, .hero-meta, .hero-lineup, #terminal-title, .button')) {
        element.addEventListener(
            'touchstart',
            () => {
              allScramblers.forEach((scrambler, idx) => {
                if (Math.random() > 0.7) {
                    window.setTimeout(() => scrambler.start(), idx * 2);
                }
              });
            },
            { passive: true },
        );
    }
  }

  // Initialize scramble effect on all text elements
  function initScramble() {
    const selectors = [
      '.site-nav a',
      '.brand',
      '.section h2',
      '.section h3',
      '#terminal-title',
      '.hero-heading',
      '.hero-subheading',
      '.hero-meta',
      '.hero-lineup',
      '.section-aside__label',
      '.section-aside__value',
      '.project-intro',
      '.button',
      '.footer-contact h2',
      '.footer-contact .button',
      '.footer-email',
      '.site-footer p',
      '.team-grid .member h3',
      '.team-grid .member p',
      '.big-date-text',
      '.detail-title',
      '.detail-text',
      '.info-label',
      '.info-value',
      '.tickets-text',
      '.ticket-button'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    
    elements.forEach(el => {
      wrapCharacters(el);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScramble);
  } else {
    initScramble();
  }
})();
