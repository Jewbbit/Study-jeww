(()=>{
  "use strict";
  const VERSION="2026-09-15-consideration-scope-v2-standard-history";
  if(window.__studyJewConsiderationScope===VERSION)return;
  window.__studyJewConsiderationScope=VERSION;

  const SELECTOR=".curriculum-standard-consideration-select";
  const APP_KEY="study-jew-v4";
  const QUICK_KEY="study-jew-v4-study-edit";
  const BACKUP_KEY="study-jew-curriculum-safety-v1";
  const EXPLANATION_KEY="study-jew-explanation-blanks-v1";
  const CONSIDERATION_KEY="study-jew-consideration-blanks-v1";
  let historyTimer=0;

  function parse(raw){try{return JSON.parse(raw||"null")}catch{return null}}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
  function object(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
  function curriculumFrom(raw){return clone(parse(raw)?.study?.curriculumPractice||null)}
  function sidecar(key){const x=parse(localStorage.getItem(key));return object(x)}

  function codeFromText(text){
    const m=String(text||"").match(/\[([^\]]+)\]/);
    return m?m[1].trim():String(text||"").trim();
  }

  function scopeSelect(sel){
    if(!(sel instanceof HTMLSelectElement)||!sel.matches(SELECTOR))return;
    const section=sel.closest(".curriculum-standards-group.single-page");
    if(!section)return;
    const codes=new Set([...section.querySelectorAll(".curriculum-standard-code")].map(el=>codeFromText(el.textContent)).filter(Boolean));
    if(!codes.size)return;
    const current=sel.value;
    for(const opt of [...sel.options]){
      if(opt.value==="__common__"||opt.value==="__auto__"||codes.has(opt.value)||opt.value===current)continue;
      opt.remove();
    }
  }

  function standardBlankSignature(cp){
    try{return JSON.stringify(object(cp).standardBlankOverrides||{})}catch{return ""}
  }

  function snapshotStandardHistory(){
    try{
      const main=curriculumFrom(localStorage.getItem(APP_KEY));
      const quick=curriculumFrom(localStorage.getItem(QUICK_KEY));
      const cp=quick||main;
      if(!cp)return;
      const old=parse(localStorage.getItem(BACKUP_KEY));
      const list=Array.isArray(old)?old:[];
      const latest=list.at(-1),latestCp=latest?.quick||latest?.main||null;
      if(latestCp&&standardBlankSignature(latestCp)===standardBlankSignature(cp))return;
      list.push({
        at:Date.now(),
        reason:"standard-blank",
        main,
        quick,
        explanation:sidecar(EXPLANATION_KEY),
        consideration:sidecar(CONSIDERATION_KEY)
      });
      localStorage.setItem(BACKUP_KEY,JSON.stringify(list.slice(-6)));
    }catch{}
  }

  function scheduleStandardPersist(){
    clearTimeout(historyTimer);
    historyTimer=setTimeout(()=>{
      historyTimer=0;
      try{if(typeof window.sjSaveCurriculumStandardEdits==="function")window.sjSaveCurriculumStandardEdits()}catch{}
      setTimeout(snapshotStandardHistory,90);
    },180);
  }

  function handle(e){
    const sel=e.target?.closest?.(SELECTOR);
    if(sel)scopeSelect(sel);
    if(e.target?.closest?.(".curriculum-standard-text"))scheduleStandardPersist();
    if(e.target?.closest?.("#sjStandardSave"))scheduleStandardPersist();
  }

  document.addEventListener("pointerdown",handle,{capture:true,passive:true});
  document.addEventListener("touchstart",handle,{capture:true,passive:true});
  document.addEventListener("mousedown",handle,{capture:true,passive:true});
  document.addEventListener("pointerup",handle,{capture:true,passive:true});
  document.addEventListener("touchend",handle,{capture:true,passive:true});
  document.addEventListener("mouseup",handle,{capture:true,passive:true});
  document.addEventListener("dblclick",handle,true);
  document.addEventListener("click",handle,true);
  document.addEventListener("focusin",handle,true);
})();
