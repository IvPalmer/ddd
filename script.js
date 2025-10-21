(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

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

  // Hero headline is static now; typing animation removed
  const terminalTitle = document.getElementById("terminal-title");
  if (terminalTitle) {
    terminalTitle.textContent = "DISCAGEM DIRETA A DISTÂNCIA";
  }

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
