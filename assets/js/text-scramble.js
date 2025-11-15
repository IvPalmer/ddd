/**
 * Text Scramble Effect - Per Character
 * Inspired by ertdfgcvb.xyz
 * Applies scrambling to each individual character on hover with continuous wave pattern
 */

(function() {
  // ASCII characters to use for scrambling (inspired by ertdfgcvb.xyz)
  const chars = '█▓▒░@%#+=*ºø¤§$&[]{}()<>|/\\~^_-.,;:!?¦¨ª«¬®¯°±²³´µ¶·¸¹»¼½¾';
  
  class CharScramble {
    constructor(span, originalChar, charIndex) {
      this.span = span;
      this.originalChar = originalChar;
      this.charIndex = charIndex; // Position in the character set for wave pattern
      this.frameRequest = null;
      this.frame = 0;
      this.duration = 40; // Fixed duration for consistent wave
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
    
    // Create a span for each character
    chars.forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      // Don't use inline-block to avoid spacing issues
      span.style.display = 'inline';
      
      const scrambler = new CharScramble(span, char, index);
      
      // ONLY add hover listener to individual character spans
      // Do NOT add parent element listener to avoid triggering all at once
      span.addEventListener('mouseenter', () => {
        scrambler.start();
      });
      
      element.appendChild(span);
    });
  }

  // Initialize scramble effect on all text elements
  function initScramble() {
    // Target ALL text elements on the page
    const selectors = [
      // Navigation
      '.site-nav a',
      '.brand',
      // All headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // All paragraphs
      'p',
      // All links
      'a',
      // Specific elements
      '.footer-email',
      '.section-aside__label',
      '.section-aside__value',
      '.footer-contact a',
      '.site-footer p',
      '.project-intro',
      'button',
      'figcaption',
      'span',
      'label'
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

  // Re-initialize on theme change (in case elements are re-rendered)
  document.addEventListener('themechange', initScramble);
})();

