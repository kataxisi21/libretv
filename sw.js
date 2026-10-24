/* LibreTV 静态缓存 Service Worker（仅缓存本站资源，跨域请求原样放行） */
var CACHE = "libretv-v1";
self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"]);
  }).catch(function(){}));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var url;
  try { url = new URL(e.request.url); } catch(err){ return; }
  if (url.origin !== location.origin) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(r){
      if (r) return r;
      return fetch(e.request).then(function(res){
        var ct = res.headers.get("content-type") || "";
        if (res.ok && /text\/html|javascript|application\/json|image\//.test(ct)) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return res;
      }).catch(function(){ return caches.match("./index.html"); });
    })
  );
});
