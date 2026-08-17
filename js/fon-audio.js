/* AgriVision — audio Fɔ̀ngbè v11
   15 fichiers humains mono 16kHz dans assets/audio/fon/*.opus
   Sélecteur Français | Fɔ̀ngbè, bienvenue au clic, auto-play zone, audio Fɔ̀ngbè
*/
(function () {
  const STORAGE_KEY = 'agrivision_audio_lang';
  const FON = {
    bienvenue: 'assets/audio/fon/01_bienvenue.opus',
    toucher_zone: 'assets/audio/fon/02_toucher_zone.opus',
    zone_rouge: 'assets/audio/fon/03_zone_rouge.opus',
    zone_jaune: 'assets/audio/fon/04_zone_jaune.opus',
    zone_verte: 'assets/audio/fon/05_zone_verte.opus',
    verifier_sol: 'assets/audio/fon/06_verifier_sol.opus',
    observer_feuilles: 'assets/audio/fon/07_observer_feuilles.opus',
    ne_pas_arroser: 'assets/audio/fon/08_ne_pas_arroser.opus',
    ne_pas_engrais: 'assets/audio/fon/09_ne_pas_engrais.opus',
    paillage: 'assets/audio/fon/10_paillage.opus',
    compost: 'assets/audio/fon/11_compost.opus',
    controle_72h: 'assets/audio/fon/12_controle_72h.opus',
    vol_7jours: 'assets/audio/fon/13_vol_7jours.opus',
    verifier_avant_agir: 'assets/audio/fon/14_verifier_avant_agir.opus',
    contacter_equipe: 'assets/audio/fon/15_contacter_equipe.opus'
  };
  const ZONE_TO_FON = {
    'Zone 1': FON.zone_rouge, 'Zone 2': FON.zone_jaune, 'Zone 3': FON.zone_verte,
    'zone 1': FON.zone_rouge, 'zone 2': FON.zone_jaune, 'zone 3': FON.zone_verte,
    'rouge': FON.zone_rouge, 'jaune': FON.zone_jaune, 'verte': FON.zone_verte
  };
  function getLang(){ try{ return localStorage.getItem(STORAGE_KEY)||'fr'; }catch(e){ return 'fr'; } }
  function setLang(v){
    try{ localStorage.setItem(STORAGE_KEY,v); }catch(e){}
    updateUI();
    document.documentElement.setAttribute('data-audio-lang', v);
    window.dispatchEvent(new CustomEvent('agrivision:lang',{detail:v}));
  }
  function isFon(){ return getLang()==='fon'; }

  function playFon(src, fallbackText){
    if(!window.AgriAudio){
      const a=new Audio(src);
      a.play().catch(()=>{ if(fallbackText && 'speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(fallbackText); u.lang='fr-FR'; speechSynthesis.cancel(); speechSynthesis.speak(u);} });
      return;
    }
    window.AgriAudio.play(src, ()=>{
      if(fallbackText) window.AgriAudio.speak(fallbackText,{lang:'fr-FR',rate:0.9});
    });
  }
  function playBienvenue(){ playFon(FON.bienvenue, "Bienvenue sur AgriVision. Touchez une zone colorée."); }

  // Détaillé : couleur + 2 conseils pour être utile
  function playForZone(zoneName, zoneProps){
    let src = ZONE_TO_FON[zoneName] || null;
    if(!src && zoneProps){
      if(zoneProps.risque==='eleve') src=FON.zone_rouge;
      else if(zoneProps.risque==='modere') src=FON.zone_jaune;
      else if(zoneProps.risque==='faible') src=FON.zone_verte;
    }
    if(!src) src=FON.toucher_zone;
    console.log('[Fon] playForZone', zoneName, zoneProps?.risque, '→', src);
    const queue=[src];
    if(src===FON.zone_rouge) queue.push(FON.verifier_sol, FON.controle_72h);
    else if(src===FON.zone_jaune) queue.push(FON.observer_feuilles, FON.compost);
    else if(src===FON.zone_verte) queue.push(FON.ne_pas_arroser, FON.ne_pas_engrais);
    if(queue.length>1 && window.AgriAudio && window.AgriAudio.playQueue) window.AgriAudio.playQueue(queue);
    else playFon(src, null);
  }
  function playForActionCard(idx, fallbackText){
    const map=[FON.zone_rouge, FON.zone_jaune, FON.zone_verte];
    const src=map[idx]||FON.verifier_avant_agir;
    const extras={0:[FON.verifier_sol, FON.paillage, FON.controle_72h],1:[FON.observer_feuilles, FON.compost, FON.verifier_avant_agir],2:[FON.ne_pas_arroser, FON.ne_pas_engrais]}[idx]||[];
    console.log('[Fon] playForActionCard', idx, '→', src, '+', extras);
    const queue=[src, ...extras];
    if(window.AgriAudio && window.AgriAudio.playQueue) window.AgriAudio.playQueue(queue);
    else playFon(src, fallbackText);
  }

  function createSwitcher(){
    if(document.getElementById('fon-lang-switcher')) return;
    const wrap=document.createElement('div');
    wrap.id='fon-lang-switcher';
    wrap.setAttribute('role','group');
    wrap.setAttribute('aria-label','Choix de la langue audio');
    wrap.innerHTML=`<span class="fon-switch-label">Audio :</span>
      <button type="button" data-lang="fr" class="fon-btn">Français</button>
      <button type="button" data-lang="fon" class="fon-btn">Fɔ̀ngbè</button>
      <span class="fon-hint">Voix humaine</span>`;
    const nav=document.querySelector('nav');
    const main=document.querySelector('main');
    if(nav && nav.parentNode) nav.insertAdjacentElement('afterend', wrap);
    else if(main) main.parentNode.insertBefore(wrap, main);
    else document.body.prepend(wrap);
    wrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const lang=btn.dataset.lang;
        const prev=getLang();
        setLang(lang);
        if(lang==='fon' && prev!=='fon') setTimeout(playBienvenue, 120);
        else if(lang==='fr' && window.AgriAudio) window.AgriAudio.stop();
      });
    });
    updateUI();
  }
  function updateUI(){
    const wrap=document.getElementById('fon-lang-switcher');
    if(!wrap) return;
    const lang=getLang();
    wrap.querySelectorAll('button').forEach(b=>{
      b.classList.toggle('active', b.dataset.lang===lang);
      b.setAttribute('aria-pressed', b.dataset.lang===lang?'true':'false');
    });
  }

  // Rapport vocal Fon — Option A : stitch 15 audios + chiffres dynamiques en TTS FR
  function playRapportFon(){
    const m = window.MISSIONS_DATA?.derniere_mission;
    const zones = (window.ZONES_GEOJSON?.features||[]).map(f=>f.properties).sort((a,b)=>{
      const r={eleve:0, modere:1, faible:2}; return (r[a.risque]??9)-(r[b.risque]??9);
    });
    if(!m || !zones.length){ alert("Données de mission non disponibles"); return; }
    const seq=[];
    // 01 bienvenue
    seq.push({audio: FON.bienvenue});
    // Intro chiffres en TTS FR (compris par tous) — on garde le Fon humain pour les concepts
    seq.push({tts: `Rapport AgriVision du ${m.date}, parcelle ${m.parcelle}. Surface totale ${m.hectares_analyses} hectares, ${zones.length} zones, indice ${m.sante_globale} pour cent.`});
    seq.push({audio: FON.toucher_zone});
    seq.push({audio: FON.verifier_avant_agir});
    zones.forEach(z=>{
      if(z.risque==='eleve'){ seq.push({audio: FON.zone_rouge}); seq.push({tts: `${z.nom}, ${z.surface_ha} hectare, VARI ${z.vari}, priorité forte.`}); seq.push({audio: FON.verifier_sol}); seq.push({audio: FON.paillage}); seq.push({audio: FON.controle_72h}); }
      else if(z.risque==='modere'){ seq.push({audio: FON.zone_jaune}); seq.push({tts: `${z.nom}, ${z.surface_ha} hectare, VARI ${z.vari}, à surveiller.`}); seq.push({audio: FON.observer_feuilles}); seq.push({audio: FON.compost}); }
      else { seq.push({audio: FON.zone_verte}); seq.push({tts: `${z.nom}, ${z.surface_ha} hectare, VARI ${z.vari}, vigueur élevée.`}); seq.push({audio: FON.ne_pas_arroser}); seq.push({audio: FON.ne_pas_engrais}); }
    });
    seq.push({audio: FON.contacter_equipe});
    seq.push({tts: `Fin du rapport. Contact : 01 98 41 92 40.`});
    console.log('[Fon] rapport seq', seq);
    // Joueur mixte audio/TTS
    let i=0;
    function next(){
      if(i>=seq.length){ console.log('[Fon] rapport fini'); if(window.AgriAudio) window.AgriAudio.stop(); return; }
      const item=seq[i++];
      if(item.audio){
        if(window.AgriAudio) window.AgriAudio.play(item.audio, ()=> next());
        else { const a=new Audio(item.audio); a.onended=next; a.onerror=next; a.play().catch(next); }
      } else if(item.tts){
        if(window.AgriAudio) {
          // AgriAudio.speak est asynchrone, on doit attendre onend
          const utter = item.tts;
          // On utilise AgriAudio.speak mais il faut chainer via onend
          // Hack : on crée une utterance et on écoute onend manuellement
          if('speechSynthesis' in window){
            window.AgriAudio.stop(); // coupe précédent
            const u=new SpeechSynthesisUtterance(utter);
            u.lang='fr-FR'; u.rate=0.9;
            const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('fr'));
            const saved=sessionStorage.getItem('agrivision_voice')||'';
            let ch=voices.find(v=>v.name===saved) || voices.find(v=>/(natural|neural|google|microsoft|amelie|denise|audrey|marie|thomas)/i.test(v.name)) || voices[0];
            if(ch) u.voice=ch;
            u.onend=next; u.onerror=next;
            // montre bouton stop
            if(window.AgriAudio && window.AgriAudio._ensureButton) window.AgriAudio._ensureButton().hidden=false;
            speechSynthesis.speak(u);
            // Sécurité si onend ne se déclenche pas (certains navigateurs)
            setTimeout(()=>{ if(speechSynthesis.speaking) return; }, 10000);
          } else next();
        } else next();
      }
    }
    if(window.AgriAudio) window.AgriAudio.stop();
    next();
  }

  window.FonAudio={ isFon, getLang, setLang, playBienvenue, playFon, playForZone, playForActionCard, playRapportFon, FILES:FON };

  function init(){
    document.documentElement.setAttribute('data-audio-lang', getLang());
    createSwitcher();
    updateUI();
    if(!document.getElementById('fon-switcher-style')){
      const s=document.createElement('style');
      s.id='fon-switcher-style';
      s.textContent=`#fon-lang-switcher{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 40px 0;padding:10px 14px;background:#f6f8f3;border:1px solid var(--line-strong, rgba(22,35,26,.14));border-radius:10px;font-size:12px}
#fon-lang-switcher .fon-switch-label{font-weight:800;color:var(--forest-deep,#123a20)}
#fon-lang-switcher .fon-btn{border:1px solid var(--line-strong, #c9d1c4);background:#fff;color:var(--ink-soft, #56604F);padding:7px 12px;border-radius:999px;font-weight:800;font-size:11.5px;cursor:pointer}
#fon-lang-switcher .fon-btn.active{background:#123a20;color:#fff;border-color:#123a20;box-shadow:0 2px 8px rgba(18,58,32,.18)}
#fon-lang-switcher .fon-hint{margin-left:auto;font-size:10px;color:var(--ink-soft,#56604F);font-weight:600}
@media(max-width:760px){#fon-lang-switcher{margin:8px 16px 0;padding:9px 12px}#fon-lang-switcher .fon-hint{display:none}}`;
      document.head.appendChild(s);
    }
    // Intercepte Écouter sur carte
    document.addEventListener('click', (e)=>{
      const btn=e.target.closest('#zone-listen, .popup-listen');
      if(!btn) return;
      if(!isFon()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      let zoneName=null, props=null;
      try{
        const t=document.getElementById('zone-title');
        if(t) zoneName=t.textContent.trim();
        if(window.ZONES_GEOJSON && zoneName){
          const f=window.ZONES_GEOJSON.features.find(fe=>fe.properties.nom===zoneName);
          if(f) props=f.properties;
        }
      }catch(_e){}
      playForZone(zoneName||'Zone 1', props);
    }, true);
    // Intercepte Écouter sur plan d'action
    document.addEventListener('click', (e)=>{
      const btn=e.target.closest('.action-listen, .zone-listen-btn');
      if(!btn || !document.querySelector('.action-card')) return;
      if(!isFon()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const idx=parseInt(btn.dataset.card||btn.getAttribute('data-card')||'0',10);
      const card=btn.closest('.action-card');
      let fallback=null;
      if(card){
        const title=card.querySelector('h3')?.textContent||'Zone';
        const lines=[...card.querySelectorAll('li')].map(x=>x.textContent).join('. ');
        fallback=`${title}. ${lines}`;
      }
      playForActionCard(idx, fallback);
    }, true);
    // Auto-play quand on clique sur la carte/filtre (geste = autoplay autorisé)
    document.addEventListener('click', (e)=>{
      if(!isFon()) return;
      const isMapClick=e.target.closest('#map')||e.target.closest('.zone-filter');
      if(!isMapClick) return;
      if(e.target.closest('#zone-listen, .popup-listen, .action-listen')) return;
      setTimeout(()=>{
        const t=document.getElementById('zone-title');
        if(!t || !t.textContent.trim()) return;
        const zoneName=t.textContent.trim();
        if(zoneName===window._lastFonZone) return;
        window._lastFonZone=zoneName;
        let props=null;
        try{ if(window.ZONES_GEOJSON){ const f=window.ZONES_GEOJSON.features.find(fe=>fe.properties.nom===zoneName); if(f) props=f.properties; } }catch(_e){}
        console.log('[Fon] auto-play zone', zoneName);
        playForZone(zoneName, props);
      }, 400);
    }, true);

    if(location.pathname.includes('resultats')||location.pathname.includes('actions')||location.pathname==='/'||location.pathname.includes('index.html')||location.pathname.endsWith('/')){

    }
    // Carte : ajoute un bouton discret pour 02_toucher_zone si en Fon
    if(location.pathname.includes('resultats')){
      const host = document.querySelector('.reading-steps');
      if(host && !document.getElementById('fon-carte-hint')){
        const hint = document.createElement('button');
        hint.id='fon-carte-hint';
        hint.type='button';
        hint.textContent='🔊 Écouter : touchez une zone (Fɔ̀ngbè)';
        hint.style.cssText='display:block;margin:10px auto;padding:8px 12px;border:1px solid var(--line-strong);border-radius:999px;background:#f6f8f3;color:var(--forest-deep);font-weight:700;font-size:11px;cursor:pointer';
        hint.onclick=()=> playFon(FON.toucher_zone, "Touchez une partie rouge, jaune ou verte");
        host.insertAdjacentElement('afterend', hint);
        // Auto-play 02 après premier clic sur la page si en Fon (accueil->carte vient d'un clic = geste)
        if(isFon()){
          const once = ()=>{ playFon(FON.toucher_zone); document.removeEventListener('click', once); };
          document.addEventListener('click', once, {once:true});
        }
      }
    }
    // À propos : ajoute bouton Fɔ̀ngbè sur contact (15)
    if(location.pathname.includes('apropos')){
      const contactCard = document.querySelector('.contact-card') || document.querySelector('.contact-card-new');
      if(contactCard && !document.getElementById('fon-contact-btn')){
        const btn=document.createElement('button');
        btn.id='fon-contact-btn';
        btn.type='button';
        btn.textContent='🔊 Écouter le contact en Fɔ̀ngbè';
        btn.style.cssText='margin-top:10px;padding:8px 12px;border:1px solid var(--forest);border-radius:8px;background:#123a20;color:#fff;font-weight:700;font-size:11px;cursor:pointer';
        btn.onclick=()=> playFon(FON.contacter_equipe, "Contact AgriVision +229 01 98 41 92 40");
        contactCard.appendChild(btn);
      }
    }
    // Assistant IA : en Fon, les cartes de glossaire jouent le Fon correspondant
    if(location.pathname.includes('ia.html')||location.pathname.includes('ia')){
      const fonMapAssistant = {
        'VARI': FON.zone_rouge, // on réutilise zone rouge pour VARI
        'GSD': FON.verifier_sol,
        'Orthophoto': FON.toucher_zone,
        'Vérification': FON.verifier_avant_agir,
        'Paillage': FON.paillage,
        'Compost': FON.compost,
        'Légumineuses': FON.compost,
        'Produit bio': FON.ne_pas_engrais
      };
      document.querySelectorAll('.learn-card').forEach(card=>{
        const key = card.querySelector('b')?.textContent.trim();
        if(!key || !fonMapAssistant[key]) return;
        // Ajoute un petit badge Fon
        if(!card.querySelector('.fon-badge')){
          const badge=document.createElement('span');
          badge.className='fon-badge';
          badge.textContent='🔊 Fɔ̀ngbè';
          badge.style.cssText='float:right;font-size:9px;background:#123a20;color:#fff;padding:2px 6px;border-radius:999px;font-weight:700';
          card.appendChild(badge);
        }
        // Intercepte clic en Fon
        card.addEventListener('click', (e)=>{
          if(!isFon()) return;
          e.preventDefault(); e.stopImmediatePropagation();
          const src=fonMapAssistant[key];
          console.log('[Fon] assistant learn', key, '→', src);
          playFon(src);
          // Lance aussi la question texte en fallback pour l'historique
          const q=card.dataset.question;
          if(q){
            const input=document.getElementById('chat-input');
            if(input){ input.value=q; }
          }
        }, true);
      });
    }
    // Hint bienvenue sur accueil
    const isIndex = location.pathname.endsWith('index.html')||location.pathname==='/'||location.pathname.endsWith('/');
    if(isFon() && isIndex){
      const hero=document.querySelector('.hero-final');
      if(hero && !document.getElementById('fon-welcome-hint')){
        const hint=document.createElement('button');
        hint.id='fon-welcome-hint';
        hint.type='button';
        hint.textContent='▶ Écouter la bienvenue en Fɔ̀ngbè';
        hint.style.cssText='margin-top:14px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;padding:8px 12px;border-radius:999px;font-weight:800;font-size:11px;cursor:pointer';
        hint.addEventListener('click', playBienvenue);
        const btnRow=hero.querySelector('div[style*="display:flex"]');
        if(btnRow) btnRow.appendChild(hint);
        else hero.appendChild(hint);
      }
    }
  }
  // Rapport bouton — bilingue : même bouton parle la langue du sélecteur
  function updateRapportBtn(){
    const btn=document.getElementById('rapport-fon-btn');
    if(!btn) return;
    btn.textContent = isFon() ? '🔊 Écouter le rapport en Fɔ̀ngbè (1 min)' : '🔊 Écouter le rapport en Français (1 min)';
  }
  document.addEventListener('click', (e)=>{
    const btn=e.target.closest('#rapport-fon-btn');
    if(!btn) return;
    e.preventDefault();
    if(isFon()) playRapportFon();
    else {
      const m=window.MISSIONS_DATA?.derniere_mission;
      const zones=(window.ZONES_GEOJSON?.features||[]).map(f=>f.properties);
      let text=`Rapport AgriVision du ${m?.date||'13 août 2026'}, parcelle ${m?.parcelle||'Cotonou'}, ${m?.hectares_analyses||2.17} hectares. `;
      zones.forEach(z=>{ text+=`${z.nom}, ${z.surface_ha} hectare, VARI ${z.vari}, ${z.risque}. `; text+= (z.recommandations||[]).join('. ') + '. '; });
      text+= ' Fin du rapport. Contact 01 98 41 92 40.';
      if(window.AgriAudio) window.AgriAudio.speak(text, {lang:'fr-FR', rate:0.88});
      else if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(text); u.lang='fr-FR'; speechSynthesis.cancel(); speechSynthesis.speak(u); }
    }
  });
  // Met à jour le texte du bouton quand on change de langue
  window.addEventListener('agrivision:lang', updateRapportBtn);
  document.addEventListener('DOMContentLoaded', updateRapportBtn);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('agrivision:lang', ()=>{
    if(isFon()){
      const isIndex = location.pathname.endsWith('index.html')||location.pathname==='/'||location.pathname.endsWith('/');
      if(!document.getElementById('fon-welcome-hint') && isIndex) setTimeout(init, 100);
    }
  });
})();