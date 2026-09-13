(()=>{
  "use strict";
  const HOTFIX="2026-09-13-side-tools-v1";
  if(window.__studyJewHotfix===HOTFIX)return;
  window.__studyJewHotfix=HOTFIX;

  function installStyle(){
    if(document.getElementById("studyJewHotfixStyle"))return;
    const style=document.createElement("style");
    style.id="studyJewHotfixStyle";
    style.textContent=`
/* 오른쪽 미션 패널: 세로 스크롤만 허용해서 드래그/스크롤 때 좌우 출렁임 제거 */
@media (min-width:700px) and (min-height:600px){
  #widePlannerSide,
  #widePlannerSide .wide-planner-inner,
  #widePlannerList{
    max-width:100%!important;
    overflow-x:hidden!important;
    overscroll-behavior-x:none!important;
  }
  #widePlannerSide .wide-planner-inner,
  #widePlannerList,
  #widePlannerList .planner-task,
  #widePlannerList .planner-task-link{
    touch-action:pan-y!important;
  }
  #widePlannerList .planner-task{
    left:0!important;
    right:auto!important;
    translate:0 0!important;
    max-width:100%!important;
  }

  /* 패드에서는 내 빈칸/쪽 편집 패널을 본문 아래가 아니라 오른쪽 교육과정 탭 안에 둔다. */
  #widePlannerList > #curriculumEditPanel{
    display:block;
    margin:7px 0 9px!important;
    padding:7px!important;
    border:1px solid #e1e1e4!important;
    border-radius:8px!important;
    background:#fafafa!important;
    max-width:100%!important;
    overflow:hidden!important;
  }
  #widePlannerList > #curriculumEditPanel.hidden{display:none!important}
  #widePlannerList > #curriculumEditPanel .curriculum-edit-head{
    margin:0 0 5px!important;
  }
  #widePlannerList > #curriculumEditPanel .curriculum-edit-head strong{font-size:10.5px!important}
  #widePlannerList > #curriculumEditPanel .curriculum-edit-head span{font-size:8.5px!important}
  #widePlannerList > #curriculumEditPanel button{font-size:9.5px!important;min-height:30px!important}
  #widePlannerList > #curriculumEditPanel .curriculum-selection-row{gap:4px!important}
  #widePlannerList > #curriculumEditPanel .curriculum-selection-label{font-size:8.8px!important;line-height:1.35!important}
}

/* 글머리표 내어쓰기: 이전 값이 4~5em까지 벌어지던 것을 책 본문 수준으로 완화 */
.curriculum-line.curriculum-hanging{
  padding-left:1.32em!important;
  text-indent:-1.32em!important;
}
/* 제목/성취기준처럼 번호가 길어도 과도하게 오른쪽으로 밀리지 않게 */
.curriculum-passage{tab-size:2!important}
`;
    document.head.append(style);
  }

  let editPanel=null,editMarker=null,originalParent=null;
  function captureEditPanel(){
    const panel=document.getElementById("curriculumEditPanel");
    if(!panel)return null;
    if(editPanel!==panel){
      editPanel=panel;
      originalParent=panel.parentNode;
      editMarker=document.createComment("curriculum-edit-panel-home");
      originalParent?.insertBefore(editMarker,panel);
    }
    return panel;
  }
  function restoreEditPanel(){
    const panel=captureEditPanel();
    if(!panel||!editMarker?.parentNode)return;
    if(panel.parentNode!==editMarker.parentNode)editMarker.parentNode.insertBefore(panel,editMarker.nextSibling);
  }
  function shouldDockEditPanel(){
    const wide=window.matchMedia?.("(min-width:700px) and (min-height:600px)")?.matches;
    const side=document.getElementById("widePlannerSide");
    const curriculumTab=document.getElementById("widePlannerCurriculumTab");
    const workspace=(window.app?.ui?.workspace||"memory");
    return !!(wide&&side?.classList.contains("eligible")&&workspace==="curriculum"&&curriculumTab?.classList.contains("active"));
  }
  function dockEditPanel(){
    const panel=captureEditPanel();
    if(!panel)return;
    if(!shouldDockEditPanel()){
      restoreEditPanel();
      return;
    }
    const list=document.getElementById("widePlannerList");
    if(!list)return;
    if(panel.parentNode!==list){
      const firstOutline=[...list.children].find(el=>el.classList?.contains("wide-curriculum-row-wrap"));
      list.insertBefore(panel,firstOutline||null);
    }
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

  function lockPlannerHorizontalScroll(){
    const inner=document.querySelector("#widePlannerSide .wide-planner-inner");
    if(inner&&!inner.dataset.xLock){
      inner.dataset.xLock="1";
      inner.addEventListener("scroll",()=>{if(inner.scrollLeft!==0)inner.scrollLeft=0},{passive:true});
    }
    const list=document.getElementById("widePlannerList");
    if(list&&!list.dataset.xLock){
      list.dataset.xLock="1";
      let startX=0,startY=0,active=false;
      list.addEventListener("pointerdown",e=>{
        if(!e.target.closest?.(".planner-task")){active=false;return}
        active=true;startX=e.clientX;startY=e.clientY;
      },{passive:true});
      list.addEventListener("pointermove",e=>{
        if(!active)return;
        const dx=e.clientX-startX,dy=e.clientY-startY;
        if(Math.abs(dx)>Math.abs(dy)&&inner?.scrollLeft)inner.scrollLeft=0;
      },{passive:true});
      const end=()=>{active=false};
      list.addEventListener("pointerup",end,{passive:true});
      list.addEventListener("pointercancel",end,{passive:true});
    }
  }

  function sync(){
    lockPlannerHorizontalScroll();
    dockEditPanel();
  }

  function install(){
    installStyle();
    captureEditPanel();
    wrapGlobal("renderWidePlannerSide",restoreEditPanel,()=>{lockPlannerHorizontalScroll();dockEditPanel()});
    wrapGlobal("renderCurriculumEdit",restoreEditPanel,dockEditPanel);
    wrapGlobal("renderCurriculumCurrent",restoreEditPanel,dockEditPanel);
    wrapGlobal("renderMode",restoreEditPanel,()=>{lockPlannerHorizontalScroll();dockEditPanel()});
    sync();
    const mo=new MutationObserver(()=>requestAnimationFrame(sync));
    mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    window.addEventListener("resize",()=>requestAnimationFrame(sync),{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
