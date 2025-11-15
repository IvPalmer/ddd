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

  // Wrap each character in a span and apply scramble effect
  function wrapCharacters(element) {
    // Skip if already wrapped
    if (element.dataset.scrambleWrapped) return;
    
    const text = element.textContent;
    const chars = text.split('');
    
    // Clear the element
    element.textContent = '';
    element.dataset.scrambleWrapped = 'true';
    
    const scramblers = [];
    const cascadeTouch = !element.matches('.project-intro');

    // Create a span for each character
    chars.forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      // Prevent layout shifts and flickering
      span.style.display = 'inline';
      span.style.transform = 'translate3d(0, 0, 0)';
      span.style.backfaceVisibility = 'hidden';
      span.style.willChange = 'contents';
      
      const scrambler = new CharScramble(span, char, index);
      scramblers.push(scrambler);
      
      // Add hover listener for desktop
      span.addEventListener('mouseenter', () => {
        scrambler.start();
      });
      
      // Add touch support for mobile
      span.addEventListener('touchstart', (e) => {
        scrambler.start();
      }, { passive: true });
      
      element.appendChild(span);
    });

    if (cascadeTouch) {
      element.addEventListener(
        'touchstart',
        () => {
          scramblers.forEach((scrambler, idx) => {
            window.setTimeout(() => scrambler.start(), idx * 10);
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
      '.team-grid .member p'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    
    elements.forEach(el => {
      // Skip if element is empty, only whitespace, or has child elements
      if (!el.textContent.trim() || el.children.length > 0) return;
      
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

