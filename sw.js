const C = 'mytube-v13';
const ROOT = new URL('./', self.registration.scope).pathname;   // e.g. /My-Tube-List/
const COLORS = ['red','orange','yellow','green','teal','blue','purple','pink'];

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./index.html', './manifest.json']))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));

async function appPage(){
  try{
    const r = await fetch(ROOT + 'index.html', { cache: 'no-cache' });
    if(r.ok){ caches.open(C).then(c => c.put('./index.html', r.clone())); return new Response(await r.blob(), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }); }
  }catch{}
  const cached = await caches.match('./index.html');
  return new Response(cached ? await cached.blob() : 'Offline', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function playlistManifest(list, q){
  const name = (q.get('name') || 'My Tube').slice(0, 30);
  const c = COLORS.includes(q.get('c')) ? q.get('c') : 'red';
  const scope = ROOT + 'p/' + list + '/';
  const m = {
    id: scope, name, short_name: name,
    start_url: scope + '?name=' + encodeURIComponent(name) + '&c=' + c,
    scope, display: 'standalone', background_color: '#15121a', theme_color: '#15121a',
    icons: [192, 512].map(n => ({ src: ROOT + c + '-' + n + '.png', sizes: n + 'x' + n, type: 'image/png', purpose: 'any' }))
  };
  return new Response(JSON.stringify(m), { status: 200, headers: { 'Content-Type': 'application/manifest+json' } });
}

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  const m = u.pathname.startsWith(ROOT) && u.pathname.slice(ROOT.length).match(/^p\/([\w-]{10,})\/(manifest\.json)?$/);
  if (m && m[2]) { e.respondWith(playlistManifest(m[1], u.searchParams)); return; }   // this playlist's app manifest
  if (m && e.request.mode === 'navigate') { e.respondWith(appPage()); return; }       // playlist page, served normally (200)
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request)));
});
