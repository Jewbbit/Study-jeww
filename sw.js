const CACHE_NAME="study-jew-pwa-v8-curriculum-core";
const CORE=["./edit.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

/*
  edit.html 안의 성취기준 v2 스크립트는 과거에 module 바깥에 붙어 있어
  module-scope 함수(curriculumUi 등)를 볼 수 없었다. 탐색 때 그 코드를
  기존 <script type=module> 마지막으로 옮겨 실행하고, 오른쪽 독립 탭/내용체계
  보기를 같은 module scope에서 이어 붙인다.
*/
const EXTRA_MODULE_PATCH=String.raw`
;(()=>{
  if(globalThis.__sjCurriculumV8)return;globalThis.__sjCurriculumV8=1;
  let contentOpen=false,contentSubject="";
  const style=document.createElement("style");style.id="sj-curriculum-v8-style";style.textContent=\`
@media(min-width:700px) and (min-height:600px){
 #widePlannerSide,#widePlannerSide .wide-planner-inner,#widePlannerList{overflow-x:hidden!important;overscroll-behavior-x:none!important;max-width:100%!important}
 #widePlannerList .planner-task,#widePlannerList .planner-task-link,#widePlannerList .planner-task-check,#widePlannerList .planner-task-exclude{touch-action:pan-y!important}
 #widePlannerList .planner-task{left:0!important;right:auto!important;translate:0 0!important;max-width:100%!important}
}
.curriculum-line.curriculum-hanging{padding-left:1.12em!important;text-indent:-1.12em!important}
#widePlannerBlankTab{white-space:nowrap!important}
.sj-standards-side-head{position:sticky;top:0;z-index:3;background:#fff;padding:7px 2px;border-bottom:1px solid #ececef}
.sj-standards-side-tools{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:5px;align-items:center}
.sj-standards-side-tools select,.sj-standards-side-tools button{height:31px;min-width:0;border:1px solid #d9d9dd;border-radius:7px;background:#fff;padding:4px 7px;font-size:9.7px;color:#55565b}
.sj-standards-side-tools button.active{background:#303136;color:#fff;border-color:#303136;font-weight:750}
.sj-standards-side-order{display:flex;gap:4px;margin-top:6px}.sj-standards-side-order button{flex:1;border:1px solid #dedee1;background:#fff;border-radius:999px;padding:4px 6px;font-size:9px;color:#696a70}.sj-standards-side-order button.active{background:#303136;color:#fff;border-color:#303136;font-weight:750}
.sj-standards-side-row{display:block;width:100%;border:0;border-bottom:1px solid #f0f0f2;background:#fff;text-align:left;padding:8px 7px;color:#3f4045}.sj-standards-side-row.current{background:#f2f2f4;font-weight:750}.sj-standards-side-row strong{display:block;font-size:10.5px;line-height:1.4}.sj-standards-side-row span{display:block;margin-top:2px;font-size:8.8px;color:#88898e}
body.sj-content-system .curriculum-page-dock,body.sj-content-system .curriculum-float-tools{display:none!important}.sj-content-root{padding:2px 0 40px}.sj-content-head{position:sticky;top:0;z-index:12;display:flex;align-items:center;gap:6px;padding:7px 3px 8px;background:rgba(255,255,255,.97);border-bottom:1px solid #e4e4e7;margin-bottom:9px}.sj-content-head strong{flex:1;font-size:.84em}.sj-content-head button{border:1px solid #d9d9dd;background:#fff;border-radius:7px;padding:6px 8px;font-size:.68em;color:#55565b}.sj-content-note{padding:8px 9px;margin-bottom:10px;border-left:3px solid #c5c6ca;background:#fafafa;font-size:.69em;color:#74757b;line-height:1.5}.sj-content-section{margin:0 0 14px}.sj-content-section>h3{margin:11px 2px 6px;font-size:.82em}.sj-content-root .curriculum-table-wrap{margin:0 0 7px!important;overflow-x:auto!important;overflow-y:hidden!important}.sj-content-root .curriculum-table{display:table!important;table-layout:fixed!important;min-width:760px!important;width:100%!important}.sj-content-root .curriculum-table tr{display:table-row!important;position:static!important;padding:0!important;border:0!important}.sj-content-root .curriculum-table td{display:table-cell!important;text-align:left!important;vertical-align:top!important;white-space:normal!important;word-break:keep-all!important}.sj-content-btn.active{background:#303136!important;color:#fff!important;border-color:#303136!important;font-weight:750!important}
@media(max-width:640px){.sj-content-root .curriculum-table{min-width:680px!important}}
\`;document.head.append(style);

  const stdTab=document.getElementById("widePlannerBlankTab");if(stdTab){stdTab.textContent="성취기준";stdTab.title="성취기준";stdTab.setAttribute("aria-label","성취기준")}
  function lockX(){for(const el of [document.querySelector("#widePlannerSide .wide-planner-inner"),document.getElementById("widePlannerList")]){if(!el||el.dataset.sjLockX)return;el.dataset.sjLockX="1";el.addEventListener("scroll",()=>{if(el.scrollLeft)el.scrollLeft=0},{passive:true})}}
  function gradeRank(g){const s=String(g||"");return s.startsWith("1")?1:s.startsWith("3")?2:s.startsWith("5")?3:9}
  function areaName(t){return String(t||"").replace(/^\\s*\\(\\d+\\)\\s*/,"").replace(/^\\s*\\d+[.)]\\s*/,"").trim()}
  function orderedGroups(subject){const gs=curriculumStandardsGroups(subject),mode=curriculumUi().standardOrderBySubject?.[subject]||"grade-area",area=new Map();let n=0;gs.forEach(g=>{const a=g.area||areaName(g.title);if(!area.has(a))area.set(a,n++)});return [...gs].sort((a,b)=>mode==="area-grade"?((area.get(a.area||areaName(a.title))-area.get(b.area||areaName(b.title)))||(gradeRank(a.grade)-gradeRank(b.grade))):((gradeRank(a.grade)-gradeRank(b.grade))||(area.get(a.area||areaName(a.title))-area.get(b.area||areaName(b.title)))))}
  function standardsSubject(){const subs=(curriculumData?.subjects||[]).filter(curriculumSubjectHasStandards),ui=curriculumUi();if(ui.sideSubject&&subs.includes(ui.sideSubject))return ui.sideSubject;if(ui.subject&&subs.includes(ui.subject))return ui.subject;const cur=curriculumCurrentItem()?.s;return subs.includes(cur)?cur:(subs[0]||"")}
  function stdPage(subject,groups){const ui=curriculumUi(),i=Math.max(0,Math.min(Math.max(0,groups.length-1),Number(ui.standardPageBySubject?.[subject])||0));ui.standardPageBySubject[subject]=i;return i}
  function openStandards(subject,index,edit=false){const ui=curriculumUi();contentOpen=false;document.body.classList.remove("sj-content-system");ui.subject=subject;ui.sideSubject=subject;ui.view="standards";ui.standardPageBySubject[subject]=Math.max(0,Number(index)||0);ui.standardBlankEdit=!!edit;widePlannerSideTab="blank";saveLocal();if((app.ui.workspace||"memory")!=="curriculum"){app.ui.workspace="curriculum";renderMode()}else renderCurriculum();renderWidePlannerSide();curriculumScrollToReadingTop()}
  function renderStandardsSide(list,count){
    if(!curriculumData){const e=document.createElement("div");e.className="wide-planner-empty";e.textContent="성취기준을 불러오는 중…";list.append(e);ensureCurriculumData().then(()=>{if(widePlannerSideTab==="blank")renderWidePlannerSide()}).catch(()=>e.textContent="성취기준을 열지 못했습니다");return}
    const subject=standardsSubject(),groups=orderedGroups(subject),pos=stdPage(subject,groups);count.textContent=groups.length?groups.length+"묶음":"";
    const head=document.createElement("div");head.className="sj-standards-side-head";const tools=document.createElement("div");tools.className="sj-standards-side-tools";const sel=document.createElement("select");for(const s of (curriculumData.subjects||[]).filter(curriculumSubjectHasStandards)){const o=document.createElement("option");o.value=s;o.textContent=s;o.selected=s===subject;sel.append(o)}sel.onchange=()=>{curriculumUi().sideSubject=sel.value;saveLocal();renderWidePlannerSide()};const open=document.createElement("button");open.textContent="열기";open.onclick=()=>openStandards(subject,pos,false);const edit=document.createElement("button");edit.textContent=curriculumStandardsView()&&curriculumUi().standardBlankEdit?"✓ 빈칸":"✎ 빈칸";edit.classList.toggle("active",curriculumStandardsView()&&curriculumUi().standardBlankEdit);edit.onclick=()=>openStandards(subject,pos,true);tools.append(sel,open,edit);const order=document.createElement("div");order.className="sj-standards-side-order";for(const [v,label] of [["grade-area","학년→영역"],["area-grade","영역→학년"]]){const b=document.createElement("button");b.textContent=label;b.classList.toggle("active",(curriculumUi().standardOrderBySubject?.[subject]||"grade-area")===v);b.onclick=()=>{curriculumUi().standardOrderBySubject[subject]=v;curriculumUi().standardPageBySubject[subject]=0;saveLocal();renderCurriculumStandards();renderWidePlannerSide()};order.append(b)}head.append(tools,order);list.append(head);
    groups.forEach((g,i)=>{const b=document.createElement("button");b.className="sj-standards-side-row"+(curriculumStandardsView()&&curriculumUi().subject===subject&&i===pos?" current":"");const strong=document.createElement("strong");strong.textContent=(g.grade?g.grade+" · ":"")+(g.area||areaName(g.title)||g.title);const span=document.createElement("span");span.textContent=(g.standards?.length||0)+"개 성취기준";b.append(strong,span);b.onclick=()=>openStandards(subject,i,false);list.append(b)})
  }

  function contentRecords(subject){const arr=curriculumDerivedItems().filter(x=>x.s===subject),out=[];let on=false;for(const item of arr){const head=(String(item.logicalLabel||"")+" "+String(item.t||"").slice(0,140)).replace(/\\s+/g," ");if(/내용\\s*체계/.test(head))on=true;if(on&&/성취\\s*기준/.test(head)&&!/내용\\s*체계/.test(String(item.logicalLabel||""))){break}if(on){const tables=curriculumTables(item);if(tables.length)out.push({item,tables,label:String(item.logicalLabel||"").trim()})}}return out}
  function closeContent(){contentOpen=false;contentSubject="";document.body.classList.remove("sj-content-system");renderCurriculum()}
  function renderContent(){if(!contentOpen)return;const subject=contentSubject,box=document.getElementById("curriculumPassage");if(!box)return;document.body.classList.add("sj-content-system");document.getElementById("curriculumEditPanel")?.classList.add("hidden");document.getElementById("curriculumPageDock")?.classList.add("hidden");document.getElementById("curriculumTitle").textContent=subject+" · 내용 체계";document.getElementById("curriculumMeta").textContent="내용 체계 모아보기";document.getElementById("curriculumSourceNote").textContent="기기에서 PDF를 다시 고르지 않고, 현재 교육과정 데이터의 표 구조를 쪽 경계와 분리해 이어서 표시합니다.";box.innerHTML="";box.classList.remove("editing","source-editing");const root=document.createElement("div");root.className="sj-content-root";const head=document.createElement("div");head.className="sj-content-head";const t=document.createElement("strong");t.textContent=subject+" 내용 체계";const close=document.createElement("button");close.textContent="원문으로";close.onclick=closeContent;head.append(t,close);root.append(head);const note=document.createElement("div");note.className="sj-content-note";note.textContent="내용 체계 구간의 표를 한곳에 모았습니다. 표 중간에서 원래 PDF 쪽이 바뀌어도 여기서는 끊지 않습니다.";root.append(note);const records=contentRecords(subject);if(!records.length){const e=document.createElement("div");e.className="curriculum-empty-note";e.textContent="이 과목에서 내용 체계 표를 찾지 못했습니다.";root.append(e)}else for(const r of records){const sec=document.createElement("section");sec.className="sj-content-section";if(r.label&&!/내용\\s*체계$/.test(r.label)){const h=document.createElement("h3");h.textContent=r.label;sec.append(h)}for(const table of r.tables)appendCurriculumTable(sec,r.item,table,"practice",[],{session:curriculumSession(),rendered:new Set()});root.append(sec)}box.append(root);addContentButton();lockX()}
  function openContent(subject){if(!subject||subject==="전체"||subject==="총론")return toast("과목을 먼저 선택하세요");contentOpen=true;contentSubject=subject;const ui=curriculumUi();ui.subject=subject;ui.sideSubject=subject;ui.view="book";ui.edit=false;widePlannerSideTab="curriculum";saveLocal();if((app.ui.workspace||"memory")!=="curriculum"){app.ui.workspace="curriculum";renderMode()}else renderContent();renderWidePlannerSide()}
  function addContentButton(){if(widePlannerSideTab!=="curriculum")return;const tools=document.querySelector("#widePlannerList .wide-curriculum-study-tools");if(!tools)return;let b=tools.querySelector(".sj-content-btn");if(!b){b=document.createElement("button");b.className="sj-content-btn";b.textContent="내용체계";b.onclick=()=>{const s=curriculumSideOutlineSubject();if(contentOpen&&contentSubject===s)closeContent();else openContent(s)};tools.prepend(b)}const s=curriculumSideOutlineSubject();b.classList.toggle("active",contentOpen&&contentSubject===s);b.textContent=contentOpen&&contentSubject===s?"✓ 내용체계":"내용체계"}

  const baseRenderSide=renderWidePlannerSide;
  renderWidePlannerSide=function(){const out=baseRenderSide();if(stdTab){stdTab.textContent="성취기준";stdTab.title="성취기준"}if(widePlannerSideTab==="blank"){const list=document.getElementById("widePlannerList"),count=document.getElementById("widePlannerCount"),nav=document.getElementById("widePlannerDateNav");if(nav)nav.classList.add("hidden");if(list)list.innerHTML="";if(count)count.textContent="";if(list&&count&&widePlannerSideEligible())renderStandardsSide(list,count)}else addContentButton();lockX();return out};
  const baseSetView=setCurriculumViewMode;
  setCurriculumViewMode=function(mode){contentOpen=false;document.body.classList.remove("sj-content-system");const out=baseSetView(mode);widePlannerSideTab=mode==="standards"?"blank":"curriculum";renderWidePlannerSide();return out};
  const baseRenderCurrent=renderCurriculumCurrent;
  renderCurriculumCurrent=function(){if(contentOpen){renderContent();return}if(curriculumStandardsView()){renderCurriculumStandards();return}return baseRenderCurrent()};
  const baseRenderCurriculum=renderCurriculum;
  renderCurriculum=async function(){if(contentOpen){if(!curriculumData)await ensureCurriculumData();renderContent();return}const out=await baseRenderCurriculum();if(curriculumStandardsView()){document.querySelector("#curriculumModebar .curriculum-mode-switch")?.classList.remove("hidden");const b=document.getElementById("curriculumBlankEditBtn");if(b){b.classList.remove("hidden");b.textContent=curriculumUi().standardBlankEdit?"✓ 빈칸 편집":"빈칸 편집";b.classList.toggle("active",curriculumUi().standardBlankEdit);b.onclick=()=>{curriculumUi().standardBlankEdit=!curriculumUi().standardBlankEdit;saveLocal();renderCurriculumStandards();renderWidePlannerSide()}}}return out};
  const baseRenderMode=renderMode;
  renderMode=function(){const out=baseRenderMode();if((app.ui.workspace||"memory")==="curriculum"&&curriculumStandardsView()){widePlannerSideTab="blank";renderWidePlannerSide()}else addContentButton();lockX();return out};
  const baseSetSideSubject=setCurriculumSideOutlineSubject;
  setCurriculumSideOutlineSubject=function(subject){const out=baseSetSideSubject(subject);if(contentOpen){contentSubject=subject;curriculumUi().subject=subject;saveLocal();renderContent()}return out};
  lockX();if(stdTab)stdTab.textContent="성취기준";
})();
`;

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

function stripLegacyHotfixes(html){
  return html
    .replace(/<script[^>]+src=["'][^"']*hotfix(?:-bridge|-v4|-v5)?\.js[^"']*["'][^>]*><\/script>\s*/gi,"");
}
function relocateStandards(html){
  const re=/<script\s+id=["']curriculum-standards-pages-v2["'][^>]*>([\s\S]*?)<\/script>/i;
  const m=html.match(re),standards=m?m[1]:"";
  if(m)html=html.replace(re,"");
  const start=html.search(/<script\s+type=["']module["'][^>]*>/i);
  if(start<0)return html;
  const openEnd=html.indexOf(">",start)+1,close=html.indexOf("</script>",openEnd);
  if(close<0)return html;
  const marker="/* sj-curriculum-v8-injected */";
  if(html.includes(marker))return html;
  const code=`\n${marker}\n${standards}\n${EXTRA_MODULE_PATCH}\n`;
  return html.slice(0,close)+code+html.slice(close);
}
async function withCurriculumCore(response){
  if(!response)return response;
  const type=response.headers.get("content-type")||"";if(!type.includes("text/html"))return response;
  let html=await response.text();html=relocateStandards(stripLegacyHotfixes(html));
  const headers=new Headers(response.headers);headers.delete("content-length");headers.set("cache-control","no-cache");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const req=event.request,url=new URL(req.url);
  if(req.mode==="navigate"){
    event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{
      const raw=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put("./edit.html",raw)).catch(()=>{});
      return withCurriculumCore(res);
    }).catch(()=>caches.match("./edit.html").then(withCurriculumCore)));
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)).catch(()=>{});return res;})));
  }
});