(function () {
  const ua = navigator.userAgent || "";
  const isIOSDevice = /iP(ad|hone|od)/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disableScramble = prefersReducedMotion;
  window.__DDD_DISABLE_SCRAMBLE__ = disableScramble;
  
  // Add Safari class to body for CSS targeting
  if (isSafari || isIOSDevice) {
    document.documentElement.classList.add('is-safari');
  }

  // Initialize Lenis smooth scroll
  let lenis = null;
  
  function initLenis() {
    if (!prefersReducedMotion && typeof Lenis !== 'undefined') {
      // Add lenis class to html element
      document.documentElement.classList.add('lenis', 'lenis-smooth');
      
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // Initialize Lenis when window fully loads (ensures deferred scripts are ready)
  if (typeof Lenis !== 'undefined') {
    initLenis();
  } else {
    window.addEventListener('load', initLenis);
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Smooth scroll with Lenis (respects reduced motion)
  if (!prefersReducedMotion) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#" || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        
        // Use Lenis if available, fallback to native smooth scroll
        if (lenis) {
          lenis.scrollTo(target, {
            offset: 0,
            duration: 1.2
          });
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  // YouTube facade — load iframe on click
  document.querySelectorAll('.yt-facade').forEach(function(facade) {
    facade.addEventListener('click', function() {
      var id = facade.getAttribute('data-id');
      if (!id) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      facade.textContent = '';
      facade.appendChild(iframe);
      facade.classList.remove('yt-facade');
    });
  });

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // Scroll-triggered animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
        // Stagger child animations
        const children = entry.target.querySelectorAll(".animate-item");
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add("animate-in");
          }, index * 100);
        });
      }
    });
  }, observerOptions);

  // Observe sections and animate elements
  document.querySelectorAll(".section").forEach((section) => {
    observer.observe(section);
    // Mark animatable items
    const items = section.querySelectorAll(
      "h2, h3, p, li, .photo, .member, .button",
    );
    items.forEach((item) => {
      item.classList.add("animate-item");
    });

  });

  // Cross-browser scroll animation for location images
  const setupLocationAnimation = () => {
    const imgWrapper = document.querySelector('.location-image-wrapper');
    const mapWrapper = document.querySelector('.location-map-wrapper');
    
    if (!imgWrapper && !mapWrapper) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Small delay ensures browser has rendered initial state
          requestAnimationFrame(() => {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, 50);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });
    
    if (imgWrapper) observer.observe(imgWrapper);
    if (mapWrapper) observer.observe(mapWrapper);
  };
  
  // Run after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLocationAnimation);
  } else {
    setupLocationAnimation();
  }

  // Observe footer
  const footer = document.querySelector(".site-footer");
  if (footer) {
    observer.observe(footer);
    footer.querySelectorAll("p").forEach((item) => {
      item.classList.add("animate-item");
    });
  }

  // Lightbox open/close
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.querySelector(".lightbox-close");
  if (lightbox && lightboxImg) {
    document.querySelectorAll("a[data-full]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const href = link.getAttribute("href");
        if (!href) return;
        lightboxImg.src = href;
        // Prefer figcaption text; fallback to filename heuristics
        let caption = "";
        const figure = link.closest("figure");
        const fc = figure ? figure.querySelector("figcaption") : null;
        if (fc && fc.textContent) caption = fc.textContent.trim().toUpperCase();
        if (!caption) {
          const urlParts = href.split("/");
          const filename = urlParts[urlParts.length - 1].toLowerCase();
          if (filename.includes("teatro"))
            caption = "TERRAÇO DO TEATRO NACIONAL";
          else if (filename.includes("torre"))
            caption = "CÚPULA DA TORRE DIGITAL";
          else if (filename.includes("panteao")) caption = "PANTEÃO DA PÁTRIA";
          else if (filename.includes("ruinas")) caption = "RUÍNAS DA UNB";
          else if (filename.includes("galeria")) caption = "GALERIA INDEX";
        }
        if (caption.includes("GALERIA")) caption = "GALERIA INDEX";
        if (lightboxCaption) lightboxCaption.textContent = caption;
        lightbox.removeAttribute("hidden");
      });
    });
    const close = () => {
      lightbox.setAttribute("hidden", "");
      if (lightboxImg) lightboxImg.removeAttribute("src");
    };
    if (lightboxClose) lightboxClose.addEventListener("click", close);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // Floating ticket button logic
  // Always visible now, so observer removed

  // Radio message glitch effect using RAF for better performance
  const glitchChars = '!@#$%&*+=-_?/\\|~`';
  const messages = document.querySelectorAll('.radio-message');
  
  // Message pool with varying probabilities
  const messagePool = [
    // Post-event messages
    { text: "mano quando é a próxima??", weight: 10 },
    { text: "nossa foi mto bommm", weight: 10 },
    { text: "quero de novo!!", weight: 8 },
    { text: "a vibe tava insana", weight: 8 },
    { text: "brasília precisa de mais ddd", weight: 10 },
    { text: "melhor noite do ano ate agora", weight: 8 },
    { text: "o set do chokolaty me destruiu", weight: 7 },
    { text: "gg limona não tem explicação", weight: 7 },
    { text: "leriss e gio acabaram comigo", weight: 7 },
    { text: "kurup fechou a noite demais", weight: 7 },
    { text: "galeria index é o lugar certo", weight: 6 },
    { text: "já quero ingresso da próxima", weight: 8 },
    { text: "assistiu o aftermovie?? ficou lindo", weight: 6 },
    { text: "sem celular foi a melhor decisão", weight: 5 },
    { text: "nice dreamks melhor bar da cidade", weight: 6 },
  ];
  
  // Weighted random selection with exclusion list
  function getRandomMessage(excludeTexts = []) {
    // Filter out messages that are already visible
    const availableMessages = messagePool.filter(msg => !excludeTexts.includes(msg.text));
    
    // If no messages available (shouldn't happen), use full pool
    if (availableMessages.length === 0) {
      availableMessages.push(...messagePool);
    }
    
    const totalWeight = availableMessages.reduce((sum, msg) => sum + msg.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const msg of availableMessages) {
      random -= msg.weight;
      if (random <= 0) return msg.text;
    }
    return availableMessages[0].text; // Fallback
  }
  
  if (messages.length > 0) {
    let lastGlitchTime = 0;
    const glitchInterval = 100; // ms between glitch updates
    
    // Track recently used messages to avoid repetition
    const recentlyUsedMessages = [];
    const maxRecentMessages = Math.ceil(messagePool.length * 0.4); // Remember 40% of pool
    
    function updateTextWidth(element, text) {
      // Get the computed style from the actual element to match exactly
      const computedStyle = window.getComputedStyle(element);
      
      // Create temporary element to measure text width with exact same styling
      const temp = document.createElement('div');
      temp.style.cssText = `
        position: absolute;
        visibility: hidden;
        top: -9999px;
        font-family: ${computedStyle.fontFamily};
        font-size: ${computedStyle.fontSize};
        font-weight: ${computedStyle.fontWeight};
        letter-spacing: ${computedStyle.letterSpacing};
        white-space: nowrap;
      `;
      temp.textContent = text;
      document.body.appendChild(temp);
      const width = temp.offsetWidth;
      document.body.removeChild(temp);
      
      element.style.setProperty('--text-width', `${width}px`);
    }
    
    // Track occupied vertical zones to prevent stacking
    const elementZones = new Map(); // Map element to its current position
    const minZoneSpacing = 22; // Minimum 22% spacing between messages
    
    function getAvailableVerticalPosition(excludeElement = null) {
      // Get currently occupied positions (excluding the element we're updating)
      const occupiedPositions = [];
      for (const [el, pos] of elementZones.entries()) {
        if (el !== excludeElement) {
          occupiedPositions.push(pos);
        }
      }
      
      // Try to find a non-overlapping position (max 50 attempts)
      for (let attempt = 0; attempt < 50; attempt++) {
        const randomTop = 20 + Math.random() * 60; // Range 20-80%
        
        // Check if this position is too close to any occupied zone
        let tooClose = false;
        for (const occupiedTop of occupiedPositions) {
          if (Math.abs(randomTop - occupiedTop) < minZoneSpacing) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          return randomTop;
        }
      }
      
      // If we couldn't find a free spot, use evenly distributed positions
      const evenlySpacedPositions = [25, 45, 65];
      
      // Find which position is furthest from all occupied positions
      let bestPosition = evenlySpacedPositions[0];
      let maxMinDistance = 0;
      
      for (const testPos of evenlySpacedPositions) {
        let minDistance = 100;
        for (const occupiedPos of occupiedPositions) {
          const distance = Math.abs(testPos - occupiedPos);
          if (distance < minDistance) {
            minDistance = distance;
          }
        }
        if (minDistance > maxMinDistance) {
          maxMinDistance = minDistance;
          bestPosition = testPos;
        }
      }
      
      return bestPosition;
    }
    
    function randomizeMessageAppearance(element) {
      // Get a non-overlapping vertical position (excluding this element's current position)
      const randomTop = getAvailableVerticalPosition(element);
      element.style.top = `${randomTop}%`;
      
      // Update the zone tracking for this element
      elementZones.set(element, randomTop);
      
      // Random direction (L-R or R-L)
      const direction = Math.random() < 0.5 ? 'LR' : 'RL';
      
      // Random speed (5s - 8s)
      const duration = 5 + Math.random() * 3;
      
      // Random delay (0 - 3s)
      const delay = Math.random() * 3;
      
      // Apply animation with randomized properties
      const animationName = direction === 'LR' ? 'messageLR' : 'messageRL';
      element.style.animation = `${animationName} ${duration.toFixed(1)}s linear infinite ${delay.toFixed(1)}s`;
      
    }
    
    // Initialize messages data with unique messages
    const messagesData = [];
    const usedMessages = [];
    
    Array.from(messages).forEach(msg => {
      const randomText = getRandomMessage(usedMessages);
      usedMessages.push(randomText);
      recentlyUsedMessages.push(randomText);
      msg.setAttribute('data-text', randomText);
      messagesData.push({
        element: msg,
        originalText: randomText,
        lastChanged: Date.now()
      });
      // Initialize text width
      updateTextWidth(msg, randomText);
      // Randomize appearance with zone tracking
      randomizeMessageAppearance(msg);
    });
    
    function glitchText(data) {
      const chars = data.originalText.split('');
      const glitched = chars.map(char => {
        if (char === ' ') return ' ';
        // Random chance to glitch (20%)
        if (Math.random() < 0.2) {
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        return char;
      }).join('');
      data.element.textContent = glitched;
    }
    
    function updateRandomMessage() {
      // Pick a random message element to update
      const randomIndex = Math.floor(Math.random() * messagesData.length);
      const data = messagesData[randomIndex];
      
      // Get currently visible messages and recently used (excluding the one we're updating)
      const currentlyVisible = messagesData
        .filter((_, index) => index !== randomIndex)
        .map(d => d.originalText);
      
      const excludeMessages = [...new Set([...currentlyVisible, ...recentlyUsedMessages])];
      
      // Get a new random message that's not currently visible or recently used
      const newText = getRandomMessage(excludeMessages);
      data.originalText = newText;
      data.element.setAttribute('data-text', newText);
      data.lastChanged = Date.now();
      
      // Track recently used
      recentlyUsedMessages.push(newText);
      if (recentlyUsedMessages.length > maxRecentMessages) {
        recentlyUsedMessages.shift(); // Remove oldest
      }
      
      // Update text width for proper animation
      updateTextWidth(data.element, newText);
      
      // Randomize appearance (direction, speed, position) with zone tracking
      randomizeMessageAppearance(data.element);
    }
    
    function glitchLoop(timestamp) {
      // Update glitch effect
      if (timestamp - lastGlitchTime >= glitchInterval) {
        messagesData.forEach(data => glitchText(data));
        lastGlitchTime = timestamp;
      }
      
      // Randomly update messages at varying intervals (every 8-15 seconds per message)
      messagesData.forEach((data, index) => {
        const timeSinceLastChange = Date.now() - data.lastChanged;
        const randomInterval = 8000 + Math.random() * 7000; // 8-15 seconds
        
        if (timeSinceLastChange >= randomInterval) {
          // Update this specific message
          const currentlyVisible = messagesData
            .filter((_, idx) => idx !== index)
            .map(d => d.originalText);
          
          const excludeMessages = [...new Set([...currentlyVisible, ...recentlyUsedMessages])];
          const newText = getRandomMessage(excludeMessages);
          
          data.originalText = newText;
          data.element.setAttribute('data-text', newText);
          data.lastChanged = Date.now();
          
          recentlyUsedMessages.push(newText);
          if (recentlyUsedMessages.length > maxRecentMessages) {
            recentlyUsedMessages.shift();
          }
          
          updateTextWidth(data.element, newText);
          randomizeMessageAppearance(data.element);
        }
      });
      
      requestAnimationFrame(glitchLoop);
    }
    
    requestAnimationFrame(glitchLoop);
  }


})();

