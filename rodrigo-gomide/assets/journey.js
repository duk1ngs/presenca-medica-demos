// Animate only the chosen chapter. Unenhanced HTML remains visible and interactive.
(() => {
  const chapters = document.querySelectorAll('[data-reveal]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!chapters.length || !('IntersectionObserver' in window) || reduced.matches) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reduced.matches) entry.target.dataset.inView = 'true';
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });

  for (const chapter of chapters) observer.observe(chapter);
})();
