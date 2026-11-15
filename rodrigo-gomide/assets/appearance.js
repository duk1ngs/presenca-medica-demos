(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const key = 'presenca-medica-appearance';
  let choice = null;
  try { const stored = localStorage.getItem(key); if (stored === 'dark' || stored === 'light') choice = stored; } catch {}
  const apply = () => {
    const dark = choice ? choice === 'dark' : system.matches;
    root.dataset.appearance = dark ? 'dark' : 'light';
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    toggle.hidden = false;
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
    toggle.querySelector('.theme-label').textContent = dark ? 'Claro' : 'Escuro';
  };
  apply();
  system.addEventListener('change', () => { if (!choice) apply(); });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelector('.theme-toggle')?.addEventListener('click', () => {
      choice = root.dataset.appearance === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, choice); } catch {}
      apply();
    });
  });
})();
