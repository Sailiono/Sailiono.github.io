const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const motionButtons = [...document.querySelectorAll("[data-motion]")];
const languageButtons = [...document.querySelectorAll("[data-language]")];
const hero = document.querySelector("[data-hero]");
const comparison = document.querySelector("[data-comparison]");
const algorithm = document.querySelector(".algorithm");
const plot = document.querySelector("[data-plot]");
const revealRects = [...document.querySelectorAll("[data-plot-reveal]")];
const replayButton = document.querySelector("[data-replay-toggle]");
const replayTransport = document.querySelector(".replay-transport");
const replayTime = document.querySelector(".replay-time");
const readingTools = document.querySelector(".reading-tools");
const chapters = [...document.querySelectorAll("[data-index]")];
const projectLinks = [...document.querySelectorAll("[data-project-link]")];
const diagrams = [...document.querySelectorAll("[data-system]")];
const translated = [...document.querySelectorAll("[data-en]")].map((el) => ({
  el,
  zh: el.innerHTML,
  en: el.dataset.en,
}));
const accessibleLabels = [...document.querySelectorAll("[data-aria-en]")].map(
  (el) => ({ el, zh: el.getAttribute("aria-label"), en: el.dataset.ariaEn }),
);
const chartWords = new Map([
  ["公开 C 算法磁偏置回放", "Magnetic-bias replay of the public C algorithms"],
  [
    "2000个实际输出采样点。6.66秒起加入磁偏置，标准配置误差上升，抗干扰配置接近参考值。合成回放，不是实飞。",
    "2,000 actual output samples. Magnetic bias starts at 6.66 seconds. Standard error rises while the robust configuration remains close to the reference. Synthetic replay, not a flight test.",
  ],
  ["姿态误差 / °", "Attitude error / °"],
  ["时间 / s", "Time / s"],
  ["磁场偏置 →", "Mag. bias →"],
]);
const chartLabels = [
  ...document.querySelectorAll(
    "[data-chart] text, [data-chart] title, [data-chart] desc",
  ),
]
  .filter((el) => chartWords.has(el.textContent))
  .map((el) => ({
    el,
    zh: el.textContent,
    en: chartWords.get(el.textContent),
  }));

function stored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Reading works without storage. */
  }
}
let language = stored("portfolio-language") === "en" ? "en" : "zh-CN";
let manualPause = ["off", "pause"].includes(stored("portfolio-motion"));
let paused = reducedMotion.matches || manualPause;
let fullReplay = false;
let printing = false;
let printFoldouts = [];
let frame = 0;
let heroProgress = 0;
let compareProgress = 1;
let algorithmProgress = 0;
let replayProgress = 1;
const clamp = (n) => Math.min(1, Math.max(0, n));
const en = () => language === "en";

function updateControls() {
  root.dataset.paused = String(paused);
  for (const button of motionButtons) {
    button.hidden = false;
    button.disabled = reducedMotion.matches;
    button.setAttribute("aria-pressed", String(paused));
    button.title = reducedMotion.matches
      ? en()
        ? "Following your reduced-motion preference"
        : "遵循系统的减少动效设置"
      : "";
    button.textContent = reducedMotion.matches
      ? en()
        ? "Reduced motion"
        : "减少动效"
      : paused
        ? en()
          ? "Resume motion"
          : "开启动效"
        : en()
          ? "Pause motion"
          : "暂停动效";
  }
  for (const button of languageButtons) {
    button.hidden = false;
    button.textContent = en() ? "中文" : "EN";
    button.setAttribute(
      "aria-label",
      en() ? "切换到中文" : "Switch to English",
    );
  }
  if (replayButton) {
    replayButton.textContent = fullReplay
      ? en()
        ? "Scroll replay"
        : "滚动回放"
      : en()
        ? "Show full curves"
        : "显示完整曲线";
    replayButton.setAttribute("aria-pressed", String(fullReplay));
  }
  if (replayTransport) replayTransport.hidden = reducedMotion.matches;
}

