(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const toggle = document.querySelector(".language-toggle");
  const header = document.querySelector(".site-header");
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-nav");
  const storageKey = "portfolio-language";
  const readLanguage = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === "en" || saved === "zh" ? saved : "zh";
    } catch {
      return "zh";
    }
  };
  const updateMenuLabel = () => {
    if (!menu) return;
    const open = menu.getAttribute("aria-expanded") === "true";
    const zh = root.lang.startsWith("zh");
    menu.setAttribute(
      "aria-label",
      zh
        ? open
          ? "关闭导航菜单"
          : "打开导航菜单"
        : open
          ? "Close navigation menu"
          : "Open navigation menu",
    );
  };
  const setMenu = (open) => {
    if (!menu || !header) return;
    header.classList.toggle("menu-open", open);
    menu.setAttribute("aria-expanded", String(open));
    updateMenuLabel();
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
    const title = zh
      ? document.body.dataset.titleZh
      : document.body.dataset.titleEn;
    if (title) document.title = title;
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(zh));
      toggle.setAttribute(
        "aria-label",
        zh ? "Switch to English" : "切换为中文",
      );
      toggle.querySelector(".language-current").textContent = zh
        ? "中文"
        : "EN";
      toggle.querySelector(".language-other").textContent = zh ? "EN" : "中文";
    }
    updateMenuLabel();
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      /* Reading does not require storage. */
    }
  };
  applyLanguage(readLanguage());
  toggle?.addEventListener("click", () =>
    applyLanguage(root.lang.startsWith("zh") ? "en" : "zh"),
  );
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
  const narrow = window.matchMedia("(max-width: 760px)");
  narrow.addEventListener("change", () => setMenu(false));
})();
