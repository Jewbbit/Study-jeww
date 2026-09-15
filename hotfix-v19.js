(()=>{
  "use strict";
  const VERSION="2026-09-15-consideration-scope-v1";
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
  document.addEventListener("touchstart",handle,{capture:true,passive:true});
  document.addEventListener("mousedown",handle,{capture:true,passive:true});
  document.addEventListener("focusin",handle,true);
})();
