(()=>{
  "use strict";

  const VERSION="2026-09-13-standards-blank-hotfix-v2";
  if(window.__studyJewStandardsBlankHotfix===VERSION)return;
  window.__studyJewStandardsBlankHotfix=VERSION;

  const NOTE_SELECTOR = ".curriculum-standard-note-strip input, .curriculum-standard-note-strip textarea";
  const MARK_SELECTOR = ".curriculum-standard-text mark";
  const DOUBLE_TAP_MS = 520;
  let lastTapAt = 0;
  let lastTapMark = null;

  function blankEditButton(){
    const toolbar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");
    if(!toolbar)return null;
    return [...toolbar.querySelectorAll("button")].find(b=>String(b.textContent||"").includes("빈칸"))||null;
  }

  function isBlankEditMode(){
    const btn=blankEditButton();
    return !!(btn&&(btn.classList.contains("active")||String(btn.textContent||"").includes("완료")));
  }

  function syncNoteInputs(root=document){
    const inputs=root.querySelectorAll?root.querySelectorAll(NOTE_SELECTOR):[];
    const locked=isBlankEditMode();
    inputs.forEach(input=>{
      /* 예: 주장과 근거 / 연결·제한·헷갈리는 점 같은 안내 문구는 항상 숨긴다. */
      input.removeAttribute("placeholder");
      input.placeholder="";

      if(locked){
        if(input.dataset.blankModeLock!=="1"){
          input.dataset.blankModeLock="1";
          input.dataset.blankModePrevReadonly=input.readOnly?"1":"0";
          input.dataset.blankModePrevTabindex=input.hasAttribute("tabindex")?input.getAttribute("tabindex"):"__none__";
        }
        input.readOnly=true;
        input.setAttribute("tabindex","-1");
        if(document.activeElement===input)input.blur();
      }else if(input.dataset.blankModeLock==="1"){
        input.readOnly=input.dataset.blankModePrevReadonly==="1";
        const prev=input.dataset.blankModePrevTabindex;
        if(prev==="__none__")input.removeAttribute("tabindex");
        else if(prev!=null)input.setAttribute("tabindex",prev);
        delete input.dataset.blankModeLock;
        delete input.dataset.blankModePrevReadonly;
        delete input.dataset.blankModePrevTabindex;
      }
    });
  }

  function installStyles(){
    let style=document.getElementById("standard-blank-note-hotfix-style");
    if(!style){style=document.createElement("style");style.id="standard-blank-note-hotfix-style";document.head.appendChild(style)}
    style.textContent=`
      .curriculum-standard-note-strip input::placeholder,
      .curriculum-standard-note-strip textarea::placeholder{color:transparent!important;opacity:0!important}
      body.sj-standard-blank-edit .curriculum-standard-note-strip input,
      body.sj-standard-blank-edit .curriculum-standard-note-strip textarea{
        pointer-events:none!important;
        caret-color:transparent!important;
      }
      body.sj-standard-blank-edit ${MARK_SELECTOR}{
        touch-action:manipulation!important;
        -webkit-tap-highlight-color:transparent!important;
      }
    `;
  }

  function syncModeClass(){
    document.body?.classList.toggle("sj-standard-blank-edit",isBlankEditMode());
    syncNoteInputs();
  }

  function currentMark(target){
    const el=target instanceof Element?target:target?.parentElement;
    const mark=el?.closest?.(MARK_SELECTOR);
    if(!mark||!document.getElementById("curriculumPassage")?.contains(mark))return null;
    return mark;
  }

  function triggerMarkDelete(mark,event){
    lastTapAt=0;lastTapMark=null;
    try{event?.preventDefault?.();event?.stopPropagation?.()}catch{}
    mark.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,view:window,detail:2}));
    try{window.getSelection()?.removeAllRanges()}catch{}
  }

  function registerTap(event){
    if(!isBlankEditMode())return;
    const mark=currentMark(event.target);if(!mark)return;
    const now=Date.now();
    const same=mark===lastTapMark&&(now-lastTapAt)<=DOUBLE_TAP_MS;
    lastTapAt=now;lastTapMark=mark;
    if(same)triggerMarkDelete(mark,event);
  }

  function install(){
    installStyles();
    syncModeClass();

    /* iPad Safari는 touchend 대신 pointerup만 안정적으로 오는 경우가 있어 둘 다 받는다. */
    document.addEventListener("pointerup",e=>{
      if(e.pointerType==="touch"||e.pointerType==="pen")registerTap(e);
    },{capture:true,passive:false});
    document.addEventListener("touchend",registerTap,{capture:true,passive:false});

    const observer=new MutationObserver(mutations=>{
      let shouldSync=false;
      for(const mutation of mutations){
        if(mutation.type==="childList"||mutation.type==="attributes")shouldSync=true;
      }
      if(shouldSync)queueMicrotask(syncModeClass);
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
