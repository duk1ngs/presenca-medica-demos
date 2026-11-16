// Native state and accessibility adaptation of SaaS Template Navigation.
(()=>{
 const header=document.querySelector('.ui21st-navigation');
 const toggle=header?.querySelector('.medical-menu-toggle');
 const menu=header?.querySelector('#medical-nav');
 if(!header||!toggle||!menu)return;
 header.dataset.menuReady='true';toggle.hidden=false;
 const setOpen=(open,restore=false)=>{
  header.toggleAttribute('data-menu-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  if(restore)toggle.focus({preventScroll:true});
 };
 toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
 menu.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);});
 header.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.hasAttribute('data-menu-open'))setOpen(false,true);});
 matchMedia('(min-width:961px)').addEventListener('change',event=>{if(event.matches)setOpen(false);});
})();
