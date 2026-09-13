const CACHE_NAME="study-jew-pwa-v11-blank-editor-hotfix";
const FALLBACK_URL="./edit.html";
const HOTFIX_SRC="./hotfix-v6.js?v=20260913-1";
const HOTFIX_TAG=`<script src="${HOTFIX_SRC}"></script>`;

async function injectHotfix(response){
  if(!response||!response.ok)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;

  const html=await response.text();
  const patched=html.includes("hotfix-v6.js")
    ? html
    : (html.includes("</body>") ? html.replace("</body>",`${HOTFIX_TAG}</body>`) : html+HOTFIX_TAG);

  const headers=new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(patched,{
    status:response.status,
    statusText:response.statusText,
    headers
  });
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
    return;
  }
  /* 다른 정적 파일은 변형/주입하지 않고 브라우저가 그대로 네트워크에서 받게 둔다. */
});
