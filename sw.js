const C='pl-v5', FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./favicon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(FILES))));
self.addEventListener('fetch',e=>{
  if(new URL(e.request.url).origin!==location.origin) return;
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
