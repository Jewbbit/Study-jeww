(()=>{
  "use strict";

  const VERSION="2026-09-13-standard-blank-enter-v1";
  if(window.__studyJewBlankEnterHotfix===VERSION)return;
  window.__studyJewBlankEnterHotfix=VERSION;

  const BLANK_SELECTOR=".curriculum-standard-blank,.sj-explanation-blank,.sj-consideration-blank";

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

  let pendingNextPageFocus=false;
  function focusFirstAfterRender(){
    if(!pendingNextPageFocus)return;
    const first=visibleBlanks()[0];
    if(!first)return;
    pendingNextPageFocus=false;
    requestAnimationFrame(()=>focusInput(first));
  }

  document.addEventListener("keydown",e=>{
    if(e.isComposing||e.keyCode===229||e.key!=="Enter")return;
    const input=e.target instanceof HTMLInputElement&&e.target.matches(BLANK_SELECTOR)?e.target:null;
    if(!input)return;

    // 기존 동작처럼 정답일 때만 다음 칸으로 이동한다.
    if(!input.classList.contains("done"))return;

    const xs=visibleBlanks();
    const i=xs.indexOf(input);
    const next=i>=0?xs[i+1]:null;
    if(next){
      e.preventDefault();
      e.stopImmediatePropagation();
      focusInput(next);
      return;
    }

    // 현재 페이지의 마지막 빈칸이면 기존처럼 다음 페이지로 넘어가되,
    // 렌더 후 첫 빈칸에 다시 초점을 준다.
    const nextBtn=nextPageButton();
    if(nextBtn&&!nextBtn.disabled){
      e.preventDefault();
      e.stopImmediatePropagation();
      pendingNextPageFocus=true;
      nextBtn.click();
      requestAnimationFrame(focusFirstAfterRender);
      setTimeout(focusFirstAfterRender,40);
      setTimeout(focusFirstAfterRender,120);
    }
  },true);

  const mo=new MutationObserver(()=>focusFirstAfterRender());
  const start=()=>{if(document.body)mo.observe(document.body,{subtree:true,childList:true})};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
