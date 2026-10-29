const CACHE_NAME = 'nasti-life-v4';
const APP_FILES = ['./manifest.json', './icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('nasti-life-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // HTML always network-first: don't let a stale cached index.html hide fixes.
  if (req.mode === 'navigate' || req.destination === 'document' || new URL(req.url).pathname.endsWith('.html')) {
    event.respondWith(fetch(req).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
    return response;
  })));
});
self.addEventListener('push', event => {
  let data = { title: 'NASTI LIFE', body: 'Hai un promemoria in programma.', url: './' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) { if (event.data) data.body = event.data.text(); }
  event.waitUntil(self.registration.showNotification(data.title || 'NASTI LIFE', {
    body: data.body || 'Hai un promemoria in programma.', icon: './icon.svg', badge: './icon.svg',
    data: { url: data.url || './' }
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    for (const client of clients) if (client.url === target && 'focus' in client) return client.focus();
    if (self.clients.openWindow) return self.clients.openWindow(target);
  }));
});