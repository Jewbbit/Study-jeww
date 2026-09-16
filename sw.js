const CACHE_NAME="study-jew-pwa-v26-curriculum-local-first";
const FALLBACK_URL="./edit.html";
const HOTFIX_SRCS=[
  "./hotfix-v21.js?v=20260916-1",
  "./hotfix-v6.js?v=20260913-4",
  "./hotfix-v8.js?v=20260913-2",
  "./hotfix-v9.js?v=20260913-2",
  "./hotfix-v10.js?v=20260913-1",
  "./hotfix-v11.js?v=20260915-3",
  "./hotfix-v19.js?v=20260916-1"
];
const HEADER_PROGRESS_STYLE='<style id="mission-progress-fit">#plannerQuickBtn{width:auto!important;min-width:38px!important;max-width:none!important;height:33px!important;padding:5px 6px!important;font-size:9px!important;line-height:1!important;white-space:nowrap!important;letter-spacing:-.15px!important;flex:0 0 auto!important}</style>';
const STANDARD_NOTE_STYLE='<style id="standard-note-room">.curriculum-standard-note-strip{grid-template-columns:minmax(0,1.6fr) minmax(160px,.9fr)!important;align-items:start!important}.curriculum-standard-note-field{align-items:start!important}.curriculum-standard-note-field textarea{box-sizing:border-box!important;width:100%!important;min-height:31px!important;max-height:110px!important;overflow:auto!important}.curriculum-standard-note-field:first-child textarea{min-height:48px!important;resize:vertical!important;padding-top:5px!important;padding-bottom:5px!important}@media(max-width:699px){.curriculum-standard-note-strip{grid-template-columns:1fr!important}.curriculum-standard-note-field:first-child textarea{min-height:54px!important}}</style>';

