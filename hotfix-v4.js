(()=>{
  "use strict";
  const VERSION="2026-09-13-curriculum-tools-v4";
  if(window.__studyJewHotfixV4===VERSION)return;
  window.__studyJewHotfixV4=VERSION;

  const PDF_DB="study-jew-curriculum-pdf";
  const PDF_STORE="files";
  const PDF_KEY="curriculum-minibook";
  const PDF_SERVER="./curriculum-minibook.pdf";
  const PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFWORKER="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const START={"총론":3,"창체":20,"바른 생활":30,"슬기로운 생활":42,"즐거운 생활":54,"국어":66,"사회":106,"도덕":139,"수학":152,"과학":184,"실과":221,"체육":241,"음악":268,"미술":285,"영어":302};
  const ORDER=Object.keys(START);
  const ALIAS={"창의적 체험활동":"창체","창의적체험활동":"창체","바른생활":"바른 생활","슬기로운생활":"슬기로운 생활","즐거운생활":"즐거운 생활","실과(기술가정)정보":"실과"};
  const state={content:false,subject:"",doc:null,blob:null,loading:false,token:0,cache:new Map()};

  function style(){
    let s=document.getElementById("studyJewV4Style");if(s)return;
    s=document.createElement("style");s.id="studyJewV4Style";s.textContent=`
@media (min-width:700px) and (min-height:600px){
 #widePlannerSide{width:clamp(230px,30vw,340px)!important;max-width:340px!important;min-width:230px!important;overflow:hidden!important;overscroll-behavior-x:none!important}
 #widePlannerSide .wide-planner-inner,#widePlannerList{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important;overscroll-behavior-x:none!important}
 #widePlannerList .planner-task,#widePlannerList .planner-task-link,#widePlannerList .planner-task-check,#widePlannerList .planner-task-exclude{touch-action:pan-y!important}
 #widePlannerList .planner-task{max-width:100%!important;min-width:0!important;left:0!important;right:auto!important;translate:0 0!important}
}
.curriculum-line.curriculum-hanging{padding-left:min(var(--curriculum-hang,1.05em),1.32em)!important;text-indent:calc(-1 * min(var(--curriculum-hang,1.05em),1.32em))!important}
.curriculum-passage{tab-size:2!important}
.wide-curriculum-study-tools .sj-content-btn.active,.wide-curriculum-study-tools .sj-standard-blank.active{background:#303136!important;color:#fff!important;border-color:#303136!important;font-weight:750}
body.sj-content-mode .curriculum-page-dock{display:none!important}
.sj-content-root{padding:2px 0 28px;max-width:100%;overflow:hidden}
.sj-content-head{position:sticky;top:0;z-index:9;display:flex;align-items:center;gap:6px;padding:7px 4px 8px;margin-bottom:8px;background:rgba(255,255,255,.97);border-bottom:1px solid #e5e5e8}
.sj-content-head strong{flex:1;min-width:0;font-size:.94em}.sj-content-head button{border:1px solid #dddde1;background:#fff;border-radius:7px;padding:6px 8px;font-size:.68em;color:#55565b;white-space:nowrap}
.sj-content-note{padding:12px 10px;border:1px solid #e2e2e5;border-radius:8px;background:#fafafa;color:#707177;font-size:.73em;line-height:1.55}
.sj-content-note button{margin-top:8px;border:1px solid #d9d9dd;background:#fff;border-radius:7px;padding:7px 9px}
.sj-content-stack{display:flex;flex-direction:column;align-items:center;gap:0;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.sj-content-page{display:block;max-width:none;height:auto;background:#fff;border-left:1px solid #e1e1e3;border-right:1px solid #e1e1e3}
.sj-content-page:first-child{border-top:1px solid #e1e1e3;border-radius:7px 7px 0 0}.sj-content-page:last-child{border-bottom:1px solid #e1e1e3;border-radius:0 0 7px 7px}
.sj-content-loading{padding:20px 8px;text-align:center;color:#85868b;font-size:.75em}
`;
    document.head.append(s);
  }

  function curriculumOn(){const v=document.getElementById("curriculumView"),b=document.getElementById("workspaceCurriculum");return !!((v&&!v.classList.contains("hidden"))||b?.classList.contains("active"))}
  function sideCurriculumOn(){return curriculumOn()&&document.getElementById("widePlannerCurriculumTab")?.classList.contains("active")}
  function subject(){
    const sel=document.querySelector("#widePlannerList .wide-curriculum-toolbar select");
    let s=sel?.value||document.getElementById("curriculumTitle")?.textContent||"";s=String(s).trim();return ALIAS[s]||s;
  }
  function range(sub){const s=ALIAS[sub]||sub,i=ORDER.indexOf(s);if(i<0)return null;return {s,start:START[s]+9,end:i<ORDER.length-1?START[ORDER[i+1]]+8:328}}
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function setActive(el,on){if(el&&el.classList.contains("active")!==!!on)el.classList.toggle("active",!!on)}

  function lockX(){
    const inner=document.querySelector("#widePlannerSide .wide-planner-inner"),list=document.getElementById("widePlannerList");
    for(const el of [inner,list]){if(!el||el.dataset.sjXLock)return;el.dataset.sjXLock="1";el.addEventListener("scroll",()=>{if(el.scrollLeft)el.scrollLeft=0},{passive:true})}
  }

  function sourceBlankButton(){
    const toolbar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");if(!toolbar)return null;
    return [...toolbar.querySelectorAll("button")].find(b=>b.textContent.includes("빈칸 편집"))||null;
  }
  function syncSideTools(){
    lockX();if(!sideCurriculumOn())return;
    const tools=document.querySelector("#widePlannerList .wide-curriculum-study-tools");if(!tools)return;

    let cb=tools.querySelector(".sj-content-btn");
    if(!cb){cb=document.createElement("button");cb.type="button";cb.className="sj-content-btn";cb.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toggleContent()});const hint=tools.querySelector(".wide-curriculum-study-hint");tools.insertBefore(cb,hint||null)}
    const cs=subject(),contentOn=state.content&&state.subject===cs;setText(cb,contentOn?"✓ 내용체계":"내용체계");setActive(cb,contentOn);cb.disabled=!range(cs);

    const src=sourceBlankButton();let sb=tools.querySelector(".sj-standard-blank");
    if(src){
      if(!sb){sb=document.createElement("button");sb.type="button";sb.className="sj-standard-blank";sb.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();const live=sourceBlankButton();if(live)live.click()});const hint=tools.querySelector(".wide-curriculum-study-hint");tools.insertBefore(sb,hint||null)}
      setText(sb,src.textContent||"✎ 빈칸 편집");setActive(sb,src.classList.contains("active"));sb.disabled=false;
    }else sb?.remove();
  }

  function openDb(){return new Promise((res,rej)=>{const q=indexedDB.open(PDF_DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(PDF_STORE))q.result.createObjectStore(PDF_STORE)};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
  async function stored(){try{const db=await openDb();return await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,"readonly"),q=tx.objectStore(PDF_STORE).get(PDF_KEY);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)})}catch{return null}}
  async function saveBlob(blob){try{const db=await openDb();await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,"readwrite");tx.objectStore(PDF_STORE).put(blob,PDF_KEY);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}catch{}}
  async function clearBlob(){try{const db=await openDb();await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,"readwrite");tx.objectStore(PDF_STORE).delete(PDF_KEY);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}catch{}state.doc=null;state.blob=null;state.cache.clear()}
  function choose(){return new Promise(res=>{const i=document.createElement("input");i.type="file";i.accept="application/pdf,.pdf";i.style.display="none";document.body.append(i);let done=false;const finish=f=>{if(done)return;done=true;i.remove();res(f)};i.onchange=()=>finish(i.files?.[0]||null);i.addEventListener("cancel",()=>finish(null),{once:true});i.click()})}
  async function blob(force=false){
    if(state.blob&&!force)return state.blob;
    if(!force){try{const r=await fetch(PDF_SERVER,{cache:"no-store"});if(r.ok){const b=await r.blob();if(b.size>100000){state.blob=b;return b}}}catch{}const b=await stored();if(b){state.blob=b;return b}}
    const f=await choose();if(!f)return null;state.blob=f;state.doc=null;state.cache.clear();await saveBlob(f);return f;
  }
  function pdfjs(){if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);if(window.__sjPdfPromise)return window.__sjPdfPromise;window.__sjPdfPromise=new Promise((res,rej)=>{const s=document.createElement("script");s.src=PDFJS;s.onload=()=>{if(!window.pdfjsLib)return rej(new Error("PDF 도구를 불러오지 못했습니다"));window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFWORKER;res(window.pdfjsLib)};s.onerror=()=>rej(new Error("PDF 도구를 불러오지 못했습니다"));document.head.append(s)});return window.__sjPdfPromise}
  async function doc(force=false){if(state.doc&&!force)return state.doc;const b=await blob(force);if(!b)return null;const lib=await pdfjs(),buf=await b.arrayBuffer();state.doc=await lib.getDocument({data:buf}).promise;return state.doc}
  const compact=s=>String(s||"").replace(/[\s⋅·ㆍ]/g,"");
  function lines(tc){const rows=[];for(const it of tc.items||[]){const t=String(it.str||"").trim();if(!t)continue;const y=Number(it.transform?.[5]||0);let r=rows.find(x=>Math.abs(x.y-y)<2.4);if(!r){r={y,parts:[]};rows.push(r)}r.parts.push({x:Number(it.transform?.[4]||0),t})}return rows.map(r=>({y:r.y,t:r.parts.sort((a,b)=>a.x-b.x).map(x=>x.t).join(" ")})).sort((a,b)=>b.y-a.y)}
  async function span(d,sub){if(state.cache.has(sub))return state.cache.get(sub);const rg=range(sub);if(!rg)throw new Error("이 과목 범위를 찾을 수 없습니다");let sp=0,ep=0,sy=null,ey=null;for(let p=rg.start;p<=Math.min(d.numPages,rg.end);p++){const pg=await d.getPage(p),ls=lines(await pg.getTextContent());if(!sp){const l=ls.find(x=>compact(x.t).includes("가.내용체계"));if(l){sp=p;sy=l.y}}if(sp){const l=ls.find(x=>compact(x.t).includes("나.성취기준"));if(l){ep=p;ey=l.y;break}}}if(!sp)throw new Error("‘가. 내용 체계’를 찾지 못했습니다");if(!ep){ep=Math.min(d.numPages,rg.end);ey=null}const out={sp,ep,sy,ey};state.cache.set(sub,out);return out}
  async function crop(pg,opt){const scale=window.innerWidth<900?1.5:1.7,v=pg.getViewport({scale}),full=document.createElement("canvas");full.width=Math.ceil(v.width);full.height=Math.ceil(v.height);await pg.render({canvasContext:full.getContext("2d",{alpha:false}),viewport:v}).promise;const mx=Math.round(24*scale),mt=Math.round(25*scale),mb=Math.round(24*scale);let top=mt,bottom=full.height-mb;if(opt.sy!=null)top=Math.max(0,Math.round(full.height-opt.sy*scale-22*scale));if(opt.ey!=null)bottom=Math.min(full.height,Math.round(full.height-opt.ey*scale-10*scale));if(bottom<=top+20){top=mt;bottom=full.height-mb}const left=mx,w=Math.max(1,full.width-mx*2),h=Math.max(1,bottom-top),out=document.createElement("canvas");out.width=w;out.height=h;out.className="sj-content-page";out.getContext("2d",{alpha:false}).drawImage(full,left,top,w,h,0,0,w,h);full.width=1;full.height=1;return out}

  function restore(){state.content=false;state.loading=false;state.token++;document.body.classList.remove("sj-content-mode");if(typeof window.renderCurriculumCurrent==="function")window.renderCurriculumCurrent();else location.reload();setTimeout(syncSideTools,50)}
  async function showContent(sub,force=false){
    const rg=range(sub);if(!rg)return;const passage=document.getElementById("curriculumPassage");if(!passage)return;
    const token=++state.token;state.content=true;state.subject=rg.s;state.loading=true;document.body.classList.add("sj-content-mode");passage.innerHTML="";
    const root=document.createElement("div");root.className="sj-content-root";const head=document.createElement("div");head.className="sj-content-head";const title=document.createElement("strong");title.textContent=`${rg.s} · 내용 체계`;const change=document.createElement("button");change.type="button";change.textContent="PDF 바꾸기";change.onclick=async()=>{await clearBlob();showContent(rg.s,true)};const close=document.createElement("button");close.type="button";close.textContent="원문";close.onclick=restore;head.append(title,change,close);root.append(head);const wait=document.createElement("div");wait.className="sj-content-loading";wait.textContent="내용 체계를 불러오는 중…";root.append(wait);passage.append(root);syncSideTools();
    try{const d=await doc(force);if(token!==state.token)return;if(!d){wait.className="sj-content-note";wait.textContent="처음 한 번만 미니북 PDF를 선택해 주세요.";const b=document.createElement("button");b.type="button";b.textContent="미니북 PDF 선택";b.onclick=()=>showContent(rg.s,true);wait.append(document.createElement("br"),b);state.loading=false;return}const x=await span(d,rg.s);if(token!==state.token)return;const stack=document.createElement("div");stack.className="sj-content-stack";wait.replaceWith(stack);for(let p=x.sp;p<=x.ep;p++){if(token!==state.token)return;const pg=await d.getPage(p),cv=await crop(pg,{sy:p===x.sp?x.sy:null,ey:p===x.ep?x.ey:null});const avail=Math.max(280,passage.clientWidth-12);cv.style.width=`${avail}px`;stack.append(cv)}state.loading=false}catch(err){if(token!==state.token)return;wait.className="sj-content-note";wait.textContent=`내용 체계를 표시하지 못했습니다. ${err?.message||"PDF를 다시 선택해 주세요."}`;state.loading=false}
  }
  function toggleContent(){const s=subject();if(state.content&&state.subject===s)restore();else showContent(s)}

  let raf=0;function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(syncSideTools)}
  function install(){
    style();syncSideTools();
    const side=document.getElementById("widePlannerSide"),cv=document.getElementById("curriculumView");
    const mo=new MutationObserver(schedule);if(side)mo.observe(side,{subtree:true,childList:true});if(cv)mo.observe(cv,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
    window.addEventListener("resize",schedule,{passive:true});
    document.addEventListener("click",e=>{if(e.target.closest?.("#widePlannerCurriculumTab,#workspaceCurriculum,.wide-curriculum-study-tools button"))setTimeout(schedule,0)},true);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
