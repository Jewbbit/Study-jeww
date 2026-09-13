const CACHE_NAME="study-jew-pwa-v5-content-bridge";
const CORE=["./edit.html","./hotfix.js","./hotfix-bridge.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

function withHotfix(response){
  if(!response)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  return response.text().then(html=>{
    const tags=[];
    if(!html.includes("hotfix.js"))tags.push('<script src="./hotfix.js?v=20260913-3"></script>');
    if(!html.includes("hotfix-bridge.js"))tags.push('<script src="./hotfix-bridge.js?v=20260913-1"></script>');
    if(tags.length){
      const block=tags.join("\n");
      if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,block+"\n</body>");
      else if(/<\/head>/i.test(html))html=html.replace(/<\/head>/i,block+"\n</head>");
      else html+=block;
    }
    const headers=new Headers(response.headers);
    headers.delete("content-length");
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  });
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const req=event.request;
  const url=new URL(req.url);

  if(req.mode==="navigate"){
    event.respondWith(
      fetch(req,{cache:"no-store"})
        .then(withHotfix)
        .then(res=>{
          if(res){const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put("./edit.html",copy));}
          return res;
        })
        .catch(()=>caches.match("./edit.html").then(withHotfix))
    );
    return;
  }

  if(url.origin===self.location.origin){
    if(url.pathname.endsWith("/hotfix.js")||url.pathname.endsWith("/hotfix-bridge.js")){
      event.respondWith(
        fetch(req,{cache:"no-store"}).then(res=>{
          const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return res;
        }).catch(()=>caches.match(req))
      );
      return;
    }
    event.respondWith(
      caches.match(req).then(cached=>cached||fetch(req).then(res=>{
        const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return res;
      }))
    );
  }
});
