(() => {
  const toggle = document.querySelector('.language-toggle');
  const nodes = document.querySelectorAll('[data-en][data-zh]');
  const storageKey = 'portfolio-language';

  const applyLanguage = (language) => {
    const isChinese = language === 'zh';

    document.documentElement.lang = isChinese ? 'zh-CN' : 'en';
    document.title = isChinese
      ? 'Clark Cui — 嵌入式与工业系统工程师'
      : 'Clark Cui — Embedded & Industrial Systems Engineer';

    nodes.forEach((node) => {
      node.textContent = node.dataset[language];
    });

    toggle.setAttribute('aria-pressed', String(isChinese));
    toggle.setAttribute('aria-label', isChinese ? 'Switch to English' : '切换为中文');
    toggle.querySelector('.language-current').textContent = isChinese ? '中文' : 'EN';
    toggle.querySelector('.language-other').textContent = isChinese ? 'EN' : '中文';
    localStorage.setItem(storageKey, language);
  };

  const savedLanguage = localStorage.getItem(storageKey);
  const browserLanguage = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  applyLanguage(savedLanguage || browserLanguage);

  toggle.addEventListener('click', () => {
    applyLanguage(document.documentElement.lang.startsWith('zh') ? 'en' : 'zh');
  });
})();
