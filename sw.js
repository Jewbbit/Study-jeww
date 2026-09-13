const CACHE_NAME="study-jew-pwa-v6-curriculum-tools";
const CORE=["./edit.html","./hotfix-v4.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

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
    html=html
      .replace(/<script[^>]+src=["'][^"']*hotfix\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
      .replace(/<script[^>]+src=["'][^"']*hotfix-bridge\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
      .replace(/<script[^>]+src=["'][^"']*hotfix-v4\.js[^"']*["'][^>]*><\/script>\s*/gi,"");
    const tag='<script src="./hotfix-v4.js?v=20260913-4"></script>';
    if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,tag+"\n</body>");
    else if(/<\/head>/i.test(html))html=html.replace(/<\/head>/i,tag+"\n</head>");
    else html+=tag;
    const headers=new Headers(response.headers);headers.delete("content-length");
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  });
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const req=event.request,url=new URL(req.url);
  if(req.mode==="navigate"){
    event.respondWith(
      fetch(req,{cache:"no-store"}).then(withHotfix).then(res=>{
        if(res){const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put("./edit.html",copy));}
        return res;
      }).catch(()=>caches.match("./edit.html").then(withHotfix))
    );
    return;
  }
  if(url.origin===self.location.origin){
    if(url.pathname.endsWith("/hotfix-v4.js")){
      event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return res;}).catch(()=>caches.match(req)));
      return;
    }
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return res;})));
  }
});
