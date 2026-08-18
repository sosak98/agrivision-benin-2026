// AgriVision — Multi-agriculteur via lien unique ?farmer=ID
// 1 lien = 1 agriculteur, sans écraser les autres. Fonctionne offline après 1 import (cache farmers.json)
(function(){
  const PARAM = 'farmer';
  const LS_FARMERS = 'agrivision_farmers';
  const LS_CURRENT = 'agrivision_current_farmer';

  function getParam(){
    try{ return new URLSearchParams(location.search).get(PARAM); }catch(e){ return null; }
  }
  function loadLocalFarmers(){
    try{ return JSON.parse(localStorage.getItem(LS_FARMERS)||'{}'); }catch(e){ return {}; }
  }
  function saveLocalFarmers(obj){
    try{ localStorage.setItem(LS_FARMERS, JSON.stringify(obj)); }catch(e){}
  }

  const SUPABASE_URL = 'https://vohgjznludhwsinervkm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_rfg-pzSClJ0pax2lQ24KVQ_E9gfZKqi';
  // Charge depuis Supabase (vrai backend) puis fallback sur data/farmers.json pour offline
  async function loadStaticFarmers(){
    // 1. Essaie Supabase d'abord (vrai base)
    try{
      const r = await fetch(SUPABASE_URL + '/rest/v1/farmers?select=*', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      if(r.ok){
        const farmers = await r.json();
        const map={};
        for(const f of farmers){
          // Pour chaque farmer, charge sa mission
          try{
            const mr = await fetch(SUPABASE_URL + '/rest/v1/missions?farmer_id=eq.' + encodeURIComponent(f.id) + '&select=*&order=created_at.desc&limit=1', {
              headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
            });
            if(mr.ok){
              const missions = await mr.json();
              const m = missions[0];
              if(m){
                // m.mission et m.geojson sont déjà JSON (jsonb)
                const mission = typeof m.mission === 'string' ? JSON.parse(m.mission) : m.mission;
                const zones = typeof m.geojson === 'string' ? JSON.parse(m.geojson) : m.geojson;
                // Si zones est un FeatureCollection complet, on l'utilise, sinon fallback
                const zonesFC = zones && zones.type ? zones : {type:"FeatureCollection",features:[]};
                map[f.id] = { mission: mission.derniere_mission ? mission : {derniere_mission: mission}, zones: zonesFC, meta: {nom: f.nom, telephone: f.telephone, parcelle: f.parcelle} };
                // Normalise mission si elle est déjà au bon format
                if(!map[f.id].mission.derniere_mission && map[f.id].mission.derniere_mission===undefined){
                  // Si mission est déjà la bonne structure
                }
              } else {
                // Pas de mission, on met un placeholder
                map[f.id] = { mission: {derniere_mission:{parcelle:f.parcelle, hectares_analyses:0, sante_globale:0}}, zones: {type:"FeatureCollection",features:[]}, meta: {nom:f.nom, telephone:f.telephone, parcelle:f.parcelle} };
              }
            }
          }catch(e){ console.warn('Supabase mission fetch failed', e); }
        }
        if(Object.keys(map).length>0) return map;
      }
    }catch(e){ console.warn('Supabase farmers fetch failed', e); }
    // 2. Fallback : data/farmers.json (offline, démo)
    try{
      const r = await fetch('data/farmers.json', {cache:'no-store'});
      if(!r.ok) return {};
      const j = await r.json();
      const map={};
      (j.farmers||[]).forEach(f=>{
        map[f.id] = { mission: f.mission, zones: f.zones, meta: {nom:f.nom, telephone:f.telephone, parcelle:f.parcelle} };
      });
      return map;
    }catch(e){ return {}; }
  }

  async function init(){
    const paramId = getParam();
    const staticFarmers = await loadStaticFarmers();
    const localFarmers = loadLocalFarmers();
    // Merge : local écrase static si même id
    const all = {...staticFarmers, ...localFarmers};

    // Si ?farmer= présent et trouvé, on l'active
    if(paramId && all[paramId]){
      const data = all[paramId];
      // Override global data (défini dans data.js)
      if(data.mission && window.MISSIONS_DATA){
        Object.keys(window.MISSIONS_DATA).forEach(k=>delete window.MISSIONS_DATA[k]);
        Object.assign(window.MISSIONS_DATA, data.mission);
      }
      if(data.zones && window.ZONES_GEOJSON){
        Object.keys(window.ZONES_GEOJSON).forEach(k=>delete window.ZONES_GEOJSON[k]);
        Object.assign(window.ZONES_GEOJSON, data.zones);
      }
      localStorage.setItem(LS_CURRENT, paramId);
      window.AGRIVISION_CURRENT_FARMER = paramId;
      window.AGRIVISION_CURRENT_META = data.meta;
      // Affiche un bandeau "Vous consultez Amadou"
      showBanner(data.meta);
    } else if(paramId && !all[paramId]){
      console.warn('Agriculteur inconnu:', paramId);
      showBanner(null, paramId);
    } else {
      // Pas de param : on reste sur la mission par défaut ou la dernière importée
      const cur = localStorage.getItem(LS_CURRENT);
      if(cur && all[cur] && !window.AGRIVISION_IMPORTED){
        // Optionnel : restaure le dernier agriculteur vu
      }
    }

    // Expose pour l'import QGIS : quand on importe, on sauve sous un nouvel id
    window.AgrivisionSaveFarmer = function(id, nom, telephone, mission, zones){
      const local = loadLocalFarmers();
      local[id] = { mission, zones, meta:{nom, telephone, parcelle: mission.derniere_mission.parcelle} };
      saveLocalFarmers(local);
      localStorage.setItem(LS_CURRENT, id);
      // Génère le lien unique
      const url = location.origin + location.pathname.replace(/[^\/]*$/, '') + '?farmer=' + encodeURIComponent(id);
      return url;
    };

    // Si on est sur la page d'accueil, affiche le sélecteur (pour le technicien)
    renderSelector(all);
  }

  function showBanner(meta, unknownId){
    const bar = document.querySelector('.index-bar');
    if(!bar) return;
    let el = document.getElementById('farmer-banner');
    if(!el){
      el = document.createElement('div');
      el.id='farmer-banner';
      el.style.cssText='text-align:center;padding:8px 12px;background:#eef7e8;border-bottom:1px solid #cfe5c1;font-size:12px;font-weight:700;color:#123a20';
      bar.insertAdjacentElement('afterend', el);
    }
    if(meta){
      el.innerHTML = `🌾 Vous consultez : <b>${meta.nom}</b> — ${meta.parcelle} — <a href="${location.pathname}" style="text-decoration:underline;color:#123a20">Voir site général</a> • QR perso : <b>?farmer=${meta.nom.split(' ')[0].toLowerCase()}</b>`;
      el.style.display='block';
    } else if(unknownId){
      el.innerHTML = `⚠️ Agriculteur <b>${unknownId}</b> introuvable. <a href="${location.pathname}" style="text-decoration:underline">Retour</a>`;
      el.style.display='block';
    } else {
      el.style.display='none';
    }
  }

  function renderSelector(all){
    // Uniquement sur l'accueil et si on est pas déjà en ?farmer=
    if(location.search.includes(PARAM+'=')) return;
    const host = document.querySelector('.hero-final') || document.querySelector('main');
    if(!host || document.getElementById('farmer-selector')) return;
    const ids = Object.keys(all);
    if(ids.length <= 1) return; // pas besoin si 1 seul
    const wrap = document.createElement('div');
    wrap.id='farmer-selector';
    wrap.style.cssText='margin:16px 0;padding:12px;background:#fff;border:1px solid var(--line-strong);border-radius:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px';
    wrap.innerHTML = `<b>🌾 Choisir parcelle :</b> <select id="farmer-select" style="flex:1;min-width:160px;padding:8px;border-radius:8px;border:1px solid #cfe5c1"></select> <a id="farmer-qr-link" target="_blank" style="padding:8px 12px;background:#123a20;color:#fff;border-radius:999px;text-decoration:none;font-weight:800">QR</a> <span style="font-size:10px;color:#56604F">1 lien = 1 agriculteur</span>`;
    const sel = wrap.querySelector('#farmer-select');
    ids.forEach(id=>{
      const opt=document.createElement('option');
      opt.value=id; opt.textContent=all[id].meta.nom + ' — ' + all[id].mission.derniere_mission.hectares_analyses + ' ha';
      sel.appendChild(opt);
    });
    // Ajoute option par défaut (site général)
    const defOpt=document.createElement('option');
    defOpt.value=''; defOpt.textContent='Site général (2,17 ha défaut)';
    sel.prepend(defOpt);
    sel.value = localStorage.getItem(LS_CURRENT)||'';
    sel.onchange=()=>{
      const v=sel.value;
      if(!v) location.href=location.pathname;
      else location.href=location.pathname + '?farmer=' + encodeURIComponent(v);
    };
    const qrLink=wrap.querySelector('#farmer-qr-link');
    function updQr(){
      const v=sel.value || 'demo';
      const url = location.origin + location.pathname + '?farmer=' + encodeURIComponent(v);
      qrLink.href='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(url);
    }
    sel.addEventListener('change', updQr);
    updQr();
    host.parentNode.insertBefore(wrap, host.nextSibling);
  }

  // Lance après que data.js ait chargé
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 300);
})();
