const hero = document.querySelector('.hero');
if (hero) {
  const query = matchMedia('(prefers-reduced-motion: reduce), (max-width: 760px)');
  let pending = 0;
  function update() {
    pending = 0;
    if (query.matches) {
      hero.style.removeProperty('--photo-shift');
      hero.style.removeProperty('--name-shift');
      return;
    }
    const rect = hero.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return;
    const distance = Math.max(0, -rect.top);
    hero.style.setProperty('--photo-shift', Math.min(35, distance * 0.065) + 'px');
    hero.style.setProperty('--name-shift', -Math.min(115, distance * 0.32) + 'px');
  }
  function requestUpdate() {
    if (!pending) pending = requestAnimationFrame(update);
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate, { passive: true });
  query.addEventListener('change', requestUpdate);
  requestUpdate();
}

const rail = document.querySelector('.rail');
if (rail) {
  const previous = document.querySelector('[data-direction="-1"]');
  const next = document.querySelector('[data-direction="1"]');
  const sync = () => {
    previous.disabled = rail.scrollLeft < 2;
    next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
  };
  [previous, next].forEach(button => button.addEventListener('click', () => {
    const step = rail.firstElementChild.getBoundingClientRect().width + 14;
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    rail.scrollBy({ left: step * Number(button.dataset.direction), behavior });
  }));
  rail.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync, { passive: true });
  sync();
}

const original = document.querySelector('.original');
if (original) {
  const player = original.querySelector('.player');
  original.addEventListener('toggle', () => {
    if (!original.open) {
      player.replaceChildren();
      return;
    }
    const video = document.createElement('iframe');
    video.title = 'Publicação original do Instagram';
    video.referrerPolicy = 'no-referrer';
    video.src = original.dataset.embed;
    video.allowFullscreen = true;
    player.append(video);
  });
}
