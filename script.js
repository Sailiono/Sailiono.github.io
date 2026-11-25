(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const header = document.querySelector(".site-header");
  const nav = document.querySelector("#primary-nav");
  const menu = document.querySelector(".menu-toggle");
  const languageButton = document.querySelector(".language-toggle");
  const motionButton = document.querySelector(".motion-toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 860px)");
  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Preferences are optional. */
    }
  };
  let motionPaused = read("portfolio-motion") === "off";
  const motionEnabled = () => !motionPaused && !reducedMotion.matches;
  const isChinese = () => root.lang.startsWith("zh");
  const updateMenuLabel = () => {
    if (!menu) return;
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute(
      "aria-label",
      isChinese()
        ? open
          ? "关闭菜单"
          : "打开菜单"
        : open
          ? "Close menu"
          : "Open menu",
    );
  };
  const setMenu = (open) => {
    header?.classList.toggle("menu-open", open);
    menu?.setAttribute("aria-expanded", String(open));
    updateMenuLabel();
  };
  const updateMotionUI = () => {
    const enabled = motionEnabled();
    root.classList.toggle("motion-on", enabled);
    if (!motionButton) return;
    motionButton.disabled = reducedMotion.matches;
    motionButton.setAttribute("aria-pressed", String(enabled));
    const label = reducedMotion.matches
      ? isChinese()
        ? "已跟随系统减少动态"
        : "Reduced motion follows system settings"
      : isChinese()
        ? enabled
          ? "暂停动效"
          : "开启动效"
        : enabled
          ? "Pause motion"
          : "Enable motion";
    motionButton.setAttribute("aria-label", label);
    motionButton.title = label;
    motionButton.querySelector(".motion-label").textContent = isChinese()
      ? "动效"
      : "Motion";
  };
  const applyLanguage = (language) => {
    const zh = language === "zh";
    root.lang = zh ? "zh-CN" : "en";
    document.querySelectorAll("[data-zh][data-en]").forEach((node) => {
      node.textContent = node.dataset[language];
    });
    document.querySelectorAll("[data-alt-zh][data-alt-en]").forEach((node) => {
      node.alt = zh ? node.dataset.altZh : node.dataset.altEn;
    });
    document
      .querySelectorAll("[data-aria-zh][data-aria-en]")
      .forEach((node) => {
        node.setAttribute(
          "aria-label",
          zh ? node.dataset.ariaZh : node.dataset.ariaEn,
        );
      });
    document.title = zh
      ? document.body.dataset.titleZh
      : document.body.dataset.titleEn;
    if (languageButton) {
      languageButton.setAttribute("aria-pressed", String(zh));
      languageButton.setAttribute(
        "aria-label",
        zh ? "Switch to English" : "切换为中文",
      );
      languageButton.querySelector(".language-current").textContent = zh
        ? "中文"
        : "EN";
      languageButton.querySelector(".language-other").textContent = zh
        ? "EN"
        : "中文";
    }
    updateMenuLabel();
    updateMotionUI();
    save("portfolio-language", language);
    scheduleFrame();
  };

  // Native scrolling stays in control. One passive listener batches measurements
  // and writes into a frame; project diagrams contain no measured result data.
  const chapters = [...document.querySelectorAll("[data-scene]")];
  const scenes = [...document.querySelectorAll("[data-scene-visual]")];
  const sceneLinks = [...document.querySelectorAll("[data-scene-link]")];
  const stage = document.querySelector(".story-visual");
  const count = document.querySelector(".stage-count");
  const hero = document.querySelector(".hero");
  const workflow = document.querySelector(".workflow-line");
  const workflowSteps = [...document.querySelectorAll(".workflow-line li")];
  let framePending = false;
  let currentScene = -1;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  function updateFrame() {
    framePending = false;
    const height = window.innerHeight;
    const scroll = window.scrollY;
    const total = document.documentElement.scrollHeight - height;
    const bounds = chapters.map((chapter) => chapter.getBoundingClientRect());
    const workflowBounds = workflow?.getBoundingClientRect();
    const heroHeight = hero?.offsetHeight || 1;
    const stageHeight = stage?.offsetHeight || 0;
    const stageTop = stage
      ? parseFloat(getComputedStyle(stage).getPropertyValue("--story-top"))
      : 0;
    // Leave room to read below a mobile illustration; never pin a panel that
    // cannot fit. Measuring also covers translated captions and browser zoom.
    const stageFits =
      stageHeight + stageTop + (mobile.matches ? 200 : 24) <= height;
    const scrollPadding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const chapterTop =
      mobile.matches && stageFits
        ? stageTop + stageHeight + 12
        : Math.max(scrollPadding, Math.min(120, height * 0.4));
    // Anchor landing and scene activation share the same measured geometry.
    // Scroll padding and scroll margin add together in native fragment jumps.
    const trigger = Math.max(
      height * (mobile.matches ? 0.76 : 0.58),
      chapterTop + 1,
    );
    let active = 0;
    bounds.forEach((rect, index) => {
      if (rect.top <= trigger) active = index;
    });
    const progress = bounds.length
      ? clamp((trigger - bounds[active].top) / bounds[active].height)
      : 1;
    stage?.classList.toggle("is-unpinned", !stageFits);
    root.style.setProperty(
      "--chapter-offset",
      Math.max(0, chapterTop - scrollPadding) + "px",
    );
    root.style.setProperty(
      "--reading-progress",
      total > 0 ? clamp(scroll / total).toFixed(4) : "0",
    );
    root.style.setProperty(
      "--hero-drift",
      motionEnabled()
        ? (-clamp(scroll / heroHeight) * 30).toFixed(2) + "px"
        : "0px",
    );
    root.style.setProperty(
      "--hero-turn",
      motionEnabled()
        ? (clamp(scroll / heroHeight) * 1.8).toFixed(2) + "deg"
        : "0deg",
    );
    stage?.style.setProperty(
      "--scene-progress",
      motionEnabled() ? progress.toFixed(4) : "1",
    );
    if (active !== currentScene) {
      currentScene = active;
      chapters.forEach((chapter, i) =>
        chapter.classList.toggle("is-active", i === active),
      );
      scenes.forEach((scene, i) =>
        scene.classList.toggle("is-active", i === active),
      );
      sceneLinks.forEach((item, i) => {
        if (i === active) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });
      if (count) count.textContent = "0" + (active + 1) + " — 04";
    }
    if (workflowBounds) {
      const completed = motionEnabled()
        ? clamp((height * 0.9 - workflowBounds.top) / (height * 0.35))
        : 1;
      workflowSteps.forEach((item, i) =>
        item.classList.toggle(
          "is-done",
          completed >= (i + 1) / workflowSteps.length,
        ),
      );
    }
  }
  function scheduleFrame() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateFrame);
  }

  if ("IntersectionObserver" in window) {
    const reveal = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -25px 0px" },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((node) => reveal.observe(node));
    root.classList.add("motion-ready");
  }
  languageButton?.addEventListener("click", () =>
    applyLanguage(isChinese() ? "en" : "zh"),
  );
  motionButton?.addEventListener("click", () => {
    motionPaused = !motionPaused;
    save("portfolio-motion", motionPaused ? "off" : "on");
    updateMotionUI();
    scheduleFrame();
  });
  menu?.addEventListener("click", () =>
    setMenu(menu.getAttribute("aria-expanded") !== "true"),
  );
  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu?.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      menu.focus();
    }
  });
  mobile.addEventListener("change", () => {
    setMenu(false);
    scheduleFrame();
  });
  reducedMotion.addEventListener("change", () => {
    updateMotionUI();
    scheduleFrame();
  });
  window.addEventListener("scroll", scheduleFrame, { passive: true });
  window.addEventListener("resize", scheduleFrame, { passive: true });
  window.addEventListener("load", scheduleFrame, { once: true });
  if (stage && "ResizeObserver" in window) {
    new ResizeObserver(scheduleFrame).observe(stage);
  }
  document.fonts?.ready.then(scheduleFrame);
  const savedLanguage = read("portfolio-language");
  applyLanguage(savedLanguage === "en" ? "en" : "zh");
  updateFrame();
})();
