(function () {
  const ua = navigator.userAgent || "";
  const isIOSDevice = /iP(ad|hone|od)/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const heroLightMode = false;
  const disableScramble = prefersReducedMotion;
  window.__DDD_DISABLE_SCRAMBLE__ = disableScramble;
  
  // Add Safari class to body for CSS targeting
  if (isSafari || isIOSDevice) {
    document.documentElement.classList.add('is-safari');
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Smooth scroll (respects reduced motion)
  if (!prefersReducedMotion) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#" || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // ASCII hero background with waves and cube
  const heroAscii = document.getElementById("hero-ascii");
  if (heroAscii) {
    (function() {
      'use strict';

      // Inverted wave colors (light to dark instead of dark to light)
      const chars = [' ', '.', ':', '*', '#', '█'];
      const density = ' -=+abcdX';

      // Helper functions for cube rendering
      function map(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
      }

      function vec2(x, y) {
        return { x, y };
      }

      function vec3(x, y, z) {
        return { x, y, z };
      }

      function vec2MulN(v, n) {
        return vec2(v.x * n, v.y * n);
      }

      function vec3Copy(v) {
        return vec3(v.x, v.y, v.z);
      }

      function vec3RotX(v, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
      }

      function vec3RotY(v, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
      }

      function vec3RotZ(v, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
      }

      function vec2Sub(a, b) {
        return vec2(a.x - b.x, a.y - b.y);
      }

      function vec2Dot(a, b) {
        return a.x * b.x + a.y * b.y;
      }

      function vec2Length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
      }

      function sdSegment(p, a, b, thickness) {
        const pa = vec2Sub(p, a);
        const ba = vec2Sub(b, a);
        const h = Math.max(0, Math.min(1, vec2Dot(pa, ba) / vec2Dot(ba, ba)));
        const q = vec2Sub(pa, vec2MulN(ba, h));
        return vec2Length(q) - thickness;
      }

      function wave(t, x, seeds, amps) {
        return (
          (Math.sin(t + x * seeds[0]) + 1) * amps[0] +
          (Math.sin(t + x * seeds[1]) + 1) * amps[1] +
          (Math.sin(t + x * seeds[2])) * amps[2]
        );
      }

      // Cube data
      const l = 0.6;
      const box = {
        vertices: [
          vec3( l, l, l),
          vec3(-l, l, l),
          vec3(-l,-l, l),
          vec3( l,-l, l),
          vec3( l, l,-l),
          vec3(-l, l,-l),
          vec3(-l,-l,-l),
          vec3( l,-l,-l)
        ],
        edges: [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ]
      };

      const ASCII_CHAR_ASPECT = 2.2;
      const CUBE_WIDTH_SCALE = 1.35;

      class ASCIIAnimation {
        constructor(element) {
          this.element = element;
          this.cols = 0;
          this.rows = 0;
          this.startTime = 0;
          this.boxProj = [];
          this.cursor = { x: 0, y: 0 };
          this.lightMode = heroLightMode;
          this.prefersReducedMotion = prefersReducedMotion;
          this.frameInterval = this.lightMode ? 1000 / 18 : 1000 / 30;
          this.lastFrameTime = 0;
          this.waveSpeed = this.lightMode ? 0.0014 : 0.002;
          this.cubeSpeed = this.lightMode ? 0.006 : 0.01;
          this.animationHandle = null;
          this.densityScale = this.lightMode ? 1.35 : 1;
          
          // Hide initially to prevent FOUC/glitch
          this.element.style.opacity = '0';
          this.element.style.transition = 'opacity 0.4s ease-out';
          
          const start = () => {
            // First pass calculation
            this.init();
            this.startAnimation();
            
            // Safety delay for Safari layout stability
            setTimeout(() => {
              this.init(); // Recalculate metrics
              // Show only after stabilization
              requestAnimationFrame(() => {
                this.element.style.opacity = '1';
              });
            }, 150);
          };

          // Wait for fonts to load before initializing to ensure correct char metrics
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(start);
          } else {
            // Fallback for older browsers
            window.addEventListener('load', start);
          }

          // Throttle resize with debounce
          let resizeTimer;
          window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.init(), 150);
          }, { passive: true });
          
          // Throttle mouse position updates using RAF
          let rafPending = false;
          document.addEventListener('mousemove', (e) => {
            if (!rafPending) {
              rafPending = true;
              requestAnimationFrame(() => {
                this.cursor.x = e.clientX;
                this.cursor.y = e.clientY;
                rafPending = false;
              });
            }
          }, { passive: true });
        }

        init() {
          // Use viewport dimensions (excluding scrollbar) for consistent sizing
          const width = window.innerWidth;
          const height = window.innerHeight;

          // Match the ASCII element dimensions exactly to the viewport
          this.element.style.width = `${width}px`;
          this.element.style.height = `${height}px`;

          // Measure character metrics using the same computed styles as the ASCII element
          const testChar = document.createElement('span');
          const testText = 'MMMMMMMMMM';
          testChar.textContent = testText;
          testChar.style.visibility = 'hidden';
          testChar.style.position = 'absolute';
          this.element.appendChild(testChar);
          const charRect = testChar.getBoundingClientRect();
          const charWidth = ((charRect.width / testText.length) || 7.2) * this.densityScale;
          const lineHeight = (charRect.height || 13.2) * this.densityScale;
          this.element.removeChild(testChar);

          // Add buffer columns to ensure the right edge is fully covered
          this.cols = Math.ceil(width / charWidth) + 6;
          this.rows = Math.ceil(height / lineHeight);
        }

        updateCubeProjection(t) {
          const rot = vec3(t * 0.11, t * 0.13, -t * 0.15);
          const d = 2;
          const zOffs = map(Math.sin(t * 0.12), -1, 1, -2.5, -6);
          
          for (let i = 0; i < box.vertices.length; i++) {
            const v = vec3Copy(box.vertices[i]);
            let vt = vec3RotX(v, rot.x);
            vt = vec3RotY(vt, rot.y);
            vt = vec3RotZ(vt, rot.z);
            vt.x *= CUBE_WIDTH_SCALE;
            this.boxProj[i] = vec2MulN(vec2(vt.x, vt.y), d / (vt.z - zOffs));
          }
        }

        getCubeChar(x, y, t) {
          const m = Math.min(this.cols, this.rows);
          const aspect = (this.cols / this.rows) / ASCII_CHAR_ASPECT;
          
          const st = {
            x: 2.0 * (x - this.cols / 2 + 0.5) / m * aspect,
            y: 2.0 * (y - this.rows / 2 + 0.5) / m,
          };
          
          let d = 1e10;
          const thickness = map(this.cursor.x, 0, window.innerWidth, 0.02, 0.18);
          const expMul = map(this.cursor.y, 0, window.innerHeight, -100, -5);
          
          for (let i = 0; i < box.edges.length; i++) {
            const a = this.boxProj[box.edges[i][0]];
            const b = this.boxProj[box.edges[i][1]];
            d = Math.min(d, sdSegment(st, a, b, thickness));
          }
          
          const idx = Math.floor(Math.exp(expMul * Math.abs(d)) * density.length);
          
          if (idx === 0) {
            return {
              char: null,
              color: null,
              visible: false
            };
          } else {
            return {
              char: density[Math.min(idx, density.length - 1)],
              color: 'royalblue',
              visible: true
            };
          }
        }

        renderFrame(t, tCube) {
          this.updateCubeProjection(tCube);
          let output = '';

          for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
              const v0 = this.rows / 4 + wave(t, x, [0.15, 0.13, 0.37], [10, 8, 5]) * 0.9;
              const v1 = v0 + wave(t, x, [0.12, 0.14, 0.27], [3, 6, 5]) * 0.8;
              const v2 = v1 + wave(t, x, [0.089, 0.023, 0.217], [2, 4, 2]) * 0.3;
              const v3 = v2 + wave(t, x, [0.167, 0.054, 0.147], [4, 6, 7]) * 0.4;

              let waveChar;
              if (y <= v0) {
                waveChar = chars[0];
              } else if (y >= v3) {
                waveChar = chars[chars.length - 1];
              } else {
                const gradient = (y - v0) / (v3 - v0 || 1);
                const idx = Math.min(chars.length - 2, Math.floor(gradient * (chars.length - 2))) + 1;
                waveChar = chars[idx];
              }

              const cubeResult = this.getCubeChar(x, y, tCube);

              if (cubeResult.visible && cubeResult.char !== null && density.includes(cubeResult.char)) {
                output += cubeResult.char;
              } else {
                output += waveChar;
              }
            }
            output += '\n';
          }

          this.element.textContent = output;
        }

        startAnimation() {
          if (this.animationHandle) return;

          if (this.prefersReducedMotion) {
            this.renderFrame(0, 0);
            return;
          }

          const loop = (now) => {
            if (!this.startTime) {
              this.startTime = now;
              this.lastFrameTime = now;
            }

            if (now - this.lastFrameTime >= this.frameInterval) {
              this.lastFrameTime = now;
              const elapsed = now - this.startTime;
              this.renderFrame(elapsed * this.waveSpeed, elapsed * this.cubeSpeed);
            }

            this.animationHandle = requestAnimationFrame(loop);
          };

          this.animationHandle = requestAnimationFrame(loop);
        }

        stopAnimation() {
          if (this.animationHandle) {
            cancelAnimationFrame(this.animationHandle);
            this.animationHandle = null;
          }
          this.startTime = 0;
          this.lastFrameTime = 0;
        }

        restartAnimation() {
          this.stopAnimation();
          this.startAnimation();
        }
      }
      const heroAsciiController = new ASCIIAnimation(heroAscii);
      document.addEventListener("visibilitychange", () => {
        if (!heroAsciiController || heroAsciiController.prefersReducedMotion) return;
        if (document.hidden) heroAsciiController.stopAnimation();
        else heroAsciiController.restartAnimation();
      }, { passive: true });
      window.addEventListener("pageshow", (event) => {
        if (event.persisted && heroAsciiController) {
          heroAsciiController.init();
          heroAsciiController.restartAnimation();
        }
      }, { passive: true });
    })();
  } else {
    // Fallback removed - ASCII animation should work everywhere
  }

  // Terminal typing animation with loop
  let animationRunning = false;
  let currentTimeout;

  const terminalTyping = () => {
    // Prevent multiple instances
    if (animationRunning) return;

    const terminalTitle = document.getElementById("terminal-title");
    const typedTextElement = document.getElementById("typed-text");
    const cursor = document.getElementById("cursor");

    if (!terminalTitle || !typedTextElement || !cursor) {
      return;
    }

    // Check if text would overflow and needs line break based on actual space
    const testText = "DDD:+5561.22.11.25.";
    const tempSpan = document.createElement("span");
    tempSpan.style.visibility = "hidden";
    tempSpan.style.position = "absolute";
    tempSpan.style.whiteSpace = "nowrap";
    tempSpan.style.fontWeight = "bold";

    // Copy all relevant styles from the terminal title
    const computedStyle = getComputedStyle(terminalTitle);
    tempSpan.style.fontSize = computedStyle.fontSize;
    tempSpan.style.fontFamily = computedStyle.fontFamily;
    tempSpan.style.fontWeight = computedStyle.fontWeight;
    tempSpan.style.letterSpacing = computedStyle.letterSpacing;

    tempSpan.textContent = testText;
    document.body.appendChild(tempSpan);

    const textWidth = tempSpan.offsetWidth;
    const availableWidth = window.innerWidth - 10; // Minimal padding - maximize available width
    document.body.removeChild(tempSpan);

    const needsLineBreak = textWidth > availableWidth;
    const fullText = needsLineBreak
      ? "DDD:\n+5561.22.11.25."
      : "DDD:+5561.22.11.25.";
    let index = 0;
    let phase = 1; // 1 = typing, 2 = pause after DDD, 3 = continue typing, 4 = final pause

    const clearText = () => {
      // Clear any existing timeout
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }

      typedTextElement.innerHTML = "";
      terminalTitle.dataset.text = "";
      terminalTitle.classList.remove("typing", "paused");
      index = 0;
      phase = 1;
    };

    const typeChar = () => {
      if (phase === 1) {
        // Typing until we reach "DDD"
        if (index < 3) {
          // DDD is 3 characters
          terminalTitle.classList.add("typing");
          const nextIndex = index + 1;
          const currentText =
            '<span style="font-weight: 700; color: #9df0c0;">' +
            fullText.substring(0, nextIndex) +
            "</span>";
          typedTextElement.innerHTML = currentText;
          terminalTitle.dataset.text = fullText.substring(0, nextIndex);
          index = nextIndex;
          currentTimeout = setTimeout(typeChar, 180 + Math.random() * 100);
        } else {
          // DDD complete - pause with prominent cursor
          terminalTitle.classList.remove("typing");
          terminalTitle.classList.add("paused");
          phase = 2;
          currentTimeout = setTimeout(typeChar, 2000); // 2 second pause
        }
      } else if (phase === 2) {
        // Resume typing the rest
        terminalTitle.classList.remove("paused");
        terminalTitle.classList.add("typing");
        phase = 3;
        currentTimeout = setTimeout(typeChar, 100);
      } else if (phase === 3) {
        // Continue typing the phone number
        if (index < fullText.length) {
          const nextIndex = index + 1;
          const currentText =
            '<span style="font-weight: 700; color: #9df0c0;">' +
            fullText.substring(0, nextIndex) +
            "</span>";
          typedTextElement.innerHTML = currentText;
          terminalTitle.dataset.text = fullText.substring(0, nextIndex);
          index = nextIndex;
          currentTimeout = setTimeout(typeChar, 120 + Math.random() * 60);
        } else {
          // Complete - final pause
          terminalTitle.classList.remove("typing");
          terminalTitle.classList.add("paused");
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
  window.addEventListener("resize", () => {
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
  }, { passive: true });

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
    // Original messages
    { text: "eai ja ouviu falar da ddd?", weight: 8 },
    { text: "fiquei sabendo que vai ser na galeria index!!", weight: 10 },
    { text: "vai ser dia 06.12 as 21h ate umas 4h", weight: 10 },
    { text: "ai brasilia tava precisando de um rolezinho novo ne?!", weight: 4 },
    { text: "gg limona tudo pra mim", weight: 10 },
    { text: "unexpected beats drive our minds and bodies", weight: 6 },
    { text: "eu amo kurup!!", weight: 7 },
    { text: "aff dj chokolaty lenda", weight: 10 },
    { text: "leriss e gio patrimonios de bsb!!", weight: 10 },
    { text: "nice dreamks melhor bar da cidade mona", weight: 10 },
    { text: "bolsonaro na cadeiaaaa", weight: 4 },
    { text: "boiler room de c* é rola amiga vamo pra ddd", weight: 2 },
    { text: "dsrptv sundsystem é o palmer ne?", weight: 5 },
    { text: "vamo chegar cedo ne pra dar close nas gravações", weight: 8 },
    { text: "ingresso muito barato ne? 30 reais os 50 primeiros!", weight: 7 },
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
      
      console.log(`Message at ${randomTop.toFixed(0)}% - Direction: ${direction}, Duration: ${duration.toFixed(1)}s`);
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

