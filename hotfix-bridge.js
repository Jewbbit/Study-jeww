(()=>{
  "use strict";
  function syncWorkspace(){
    const view=document.getElementById("curriculumView");
    const btn=document.getElementById("workspaceCurriculum");
    const on=!!((view&&!view.classList.contains("hidden"))||btn?.classList.contains("active"));
    if(!window.app||typeof window.app!=="object")window.app={};
    if(!window.app.ui||typeof window.app.ui!=="object")window.app.ui={};
    const next=on?"curriculum":"memory";
    if(window.app.ui.workspace!==next){
      window.app.ui.workspace=next;
      window.dispatchEvent(new Event("resize"));
    }
  }
  function install(){
    syncWorkspace();
    const mo=new MutationObserver(syncWorkspace);
    mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
    document.getElementById("widePlannerCurriculumTab")?.addEventListener("click",()=>setTimeout(()=>{syncWorkspace();window.dispatchEvent(new Event("resize"))},0));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
