(()=>{
  "use strict";

  const VERSION="2026-09-13-standard-blank-enter-v2";
  if(window.__studyJewBlankEnterHotfix===VERSION)return;
  window.__studyJewBlankEnterHotfix=VERSION;

  const BLANK_SELECTOR=".curriculum-standard-blank,.sj-explanation-blank,.sj-consideration-blank";
  let pendingNextPageFocus=false;
  let lastAdvanceAt=0,lastAdvanceInput=null;

  function visibleBlanks(){
    return [...document.querySelectorAll(`#curriculumPassage ${BLANK_SELECTOR}`)]
      .filter(el=>el instanceof HTMLInputElement&&!el.disabled&&el.offsetParent!==null);
  }

  function focusInput(input){
    if(!input)return false;
    try{input.focus({preventScroll:true})}catch{try{input.focus()}catch{return false}}
    try{const n=input.value.length;input.setSelectionRange(n,n)}catch{}
    input.scrollIntoView?.({block:"nearest",inline:"nearest"});
    return document.activeElement===input;
  }

  function nextPageButton(){
    const nav=document.querySelector("#curriculumPassage .curriculum-standards-v2-nav:not(.bottom)")||document.querySelector("#curriculumPassage .curriculum-standards-v2-nav");
    const buttons=nav?[...nav.querySelectorAll("button")]:[];
    return buttons.length?buttons[buttons.length-1]:null;
  }

  function focusFirstAfterRender(){
    if(!pendingNextPageFocus)return;
    const first=visibleBlanks()[0];
    if(!first)return;
    pendingNextPageFocus=false;
    requestAnimationFrame(()=>focusInput(first));
    setTimeout(()=>focusInput(first),35);
  }

  function isDone(input){return !!input?.classList?.contains("done")}

  function advance(input){
    if(!input||!isDone(input))return false;
    const now=Date.now();
    if(lastAdvanceInput===input&&now-lastAdvanceAt<180)return true;
    lastAdvanceInput=input;lastAdvanceAt=now;

    const xs=visibleBlanks(),i=xs.indexOf(input),next=i>=0?xs[i+1]:null;
    if(next)return focusInput(next);

    const nextBtn=nextPageButton();
    if(nextBtn&&!nextBtn.disabled){
      pendingNextPageFocus=true;
      nextBtn.click();
      requestAnimationFrame(focusFirstAfterRender);
      setTimeout(focusFirstAfterRender,40);
      setTimeout(focusFirstAfterRender,120);
      setTimeout(focusFirstAfterRender,260);
      return true;
    }
    return false;
  }

  document.addEventListener("keydown",e=>{
    if(e.key!=="Enter")return;
    const input=e.target instanceof HTMLInputElement&&e.target.matches(BLANK_SELECTOR)?e.target:null;
    if(!input)return;

    // 정답 판정이 이미 끝난 경우에는 기본 Enter 동작을 막고 즉시 다음 칸으로 이동한다.
    if(isDone(input)&&!e.isComposing&&e.keyCode!==229){
      e.preventDefault();e.stopImmediatePropagation();advance(input);return;
    }

    // iPad 한글 IME는 Enter 순간에도 composing/229로 들어오는 경우가 있어
    // 조합 종료 직후 다시 판정해 키보드가 닫혀도 다음 칸으로 포커스를 되돌린다.
    setTimeout(()=>{if(isDone(input))advance(input)},0);
    setTimeout(()=>{if(isDone(input))advance(input)},45);
  },true);

  document.addEventListener("keyup",e=>{
    if(e.key!=="Enter")return;
    const input=e.target instanceof HTMLInputElement&&e.target.matches(BLANK_SELECTOR)?e.target:null;
    if(!input)return;
    setTimeout(()=>{if(isDone(input))advance(input)},0);
  },true);

  document.addEventListener("compositionend",e=>{
    const input=e.target instanceof HTMLInputElement&&e.target.matches(BLANK_SELECTOR)?e.target:null;
    if(!input)return;
    // 직전에 Enter가 들어왔다가 IME 조합 때문에 무시된 경우를 위한 최종 보정.
    setTimeout(()=>{if(isDone(input)&&document.activeElement!==input)advance(input)},25);
  },true);

  const mo=new MutationObserver(()=>focusFirstAfterRender());
  const start=()=>{if(document.body)mo.observe(document.body,{subtree:true,childList:true})};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
