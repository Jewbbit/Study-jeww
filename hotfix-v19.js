(()=>{
  "use strict";
  const VERSION="2026-09-28-consideration-scope-v4";
  if(window.__studyJewConsiderationScope===VERSION)return;
  window.__studyJewConsiderationScope=VERSION;

  const SELECTOR=".curriculum-standard-consideration-select";
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
  function handle(e){
    const sel=e.target?.closest?.(SELECTOR);
    if(sel)scopeSelect(sel);
  }
  document.addEventListener("pointerdown",handle,{capture:true,passive:true});
  document.addEventListener("focusin",handle,true);

  const style=document.createElement("style");
  style.id="mobile-workspace-header-simplify";
  style.textContent=`
    @media(max-width:640px){
      #curriculumSpace,#reviewSpace{display:none!important}
      .workspace-switch{flex:0 0 auto!important;max-width:none!important}
      .workspace-switch .workspace-btn{padding-left:10px!important;padding-right:10px!important}
    }
  `;
  document.head.append(style);
})();

(()=>{
  "use strict";
  const VERSION="2026-10-01-quiz-keymap-v3";
  if(window.__studyJewQuizKeymap===VERSION)return;
  window.__studyJewQuizKeymap=VERSION;

  function annotateQuizSet(){
    if(typeof quizSession==="undefined"||!quizSession?.adventure||quizSession.adventure.review)return;
    const setIndex=Number(quizSession.adventure.setIndex);
    if(!Number.isInteger(setIndex)||setIndex<0)return;
    const el=document.querySelector("#quizView .quiz-sheet-name");
    if(!el||el.dataset.sjSetLabel==="1")return;
    el.dataset.sjSetLabel="1";
    el.textContent=`${el.textContent||""} · ${setIndex+1}세트`;
  }

  const quizView=document.getElementById("quizView");
  if(quizView){
    new MutationObserver(()=>annotateQuizSet()).observe(quizView,{childList:true,subtree:true});
    annotateQuizSet();
  }

  function clickChoice(index){
    const buttons=[...document.querySelectorAll("#quizView .choices .choice")].filter(b=>b.offsetParent!==null&&!b.disabled);
    const target=buttons[index];
    if(!target)return false;
    target.click();
    return true;
  }

  window.addEventListener("keydown",e=>{
    if(typeof app==="undefined"||app?.ui?.workspace!=="bank"||app?.ui?.bankMode!=="quiz")return;
    const tag=document.activeElement?.tagName;
    if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;

    if((typeof quizSession==="undefined"||!quizSession)&&app?.ui?.quizHomeMode==="path"&&(e.key==="Enter"||e.code==="Enter"||e.code==="NumpadEnter")){
      const next=document.querySelector("#quizView .path-node.current:not(:disabled)")||document.querySelector("#quizView .path-node.in-progress:not(:disabled)");
      if(next){e.preventDefault();e.stopImmediatePropagation();next.click();return}
    }

    let choiceIndex=-1;
    if(e.key==="6"||e.code==="Digit6"||e.code==="Numpad6")choiceIndex=1;
    else if(e.key==="9"||e.code==="Digit9"||e.code==="Numpad9")choiceIndex=0;
    else return;

    if(clickChoice(choiceIndex)){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);
})();
