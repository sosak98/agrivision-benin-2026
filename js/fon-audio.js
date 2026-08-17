/* AgriVision — audio Fɔ̀ngbè
   - 15 fichiers humains dans assets/audio/fon/*.opus
   - sélecteur Français | Fɔ̀ngbè mémorisé
   - bienvenue au choix de Fɔ̀ngbè (geste utilisateur)
   - utilise AgriAudio pour tout (arrêt global, Échap, changement de page)
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

  // Map zones to their main Fon file
  const ZONE_TO_FON = {
    'Zone 1': FON.zone_rouge,
    'Zone 2': FON.zone_jaune,
    'Zone 3': FON.zone_verte,
    'zone 1': FON.zone_rouge,
    'zone 2': FON.zone_jaune,
    'zone 3': FON.zone_verte,
    'zone1': FON.zone_rouge,
    'zone2': FON.zone_jaune,
    'zone3': FON.zone_verte,
    'rouge': FON.zone_rouge,
    'jaune': FON.zone_jaune,
    'verte': FON.zone_verte,
    'vert': FON.zone_verte,
    'élevée': FON.zone_rouge, // rigor: but we handle by risque
    'faible': FON.zone_verte,
    'modere': FON.zone_jaune
  };

  function getLang() {
    try { return localStorage.getItem(STORAGE_KEY) || 'fr'; } catch (e) { return 'fr'; }
  }
  function setLang(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
    updateUI();
    document.documentElement.setAttribute('data-audio-lang', v);
    // dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('agrivision:lang', { detail: v }));
  }
  function isFon() { return getLang() === 'fon'; }

  function playFon(src, fallbackText) {
    if (!window.AgriAudio) {
      // fallback to direct audio if AgriAudio missing
      const a = new Audio(src);
      a.play().catch(() => { if (fallbackText && 'speechSynthesis' in window) { const u=new SpeechSynthesisUtterance(fallbackText); u.lang='fr-FR'; speechSynthesis.cancel(); speechSynthesis.speak(u);} });
      return;
    }
    window.AgriAudio.play(src, () => {
      if (fallbackText) window.AgriAudio.speak(fallbackText, { lang: 'fr-FR', rate: 0.9 });
    });
  }

  function playQueueFon(list, fallbackText) {
    if (!window.AgriAudio) { playFon(list[0], fallbackText); return; }
    // try queue, if files missing they will be skipped and fallback after?
    window.AgriAudio.playQueue(list, null);
  }

  // Bienvenue — jouée uniquement sur clic utilisateur choix Fon
  function playBienvenue() {
    playFon(FON.bienvenue, "Bienvenue sur AgriVision. Touchez une zone colorée pour écouter les conseils.");
  }

  // Zone click from carte
  function playForZone(zoneName, zoneProps) {
    // zoneName like "Zone 1"
    let src = ZONE_TO_FON[zoneName] || null;
    if (!src && zoneProps) {
      if (zoneProps.risque === 'eleve') src = FON.zone_rouge;
      else if (zoneProps.risque === 'modere') src = FON.zone_jaune;
      else if (zoneProps.risque === 'faible') src = FON.zone_verte;
    }
    if (!src) src = FON.toucher_zone;
    // playlist suggestion: couleur + vérification
    // For now play single color file; if we want richer, playQueue
    const queue = [src];
    // add a generic verification after color for context
    if (src === FON.zone_rouge) queue.push(FON.verifier_sol, FON.controle_72h);
    else if (src === FON.zone_jaune) queue.push(FON.observer_feuilles, FON.compost);
    else if (src === FON.zone_verte) queue.push(FON.ne_pas_arroser, FON.ne_pas_engrais);
    // Use queue if multiple, else single
    if (queue.length > 1) playQueueFon(queue, null);
    else playFon(src, null);
  }

  // Action card index 0,1,2 => mapping zone
  function playForActionCard(idx, fallbackText) {
    const map = [FON.zone_rouge, FON.zone_jaune, FON.zone_verte];
    const src = map[idx] || FON.verifier_avant_agir;
    const extras = {
      0: [FON.verifier_sol, FON.paillage, FON.controle_72h],
      1: [FON.observer_feuilles, FON.compost, FON.verifier_avant_agir],
      2: [FON.ne_pas_arroser, FON.ne_pas_engrais]
    }[idx] || [];
    playQueueFon([src, ...extras], fallbackText);
  }

  function createSwitcher() {
    if (document.getElementById('fon-lang-switcher')) return;
    const wrap = document.createElement('div');
    wrap.id = 'fon-lang-switcher';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Choix de la langue audio');
    wrap.innerHTML = `
      <span class="fon-switch-label">Audio :</span>
      <button type="button" data-lang="fr" class="fon-btn">Français</button>
      <button type="button" data-lang="fon" class="fon-btn">Fɔ̀ngbè</button>
      <span class="fon-hint">Voix humaine</span>
    `;
    // Insert: try after nav, or before main, or in index-bar
    const nav = document.querySelector('nav');
    const main = document.querySelector('main');
    const indexBar = document.querySelector('.index-bar');
    if (nav && nav.parentNode) {
      nav.insertAdjacentElement('afterend', wrap);
    } else if (indexBar && indexBar.parentNode) {
      indexBar.insertAdjacentElement('afterend', wrap);
    } else if (main && main.parentNode) {
      main.parentNode.insertBefore(wrap, main);
    } else {
      document.body.prepend(wrap);
    }
    // events
    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        const prev = getLang();
        setLang(lang);
        if (lang === 'fon' && prev !== 'fon') {
          // geste utilisateur valide => lancer bienvenue
          setTimeout(playBienvenue, 120);
        } else if (lang === 'fr') {
          if (window.AgriAudio) window.AgriAudio.stop();
          // optional confirm vocal français
          // window.AgriAudio.speak("Audio en français", {lang:"fr-FR", rate:0.95});
        }
      });
    });
    updateUI();
  }

  function updateUI() {
    const wrap = document.getElementById('fon-lang-switcher');
    if (!wrap) return;
    const lang = getLang();
    wrap.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
      b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
    });
    wrap.setAttribute('data-current', lang);
  }

  // Public API
  window.FonAudio = {
    isFon,
    getLang,
    setLang,
    playBienvenue,
    playFon,
    playForZone,
    playForActionCard,
    FILES: FON
  };

  // Init
  function init() {
    // set html attribute early for CSS
    document.documentElement.setAttribute('data-audio-lang', getLang());
    createSwitcher();
    updateUI();

    // Add CSS if not present
    if (!document.getElementById('fon-switcher-style')) {
      const s = document.createElement('style');
      s.id = 'fon-switcher-style';
      s.textContent = `
#fon-lang-switcher{
 display:flex;align-items:center;gap:8px;flex-wrap:wrap;
 margin:10px 40px 0;padding:10px 14px;
 background:#f6f8f3;border:1px solid var(--line-strong, rgba(22,35,26,.14));
 border-radius:10px;font-size:12px
}
#fon-lang-switcher .fon-switch-label{font-weight:800;color:var(--forest-deep,#123a20)}
#fon-lang-switcher .fon-btn{
 border:1px solid var(--line-strong, #c9d1c4);background:#fff;color:var(--ink-soft, #56604F);
 padding:7px 12px;border-radius:999px;font-weight:800;font-size:11.5px;cursor:pointer
}
#fon-lang-switcher .fon-btn.active{
 background:#123a20;color:#fff;border-color:#123a20;box-shadow:0 2px 8px rgba(18,58,32,.18)
}
#fon-lang-switcher .fon-hint{margin-left:auto;font-size:10px;color:var(--ink-soft,#56604F);font-weight:600}
@media(max-width:760px){
 #fon-lang-switcher{margin:8px 16px 0;padding:9px 12px}
 #fon-lang-switcher .fon-hint{display:none}
}
`;
      document.head.appendChild(s);
    }

    // Monkey-patch existing listen handlers to respect Fon ===
    // Carte: intercept #zone-listen click in capture phase
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#zone-listen, .popup-listen');
      if (!btn) return;
      if (!isFon()) return; // let default TTS run
      e.preventDefault(); e.stopImmediatePropagation();
      // Retrieve active zone via global var or DOM
      let zoneName = null, props = null;
      try {
        const t = document.getElementById('zone-title');
        if (t) zoneName = t.textContent.trim();
        // try to get props from window
        if (window.ZONES_GEOJSON && zoneName) {
          const f = window.ZONES_GEOJSON.features.find(fe => fe.properties.nom === zoneName);
          if (f) props = f.properties;
        }
      } catch(_e){}
      playForZone(zoneName || 'Zone 1', props);
    }, true);

    // Actions: intercept .action-listen
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.action-listen, .zone-listen-btn');
      if (!btn) return;
      if (!document.querySelector('.action-card')) return; // only on actions page, but safe to run everywhere
      if (!isFon()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const idx = parseInt(btn.dataset.card || btn.getAttribute('data-card') || '0', 10);
      // fallback text for error case
      const card = btn.closest('.action-card');
      let fallback = null;
      if (card) {
        const title = card.querySelector('h3')?.textContent || 'Zone';
        const lines = [...card.querySelectorAll('li')].map(x => x.textContent).join('. ');
        fallback = `${title}. ${lines}`;
      }
      playForActionCard(idx, fallback);
    }, true);

    // Index bienvenue hint: if on index and Fon already selected, show a small play button?
    // We don't autoplay on load (browsers block), but we add a banner hint
    if (isFon() && location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/')) {
      // inject subtle call-to-action near hero if not already
      const hero = document.querySelector('.hero-final');
      if (hero && !document.getElementById('fon-welcome-hint')) {
        const hint = document.createElement('button');
        hint.id = 'fon-welcome-hint';
        hint.type = 'button';
        hint.textContent = '▶ Écouter la bienvenue en Fɔ̀ngbè';
        hint.style.cssText = 'margin-top:14px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;padding:8px 12px;border-radius:999px;font-weight:800;font-size:11px;cursor:pointer';
        hint.addEventListener('click', playBienvenue);
        // append after hero buttons
        const btnRow = hero.querySelector('div[style*="display:flex"]');
        if (btnRow) btnRow.appendChild(hint);
        else hero.appendChild(hint);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-init hint when lang changes
  window.addEventListener('agrivision:lang', () => {
    if (isFon()) {
      // ensure hint exists on index
      if (!document.getElementById('fon-welcome-hint') && (location.pathname === '/' || location.pathname.endsWith('index.html') || location.pathname === '/index.html')) {
        setTimeout(init, 100);
      }
    }
  });
})();
