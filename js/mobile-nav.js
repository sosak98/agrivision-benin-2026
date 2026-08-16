document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('nav').forEach(nav=>{
    const button=nav.querySelector('.nav-toggle'),tabs=nav.querySelector('.tabs');
    if(!button||!tabs)return;
    button.addEventListener('click',()=>{const open=nav.classList.toggle('menu-open');button.setAttribute('aria-expanded',String(open));button.textContent=open?'✕':'☰'});
    tabs.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('menu-open');button.setAttribute('aria-expanded','false');button.textContent='☰'}));
  });
});
