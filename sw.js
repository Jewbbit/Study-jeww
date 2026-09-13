const CACHE_NAME="study-jew-pwa-v17-consideration-overdraw";
const FALLBACK_URL="./edit.html";
const HOTFIX_SRCS=[
  "./hotfix-v6.js?v=20260913-4",
  "./hotfix-v8.js?v=20260913-2"
];
const HEADER_PROGRESS_STYLE='<style id="mission-progress-fit">#plannerQuickBtn{width:auto!important;min-width:38px!important;max-width:none!important;height:33px!important;padding:5px 6px!important;font-size:9px!important;line-height:1!important;white-space:nowrap!important;letter-spacing:-.15px!important;flex:0 0 auto!important}</style>';

async function injectHotfix(response){
  if(!response||!response.ok)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;

  let html=await response.text();
  html=html
    .replace(/<script[^>]+src=["'][^"']*hotfix-v6\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v7\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v8\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<style id=["']mission-progress-fit["'][^>]*>[\s\S]*?<\/style>\s*/gi,"")
    .replace(/\s*if\(!useCompactMissionPanel\(\)\)\{\s*button\.textContent="오늘";\s*button\.setAttribute\("aria-label","하루 미션"\);\s*return;\s*\}\s*(?=const x=plannerDaySummary\(plannerToday\(\)\);)/,"\n")
    .replace(/button\.textContent="✓";(?=\s*button\.classList\.add\("mission-complete"\))/,'button.textContent=`${x.done}/${x.total}`;');
  html=html.includes("</head>")?html.replace("</head>",`${HEADER_PROGRESS_STYLE}\n</head>`):HEADER_PROGRESS_STYLE+html;
  const tags=HOTFIX_SRCS.map(src=>`<script src="${src}"></script>`).join("\n");
  html=html.includes("</body>")?html.replace("</body>",`${tags}\n</body>`):html+tags;

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
