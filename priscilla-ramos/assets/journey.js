// Reveal headings and editorial details as they enter the viewport.
(() => {
  const chapters = document.querySelectorAll('[data-reveal], main .section h2');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!chapters.length || !('IntersectionObserver' in window) || reduced.matches) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reduced.matches) entry.target.dataset.inView = 'true';
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  for (const chapter of chapters) observer.observe(chapter);
})();

// Scroll and links work without JS. Only an explicit play action contacts Instagram.
const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const track = carousel.querySelector('.reel-track');
  const slides = [...track.children];
  const buttons = [...track.querySelectorAll('[data-reel]')];
  const prev = carousel.querySelector('[data-prev]');
  const next = carousel.querySelector('[data-next]');
  const count = carousel.querySelector('[data-count]');
  const player = carousel.querySelector('#reel-player');
  const close = player.querySelector('[data-close]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let trigger;

  function closeVideo(restoreFocus = false) {
    player.querySelector('iframe')?.remove();
    player.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger?.focus({preventScroll: true});
    trigger = undefined;
  }

  function update(index) {
    active = index;
    count.textContent = `${index + 1} / ${slides.length}`;
    prev.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === slides.length - 1));
  }

  function position(index) {
    return Math.min(slides[index].offsetLeft - slides[0].offsetLeft, track.scrollWidth - track.clientWidth);
  }

  function move(index) {
    if (index < 0 || index >= slides.length || index === active) return;
    closeVideo();
    update(index);
    track.scrollTo({left: position(index), behavior: reduced.matches ? 'instant' : 'smooth'});
  }

  prev.addEventListener('click', () => move(active - 1));
  next.addEventListener('click', () => move(active + 1));
  track.addEventListener('scroll', () => {
    const nearest = slides.reduce((best, _, index) =>
      Math.abs(position(index) - track.scrollLeft) < Math.abs(position(best) - track.scrollLeft) ? index : best, 0);
    if (nearest !== active) update(nearest);
  }, {passive: true});
  track.addEventListener('keydown', (event) => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const destinations = {ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1};
    move(destinations[event.key]);
  });

  close.addEventListener('click', () => closeVideo(true));
  player.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeVideo(true);
  });
  buttons.forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      if (trigger === button) {
        closeVideo(true);
        return;
      }
      closeVideo();
      trigger = button;
      trigger.setAttribute('aria-expanded', 'true');
      const title = button.closest('li').querySelector('h3').textContent;
      player.querySelector('[data-playing]').textContent = title;
      const frame = document.createElement('iframe');
      frame.src = button.dataset.reel;
      frame.title = `Instagram: ${title}`;
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'no-referrer';
      player.append(frame);
      player.hidden = false;
      close.focus({preventScroll: true});
      player.scrollIntoView({block: 'start', behavior: reduced.matches ? 'instant' : 'smooth'});
    });
  });
  carousel.querySelector('.reel-controls').hidden = false;
  update(0);
}