function appShellNavigation(request){
  try{
    const u=new URL(request.url),scope=new URL(self.registration.scope);
    if(u.origin!==scope.origin)return false;
    const base=scope.pathname.replace(/\/$/,"");
    const p=u.pathname.replace(/\/$/,"");
    return p===base||p===`${base}/edit.html`||p===`${base}/index.html`;
  }catch{return false}
}

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
    .replace(/<script[^>]+src=["'][^"']*hotfix-v11\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v19\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v20\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<script[^>]+src=["'][^"']*hotfix-v21\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<style id=["']mission-progress-fit["'][^>]*>[\s\S]*?<\/style>\s*/gi,"")
    .replace(/<style id=["']standard-note-room["'][^>]*>[\s\S]*?<\/style>\s*/gi,"")
    .replace(/\s*if\(!useCompactMissionPanel\(\)\)\{\s*button\.textContent="오늘";\s*button\.setAttribute\("aria-label","하루 미션"\);\s*return;\s*\}\s*(?=const x=plannerDaySummary\(plannerToday\(\)\);)/,"\n")
    .replace(/button\.textContent="✓";(?=\s*button\.classList\.add\("mission-complete"\))/,'button.textContent=`${x.done}/${x.total}`;')
    .replace(/const el=key==="memo"\?document\.createElement\("textarea"\):document\.createElement\("input"\);if\(el\.tagName==="INPUT"\)el\.type="text";else el\.rows=1;/g,'const el=document.createElement("textarea");el.rows=key==="content"?2:1;')
    .replace(/saveLocal\(\);scheduleCurriculumCloud\(700\)/g,'app.study.updatedAt=Date.now();saveStudyQuickNow();saveLocal();scheduleCurriculumCloud(700)')
    .replace(/saveLocal\(\);scheduleCurriculumCloud\(1300\)/g,'app.study.updatedAt=Date.now();saveStudyQuickNow();saveLocal();scheduleCurriculumCloud(1300)')
    .replace('function markStudyCloud(){app.study.updatedAt=Date.now();saveStudyQuickNow();saveLocal();saveStudyDraftsNow();scheduleStudyCloud()}',`function sjReadStandardSidecar(key){try{const raw=localStorage.getItem(key);if(raw===null)return {exists:false,value:{}};const x=JSON.parse(raw||"{}");return {exists:true,value:x&&typeof x==="object"&&!Array.isArray(x)?x:{}}}catch{return {exists:false,value:{}}}}\nfunction syncStandardExtraBlanksIntoStudy(){const st=curriculumStore(),exp=sjReadStandardSidecar("study-jew-explanation-blanks-v1"),con=sjReadStandardSidecar("study-jew-consideration-blanks-v1");if(exp.exists)st.explanationBlankOverrides=exp.value;else if(st.explanationBlankOverrides&&typeof st.explanationBlankOverrides==="object")try{localStorage.setItem("study-jew-explanation-blanks-v1",JSON.stringify(st.explanationBlankOverrides))}catch{};if(con.exists)st.considerationBlankOverrides=con.value;else if(st.considerationBlankOverrides&&typeof st.considerationBlankOverrides==="object")try{localStorage.setItem("study-jew-consideration-blanks-v1",JSON.stringify(st.considerationBlankOverrides))}catch{}}\nfunction syncStandardExtraBlanksOutOfStudy(){const st=app.study?.curriculumPractice;if(!st||typeof st!=="object")return;if(st.explanationBlankOverrides&&typeof st.explanationBlankOverrides==="object")try{localStorage.setItem("study-jew-explanation-blanks-v1",JSON.stringify(st.explanationBlankOverrides))}catch{};if(st.considerationBlankOverrides&&typeof st.considerationBlankOverrides==="object")try{localStorage.setItem("study-jew-consideration-blanks-v1",JSON.stringify(st.considerationBlankOverrides))}catch{}}\nfunction markStudyCloud(){syncStandardExtraBlanksIntoStudy();app.study.updatedAt=Date.now();saveStudyQuickNow();saveLocal();saveStudyDraftsNow();scheduleStudyCloud()}\nwindow.sjSaveCurriculumStandardEdits=()=>{markStudyCloud();return true}`)
    .replace('app.study=incoming;cleanup();\n  if(typeof invalidateCurriculumDerived==="function")invalidateCurriculumDerived();','app.study=incoming;cleanup();syncStandardExtraBlanksOutOfStudy();\n  if(typeof invalidateCurriculumDerived==="function")invalidateCurriculumDerived();')
    .replace('function setPage(subject,idx,focusBlank){const ui=curriculumUi(),groups=orderedGroups(subject);','function setPage(subject,idx,focusBlank){markStudyCloud();const ui=curriculumUi(),groups=orderedGroups(subject);')
    .replace('be.onclick=()=>{ui.standardBlankEdit=!ui.standardBlankEdit;standardSelection=null;saveLocal();renderCurriculumStandards()}','be.onclick=()=>{ui.standardBlankEdit=!ui.standardBlankEdit;standardSelection=null;saveLocal();markStudyCloud();renderCurriculumStandards()}')
    .replace('function plannerMissionsForDate(round,date,{includeExcluded=false}={}){\n  return (round?.missions||[]).filter(m=>plannerMissionDisplayDate(round,m)===date&&(includeExcluded||!plannerMissionExcluded(round,m)));\n}',`function plannerMissionsForDate(round,date,{includeExcluded=false}={}){\n  return (round?.missions||[]).filter(m=>plannerMissionDisplayDate(round,m)===date&&(includeExcluded||!plannerMissionExcluded(round,m)));\n}\nfunction plannerMissionsForDayView(round,date){\n  const exact=plannerMissionsForDate(round,date);\n  if(date!==plannerToday())return exact;\n  const seen=new Set(exact);\n  const overdue=(round?.missions||[]).filter(m=>String(m.date||"")<date&&!plannerMissionExcluded(round,m)&&!plannerMissionDone(round,m)&&!seen.has(m));\n  overdue.sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));\n  return [...overdue,...exact];\n}`)
    .replace('for(const r of p.rounds)for(const m of plannerMissionsForDate(r,date))missions.push([r,m]);','for(const r of p.rounds)for(const m of plannerMissionsForDayView(r,date))missions.push([r,m]);')
    .replace('const missions=plannerMissionsForDate(r,selected);','const missions=plannerMissionsForDayView(r,selected);')
    .replace('const missions=plannerMissionsForDate(round,date);total+=missions.length;done+=missions.filter(m=>plannerMissionDone(round,m)).length;','const missions=plannerMissionsForDayView(round,date);total+=missions.length;done+=missions.filter(m=>plannerMissionDone(round,m)).length;')
    .replace('if(m.date<today&&!plannerMissionExcluded(r,m)&&!plannerMissionDone(r,m))overdue.push([r,m]);','if(selected!==today&&m.date<today&&!plannerMissionExcluded(r,m)&&!plannerMissionDone(r,m))overdue.push([r,m]);');
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
  if(req.mode!=="navigate"||!appShellNavigation(req))return;
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
});