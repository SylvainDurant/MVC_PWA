const staticCache = "numerus-static-v1.6";
const dynamicCache = "numerus-dynamic-v1.6";
const assets = [
  "/",
  "/test",
  "	/manifest.json",
  "/js/app.js",
  "/js/db.js",
  "/js/insatllPrompt.js",
  "/stylesheets/style.css"
];

///// LIMIT CACHE SIZE
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0])
        .then(limitCacheSize(name, size));
      }
    })
  })
}

///// INSTALL SERVICE WORKER
self.addEventListener("install", evt => {
  console.log("service worker has been installed");
  
  // cache the static assets
  evt.waitUntil(
    caches.open(staticCache).then(cache => {
      console.log("caching static assets");
      cache.addAll(assets);
    })
  );
});

///// ACTIVATE SERVICE WORKER
self.addEventListener("activate", evt => {
  console.log("service worker has been activated");

  // deleting old caches
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticCache && key !== dynamicCache)
        .map(key => caches.delete(key)))
    })
  )
});

///// FETCH EVENTS
// looks what the app is fetching
// self.addEventListener("fetch", evt => {
//   // looks if the fetched asset is already in the caches
//   evt.respondWith(
//     caches.match(evt.request).then(response => {
//       return response || fetch(evt.request).then( fetchResponse => {
//         // if it's not in the caches, cache it in the dynamic cache 
//         return caches.open(dynamicCache).then(cache => {
//           // the fetchResponse is needed for the return, so it cache a copy of the fetchResponse
//           cache.put(evt.request.url, fetchResponse.clone());
//           // check if the dynamic cache is full
//           limitCacheSize(dynamicCache,50);
//           return fetchResponse;
//         })
//       });
//       // if the fetch fail (asset not in the caches while offline)
//     }).catch(() => {
//       // if it was a page fetch then redirect to the fallback page
//       if (evt.request.url.indexOf(".html") > -1) {
//         return caches.match("/pages/fallback.html");
//       }
//     })
//   );
// });
