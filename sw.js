// Guarda la app y el inventario cifrado en el celular para que funcionen sin internet.
// Siempre intenta primero la versión de internet; sin conexión usa la última copia guardada.
const CACHE = 'medicamentos-v1';
const APP = ['./', 'index.html', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png'];
const ESPERA_MS = 6000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(nombres => Promise.all(nombres.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const clave = url.origin + url.pathname;   // sin la marca de hora con la que se pide el inventario
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const r = await fetch(url.href, { cache: 'no-store', signal: AbortSignal.timeout(ESPERA_MS) });
      if (r.ok) await cache.put(clave, r.clone());
      return r;
    } catch (err) {
      const guardada = await cache.match(clave);
      if (guardada) return guardada;
      throw err;
    }
  })());
});
