document.addEventListener('DOMContentLoaded',()=>{
 const zones=ZONES_GEOJSON.features.map(f=>f.properties);
 document.getElementById('rep-brand').textContent='AgriVision Bénin · Groupe 3';
 const m=MISSIONS_DATA.derniere_mission; document.getElementById('rep-sante').textContent=m.sante_globale+'%';
 const dateEl=document.getElementById('rep-date'),parcelleEl=document.getElementById('rep-parcelle');if(dateEl)dateEl.textContent=m.date;if(parcelleEl)parcelleEl.textContent=m.parcelle;const quality=document.querySelectorAll('.report-stats')[0]?.querySelectorAll('.num');if(window.AGRIVISION_IMPORTED&&quality){quality[0].textContent=m.photos?`${m.photos}/${m.photos_alignees||m.photos}`:'Non fourni';quality[1].textContent=m.gsd_cm?m.gsd_cm+' cm':'Non fourni';quality[2].textContent='Non fourni';quality[3].textContent='Non fourni';}
 const summary=document.querySelectorAll('.report-stats')[1]?.querySelectorAll('.num');if(summary){summary[1].textContent=zones.length;summary[2].textContent=zones.filter(z=>z.risque!== 'faible').length;summary[3].textContent=zones.filter(z=>z.risque==='eleve').length;}
 document.getElementById('rep-diagnostic').innerHTML=genererDiagnostic(ZONES_GEOJSON).join(' • ');
 const labels={faible:'Vigueur élevée',modere:'À surveiller',eleve:'Priorité forte'};
 document.getElementById('rep-zones-body').innerHTML=zones.map(z=>`<tr><td>${z.nom}</td><td>${z.surface_ha} ha</td><td>${z.vari??'—'}</td><td>${labels[z.risque]}</td><td>${z.causes?.join(', ')||'Aucune anomalie majeure'}</td></tr>`).join('');
 const priorities=zones.filter(z=>z.risque!=='faible').flatMap(z=>z.recommandations.slice(0,3).map(r=>`${z.nom} — ${r}`));
 document.getElementById('rep-recos').innerHTML=priorities.map(r=>`<li>${r}</li>`).join('');
});
