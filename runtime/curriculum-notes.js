(()=>{
  "use strict";

  const VERSION="2026-09-15-standard-notes-stack-v3-compact";
  if(window.__studyJewStandardNotesHotfix===VERSION)return;
  window.__studyJewStandardNotesHotfix=VERSION;

  const PREF_KEY="study-jew-standard-memo-visible-v1";
  const TOOLBAR_SELECTOR="#curriculumPassage .curriculum-standards-v2-toolbar";
  const NOTE_SELECTOR="#curriculumPassage .curriculum-standard-note-strip textarea";

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
    let s=document.getElementById("sj-standard-note-stack-style");
    if(!s){s=document.createElement("style");s.id="sj-standard-note-stack-style";document.head.append(s)}
    s.textContent=`
      .curriculum-standard-note-strip{
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        gap:1px!important;
        align-items:stretch!important;
        margin:0 0 5px!important;
        padding:0!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field{
        display:grid!important;
        grid-template-columns:48px minmax(0,1fr)!important;
        gap:4px!important;
        align-items:center!important;
        width:100%!important;
        min-width:0!important;
        min-height:27px!important;
        margin:0!important;
        padding:0!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field label{
        align-self:center!important;
        font-size:.61em!important;
        line-height:1.15!important;
        color:#8a8b90!important;
        white-space:nowrap!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field textarea,
      .curriculum-standard-note-strip .curriculum-standard-note-field input{
        box-sizing:border-box!important;
        display:block!important;
        width:100%!important;
        min-width:0!important;
        height:27px!important;
        min-height:27px!important;
        max-height:62px!important;
        margin:0!important;
        padding:3px 2px!important;
        line-height:1.35!important;
        resize:none!important;
        overflow-y:hidden!important;
      }
      .curriculum-standard-note-strip .curriculum-standard-note-field textarea.sj-note-expanded{
        overflow-y:auto!important;
      }
      body.sj-standard-memo-hidden .curriculum-standard-note-strip .curriculum-standard-note-field:last-child{
        display:none!important;
      }
      #sjStandardMemoToggle,#sjStandardSave{white-space:nowrap!important}
    `;
  }

  function fit(el){
    if(!(el instanceof HTMLTextAreaElement))return;
    el.style.height="27px";
    const h=Math.max(27,Math.min(62,el.scrollHeight));
    el.style.height=`${h}px`;
    el.classList.toggle("sj-note-expanded",el.scrollHeight>62);
  }
  function fitAll(){document.querySelectorAll(NOTE_SELECTOR).forEach(fit)}

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
        e.preventDefault();e.stopPropagation();setMemoVisible(!memoVisible());
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
    requestAnimationFrame(fitAll);
  }

  let queued=false;
  function queueApply(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }

  function start(){
    apply();
    document.addEventListener("input",e=>{if(e.target instanceof HTMLTextAreaElement&&e.target.matches(NOTE_SELECTOR))fit(e.target)},{capture:true,passive:true});
    const mo=new MutationObserver(queueApply);
    mo.observe(document.body,{subtree:true,childList:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
