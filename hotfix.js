(()=>{
  "use strict";
  const HOTFIX="2026-09-13-side-tools-v2";
  if(window.__studyJewHotfix===HOTFIX)return;
  window.__studyJewHotfix=HOTFIX;

  function installStyle(){
    if(document.getElementById("studyJewHotfixStyle"))return;
    const style=document.createElement("style");
    style.id="studyJewHotfixStyle";
    style.textContent=`
/* 1) 오른쪽 미션: iPad에서 세로로 문지를 때 좌우로 출렁이지 않게 고정 */
@media (min-width:700px) and (min-height:600px){
  #widePlannerSide,
  #widePlannerSide .wide-planner-inner,
  #widePlannerList{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    overflow-x:hidden!important;
    overscroll-behavior-x:none!important;
    scroll-snap-type:none!important;
  }
  #widePlannerSide .wide-planner-inner,
  #widePlannerList,
  #widePlannerList .planner-task,
  #widePlannerList .planner-task-check,
  #widePlannerList .planner-task-link,
  #widePlannerList .planner-task-exclude{
    touch-action:pan-y!important;
  }
  #widePlannerList .planner-task{
    left:0!important;
    right:auto!important;
    translate:0 0!important;
    transform:none!important;
    max-width:100%!important;
    min-width:0!important;
  }

  /* 2) '내 빈칸' 상세 편집도 본문 밑이 아니라 오른쪽 교육과정 탭에 */
  #widePlannerList > #curriculumEditPanel{
    display:block;
    margin:7px 1px 9px!important;
    padding:7px!important;
    border:1px solid #e1e1e4!important;
    border-radius:8px!important;
    background:#fafafa!important;
    max-width:100%!important;
    min-width:0!important;
    overflow:hidden!important;
  }
  #widePlannerList > #curriculumEditPanel.hidden{display:none!important}
  #widePlannerList > #curriculumEditPanel .curriculum-edit-head{margin:0 0 5px!important;gap:4px!important}
  #widePlannerList > #curriculumEditPanel .curriculum-edit-head strong{font-size:10.5px!important}
  #widePlannerList > #curriculumEditPanel .curriculum-edit-head span{font-size:8.5px!important;line-height:1.3!important}
  #widePlannerList > #curriculumEditPanel button{font-size:9.3px!important;min-height:29px!important;padding:5px 6px!important}
  #widePlannerList > #curriculumEditPanel .curriculum-selection-row{gap:4px!important;grid-template-columns:minmax(0,1fr) auto!important}
  #widePlannerList > #curriculumEditPanel .curriculum-selection-label{font-size:8.6px!important;line-height:1.35!important;min-width:0!important}
  #widePlannerList > #curriculumEditPanel .curriculum-page-actions{gap:4px!important}
}

/* 3) 글머리표 내어쓰기: 원문 구조는 살리되 너무 깊게 밀리지 않게 상한을 둔다. */
.curriculum-line.curriculum-hanging{
  padding-left:min(var(--curriculum-hang,1.25em),1.72em)!important;
  text-indent:calc(-1 * min(var(--curriculum-hang,1.25em),1.72em))!important;
}
.curriculum-passage{tab-size:2!important}

/* 오른쪽에 상세 빈칸 패널이 뜰 때 본문 아래 빈 자리를 만들지 않는다. */
@media (min-width:700px) and (min-height:600px){
  #curriculumView > #curriculumEditPanel{margin:0!important;padding:0!important;border:0!important}
}
`;
    document.head.append(style);
  }

  let editPanel=null,editMarker=null;
  function captureEditPanel(){
    const panel=document.getElementById("curriculumEditPanel");
    if(!panel)return null;
    if(editPanel!==panel){
      editPanel=panel;
      editMarker=document.createComment("curriculum-edit-panel-home");
      panel.parentNode?.insertBefore(editMarker,panel);
    }
    return panel;
  }
  function restoreEditPanel(){
    const panel=captureEditPanel();
    if(!panel||!editMarker?.parentNode)return;
    if(panel.parentNode!==editMarker.parentNode)editMarker.parentNode.insertBefore(panel,editMarker.nextSibling);
  }
  function isWideCurriculumTab(){
    const wide=window.matchMedia?.("(min-width:700px) and (min-height:600px)")?.matches;
    const side=document.getElementById("widePlannerSide");
    const tab=document.getElementById("widePlannerCurriculumTab");
    const workspace=(window.app?.ui?.workspace||"memory");
    return !!(wide&&side?.classList.contains("eligible")&&workspace==="curriculum"&&tab?.classList.contains("active"));
  }
  function dockEditPanel(){
    const panel=captureEditPanel();
    if(!panel)return;
    if(!isWideCurriculumTab()){
      restoreEditPanel();
      return;
    }
    const list=document.getElementById("widePlannerList");
    if(!list)return;
    const head=list.querySelector(".wide-curriculum-head");
    if(panel.parentNode!==list || panel.previousElementSibling!==head){
      if(head)head.insertAdjacentElement("afterend",panel);
      else list.prepend(panel);
    }
  }

  function lockPlannerHorizontalScroll(){
    const side=document.getElementById("widePlannerSide");
    const inner=side?.querySelector(".wide-planner-inner");
    const list=document.getElementById("widePlannerList");
    for(const el of [side,inner,list]){
      if(!el||el.dataset.studyJewXLock)return;
      el.dataset.studyJewXLock="1";
      el.addEventListener("scroll",()=>{if(el.scrollLeft!==0)el.scrollLeft=0},{passive:true});
    }
    if(list&&!list.dataset.studyJewGestureLock){
      list.dataset.studyJewGestureLock="1";
      let active=false,startX=0,startY=0;
      list.addEventListener("pointerdown",e=>{
        active=!!e.target.closest?.(".planner-task");
        if(active){startX=e.clientX;startY=e.clientY}
      },{passive:true});
      list.addEventListener("pointermove",e=>{
        if(!active)return;
        const dx=e.clientX-startX,dy=e.clientY-startY;
        if(Math.abs(dx)>Math.abs(dy)){
          if(inner&&inner.scrollLeft!==0)inner.scrollLeft=0;
          if(list.scrollLeft!==0)list.scrollLeft=0;
        }
      },{passive:true});
      const done=()=>{active=false;if(inner&&inner.scrollLeft!==0)inner.scrollLeft=0;if(list.scrollLeft!==0)list.scrollLeft=0};
      list.addEventListener("pointerup",done,{passive:true});
      list.addEventListener("pointercancel",done,{passive:true});
    }
  }

  /* 성취기준 모아보기에서도 빈칸 편집 버튼을 오른쪽 탭에서 바로 쓸 수 있게 보조 버튼을 붙인다. */
  function ensureStandardsSideBlankButton(){
    if(!isWideCurriculumTab())return;
    const study=document.querySelector("#widePlannerList .wide-curriculum-study-tools");
    if(!study)return;
    const sourceToolbar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");
    const sourceBlank=sourceToolbar?.querySelector("button:nth-of-type(3)");
    const isStandards=!!sourceToolbar;
    let btn=study.querySelector(".study-jew-standards-blank-side");
    if(!isStandards){btn?.remove();return}
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";
      btn.className="study-jew-standards-blank-side";
      const hint=study.querySelector(".wide-curriculum-study-hint");
      study.insertBefore(btn,hint||null);
    }
    btn.textContent=sourceBlank?.textContent||"✎ 빈칸 편집";
    btn.classList.toggle("active",!!sourceBlank?.classList.contains("active"));
    btn.onclick=()=>{const live=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar button:nth-of-type(3)");live?.click();requestAnimationFrame(sync)};
  }

  function wrapGlobal(name,before,after){
    const old=window[name];
    if(typeof old!=="function"||old.__studyJewHotfixWrapped)return;
    const wrapped=function(...args){
      try{before?.()}catch(e){console.warn("hotfix before",name,e)}
      const out=old.apply(this,args);
      try{after?.()}catch(e){console.warn("hotfix after",name,e)}
      return out;
    };
    wrapped.__studyJewHotfixWrapped=true;
    window[name]=wrapped;
  }

  let raf=0;
  function sync(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      lockPlannerHorizontalScroll();
      dockEditPanel();
      ensureStandardsSideBlankButton();
    });
  }

  function install(){
    installStyle();
    captureEditPanel();
    wrapGlobal("renderWidePlannerSide",restoreEditPanel,sync);
    wrapGlobal("renderCurriculumEdit",restoreEditPanel,sync);
    wrapGlobal("renderCurriculumCurrent",restoreEditPanel,sync);
    wrapGlobal("renderCurriculumStandards",restoreEditPanel,sync);
    wrapGlobal("renderMode",restoreEditPanel,sync);
    sync();
    const mo=new MutationObserver(sync);
    mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    window.addEventListener("resize",sync,{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
