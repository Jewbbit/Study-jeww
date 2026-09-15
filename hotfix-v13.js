(()=>{
  "use strict";
  const VERSION="2026-09-15-refresh-route-v1";
  if(window.__sjRefreshRoute===VERSION)return;
  window.__sjRefreshRoute=VERSION;
  const KEY="study-jew-tab-view-v1";
  let restoring=false,lastSave=0;

  function read(){try{return JSON.parse(sessionStorage.getItem(KEY)||"null")}catch{return null}}
  function visible(id){const el=document.getElementById(id);return !!(el&&!el.classList.contains("hidden")&&getComputedStyle(el).display!=="none")}
  function workspace(){
    if(document.getElementById("curriculumSpace")?.classList.contains("active")||visible("curriculumView"))return "curriculum";
    if(visible("plannerView")||document.querySelector(".planner-btn.active"))return "planner";
    if(visible("songMapView")||document.querySelector(".melody-index-btn.active"))return "songs";
    if(document.getElementById("bankSpace")?.classList.contains("active")||visible("quizView")||visible("bankHomeView"))return "bank";
    return "memory";
  }
  function snapshot(){
    if(restoring)return;const now=Date.now();if(now-lastSave<80)return;lastSave=now;
    const ws=workspace(),subject=document.getElementById("curriculumSubject")?.value||"";
    const standards=!!document.getElementById("curriculumStandardsBtn")?.classList.contains("active")||String(document.getElementById("curriculumStandardsBtn")?.textContent||"").includes("원문 보기");
    const state={at:now,ws,subject,standards,scrollX:window.scrollX||0,scrollY:window.scrollY||0};
    try{sessionStorage.setItem(KEY,JSON.stringify(state))}catch{}
  }
  function tap(el){if(!el)return false;try{el.click();return true}catch{return false}}
  function restore(){
    const s=read();if(!s||Date.now()-Number(s.at||0)>1000*60*60*12)return;
    restoring=true;
    if(s.ws==="curriculum")tap(document.getElementById("curriculumSpace"));
    else if(s.ws==="bank")tap(document.getElementById("bankSpace"));
    else if(s.ws==="planner")tap(document.querySelector(".planner-btn"));
    else if(s.ws==="songs")tap(document.querySelector(".melody-index-btn"));
    else tap(document.getElementById("memorySpace"));

    setTimeout(()=>{
      if(s.ws==="curriculum"){
        const sel=document.getElementById("curriculumSubject");
        if(sel&&s.subject&&[...sel.options].some(o=>o.value===s.subject)&&sel.value!==s.subject){sel.value=s.subject;sel.dispatchEvent(new Event("change",{bubbles:true}))}
        setTimeout(()=>{
          const btn=document.getElementById("curriculumStandardsBtn"),isStandards=!!btn?.classList.contains("active")||String(btn?.textContent||"").includes("원문 보기");
          if(btn&&!!s.standards!==isStandards)tap(btn);
          setTimeout(()=>{window.scrollTo(Number(s.scrollX)||0,Number(s.scrollY)||0);restoring=false;snapshot()},180);
        },160);
      }else setTimeout(()=>{window.scrollTo(Number(s.scrollX)||0,Number(s.scrollY)||0);restoring=false;snapshot()},220);
    },180);
  }

  document.addEventListener("click",()=>setTimeout(snapshot,30),{capture:true,passive:true});
  document.addEventListener("change",()=>setTimeout(snapshot,30),{capture:true,passive:true});
  document.addEventListener("input",()=>setTimeout(snapshot,60),{capture:true,passive:true});
  window.addEventListener("scroll",snapshot,{passive:true});
  window.addEventListener("pagehide",snapshot,{capture:true});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")snapshot()});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(restore,900),{once:true});else setTimeout(restore,900);
})();
