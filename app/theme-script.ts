export const themeInitScript = `
  (function () {
    try {
      var storageKey = 'theme-preference';
      var stored = localStorage.getItem(storageKey);
      var preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
      var resolved = preference === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : preference;
      document.documentElement.dataset.theme = resolved;
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
    }
  })();
`;
