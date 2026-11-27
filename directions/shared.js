const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const motionButton = document.querySelector("[data-motion]");
let paused = reduce.matches;
let frame = 0;
function paint() {
  frame = 0;
  root.dataset.paused = String(paused);
  if (motionButton) {
    motionButton.hidden = false;
    motionButton.disabled = reduce.matches;
    motionButton.title = reduce.matches ? "遵循系统的减少动效设置" : "";
    motionButton.textContent = reduce.matches
      ? "减少动效"
      : paused
        ? "开启动效"
        : "暂停动效";
    motionButton.setAttribute("aria-pressed", String(paused));
  }
  document.querySelectorAll("[data-scroll]").forEach((section) => {
    if (paused && section.style.getPropertyValue("--p")) return;
    const r = section.getBoundingClientRect();
    const progress = paused
      ? 0
      : Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    section.style.setProperty("--p", progress.toFixed(4));
  });
  const sections = [...document.querySelectorAll("[data-index]")];
  let active = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= innerHeight * 0.5)
      active = section;
  }
  document.querySelectorAll("[data-project-link]").forEach((a) => {
    if (a.hash === "#" + active?.id) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(paint);
}
motionButton?.addEventListener("click", () => {
  paused = !paused;
  schedule();
});
reduce.addEventListener("change", () => {
  paused = reduce.matches;
  schedule();
});
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule, { passive: true });
paint();
