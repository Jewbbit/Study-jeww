(()=>{
  "use strict";

  const VERSION="2026-09-15-standard-notes-stack-v2-save";
  if(window.__studyJewStandardNotesHotfix===VERSION)return;
  window.__studyJewStandardNotesHotfix=VERSION;

  const PREF_KEY="study-jew-standard-memo-visible-v1";
  const TOOLBAR_SELECTOR="#curriculumPassage .curriculum-standards-v2-toolbar";

  function memoVisible(){
    try{
      const raw=localStorage.getItem(PREF_KEY);
      return raw===null?true:raw!=="0";
    }catch{return true}
  }
  function setMemoVisible(on){
    try{localStorage.setItem(PREF_KEY,on?"1":"0")}catch{}
    apply();
  }

  function ensureStyle(){
    if(document.getElementById("sj-standard-note-stack-style"))return;
    const s=document.createElement("style");
    s.id="sj-standard-note-stack-style";
    s.textContent=`
      .curriculum-standard-note-strip{
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        gap:5px!important;
        align-items:stretch!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field{
        width:100%!important;
        min-width:0!important;
        align-items:flex-start!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field textarea,
      .curriculum-standard-note-strip .curriculum-standard-note-field input{
        box-sizing:border-box!important;
        width:100%!important;
        min-width:0!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field:first-child textarea{
        min-height:44px!important;
        max-height:130px!important;
        resize:vertical!important;
        overflow:auto!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field:last-child textarea{
        min-height:34px!important;
        max-height:110px!important;
        resize:vertical!important;
        overflow:auto!important;
      }
      body.sj-standard-memo-hidden .curriculum-standard-note-strip .curriculum-standard-note-field:last-child{
        display:none!important;
      }
      #sjStandardMemoToggle,#sjStandardSave{
        white-space:nowrap!important;
      }
    `;
    document.head.append(s);
  }

  function ensureControls(){
    const toolbar=document.querySelector(TOOLBAR_SELECTOR);
    if(!toolbar)return;

    let save=toolbar.querySelector("#sjStandardSave");
    if(!save){
      save=document.createElement("button");
      save.id="sjStandardSave";
      save.type="button";
      save.textContent="저장";
      save.addEventListener("click",e=>{
        e.preventDefault();e.stopPropagation();
        const ok=typeof window.sjSaveCurriculumStandardEdits==="function"?window.sjSaveCurriculumStandardEdits():false;
        const old=save.textContent;save.textContent=ok===false?"저장 대기":"저장됨";
        setTimeout(()=>{if(save.isConnected)save.textContent=old},900);
      });
      toolbar.append(save);
    }

    let b=toolbar.querySelector("#sjStandardMemoToggle");
    if(!b){
      b=document.createElement("button");
      b.id="sjStandardMemoToggle";
      b.type="button";
      b.className="curriculum-standard-memo-toggle";
      b.addEventListener("click",e=>{
        e.preventDefault();
        e.stopPropagation();
        setMemoVisible(!memoVisible());
      });
      toolbar.append(b);
    }
    const on=memoVisible();
    b.textContent=on?"메모 숨기기":"메모 보기";
    b.classList.toggle("active",on);
    b.setAttribute("aria-pressed",on?"true":"false");
  }

  function apply(){
    ensureStyle();
    const on=memoVisible();
    document.body?.classList.toggle("sj-standard-memo-hidden",!on);
    ensureControls();
  }

  let queued=false;
  function queueApply(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }

  function start(){
    apply();
    const mo=new MutationObserver(queueApply);
    mo.observe(document.body,{subtree:true,childList:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
