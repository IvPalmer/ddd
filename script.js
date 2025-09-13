(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Smooth scroll (respects reduced motion)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  // Terminal typing animation with loop
  let animationRunning = false;
  let currentTimeout;
  
  const terminalTyping = () => {
    // Prevent multiple instances
    if (animationRunning) return;
    
    const terminalTitle = document.getElementById('terminal-title');
    const typedTextElement = document.getElementById('typed-text');
    const cursor = document.getElementById('cursor');
    
    // Check if text would overflow and needs line break based on actual space
    const testText = 'DDD:+5561.22.11.25.';
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'nowrap';
    
    // Copy all relevant styles from the terminal title
    const computedStyle = getComputedStyle(terminalTitle);
    tempSpan.style.fontSize = computedStyle.fontSize;
    tempSpan.style.fontFamily = computedStyle.fontFamily;
    tempSpan.style.fontWeight = computedStyle.fontWeight;
    tempSpan.style.letterSpacing = computedStyle.letterSpacing;
    
    tempSpan.textContent = testText;
    document.body.appendChild(tempSpan);
    
    const textWidth = tempSpan.offsetWidth;
    const availableWidth = window.innerWidth - 100; // More conservative padding
    document.body.removeChild(tempSpan);
    
    // Debug logging
    console.log('Text width:', textWidth, 'Available width:', availableWidth, 'Window width:', window.innerWidth);
    
    const needsLineBreak = textWidth > availableWidth;
    const fullText = needsLineBreak ? 'DDD:\n+5561.22.11.25.' : 'DDD:+5561.22.11.25.';
    
    console.log('Needs line break:', needsLineBreak, 'Text:', fullText.replace('\n', '\\n'));
    let index = 0;
    let phase = 1; // 1 = typing, 2 = pause after DDD, 3 = continue typing, 4 = final pause

    const clearText = () => {
      // Clear any existing timeout
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
      
      typedTextElement.textContent = '';
      terminalTitle.classList.remove('typing', 'paused');
      index = 0;
      phase = 1;
    };

    const typeChar = () => {
      if (phase === 1) {
        // Typing until we reach "DDD"
        if (index < 3) { // DDD is 3 characters
          terminalTitle.classList.add('typing');
          typedTextElement.textContent += fullText[index];
          index++;
          currentTimeout = setTimeout(typeChar, 180 + Math.random() * 100);
        } else {
          // DDD complete - pause with prominent cursor
          terminalTitle.classList.remove('typing');
          terminalTitle.classList.add('paused');
          phase = 2;
          currentTimeout = setTimeout(typeChar, 2000); // 2 second pause
        }
      } else if (phase === 2) {
        // Resume typing the rest
        terminalTitle.classList.remove('paused');
        terminalTitle.classList.add('typing');
        phase = 3;
        currentTimeout = setTimeout(typeChar, 100);
      } else if (phase === 3) {
        // Continue typing the phone number
        if (index < fullText.length) {
          typedTextElement.textContent += fullText[index];
          index++;
          currentTimeout = setTimeout(typeChar, 120 + Math.random() * 60);
        } else {
          // Complete - final pause
          terminalTitle.classList.remove('typing');
          terminalTitle.classList.add('paused');
          phase = 4;
          currentTimeout = setTimeout(typeChar, 3000); // 3 second pause
        }
      } else if (phase === 4) {
        // Clear and restart
        clearText();
        currentTimeout = setTimeout(() => {
          animationRunning = false; // Allow restart
          terminalTyping(); // Restart
        }, 1000); // 1 second pause before restart
      }
    };

    // Mark animation as running
    animationRunning = true;
    
    // Start immediately with cursor blinking, begin typing after 1 second
    clearText();
    currentTimeout = setTimeout(typeChar, 1000);
  };

  // Initialize terminal animation
  terminalTyping();
  
  // Handle window resize to recalculate line break needs
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Stop current animation
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
      animationRunning = false;
      
      // Restart with new calculations
      setTimeout(terminalTyping, 100);
    }, 300);
  });

  // Scroll-triggered animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        // Stagger child animations
        const children = entry.target.querySelectorAll('.animate-item');
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('animate-in');
          }, index * 100);
        });
      }
    });
  }, observerOptions);

  // Observe sections and animate elements
  document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
    // Mark animatable items
    const items = section.querySelectorAll('h2, h3, p, li, .photo, .member, .button');
    items.forEach(item => {
      item.classList.add('animate-item');
    });
  });

  // Observe footer
  const footer = document.querySelector('.site-footer');
  if (footer) {
    observer.observe(footer);
    footer.querySelectorAll('p').forEach(item => {
      item.classList.add('animate-item');
    });
  }

  // Lightbox open/close
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  if (lightbox && lightboxImg) {
    document.querySelectorAll('a[data-full]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (!href) return;
        lightboxImg.src = href;
        // Prefer figcaption text; fallback to filename heuristics
        let caption = '';
        const figure = link.closest('figure');
        const fc = figure ? figure.querySelector('figcaption') : null;
        if (fc && fc.textContent) caption = fc.textContent.trim().toUpperCase();
        if (!caption) {
          const urlParts = href.split('/');
          const filename = urlParts[urlParts.length - 1].toLowerCase();
          if (filename.includes('teatro')) caption = 'TERRAÇO DO TEATRO NACIONAL';
          else if (filename.includes('torre')) caption = 'CÚPULA DA TORRE DIGITAL';
          else if (filename.includes('panteao')) caption = 'PANTEÃO DA PÁTRIA';
          else if (filename.includes('ruinas')) caption = 'RUÍNAS DA UNB';
          else if (filename.includes('galeria')) caption = 'GALERIA INDEX';
        }
        if (caption.includes('GALERIA')) caption = 'GALERIA INDEX';
        if (lightboxCaption) lightboxCaption.textContent = caption;
        lightbox.removeAttribute('hidden');
      });
    });
    const close = () => {
      lightbox.setAttribute('hidden', '');
      if (lightboxImg) lightboxImg.removeAttribute('src');
    };
    if (lightboxClose) lightboxClose.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }
})();
