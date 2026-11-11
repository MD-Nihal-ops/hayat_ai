const CACHE_NAME = "hayat-shell-v1";
const APP_SHELL = "/";
const APP_SHELL_FILES = [
  APP_SHELL,
  "/manifest.webmanifest",
  "/icons/hayat-192.svg",
  "/icons/hayat-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL_FILES);
      const shell = await cache.match(APP_SHELL);
      const html = await shell.text();
      const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
        .map((match) => new URL(match[1], self.location.origin))
        .filter((url) => url.origin === self.location.origin && url.pathname.startsWith("/assets/"))
        .map((url) => url.href);
      await cache.addAll(assets);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("hayat-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("Authorization") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/") ||
    url.pathname.startsWith("/private-uploads/") ||
    !(
      url.pathname === "/" ||
      url.pathname === "/index.html" ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/assets/")
    )
  ) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(
          url.pathname === "/" || url.pathname === "/index.html" ? APP_SHELL : request,
          copy
        ));
      }
      return response;
    }).catch(async () => (await caches.match(
      url.pathname === "/" || url.pathname === "/index.html" ? APP_SHELL : request
    )) || Response.error())
  );
});
