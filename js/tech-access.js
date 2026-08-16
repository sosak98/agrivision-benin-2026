document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('tech-login'),code=document.getElementById('tech-code'),message=document.getElementById('tech-message'),panel=document.getElementById('tech-panel'),logout=document.getElementById('tech-logout'),key=document.getElementById('tech-groq-key');
  const unlocked=sessionStorage.getItem('agrivision_tech')==='1';
  function show(){if(form)form.hidden=true;if(panel)panel.hidden=false;if(key)key.value=sessionStorage.getItem('agrivision_groq_key')||''}
  if(unlocked)show();
  form?.addEventListener('submit',e=>{e.preventDefault();if(code.value.trim().toUpperCase()==='AGRI-TECH'){sessionStorage.setItem('agrivision_tech','1');message.textContent='Accès autorisé.';message.className='import-message ok';show()}else{message.textContent='Code incorrect.';message.className='import-message error';message.style.display='block'}});
  key?.addEventListener('input',()=>{const value=key.value.trim();value?sessionStorage.setItem('agrivision_groq_key',value):sessionStorage.removeItem('agrivision_groq_key')});
  logout?.addEventListener('click',()=>{sessionStorage.removeItem('agrivision_tech');sessionStorage.removeItem('agrivision_groq_key');location.href='index.html'});
});
