// Native adaptation of the supplied Coverflow prompt; no copied demo assets.
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const rail=document.querySelector('[data-horizontal-rail]');
 if(rail){
  const track=rail.querySelector('.medical-bento'),cards=[...track.children];
  const prev=rail.querySelector('[data-rail-prev]'),next=rail.querySelector('[data-rail-next]'),count=rail.querySelector('[data-rail-count]');
  let active=0;
  const update=()=>{const pitch=cards[1].offsetLeft-cards[0].offsetLeft;active=Math.max(0,Math.min(cards.length-1,Math.round(track.scrollLeft/pitch)));prev.disabled=track.scrollLeft<=1;next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;count.textContent=`${active+1} / ${cards.length}`;};
  const move=i=>{const index=Math.max(0,Math.min(cards.length-1,i));track.scrollTo({left:cards[index].offsetLeft-cards[0].offsetLeft,behavior:reduced.matches?'instant':'smooth'});};
  prev.addEventListener('click',()=>move(active-1));next.addEventListener('click',()=>move(active+1));
  track.addEventListener('scroll',update,{passive:true});
  track.addEventListener('keydown',e=>{if(e.target!==track)return;const actions={ArrowLeft:active-1,ArrowRight:active+1,Home:0,End:cards.length-1};if(e.key in actions){e.preventDefault();move(actions[e.key]);}});
  // Anchor targets inside a horizontal rail must be brought into view as well.
  const hash=()=>{const target=document.getElementById(location.hash.slice(1));if(target&&track.contains(target))track.scrollTo({left:target.offsetLeft-cards[0].offsetLeft,behavior:reduced.matches?'instant':'smooth'});};
  addEventListener('hashchange',hash);rail.querySelector('.rail-controls').hidden=false;new ResizeObserver(update).observe(track);update();hash();
 }
 for(const track of document.querySelectorAll('.medical-bento,.reel-track')){
  let drag=null,suppress=false;
  track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('a,button'))return;drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft,moved:false};});
  track.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const delta=e.clientX-drag.x;if(Math.abs(delta)>6&&!drag.moved){drag.moved=true;track.setPointerCapture(e.pointerId);track.dataset.dragging='true';}if(drag.moved){e.preventDefault();track.scrollLeft=drag.left-delta;}});
  const end=e=>{if(!drag||e.pointerId!==drag.id)return;suppress=drag.moved;if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);drag=null;delete track.dataset.dragging;setTimeout(()=>suppress=false,0);};
  track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',()=>{drag=null;delete track.dataset.dragging;});
  track.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopPropagation();}},true);
  track.addEventListener('dragstart',e=>e.preventDefault());
 }
 const track=document.querySelector('.reel-track');if(!track)return;
 const cards=[...track.children];let frame=0;
 const paint=()=>{frame=0;const center=track.scrollLeft+track.clientWidth/2;for(const card of cards){const offset=(card.offsetLeft+card.offsetWidth/2-center)/card.offsetWidth;const ramp=Math.pow(Math.min(2,Math.abs(offset)),.56);card.style.setProperty('--cover-angle',`${reduced.matches?0:-Math.sign(offset)*Math.min(12*ramp,20)}deg`);card.style.setProperty('--cover-depth',`${reduced.matches?0:-14*ramp}px`);}};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};track.addEventListener('scroll',schedule,{passive:true});new ResizeObserver(schedule).observe(track);reduced.addEventListener('change',paint);paint();
})();
