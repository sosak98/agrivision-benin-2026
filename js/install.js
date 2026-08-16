document.addEventListener('DOMContentLoaded',()=>{
  let deferredPrompt=null;
  const button=document.getElementById('install-app');
  if(!button)return;
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(standalone){button.hidden=true;return}
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;button.hidden=false;button.textContent='⬇ Installer AgriVision'});
  button.addEventListener('click',async()=>{
    if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;button.hidden=true;return}
    const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
    alert(ios?'Sur iPhone/iPad : touche Partager, puis « Sur l’écran d’accueil ».':'Dans le menu du navigateur, choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».');
  });
  if(/iphone|ipad|ipod/i.test(navigator.userAgent))button.hidden=false;
});
