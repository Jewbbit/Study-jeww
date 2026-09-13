const CACHE_NAME="study-jew-pwa-v15-safe-standards-blank";
const FALLBACK_URL="./edit.html";
const HOTFIX_SRC="./hotfix-v6.js?v=20260913-4";

async function injectHotfix(response){
  if(!response||!response.ok)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;

  let html=await response.text();
  html=html
    .replace(/<script[^>]+src=["'][^"']*hotfix-v6\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v7\.js[^"']*["'][^>]*><\/script>\s*/gi,"");
  const tag=`<script src="${HOTFIX_SRC}"></script>`;
  html=html.includes("</body>")?html.replace("</body>",`${tag}\n</body>`):html+tag;

  const headers=new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache=>{
        const response=await fetch(FALLBACK_URL,{cache:"no-store"});
        const patched=await injectHotfix(response);
        await cache.put(FALLBACK_URL,patched.clone());
      })
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
        .then(async res=>{
          const patched=await injectHotfix(res);
          if(patched&&patched.ok){
            const copy=patched.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put(FALLBACK_URL,copy)).catch(()=>{});
          }
          return patched;
        })
        .catch(()=>caches.match(FALLBACK_URL))
    );
  }
});
