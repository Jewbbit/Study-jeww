const CACHE_NAME="study-jew-pwa-v10-recovery";
const FALLBACK_URL="./edit.html";

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.add(FALLBACK_URL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const req=event.request;
  if(req.mode==="navigate"){
    event.respondWith(
      fetch(req,{cache:"no-store"})
        .then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put(FALLBACK_URL,copy)).catch(()=>{});
          }
          return res;
        })
        .catch(()=>caches.match(FALLBACK_URL))
    );
    return;
  }
  /* 다른 정적 파일은 변형/주입하지 않고 브라우저가 그대로 네트워크에서 받게 둔다. */
});
