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

// The external player only loads after an explicit action. Closing it stops playback.
const reel = document.querySelector('[data-reel]');
if (reel) {
  reel.hidden = false;
  reel.addEventListener('toggle', () => {
    const current = reel.querySelector('iframe');
    if (!reel.open) {
      current?.remove();
      return;
    }
    if (current) return;
    const frame = document.createElement('iframe');
    frame.src = reel.dataset.reel;
    frame.title = `Instagram: ${reel.dataset.title}`;
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'no-referrer';
    reel.append(frame);
  });
}
