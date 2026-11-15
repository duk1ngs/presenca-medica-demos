// Reveal headings and editorial details as they enter the viewport.
(() => {
  const chapters = document.querySelectorAll('[data-reveal], main .section h2');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!chapters.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reduced.matches) entry.target.dataset.inView = 'true';
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  function observeChapters() {
    observer.disconnect();
    if (reduced.matches) return;
    for (const chapter of chapters) {
      if (!chapter.dataset.inView) observer.observe(chapter);
    }
  }
  reduced.addEventListener('change', observeChapters);
  observeChapters();
})();

// Independent photographic plane, inspired by the tutorial's layered parallax.
(() => {
  const scene = document.querySelector('[data-scene]');
  const layer = scene?.querySelector('[data-scene-layer]');
  if (!layer) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const distance = document.body.classList.contains('field') ? 10 : 16;
  let frame = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let scrollY = 0;

  function render() {
    frame = 0;
    if (reduced.matches || document.hidden) return;
    currentX += (targetX - currentX) * .1;
    currentY += (targetY + scrollY - currentY) * .1;
    layer.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
    if (Math.abs(targetX - currentX) + Math.abs(targetY + scrollY - currentY) > .1) {
      frame = requestAnimationFrame(render);
    }
  }

  function schedule() {
    if (!frame && !reduced.matches && !document.hidden) frame = requestAnimationFrame(render);
  }

  scene.addEventListener('pointermove', event => {
    if (!pointer.matches || event.pointerType === 'touch') return;
    const bounds = scene.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - .5) * distance;
    targetY = ((event.clientY - bounds.top) / bounds.height - .5) * distance;
    schedule();
  });
  scene.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    schedule();
  });
  function updateScroll() {
    const bounds = scene.getBoundingClientRect();
    scrollY = Math.min(18, Math.max(-18, -bounds.top * .035));
    schedule();
  }
  window.addEventListener('scroll', updateScroll, {passive: true});
  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    currentX = currentY = targetX = targetY = scrollY = 0;
    layer.style.removeProperty('transform');
    if (!reduced.matches && !document.hidden) updateScroll();
  }
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  updateScroll();
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
