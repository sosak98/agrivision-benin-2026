document.addEventListener('DOMContentLoaded',()=>{
  function speak(text){
    if(window.AgriAudio){ window.AgriAudio.speak(text, {lang:'fr-FR', rate:0.88}); return; }
    if(!('speechSynthesis' in window)) return alert('La lecture vocale n’est pas disponible sur cet appareil.');
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fr-FR';u.rate=.88;const vs=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('fr'));u.voice=vs.find(v=>/(natural|neural|google|microsoft|amelie|denise|audrey|marie)/i.test(v.name))||vs[0]||null;speechSynthesis.speak(u)
  }
  document.querySelectorAll('.action-listen').forEach(b=>b.addEventListener('click',()=>{
    if(window.FonAudio && window.FonAudio.isFon()) return;
    const c=b.closest('.action-card'),title=c.querySelector('h3')?.textContent||'Zone',lines=[...c.querySelectorAll('li')].map(x=>x.textContent).join('. ');
    speak(`${title}. Voici les recommandations. ${lines}. Vérifiez toujours la situation sur le terrain avant d’agir.`)
  }))
});