/** Perspective Container Scroll: native adaptation of supplied React reference.
 * CSS owns perspective/frame; this controller owns panel transforms only.
 * Typed options are declared in the adjacent container-scroll.d.ts.
 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px)');
  /** @param {number|undefined} n @param {number} fallback @param {number} min @param {number} max */
  const clamp = (n, fallback, min, max) => Math.max(min, Math.min(max, Number.isFinite(n) ? Number(n) : fallback));
  /** @param {HTMLElement} root @param {NativeContainerScrollOptions} [options] @returns {()=>void} */
  function mount(root, options = {}) {
    const panel = root.querySelector('[data-container-panel]');
    if (!(panel instanceof HTMLElement) || !('IntersectionObserver' in window)) return () => {};
    /** @param {string} key */
    const number = (key) => root.dataset[key] === undefined ? undefined : Number(root.dataset[key]);
    const desktop = {rotate:clamp(options.rotate ?? number('rotate'), 10, -16, 16),scale:clamp(options.scale ?? number('scale'), .95, .9, 1.02),shift:clamp(options.shift ?? number('shift'), 18, -32, 32)};
    const compact = {rotate:clamp(options.mobileRotate ?? number('mobileRotate'), 2, -3, 3),scale:clamp(options.mobileScale ?? number('mobileScale'), .99, .98, 1),shift:clamp(options.mobileShift ?? number('mobileShift'), 4, -6, 6)};
    const original = {transform:panel.style.transform,willChange:panel.style.willChange};
    const exitMotion = root.hasAttribute('data-exit-motion');
    let visible = false, frame = 0, destroyed = false;
    const active = () => visible && !reduced.matches && !document.hidden && !destroyed;
    const restore = () => {panel.style.transform=original.transform;panel.style.willChange=original.willChange;};
    const paint = () => {
      frame=0;if(!active())return;
      // The scene's untransformed box is read once, then only composited transform is written.
      const box=root.getBoundingClientRect(), range=Math.min(innerHeight*.7,Math.max(180,box.height*.75));
      const traveled = exitMotion ? -box.top : innerHeight * .88 - box.top;
      const progress=Math.max(0,Math.min(1,traveled/range));
      const eased=1-(1-progress)*(1-progress), amount=exitMotion ? eased : 1-eased;
      const values=mobile.matches?compact:desktop;
      panel.style.transform=`translate3d(0,${(values.shift*amount).toFixed(3)}px,0) rotateX(${(values.rotate*amount).toFixed(3)}deg) scale(${(1+(values.scale-1)*amount).toFixed(5)})`;
    };
    const schedule = () => {if(active()&&!frame)frame=requestAnimationFrame(paint);};
    const reset = () => {cancelAnimationFrame(frame);frame=0;if(active()){panel.style.willChange='transform';schedule();}else restore();};
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;reset();});observer.observe(root);
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',reset,{passive:true});
    document.addEventListener('visibilitychange',reset);mobile.addEventListener('change',reset);reduced.addEventListener('change',reset);
    return () => {destroyed=true;cancelAnimationFrame(frame);observer.disconnect();restore();
      window.removeEventListener('scroll',schedule);window.removeEventListener('resize',reset);document.removeEventListener('visibilitychange',reset);
      mobile.removeEventListener('change',reset);reduced.removeEventListener('change',reset);};
  }
  window.ContainerScroll={mount};
  /** @type {Array<()=>void>} */
  let cleanups=[];
  const start=()=>{if(cleanups.length)return;document.querySelectorAll('[data-container-scroll]').forEach(root=>{if(root instanceof HTMLElement)cleanups.push(mount(root));});};
  const stop=()=>{cleanups.forEach(cleanup=>cleanup());cleanups=[];};
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);start();
})();