function setLanguage(value) {
  language = value;
  root.lang = value;
  for (const { el, zh, en: english } of translated)
    el.innerHTML = en() ? english : zh;
  for (const { el, zh, en: english } of accessibleLabels)
    el.setAttribute("aria-label", en() ? english : zh);
  for (const { el, zh, en: english } of chartLabels)
    el.textContent = en() ? english : zh;
  document.title = en()
    ? "Sailiono — Systems, Algorithms & Validation"
    : "Sailiono — 系统、算法与验证";
  updateControls();
  schedule();
}

function paint() {
  frame = 0;
  if (reducedMotion.matches) {
    heroProgress = 0;
    compareProgress = 1;
    algorithmProgress = 0;
    replayProgress = 1;
  } else if (!paused) {
    if (hero) {
      const rect = hero.getBoundingClientRect();
      heroProgress = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
    }
    if (comparison)
      compareProgress = clamp(
        (innerHeight - comparison.getBoundingClientRect().top) / innerHeight,
      );
    if (algorithm) {
      const rect = algorithm.getBoundingClientRect();
      algorithmProgress = clamp(
        -rect.top / Math.max(1, rect.height - innerHeight),
      );
    }
    if (plot)
      replayProgress = clamp(
        (innerHeight * 0.85 - plot.getBoundingClientRect().top) /
          (innerHeight * 0.6),
      );
    for (const diagram of diagrams) {
      const progress = clamp(
        (innerHeight * 0.8 - diagram.getBoundingClientRect().top) /
          (innerHeight * 0.75),
      );
      diagram.style.setProperty("--system", progress.toFixed(4));
      const nodes = [...diagram.querySelectorAll("[data-system-node]")];
      nodes.forEach((node, i) =>
        node.toggleAttribute(
          "data-active",
          progress >= i / Math.max(1, nodes.length),
        ),
      );
    }
  }
  hero?.style.setProperty("--hero", heroProgress.toFixed(4));
  comparison?.style.setProperty("--compare", compareProgress.toFixed(4));
  algorithm?.style.setProperty("--algorithm", algorithmProgress.toFixed(4));
  const shownProgress =
    fullReplay || reducedMotion.matches || printing ? 1 : replayProgress;
  for (const rect of revealRects)
    rect.setAttribute(
      "width",
      (Number(rect.dataset.width) * shownProgress).toFixed(3),
    );
  if (replayTime)
    replayTime.textContent =
      (20 * shownProgress).toFixed(2).padStart(5, "0") + " / 20.00 s";
  if (readingTools) readingTools.hidden = scrollY < innerHeight * 0.6;
  let active = chapters[0];
  for (const chapter of chapters) {
    if (chapter.getBoundingClientRect().top <= innerHeight * 0.45)
      active = chapter;
  }
  for (const link of projectLinks) {
    if (link.hash === "#" + active?.id)
      link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(paint);
}
for (const button of languageButtons)
  button.addEventListener("click", () => {
    setLanguage(en() ? "zh-CN" : "en");
    save("portfolio-language", en() ? "en" : "zh");
  });
for (const button of motionButtons)
  button.addEventListener("click", () => {
    manualPause = !manualPause;
    paused = reducedMotion.matches || manualPause;
    save("portfolio-motion", manualPause ? "off" : "on");
    updateControls();
    schedule();
  });
replayButton?.addEventListener("click", () => {
  fullReplay = !fullReplay;
  updateControls();
  schedule();
});
for (const detail of document.querySelectorAll("details"))
  detail.addEventListener("toggle", schedule);
reducedMotion.addEventListener("change", () => {
  paused = reducedMotion.matches || manualPause;
  updateControls();
  schedule();
});
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule, { passive: true });
addEventListener("beforeprint", () => {
  if (printing) return;
  printing = true;
  printFoldouts = [
    ...document.querySelectorAll(".evidence-foldout:not([open])"),
  ];
  for (const detail of printFoldouts) detail.open = true;
  paint();
});
addEventListener("afterprint", () => {
  for (const detail of printFoldouts) detail.open = false;
  printFoldouts = [];
  printing = false;
  schedule();
});
root.dataset.motionReady = "true";
setLanguage(language);
paint();
