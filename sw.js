// Offline-first service worker: everything is precached on install so the
// game runs in airplane mode. Bump CACHE_VERSION on every release.
const CACHE_VERSION = 'beatsrunner-v4';

const PRECACHE = [
  './',
  'manifest.webmanifest',
  'icon.png',
  'Lights on.mp3',
  'assets/skins/anatomical_eye_ball.glb',
  'assets/skins/basketball.glb',
  'assets/skins/disco_ball.glb',
  'assets/skins/moon.glb',
  'assets/skins/pokeball.glb',
  'assets/skins/soccer_ball.glb',
  'assets/skins/sun.glb',
  'css/base.css',
  'css/controls.css',
  'css/hud.css',
  'css/overlays.css',
  'css/screens.css',
  'css/store.css',
  'js/audio.js',
  'js/config.js',
  'js/controls.js',
  'js/core/geometry-cache.js',
  'js/core/glb-loader.js',
  'js/core/object-pool.js',
  'js/core/storage.js',
  'js/data/stage-patterns.js',
  'js/data/stage-progress.js',
  'js/data/stage-registry.js',
  'js/data/star-calculator.js',
  'js/gameflow.js',
  'js/gameplay/finish-line.js',
  'js/globals.js',
  'js/gltf-loader-bundle.js',
  'js/haptics.js',
  'js/loop.js',
  'js/main.js',
  'js/managers/beat-manager.js',
  'js/managers/bonus-orb-manager.js',
  'js/managers/collectible-manager.js',
  'js/managers/exit-booster-manager.js',
  'js/managers/magnet-manager.js',
  'js/managers/obstacle-manager.js',
  'js/managers/player-controller.js',
  'js/managers/shield-manager.js',
  'js/managers/speed-boost-manager.js',
  'js/orb-debug.js',
  'js/orbs.js',
  'js/postprocessing-bundle.js',
  'js/scene/floor.js',
  'js/scene/particles.js',
  'js/scene/pillars.js',
  'js/scene/player.js',
  'js/scene/renderer.js',
  'js/skins/basketball.js',
  'js/skins/disco-ball.js',
  'js/skins/eye-ball.js',
  'js/skins/falafel-ball.js',
  'js/skins/fire-ball.js',
  'js/skins/moon.js',
  'js/skins/pokeball.js',
  'js/skins/rainbow-orb.js',
  'js/skins/skin-animator.js',
  'js/skins/skin-manager.js',
  'js/skins/skin-preview.js',
  'js/skins/skin-registry.js',
  'js/skins/soccer-ball.js',
  'js/skins/sun.js',
  'js/state.js',
  'js/store/store-ui.js',
  'js/top-distance.js',
  'js/ui/booster-hud.js',
  'js/ui/gameplay-hud.js',
  'js/ui/level-select.js',
  'js/ui/results-screen.js',
  'js/ui/settings-screen.js',
  'js/ui/stage-info-card.js',
  'js/ui/timing-feedback.js',
  'js/ui/tutorial-overlay.js',
  'js/vendor/three.min.js',
];

// A response that followed a redirect (e.g. Cloudflare's /index.html -> /)
// cannot be used to answer a navigation, so store a clean copy instead.
async function clean(response) {
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(PRECACHE.map(async (url) => {
      const response = await fetch(new Request(url, { cache: 'reload' }));
      if (!response.ok) throw new Error('Precache failed: ' + url);
      await cache.put(url, await clean(response));
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Safari requests audio with Range headers and rejects non-206 answers,
// so serve slices of the cached full response.
async function rangeResponse(request, cached) {
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range'));
  const start = m[1] ? parseInt(m[1], 10) : 0;
  const end = m[2] ? Math.min(parseInt(m[2], 10), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) {
      return request.headers.has('range') ? rangeResponse(request, cached) : cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok && response.status === 200) cache.put(request, (await clean(response.clone())));
      return response;
    } catch (err) {
      if (request.mode === 'navigate') return cache.match('./');
      throw err;
    }
  })());
});
