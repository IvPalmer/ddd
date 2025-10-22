(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Theme toggles
  const themeButtons = document.querySelectorAll(".theme-toggle");
  const rootElement = document.documentElement;
  const THEME_STORAGE_KEY = "ddd-theme";

  const themes = {
    legacy: {
      accent: "#9df0c0",
    },
    mint: {
      accent: "#171819",
    },
    oxide: {
      accent: "#e0ba57",
      bg: "#101521",
      surface: "#f2d98d",
      text: "#f7f1e1",
    },
  };

  const applyTheme = (themeName) => {
    rootElement.setAttribute("data-theme", themeName);
    themeButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.theme === themeName));
    });
    const shaderAccent = themes[themeName]?.accent || "#ffffff";
    rootElement.style.setProperty("--shader-accent", shaderAccent);
  };

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme) {
    applyTheme(storedTheme);
  } else {
    const defaultTheme = rootElement.dataset.theme || "legacy";
    applyTheme(defaultTheme);
  }

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.theme;
      applyTheme(theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    });
  });

  // Smooth scroll (respects reduced motion)
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!prefersReduced) {
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

  // Shader-driven ASCII hero background
  const heroCanvas = document.getElementById("hero-canvas");
  if (heroCanvas) {
    const heroVideo = document.getElementById("hero-video");
    const gl = heroCanvas.getContext("webgl") || heroCanvas.getContext("experimental-webgl");
    if (gl) {
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const rect = heroCanvas.getBoundingClientRect();
        heroCanvas.width = rect.width * dpr;
        heroCanvas.height = rect.height * dpr;
        gl.viewport(0, 0, heroCanvas.width, heroCanvas.height);
      };
      resize();

      const vertexSrc = `
        attribute vec2 position;
        varying vec2 v_uv;
        void main() {
          vec2 uv = (position + 1.0) * 0.5;
          v_uv = vec2(uv.x, 1.0 - uv.y);
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fragmentSrc = `
        precision mediump float;
        varying vec2 v_uv;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform sampler2D u_video;
        uniform bool u_useVideo;
        uniform vec3 u_tintDark;
        uniform vec3 u_tintLight;

        float character(float n, vec2 p) {
          p = floor(p * vec2(-4.0, 4.0) + 2.5);
          if (p.x < 0.0 || p.x > 4.0 || p.y < 0.0 || p.y > 4.0) {
            return 0.0;
          }
          float index = p.x + 5.0 * p.y;
          float power = pow(2.0, index);
          float bit = mod(floor(n / power), 2.0);
          return bit;
        }

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        vec3 palette(float g) {
          float shadows = smoothstep(0.15, 0.4, g);
          float highlights = smoothstep(0.55, 0.95, g);
          float tone = mix(0.05, 0.85, max(shadows, highlights));
          return vec3(tone);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy;
          vec2 grid = floor(uv / 9.0) * 9.0;
          vec2 glyphUV = fract(uv / 9.0) * 2.0 - 1.0;

          float gray;
          vec3 videoCol = vec3(0.0);
          if (u_useVideo) {
            videoCol = texture2D(u_video, v_uv).rgb;
            gray = 0.3 * videoCol.r + 0.59 * videoCol.g + 0.11 * videoCol.b;
          } else {
            float noise = hash(grid / 64.0 + u_time * 0.03);
            float gradient = 0.42 + 0.3 * sin((grid.x + grid.y) * 0.004 + u_time * 0.2);
            gray = mix(gradient, noise, 0.45);
          }

          float n = 4096.0; // baseline :
          if (gray > 0.2) n = 65600.0;    // :
          if (gray > 0.3) n = 163153.0;   // *
          if (gray > 0.4) n = 15255086.0; // o
          if (gray > 0.5) n = 13121101.0; // &
          if (gray > 0.6) n = 15252014.0; // 8
          if (gray > 0.7) n = 13195790.0; // @
          if (gray > 0.8) n = 11512810.0; // #

          float glyph = character(n, glyphUV);
          float fade = smoothstep(0.0, 120.0, grid.y) * smoothstep(u_resolution.y, u_resolution.y - 160.0, grid.y);
          vec3 base = mix(u_tintDark, u_tintLight, gray);
          if (!u_useVideo) {
            base = palette(gray);
          }
          vec3 col = base * glyph * (0.6 + 0.4 * fade);
          gl_FragColor = vec4(col, glyph);
        }
      `;

      const compile = (type, source) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = compile(gl.VERTEX_SHADER, vertexSrc);
      const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSrc);
      if (vertexShader && fragmentShader) {
        const program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vertexShader);
          gl.attachShader(program, fragmentShader);
          gl.bindAttribLocation(program, 0, "position");
          gl.linkProgram(program);
          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([
                -1, -1,
                1, -1,
                -1, 1,
                -1, 1,
                1, -1,
                1, 1,
              ]),
              gl.STATIC_DRAW,
            );
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

            const uResolution = gl.getUniformLocation(program, "u_resolution");
            const uTime = gl.getUniformLocation(program, "u_time");
            const uVideo = gl.getUniformLocation(program, "u_video");
            const uUseVideo = gl.getUniformLocation(program, "u_useVideo");
            const uTintDark = gl.getUniformLocation(program, "u_tintDark");
            const uTintLight = gl.getUniformLocation(program, "u_tintLight");

            let videoReady = false;
            let videoTexture = null;

            if (heroVideo) {
              const ensurePlay = () => {
                const playPromise = heroVideo.play();
                if (playPromise) {
                  playPromise.catch(() => heroVideo.play().catch(() => {}));
                }
              };
              heroVideo.muted = true;
              heroVideo.loop = true;
              ensurePlay();
              heroVideo.addEventListener("canplay", () => {
                videoReady = true;
              });
              heroVideo.addEventListener("error", () => {
                videoReady = false;
              });

              videoTexture = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, videoTexture);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }

            const render = (time) => {
              resize();
              gl.uniform2f(uResolution, heroCanvas.width, heroCanvas.height);
              gl.uniform1f(uTime, time * 0.001);

              const useVideo = videoReady && heroVideo && heroVideo.readyState >= 2;
              gl.uniform1i(uUseVideo, useVideo ? 1 : 0);
              const theme = rootElement.getAttribute("data-theme") || "legacy";
              let dark = [0.05, 0.07, 0.07];
              let light = [0.35, 0.62, 0.52];
              if (theme === "mint") {
                dark = [0.11, 0.12, 0.11];
                light = [0.88, 1.0, 0.93];
              } else if (theme === "oxide") {
                dark = [0.06, 0.08, 0.13];
                light = [0.95, 0.85, 0.58];
              }
              gl.uniform3fv(uTintDark, dark);
              gl.uniform3fv(uTintLight, light);

              if (useVideo && videoTexture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, videoTexture);
                try {
                  gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    heroVideo,
                  );
                } catch (err) {
                  console.warn("Video texImage2D failed", err);
                }
                gl.uniform1i(uVideo, 0);
              }

              gl.drawArrays(gl.TRIANGLES, 0, 6);
              requestAnimationFrame(render);
            };
            requestAnimationFrame(render);
            window.addEventListener("resize", () => requestAnimationFrame(render));
          }
        }
      }
    } else {
      // Fallback: simple static ASCII texture using 2D context if WebGL unsupported
      const ctx = heroCanvas.getContext("2d");
      if (ctx) {
        const chars = " .:-=+*#%@";
        const drawFallback = () => {
          const dpr = window.devicePixelRatio || 1;
          heroCanvas.width = heroCanvas.clientWidth * dpr;
          heroCanvas.height = heroCanvas.clientHeight * dpr;
          ctx.scale(dpr, dpr);
          ctx.fillStyle = "#0b0f0e";
          ctx.fillRect(0, 0, heroCanvas.clientWidth, heroCanvas.clientHeight);
          ctx.fillStyle = "rgba(157, 240, 192, 0.35)";
          ctx.font = "12px var(--font-mono, monospace)";
          for (let y = 12; y < heroCanvas.clientHeight; y += 16) {
            for (let x = 8; x < heroCanvas.clientWidth; x += 12) {
              const char = chars[Math.floor(Math.random() * chars.length)];
              ctx.fillText(char, x, y);
            }
          }
          requestAnimationFrame(drawFallback);
        };
        drawFallback();
      }
    }
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
  });

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
})();
