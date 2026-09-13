(()=>{
  "use strict";
  const HOTFIX="2026-09-13-side-tools-v3";
  if(window.__studyJewHotfix===HOTFIX)return;
  window.__studyJewHotfix=HOTFIX;

  const CONTENT_PDF_DB="study-jew-curriculum-pdf";
  const CONTENT_PDF_STORE="files";
  const CONTENT_PDF_KEY="curriculum-minibook";
  const CONTENT_PDF_SERVER="./curriculum-minibook.pdf";
  const PDFJS_SRC="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  /* 미니북 목차의 인쇄 쪽수. 실제 PDF 파일 쪽수는 표지/차례 등 9쪽을 더한다. */
  const CONTENT_START_PRINTED={
    "총론":3,"창체":20,"바른 생활":30,"슬기로운 생활":42,"즐거운 생활":54,
    "국어":66,"사회":106,"도덕":139,"수학":152,"과학":184,"실과":221,
    "체육":241,"음악":268,"미술":285,"영어":302
  };
  const CONTENT_ORDER=Object.keys(CONTENT_START_PRINTED);
  const CONTENT_ALIASES={
    "창의적 체험활동":"창체","창의적체험활동":"창체","바른생활":"바른 생활",
    "슬기로운생활":"슬기로운 생활","즐거운생활":"즐거운 생활","실과(기술가정)정보":"실과"
  };

  const contentState={active:false,subject:"",doc:null,blob:null,loading:false,token:0,spanCache:new Map()};

  function installStyle(){
    const old=document.getElementById("studyJewHotfixStyle");if(old)old.remove();
    const style=document.createElement("style");
    style.id="studyJewHotfixStyle";
    style.textContent=`
/* 오른쪽 보조 패널: 패널 자신은 기존 고정 폭 유지. 내부만 100%로 잡는다. */
@media (min-width:700px) and (min-height:600px){
  #widePlannerSide{
    width:clamp(230px,30vw,340px)!important;
    max-width:340px!important;
    min-width:230px!important;
    overflow:hidden!important;
    overscroll-behavior-x:none!important;
  }
  #widePlannerSide .wide-planner-inner,#widePlannerList{
    width:100%!important;max-width:100%!important;min-width:0!important;
    overflow-x:hidden!important;overscroll-behavior-x:none!important;scroll-snap-type:none!important;
  }
  #widePlannerSide .wide-planner-inner,#widePlannerList,
  #widePlannerList .planner-task,#widePlannerList .planner-task-check,
  #widePlannerList .planner-task-link,#widePlannerList .planner-task-exclude{touch-action:pan-y!important}
  #widePlannerList .planner-task{
    left:0!important;right:auto!important;translate:0 0!important;transform:none!important;
    max-width:100%!important;min-width:0!important;
  }

  /* '내 빈칸/쪽 편집'은 기본 접힘. 오른쪽 목차 전체를 가리지 않는다. */
  .study-jew-side-edit-details{margin:6px 1px 8px;border:1px solid #e2e2e5;border-radius:8px;background:#fafafa;overflow:hidden}
  .study-jew-side-edit-details>summary{list-style:none;display:flex;align-items:center;gap:5px;padding:7px 8px;font-size:9.8px;font-weight:700;color:#55565b;cursor:pointer;user-select:none}
  .study-jew-side-edit-details>summary::-webkit-details-marker{display:none}
  .study-jew-side-edit-details>summary::after{content:"⌄";margin-left:auto;color:#999;font-size:11px}
  .study-jew-side-edit-details[open]>summary::after{content:"⌃"}
  .study-jew-side-edit-details>summary span{font-weight:500;color:#96979c;font-size:8.5px}
  .study-jew-side-edit-details>#curriculumEditPanel{
    display:block!important;margin:0!important;padding:7px!important;border:0!important;border-top:1px solid #e8e8eb!important;
    border-radius:0!important;background:#fff!important;max-width:100%!important;min-width:0!important;max-height:38vh!important;overflow:auto!important;
  }
  .study-jew-side-edit-details>#curriculumEditPanel.hidden{display:none!important}
  .study-jew-side-edit-details>#curriculumEditPanel .curriculum-edit-head{margin:0 0 5px!important;gap:4px!important}
  .study-jew-side-edit-details>#curriculumEditPanel .curriculum-edit-head strong{font-size:10.2px!important}
  .study-jew-side-edit-details>#curriculumEditPanel .curriculum-edit-head span{font-size:8.3px!important;line-height:1.3!important}
  .study-jew-side-edit-details>#curriculumEditPanel button{font-size:9.1px!important;min-height:28px!important;padding:5px 6px!important}
  .study-jew-side-edit-details>#curriculumEditPanel .curriculum-selection-row{gap:4px!important;grid-template-columns:minmax(0,1fr) auto!important}
  .study-jew-side-edit-details>#curriculumEditPanel .curriculum-selection-label{font-size:8.4px!important;line-height:1.35!important;min-width:0!important}
  #curriculumView>#curriculumEditPanel{margin:0!important;padding:0!important;border:0!important}
}

/* 내어쓰기 완화: 점/번호 뒤 둘째 줄만 살짝 맞춘다. */
.curriculum-line.curriculum-hanging{
  padding-left:min(var(--curriculum-hang,1.12em),1.42em)!important;
  text-indent:calc(-1 * min(var(--curriculum-hang,1.12em),1.42em))!important;
}
.curriculum-passage{tab-size:2!important}

/* 미니북 기반 내용 체계 보기 */
body.curriculum-content-table-mode .curriculum-page-dock{display:none!important}
.curriculum-content-table-view{padding:2px 0 26px;max-width:100%;overflow:hidden}
.curriculum-content-table-head{position:sticky;top:0;z-index:4;display:flex;align-items:center;gap:6px;padding:7px 4px;margin-bottom:8px;background:rgba(255,255,255,.96);border-bottom:1px solid #e5e5e8;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.curriculum-content-table-head strong{flex:1;min-width:0;font-size:.94em}
.curriculum-content-table-head button{border:1px solid #dddde1;background:#fff;border-radius:7px;padding:6px 8px;font-size:.68em;color:#55565b;white-space:nowrap}
.curriculum-content-table-note{padding:10px 8px;border:1px solid #e3e3e6;border-radius:8px;background:#fafafa;color:#77787d;font-size:.72em;line-height:1.55}
.curriculum-content-table-stack{display:flex;flex-direction:column;align-items:center;gap:0;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.curriculum-content-table-page{display:block;max-width:none;height:auto;background:#fff;border-left:1px solid #e0e0e3;border-right:1px solid #e0e0e3;box-shadow:none}
.curriculum-content-table-page:first-child{border-top:1px solid #e0e0e3;border-radius:7px 7px 0 0}
.curriculum-content-table-page:last-child{border-bottom:1px solid #e0e0e3;border-radius:0 0 7px 7px}
.curriculum-content-table-progress{padding:18px 8px;text-align:center;color:#85868b;font-size:.76em}
.wide-curriculum-study-tools .study-jew-content-table-side.active{background:#303136!important;color:#fff!important;border-color:#303136!important;font-weight:750}
@media(max-width:640px){
  .curriculum-content-table-head{top:0;padding:6px 1px}
  .curriculum-content-table-head button{padding:6px;font-size:.66em}
}
`;
    document.head.append(style);
  }

  let editPanel=null,editMarker=null,editDetails=null;
  function captureEditPanel(){
    const panel=document.getElementById("curriculumEditPanel");
    if(!panel)return null;
    if(editPanel!==panel){
      editPanel=panel;editMarker=document.createComment("curriculum-edit-panel-home");
      panel.parentNode?.insertBefore(editMarker,panel);
    }
    return panel;
  }
  function restoreEditPanel(){
    const panel=captureEditPanel();if(!panel||!editMarker?.parentNode)return;
    if(panel.parentNode!==editMarker.parentNode)editMarker.parentNode.insertBefore(panel,editMarker.nextSibling);
    editDetails?.remove();editDetails=null;
  }
  function isWideCurriculumTab(){
    const wide=window.matchMedia?.("(min-width:700px) and (min-height:600px)")?.matches;
    const side=document.getElementById("widePlannerSide"),tab=document.getElementById("widePlannerCurriculumTab");
    const workspace=(window.app?.ui?.workspace||"memory");
    return !!(wide&&side?.classList.contains("eligible")&&workspace==="curriculum"&&tab?.classList.contains("active"));
  }
  function dockEditPanel(){
    const panel=captureEditPanel();if(!panel)return;
    if(!isWideCurriculumTab()||panel.classList.contains("hidden")){restoreEditPanel();return}
    const list=document.getElementById("widePlannerList"),head=list?.querySelector(".wide-curriculum-head");if(!list)return;
    if(!editDetails||!editDetails.isConnected){
      editDetails=document.createElement("details");editDetails.className="study-jew-side-edit-details";
      editDetails.open=localStorage.getItem("study-jew-side-edit-open")==="1";
      const summary=document.createElement("summary");summary.innerHTML=`내 빈칸 · 쪽 편집 <span>필요할 때 펼치기</span>`;editDetails.append(summary);
      editDetails.addEventListener("toggle",()=>localStorage.setItem("study-jew-side-edit-open",editDetails.open?"1":"0"));
    }
    if(editDetails.parentNode!==list){if(head)head.insertAdjacentElement("afterend",editDetails);else list.prepend(editDetails)}
    if(panel.parentNode!==editDetails)editDetails.append(panel);
  }

  function lockPlannerHorizontalScroll(){
    const side=document.getElementById("widePlannerSide"),inner=side?.querySelector(".wide-planner-inner"),list=document.getElementById("widePlannerList");
    for(const el of [inner,list]){
      if(!el||el.dataset.studyJewXLock)return;
      el.dataset.studyJewXLock="1";el.addEventListener("scroll",()=>{if(el.scrollLeft!==0)el.scrollLeft=0},{passive:true});
    }
    if(list&&!list.dataset.studyJewGestureLock){
      list.dataset.studyJewGestureLock="1";let active=false,startX=0,startY=0;
      list.addEventListener("pointerdown",e=>{active=!!e.target.closest?.(".planner-task");if(active){startX=e.clientX;startY=e.clientY}},{passive:true});
      list.addEventListener("pointermove",e=>{if(!active)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>Math.abs(dy)){if(inner&&inner.scrollLeft!==0)inner.scrollLeft=0;if(list.scrollLeft!==0)list.scrollLeft=0}},{passive:true});
      const done=()=>{active=false;if(inner&&inner.scrollLeft!==0)inner.scrollLeft=0;if(list.scrollLeft!==0)list.scrollLeft=0};
      list.addEventListener("pointerup",done,{passive:true});list.addEventListener("pointercancel",done,{passive:true});
    }
  }

  function normalizeSubject(raw){const s=String(raw||"").trim();return CONTENT_ALIASES[s]||s}
  function contentSubject(){
    try{return normalizeSubject(window.curriculumSideOutlineSubject?.()||window.curriculumCurrentItem?.()?.s||window.curriculumScopeName?.()||"")}catch{return ""}
  }
  function contentRange(subject){
    const s=normalizeSubject(subject),i=CONTENT_ORDER.indexOf(s);if(i<0)return null;
    const start=CONTENT_START_PRINTED[s]+9;
    const end=i<CONTENT_ORDER.length-1?CONTENT_START_PRINTED[CONTENT_ORDER[i+1]]+8:328;
    return {start,end,subject:s};
  }

  function openPdfDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(CONTENT_PDF_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(CONTENT_PDF_STORE))req.result.createObjectStore(CONTENT_PDF_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
  async function getStoredPdf(){try{const db=await openPdfDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(CONTENT_PDF_STORE,"readonly"),req=tx.objectStore(CONTENT_PDF_STORE).get(CONTENT_PDF_KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}catch{return null}}
  async function putStoredPdf(blob){try{const db=await openPdfDb();await new Promise((resolve,reject)=>{const tx=db.transaction(CONTENT_PDF_STORE,"readwrite");tx.objectStore(CONTENT_PDF_STORE).put(blob,CONTENT_PDF_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});return true}catch{return false}}
  async function clearStoredPdf(){try{const db=await openPdfDb();await new Promise((resolve,reject)=>{const tx=db.transaction(CONTENT_PDF_STORE,"readwrite");tx.objectStore(CONTENT_PDF_STORE).delete(CONTENT_PDF_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch{}contentState.doc=null;contentState.blob=null;contentState.spanCache.clear()}
  function choosePdf(){return new Promise(resolve=>{const input=document.createElement("input");input.type="file";input.accept="application/pdf,.pdf";input.style.display="none";document.body.append(input);input.onchange=()=>{const f=input.files?.[0]||null;input.remove();resolve(f)};input.addEventListener("cancel",()=>{input.remove();resolve(null)},{once:true});input.click()})}
  async function serverPdf(){try{const r=await fetch(CONTENT_PDF_SERVER,{cache:"no-store"});if(!r.ok)return null;const b=await r.blob();return b.type.includes("pdf")||b.size>100000?b:null}catch{return null}}
  async function ensurePdfBlob(forceChoose=false){
    if(contentState.blob&&!forceChoose)return contentState.blob;
    if(!forceChoose){const hosted=await serverPdf();if(hosted){contentState.blob=hosted;return hosted}const stored=await getStoredPdf();if(stored){contentState.blob=stored;return stored}}
    const file=await choosePdf();if(!file)return null;contentState.blob=file;await putStoredPdf(file);contentState.doc=null;contentState.spanCache.clear();return file;
  }
  function loadPdfJs(){
    if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
    if(window.__studyJewPdfJsPromise)return window.__studyJewPdfJsPromise;
    window.__studyJewPdfJsPromise=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=PDFJS_SRC;s.async=true;s.onload=()=>{if(!window.pdfjsLib)return reject(new Error("pdf.js unavailable"));window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;resolve(window.pdfjsLib)};s.onerror=()=>reject(new Error("pdf.js load failed"));document.head.append(s)});
    return window.__studyJewPdfJsPromise;
  }
  async function ensurePdfDoc(forceChoose=false){
    if(contentState.doc&&!forceChoose)return contentState.doc;
    const blob=await ensurePdfBlob(forceChoose);if(!blob)return null;
    const lib=await loadPdfJs(),buf=await blob.arrayBuffer();contentState.doc=await lib.getDocument({data:buf}).promise;return contentState.doc;
  }

  function textLines(tc){
    const rows=[];
    for(const it of tc.items||[]){const str=String(it.str||"").trim();if(!str)continue;const y=Number(it.transform?.[5]||0);let row=rows.find(r=>Math.abs(r.y-y)<2.4);if(!row){row={y,parts:[]};rows.push(row)}row.parts.push({x:Number(it.transform?.[4]||0),str})}
    return rows.map(r=>({y:r.y,text:r.parts.sort((a,b)=>a.x-b.x).map(x=>x.str).join(" ")})).sort((a,b)=>b.y-a.y);
  }
  const squeeze=s=>String(s||"").replace(/[\s⋅·ㆍ]/g,"");
  async function findContentSpan(doc,subject){
    const key=normalizeSubject(subject);if(contentState.spanCache.has(key))return contentState.spanCache.get(key);
    const range=contentRange(key);if(!range)throw new Error("이 과목의 미니북 위치를 찾을 수 없습니다.");
    const max=Math.min(doc.numPages,range.end);let startPage=0,endPage=0,startY=null,endY=null;
    for(let p=range.start;p<=max;p++){
      const page=await doc.getPage(p),tc=await page.getTextContent(),lines=textLines(tc);
      if(!startPage){const line=lines.find(x=>squeeze(x.text).includes("가.내용체계"));if(line){startPage=p;startY=line.y}}
      if(startPage){const line=lines.find(x=>squeeze(x.text).includes("나.성취기준"));if(line){endPage=p;endY=line.y;break}}
    }
    if(!startPage)throw new Error("미니북에서 ‘가. 내용 체계’를 찾지 못했습니다.");
    if(!endPage){endPage=max;endY=null}
    const span={startPage,endPage,startY,endY,subject:key};contentState.spanCache.set(key,span);return span;
  }

  async function renderCrop(page,opts){
    const scale=window.innerWidth<900?1.55:1.75,viewport=page.getViewport({scale});
    const full=document.createElement("canvas");full.width=Math.ceil(viewport.width);full.height=Math.ceil(viewport.height);
    await page.render({canvasContext:full.getContext("2d",{alpha:false}),viewport}).promise;
    const marginX=Math.round(24*scale),marginTop=Math.round(26*scale),marginBottom=Math.round(25*scale);
    let top=marginTop,bottom=full.height-marginBottom;
    if(opts.startY!=null){const y=full.height-opts.startY*scale;top=Math.max(0,Math.round(y-24*scale))}
    if(opts.endY!=null){const y=full.height-opts.endY*scale;bottom=Math.min(full.height,Math.round(y-12*scale))}
    if(bottom<=top+20){top=marginTop;bottom=full.height-marginBottom}
    const left=marginX,right=full.width-marginX,w=Math.max(1,right-left),h=Math.max(1,bottom-top);
    const out=document.createElement("canvas");out.width=w;out.height=h;out.className="curriculum-content-table-page";
    out.getContext("2d",{alpha:false}).drawImage(full,left,top,w,h,0,0,w,h);full.width=1;full.height=1;return out;
  }

  function contentHead(root,subject){
    const head=document.createElement("div");head.className="curriculum-content-table-head";
    const title=document.createElement("strong");title.textContent=`${subject} · 내용 체계`;
    const change=document.createElement("button");change.type="button";change.textContent="PDF 바꾸기";change.onclick=async()=>{await clearStoredPdf();const f=await ensurePdfBlob(true);if(f)renderContentTable(subject,true)};
    const close=document.createElement("button");close.type="button";close.textContent="원문";close.onclick=exitContentTable;
    head.append(title,change,close);root.append(head);
  }
  async function renderContentTable(subject,force=false){
    const s=normalizeSubject(subject);if(!contentRange(s)){try{window.toast?.("이 과목은 내용 체계 이미지 범위를 아직 잡지 못했습니다") }catch{};return}
    const passage=document.getElementById("curriculumPassage");if(!passage)return;
    const token=++contentState.token;contentState.active=true;contentState.subject=s;contentState.loading=true;document.body.classList.add("curriculum-content-table-mode");
    passage.innerHTML="";const root=document.createElement("div");root.className="curriculum-content-table-view";contentHead(root,s);const progress=document.createElement("div");progress.className="curriculum-content-table-progress";progress.textContent="미니북에서 내용 체계를 불러오는 중…";root.append(progress);passage.append(root);ensureContentButton();
    try{
      const doc=await ensurePdfDoc(force);if(!doc){progress.className="curriculum-content-table-note";progress.innerHTML="내용 체계 표는 올려주신 미니북 PDF를 그대로 렌더링합니다.<br>이 기기에서 처음 한 번만 미니북 PDF를 선택해 주세요.";const b=document.createElement("button");b.type="button";b.textContent="미니북 PDF 선택";b.style.cssText="margin-top:8px;border:1px solid #d9d9dd;background:#fff;border-radius:7px;padding:7px 9px";b.onclick=async()=>{const f=await ensurePdfBlob(true);if(f)renderContentTable(s,true)};progress.append(document.createElement("br"),b);return}
      const span=await findContentSpan(doc,s);if(token!==contentState.token)return;
      const stack=document.createElement("div");stack.className="curriculum-content-table-stack";progress.replaceWith(stack);
      for(let p=span.startPage;p<=span.endPage;p++){
        if(token!==contentState.token)return;
        const page=await doc.getPage(p),canvas=await renderCrop(page,{startY:p===span.startPage?span.startY:null,endY:p===span.endPage?span.endY:null});
        canvas.title=`${s} 내용 체계 · 미니북 PDF ${p}쪽`;stack.append(canvas);
        const avail=Math.max(260,passage.clientWidth-12),cssW=Math.min(avail,canvas.width/(window.devicePixelRatio||1)*1.55);canvas.style.width=`${Math.max(avail,cssW)}px`;
      }
      contentState.loading=false;
    }catch(err){
      console.warn("content table viewer",err);contentState.loading=false;if(token!==contentState.token)return;
      progress.className="curriculum-content-table-note";progress.textContent=`내용 체계를 표시하지 못했습니다. ${err?.message||"PDF를 다시 연결해 주세요."}`;
    }
  }
  function exitContentTable(){
    if(!contentState.active)return;contentState.active=false;contentState.loading=false;contentState.token++;document.body.classList.remove("curriculum-content-table-mode");
    try{window.renderCurriculumCurrent?.();window.renderWidePlannerSide?.()}catch(e){console.warn(e)}
  }

  function ensureContentButton(){
    if(!isWideCurriculumTab())return;
    const study=document.querySelector("#widePlannerList .wide-curriculum-study-tools");if(!study)return;
    let btn=study.querySelector(".study-jew-content-table-side");if(!btn){btn=document.createElement("button");btn.type="button";btn.className="study-jew-content-table-side";const hint=study.querySelector(".wide-curriculum-study-hint");study.insertBefore(btn,hint||null)}
    const subject=contentSubject();btn.textContent=contentState.active&&normalizeSubject(contentState.subject)===subject?"✓ 내용체계":"내용체계";btn.classList.toggle("active",contentState.active&&normalizeSubject(contentState.subject)===subject);
    btn.onclick=()=>{if(contentState.active&&normalizeSubject(contentState.subject)===contentSubject())exitContentTable();else renderContentTable(contentSubject())};
  }

  function ensureStandardsSideBlankButton(){
    if(!isWideCurriculumTab())return;
    const study=document.querySelector("#widePlannerList .wide-curriculum-study-tools");if(!study)return;
    const sourceToolbar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar"),sourceBlank=sourceToolbar?.querySelector("button:nth-of-type(3)"),isStandards=!!sourceToolbar;
    let btn=study.querySelector(".study-jew-standards-blank-side");if(!isStandards){btn?.remove();return}
    if(!btn){btn=document.createElement("button");btn.type="button";btn.className="study-jew-standards-blank-side";const hint=study.querySelector(".wide-curriculum-study-hint");study.insertBefore(btn,hint||null)}
    btn.textContent=sourceBlank?.textContent||"✎ 빈칸 편집";btn.classList.toggle("active",!!sourceBlank?.classList.contains("active"));btn.onclick=()=>{document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar button:nth-of-type(3)")?.click();requestAnimationFrame(sync)};
  }

  function wrapGlobal(name,before,after){
    const old=window[name];if(typeof old!=="function"||old.__studyJewHotfixWrapped)return;
    const wrapped=function(...args){try{before?.()}catch(e){console.warn("hotfix before",name,e)}const out=old.apply(this,args);try{after?.()}catch(e){console.warn("hotfix after",name,e)}return out};wrapped.__studyJewHotfixWrapped=true;window[name]=wrapped;
  }

  let raf=0;
  function sync(){
    cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
      lockPlannerHorizontalScroll();dockEditPanel();ensureStandardsSideBlankButton();ensureContentButton();
      if(contentState.active){const s=contentSubject();if(s&&normalizeSubject(contentState.subject)!==s&&!contentState.loading)renderContentTable(s)}
    });
  }
  function afterCurriculumRender(){
    sync();if(contentState.active&&!document.querySelector("#curriculumPassage .curriculum-content-table-view"))renderContentTable(contentState.subject);
  }

  function install(){
    installStyle();captureEditPanel();
    wrapGlobal("renderWidePlannerSide",restoreEditPanel,sync);
    wrapGlobal("renderCurriculumEdit",restoreEditPanel,sync);
    wrapGlobal("renderCurriculumCurrent",restoreEditPanel,afterCurriculumRender);
    wrapGlobal("renderCurriculumStandards",restoreEditPanel,afterCurriculumRender);
    wrapGlobal("renderMode",restoreEditPanel,sync);
    sync();const mo=new MutationObserver(sync);mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});window.addEventListener("resize",sync,{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
