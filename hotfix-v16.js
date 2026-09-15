(()=>{
  "use strict";
  const VERSION="2026-09-15-curriculum-flow-polish-v1";
  if(window.__sjCurriculumFlowPolish===VERSION)return;
  window.__sjCurriculumFlowPolish=VERSION;

  const LABELS=["설계의 개요","성격·목표","내용 체계","성취기준","교수·학습 및 평가"];
  let queued=false;

  function flowActive(){
    return !!document.getElementById("curriculumSpace")?.classList.contains("active")
      && !!document.getElementById("sjCurriculumFlowNav2")
      && !document.getElementById("sjCurriculumFlowNav2")?.classList.contains("hidden");
  }
  function navButtons(){
    const nav=document.getElementById("sjCurriculumFlowNav2");
    if(!nav)return [];
    return [...nav.querySelectorAll("button")].filter(b=>!b.classList.contains("sj-flow-back")).slice(0,5);
  }
  function activeIndex(){
    const bs=navButtons();
    let i=bs.findIndex(b=>b.classList.contains("active"));
    if(i>=0)return i;
    const standards=document.getElementById("curriculumStandardsBtn");
    const on=!!standards&&(standards.classList.contains("active")||String(standards.textContent||"").includes("원문 보기"));
    return on?3:-1;
  }
  function clickSection(i){const b=navButtons()[i];if(b)b.click()}

  function ensureStyle(){
    let s=document.getElementById("sj-curriculum-flow-polish-style");
    if(!s){s=document.createElement("style");s.id="sj-curriculum-flow-polish-style";document.head.append(s)}
    s.textContent=`
      #sjCurriculumFlowNav2{position:sticky;top:47px;z-index:30;background:rgba(255,255,255,.98);padding-top:5px!important;margin-top:-2px!important}
      .sj-flow-step-footer{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:7px;margin:20px 0 34px;padding-top:12px;border-top:1px solid #ececef}
      .sj-flow-step-footer button{min-height:38px;border:1px solid #dcdde1;border-radius:8px;background:#fff;padding:7px 10px;font-size:11px;color:#55565c}
      .sj-flow-step-footer button:last-child{justify-self:end}.sj-flow-step-footer button:disabled{visibility:hidden}
      .sj-flow-step-footer span{font-size:10px;color:#96979c;white-space:nowrap;text-align:center}
      body.sj-flow2-custom .curriculum-title-row{margin-bottom:2px}
      .sj-table2-card{overflow:hidden}.sj-table2-img{border:0!important;border-radius:5px}
      @media(max-width:699px){#sjCurriculumFlowNav2{top:46px}.sj-flow-step-footer{grid-template-columns:1fr 1fr}.sj-flow-step-footer span{display:none}.sj-flow-step-footer button{width:100%}}
      @media(monochrome){#sjCurriculumFlowNav2{background:#fff!important}.sj-flow-step-footer{border-color:#111}.sj-flow-step-footer button{border-color:#111}}
    `;
  }

  function footerNode(idx){
    const f=document.createElement("div");f.className="sj-flow-step-footer";f.dataset.sjFlowFooter="1";
    const prev=document.createElement("button");prev.type="button";prev.textContent=idx>0?`‹ ${LABELS[idx-1]}`:"이전";prev.disabled=idx<=0;prev.onclick=()=>clickSection(idx-1);
    const now=document.createElement("span");now.textContent=`${idx+1} / ${LABELS.length}`;
    const next=document.createElement("button");next.type="button";next.textContent=idx<LABELS.length-1?`${LABELS[idx+1]} ›`:"다음";next.disabled=idx>=LABELS.length-1;next.onclick=()=>clickSection(idx+1);
    f.append(prev,now,next);return f;
  }

  function polish(){
    queued=false;ensureStyle();if(!flowActive())return;
    const bs=navButtons();bs.forEach((b,i)=>{if(LABELS[i])b.textContent=LABELS[i]});
    const idx=activeIndex();if(idx<0)return;
    document.querySelectorAll(".sj-flow-step-footer").forEach(x=>x.remove());
    if(idx===3){
      const passage=document.getElementById("curriculumPassage");
      if(passage&&!passage.classList.contains("hidden"))passage.append(footerNode(idx));
    }else{
      const body=document.getElementById("sjCurriculumFlowBody2");
      if(body&&!body.classList.contains("hidden"))body.append(footerNode(idx));
    }
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>setTimeout(polish,20))}

  document.addEventListener("click",e=>{
    if(e.target?.closest?.("#sjCurriculumFlowNav2,#curriculumSpace,#curriculumStandardsBtn,.curriculum-outline-row,.wide-curriculum-row"))setTimeout(schedule,180);
  },{capture:true,passive:true});
  document.addEventListener("change",e=>{if(e.target?.id==="curriculumSubject")setTimeout(schedule,180)},{capture:true,passive:true});
  const mo=new MutationObserver(schedule);
  const start=()=>{ensureStyle();mo.observe(document.body,{subtree:true,childList:true,classList:true,attributes:true,attributeFilter:["class"]});setTimeout(schedule,450)};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
