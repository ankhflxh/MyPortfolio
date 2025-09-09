// Reveal + skill bar animation
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          const percent = parseInt(
            entry.target.getAttribute("data-percent") || "0",
            10
          );
          const bar = entry.target.querySelector(".skill-meter .bar");
          const label = entry.target.querySelector(".skill-percent");

          if (bar) {
            requestAnimationFrame(() => {
              bar.style.width = percent + "%";
            });
          }

          if (label) {
            let start = 0;
            const duration = 1200;
            const startTime = performance.now();
            function tick(now) {
              const t = Math.min(1, (now - startTime) / duration);
              const val = Math.round(start + t * (percent - start));
              label.textContent = val + "%";
              if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();

/* ===========================
   Reveal + Skill Bar Animation
=========================== */
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          const percent = parseInt(
            entry.target.getAttribute("data-percent") || "0",
            10
          );
          const bar = entry.target.querySelector(".skill-meter .bar");
          const label = entry.target.querySelector(".skill-percent");

          if (bar) {
            requestAnimationFrame(() => {
              bar.style.width = percent + "%";
            });
          }

          if (label) {
            let start = 0;
            const duration = 1200;
            const startTime = performance.now();
            function tick(now) {
              const t = Math.min(1, (now - startTime) / duration);
              const val = Math.round(start + t * (percent - start));
              label.textContent = val + "%";
              if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();

/* ===========================
   Dark/Light Theme Toggle
=========================== */
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");

  // Determine initial theme: saved preference > system preference > light
  const saved = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");

  setTheme(initial);

  // Update button state/icon
  function syncButton(theme) {
    if (!btn) return;
    const isDark = theme === "dark";
    btn.setAttribute("aria-pressed", String(isDark));
    btn.textContent = isDark ? "☀️" : "🌙";
    btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  }

  function setTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
    syncButton(theme);
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      setTheme(isDark ? "light" : "dark");
    });
  }

  // Keep in sync if system preference changes (optional)
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        const savedPref = localStorage.getItem("theme");
        // Only auto-change if user hasn't set an explicit choice
        if (!savedPref) setTheme(e.matches ? "dark" : "light");
      });
  }
})();
