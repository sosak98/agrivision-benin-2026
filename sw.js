const CACHE='agrivision-production-v2';
const CORE=[
  './','./index.html','./analyse.html','./resultats.html','./actions.html','./qualite.html','./historique.html','./ia.html','./rapport.html','./offline.html',
  './css/style.css','./css/finale.css',
  './js/data.js','./js/dashboard-dynamic.js','./js/actions-dynamic.js','./js/actions-audio.js','./js/quality-dynamic.js','./js/carte.js','./js/qgis-import.js','./js/history-dynamic.js','./js/assistant-local.js','./js/rapport.js','./js/offline.js','./js/install.js',
  './vendor/leaflet/leaflet.css','./vendor/leaflet/leaflet.js',
  './assets/logo.png','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png','./assets/apple-touch-icon.png',
  './assets/maps/map-zone1.png','./assets/maps/map-zone2.png','./assets/maps/map-zone3.png','./assets/maps/map-all.png','./manifest.json'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(url.hostname.includes('tile.openstreetmap.org')){event.respondWith(fetch(req).catch(()=>new Response('',{status:503})));return}
  if(url.origin!==self.location.origin)return;
  event.respondWith(caches.match(req).then(cached=>{
    const network=fetch(req).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}return response});
    if(cached){event.waitUntil(network.catch(()=>null));return cached}
    return network.catch(()=>req.mode==='navigate'?caches.match('./offline.html'):new Response('',{status:503}));
  }));
});
