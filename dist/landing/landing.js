const toggle=document.querySelector('#grid-toggle');
toggle.addEventListener('click',()=>{
  const visible=toggle.getAttribute('aria-pressed')!=='true';
  toggle.setAttribute('aria-pressed',String(visible));
  document.querySelector('#page').classList.toggle('grid-hidden',!visible);
});
