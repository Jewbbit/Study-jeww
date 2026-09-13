const CACHE_NAME="study-jew-pwa-v20-curriculum-recovery";
const FALLBACK_URL="./edit.html";
const HOTFIX_SRCS=[
  "./hotfix-v6.js?v=20260913-4",
  "./hotfix-v8.js?v=20260913-2",
  "./hotfix-v9.js?v=20260913-2",
  "./hotfix-v10.js?v=20260913-1"
];
const HEADER_PROGRESS_STYLE='<style id="mission-progress-fit">#plannerQuickBtn{width:auto!important;min-width:38px!important;max-width:none!important;height:33px!important;padding:5px 6px!important;font-size:9px!important;line-height:1!important;white-space:nowrap!important;letter-spacing:-.15px!important;flex:0 0 auto!important}</style>';
const STANDARD_NOTE_STYLE='<style id="standard-note-room">.curriculum-standard-note-strip{grid-template-columns:minmax(0,1.6fr) minmax(160px,.9fr)!important;align-items:start!important}.curriculum-standard-note-field{align-items:start!important}.curriculum-standard-note-field textarea{box-sizing:border-box!important;width:100%!important;min-height:31px!important;max-height:110px!important;overflow:auto!important}.curriculum-standard-note-field:first-child textarea{min-height:48px!important;resize:vertical!important;padding-top:5px!important;padding-bottom:5px!important}@media(max-width:699px){.curriculum-standard-note-strip{grid-template-columns:1fr!important}.curriculum-standard-note-field:first-child textarea{min-height:54px!important}}</style>';

async function injectHotfix(response){
  if(!response||!response.ok)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;

  let html=await response.text();
  html=html
    .replace(/<script[^>]+src=["'][^"']*hotfix-v6\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v7\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v8\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v9\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v10\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<style id=["']mission-progress-fit["'][^>]*>[\s\S]*?<\/style>\s*/gi,"")
    .replace(/<style id=["']standard-note-room["'][^>]*>[\s\S]*?<\/style>\s*/gi,"")
    .replace(/\s*if\(!useCompactMissionPanel\(\)\)\{\s*button\.textContent="오늘";\s*button\.setAttribute\("aria-label","하루 미션"\);\s*return;\s*\}\s*(?=const x=plannerDaySummary\(plannerToday\(\)\);)/,"\n")
    .replace(/button\.textContent="✓";(?=\s*button\.classList\.add\("mission-complete"\))/,'button.textContent=`${x.done}/${x.total}`;')
    .replace(/const el=key==="memo"\?document\.createElement\("textarea"\):document\.createElement\("input"\);if\(el\.tagName==="INPUT"\)el\.type="text";else el\.rows=1;/g,'const el=document.createElement("textarea");el.rows=key==="content"?2:1;')
    .replace(/saveLocal\(\);scheduleCurriculumCloud\(700\)/g,'app.study.updatedAt=Date.now();saveStudyQuickNow();saveLocal();scheduleCurriculumCloud(700)')
    .replace(/saveLocal\(\);scheduleCurriculumCloud\(1300\)/g,'app.study.updatedAt=Date.now();saveStudyQuickNow();saveLocal();scheduleCurriculumCloud(1300)');
  const headStyles=`${HEADER_PROGRESS_STYLE}\n${STANDARD_NOTE_STYLE}`;
  html=html.includes("</head>")?html.replace("</head>",`${headStyles}\n</head>`):headStyles+html;
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
