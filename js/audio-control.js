/* AgriVision — contrôleur audio global
   Gère un seul flux à la fois, bouton Arrêter visible, Échap et changement de page */
(function () {
  let audioEl = null;
  let stopBtn = null;
  let isSpeaking = false;
  let currentBlobUrl = null;

  function ensureAudio() {
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.preload = 'auto';
      audioEl.addEventListener('play', showStop);
      audioEl.addEventListener('pause', () => { if (audioEl && audioEl.paused && !audioEl.ended) hideStopMaybe(); });
      audioEl.addEventListener('ended', hideStop);
      audioEl.addEventListener('error', hideStop);
    }
    return audioEl;
  }

  function ensureButton() {
    if (stopBtn) return stopBtn;
    stopBtn = document.createElement('button');
    stopBtn.id = 'global-audio-stop';
    stopBtn.type = 'button';
    stopBtn.hidden = true;
    stopBtn.setAttribute('aria-label', "Arrêter l'audio");
    stopBtn.textContent = '⏹ Arrêter l’audio';
    stopBtn.addEventListener('click', stopAll);
    if (!document.getElementById('audio-control-style')) {
      const s = document.createElement('style');
      s.id = 'audio-control-style';
      s.textContent = `
#global-audio-stop{
 position:fixed;left:50%;bottom:18px;transform:translateX(-50%);
 z-index:9999;background:#123a20;color:#fff;border:0;border-radius:999px;
 padding:12px 18px;font-weight:800;font-size:13px;box-shadow:0 8px 22px rgba(0,0,0,.25);
 cursor:pointer;display:flex;align-items:center;gap:8px
}
#global-audio-stop[hidden]{display:none!important}
#global-audio-stop:hover{background:#1e5631}
`;
      document.head.appendChild(s);
    }
    document.body.appendChild(stopBtn);
    return stopBtn;
  }

  function showStop() { ensureButton().hidden = false; }
  function hideStop() {
    if (stopBtn) stopBtn.hidden = true;
    isSpeaking = false;
  }
  function hideStopMaybe() {
    setTimeout(() => { if (audioEl && audioEl.paused) hideStop(); }, 300);
  }

  function revokeBlob() {
    if (currentBlobUrl) { try { URL.revokeObjectURL(currentBlobUrl); } catch(e){} currentBlobUrl = null; }
    if (audioEl && audioEl._blobUrl) { try { URL.revokeObjectURL(audioEl._blobUrl); } catch(e){} audioEl._blobUrl = null; }
  }

  function stopAll() {
    if (audioEl) {
      try { audioEl.pause(); audioEl.currentTime = 0; } catch(e){}
      // don't clear src immediately if blob, will revoke after
      revokeBlob();
      try { audioEl.removeAttribute('src'); audioEl.load(); } catch(e){}
    }
    if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch(e){} }
    isSpeaking = false;
    hideStop();
  }

  function playBlobUrl(url, onEnd, onError) {
    const a = ensureAudio();
    revokeBlob();
    currentBlobUrl = url;
    a._blobUrl = url;
    a.src = url;
    a.currentTime = 0;
    showStop();
    a.onended = () => { hideStop(); revokeBlob(); if (typeof onEnd === 'function') onEnd(); };
    a.onerror = () => { hideStop(); revokeBlob(); if (typeof onError === 'function') onError(new Error('audio error')); };
    const p = a.play();
    if (p && typeof p.catch === 'function') {
      p.catch(err => { hideStop(); revokeBlob(); if (typeof onError === 'function') onError(err); else console.warn('AgriAudio play error', err); });
    }
  }

  function playSrc(src, onError) {
    stopAll();
    ensureButton().hidden = false;
    // Use fetch to handle mime mismatch (WAV content served as .opus) and offline cache
    fetch(src).then(resp => {
      if (!resp.ok) throw new Error('fetch failed ' + resp.status);
      return resp.arrayBuffer();
    }).then(buf => {
      let mime = 'audio/ogg';
      if (buf.byteLength >= 4) {
        const bytes = new Uint8Array(buf.slice(0,4));
        const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        if (header === 'RIFF') mime = 'audio/wav';
        else if (header === 'OggS') mime = 'audio/ogg';
        else if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) mime = 'audio/mpeg';
      }
      const blob = new Blob([buf], {type: mime});
      const url = URL.createObjectURL(blob);
      playBlobUrl(url, hideStop, onError);
    }).catch(err => {
      // Fallback direct src (e.g. offline fetch blocked, or CORS)
      // console.warn('AgriAudio fetch fallback', err);
      const a = ensureAudio();
      a.src = src;
      a.currentTime = 0;
      showStop();
      a.onended = hideStop;
      a.onerror = () => { hideStop(); if (typeof onError === 'function') onError(new Error('audio error')); };
      const p = a.play();
      if (p && p.catch) p.catch(e=> { hideStop(); if (typeof onError === 'function') onError(e); else console.warn('AgriAudio direct play error', e); });
    });
  }

  function playQueue(sources, onDone) {
    if (!sources || !sources.length) { if (onDone) onDone(); return; }
    let idx = 0;
    function next() {
      if (idx >= sources.length) { hideStop(); if (onDone) onDone(); return; }
      const src = sources[idx++];
      // play next src; on end continue
      playSrcWithQueue(src, next);
    }
    function playSrcWithQueue(src, cb) {
      // Use fetch path but chain via onend
      fetch(src).then(r=>{ if(!r.ok) throw new Error('fetch '+r.status); return r.arrayBuffer(); }).then(buf=>{
        let mime='audio/ogg';
        if(buf.byteLength>=4){
          const b=new Uint8Array(buf.slice(0,4));
          const h=String.fromCharCode(b[0],b[1],b[2],b[3]);
          if(h==='RIFF') mime='audio/wav';
          else if(h==='OggS') mime='audio/ogg';
          else if(b[0]===0xFF && (b[1]&0xE0)===0xE0) mime='audio/mpeg';
        }
        const blob=new Blob([buf],{type:mime});
        const url=URL.createObjectURL(blob);
        const a=ensureAudio();
        revokeBlob();
        currentBlobUrl=url; a._blobUrl=url;
        a.src=url; a.currentTime=0; showStop();
        a.onended=()=>{ revokeBlob(); cb(); };
        a.onerror=()=>{ revokeBlob(); cb(); };
        const p=a.play();
        if(p && p.catch) p.catch(()=>{ revokeBlob(); cb(); });
      }).catch(()=>{
        // fallback direct
        const a=ensureAudio();
        a.src=src; a.currentTime=0; showStop();
        a.onended=cb; a.onerror=cb;
        const p=a.play();
        if(p && p.catch) p.catch(()=>cb());
      });
    }
    stopAll();
    next();
  }

  function speak(text, opts = {}) {
    stopAll();
    if (!('speechSynthesis' in window)) {
      alert("La lecture vocale n'est pas disponible sur cet appareil.");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang || 'fr-FR';
    u.rate = opts.rate != null ? opts.rate : 0.9;
    u.pitch = opts.pitch != null ? opts.pitch : 1;
    const voices = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('fr'));
    const saved = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('agrivision_voice')) || '';
    let chosen = null;
    if (saved) chosen = voices.find(v => v.name === saved);
    if (!chosen) chosen = voices.find(v => /(natural|neural|google|microsoft|amelie|amélie|denise|audrey|marie|thomas)/i.test(v.name)) || voices[0] || null;
    if (chosen) u.voice = chosen;
    u.onstart = () => { isSpeaking = true; showStop(); };
    u.onend = hideStop;
    u.onerror = hideStop;
    isSpeaking = true;
    showStop();
    speechSynthesis.speak(u);
  }

  window.addEventListener('keydown', e => { if (e.key === 'Escape') stopAll(); });
  window.addEventListener('pagehide', stopAll);
  window.addEventListener('beforeunload', stopAll);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (a && a.getAttribute('href') && !a.getAttribute('href').startsWith('#') && !a.hasAttribute('download')) {
      stopAll();
    }
  }, true);

  window.AgriAudio = {
    play: playSrc,
    playQueue,
    speak,
    stop: stopAll,
    isPlaying: () => {
      if (audioEl && !audioEl.paused && !audioEl.ended) return true;
      if (isSpeaking && typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) return true;
      return false;
    },
    _ensureButton: ensureButton
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureButton);
  else ensureButton();
})();
