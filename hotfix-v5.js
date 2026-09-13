(()=>{
  "use strict";
  /* 구 서비스워커가 한 번 더 주입하더라도, 예전 PDF 검색 패치를 실행하지 않는 호환용 shim. */
  if(window.__studyJewV5Compat)return;window.__studyJewV5Compat=true;
  const style=document.createElement("style");style.id="sjV5CompatStyle";style.textContent=`
@media(min-width:700px) and (min-height:600px){
 #widePlannerSide,#widePlannerSide .wide-planner-inner,#widePlannerList{overflow-x:hidden!important;overscroll-behavior-x:none!important;max-width:100%!important}
 #widePlannerList .planner-task,#widePlannerList .planner-task-link,#widePlannerList .planner-task-check,#widePlannerList .planner-task-exclude{touch-action:pan-y!important}
 #widePlannerList .planner-task{left:0!important;right:auto!important;translate:0 0!important;max-width:100%!important}
}
.curriculum-line.curriculum-hanging{padding-left:1.12em!important;text-indent:-1.12em!important}
`;document.head.append(style);
  const lock=()=>{for(const el of [document.querySelector("#widePlannerSide .wide-planner-inner"),document.getElementById("widePlannerList")]){if(!el||el.dataset.sjCompatX)return;el.dataset.sjCompatX="1";el.addEventListener("scroll",()=>{if(el.scrollLeft)el.scrollLeft=0},{passive:true})}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",lock,{once:true});else lock();
})();