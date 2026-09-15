(()=>{
  "use strict";
  const VERSION="2026-09-15-curriculum-flow-nav-tap-v1";
  if(window.__sjCurriculumFlowNavTap===VERSION)return;
  window.__sjCurriculumFlowNavTap=VERSION;

  const NAV="#sjCurriculumFlowNav2";
  let lastButton=null,lastAt=0;

  function installStyle(){
    let s=document.getElementById("sj-curriculum-flow-nav-tap-style");
    if(!s){s=document.createElement("style");s.id="sj-curriculum-flow-nav-tap-style";document.head.append(s)}
    s.textContent=`
      ${NAV}{z-index:120!important;pointer-events:auto!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important;isolation:isolate!important}
      ${NAV} button{pointer-events:auto!important;touch-action:manipulation!important;position:relative!important;z-index:1!important;min-height:34px!important;-webkit-tap-highlight-color:transparent!important}
    `;
  }

  function navButton(target){
    const el=target instanceof Element?target:target?.parentElement;
    const b=el?.closest?.(`${NAV} button`);
    return b&&b.isConnected?b:null;
  }
  function activate(b){
    if(!b)return false;
    const now=Date.now();
    if(lastButton===b&&now-lastAt<260)return true;
    lastButton=b;lastAt=now;
    try{
      const fn=b.onclick;
      if(typeof fn==="function"){
        fn.call(b,new Event("click",{bubbles:false,cancelable:true}));
        return true;
      }
      b.click();
      return true;
    }catch(err){console.error("curriculum flow nav",err);return false}
  }

  document.addEventListener("pointerup",e=>{
    const b=navButton(e.target);if(!b)return;
    if(e.pointerType==="mouse")return;
    e.preventDefault();e.stopPropagation();
    activate(b);
  },{capture:true,passive:false});

  document.addEventListener("click",e=>{
    const b=navButton(e.target);if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    activate(b);
  },{capture:true,passive:false});

  installStyle();
})();
