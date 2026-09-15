(()=>{
  "use strict";
  const VERSION="2026-09-15-curriculum-subject-flow-v1";
  if(window.__sjCurriculumSubjectFlow===VERSION)return;
  window.__sjCurriculumSubjectFlow=VERSION;

  const DATA_URL="./curriculum-v6.json?v=20260913-logical-v6";
  const STATE_KEY="study-jew-curriculum-flow-v1";
  const SECTIONS=[
    ["design","설계 개요"],
    ["identity","성격·목표"],
    ["content","내용체계"],
    ["standards","성취기준"],
    ["teaching","교수·학습·평가"]
  ];
  let data=null,loading=null,renderQueued=false;

  function readState(){try{const x=JSON.parse(localStorage.getItem(STATE_KEY)||"{}");return x&&typeof x==="object"?x:{}}catch{return {}}}
  function writeState(x){try{localStorage.setItem(STATE_KEY,JSON.stringify(x))}catch{}}
  function subject(){return document.getElementById("curriculumSubject")?.value||"전체"}
  function inCurriculum(){return !!document.getElementById("curriculumSpace")?.classList.contains("active")}
  function stateFor(s){const all=readState();if(!all[s])all[s]={section:"design",sourceMode:false};return {all,st:all[s]}}
  function saveSubjectState(s,patch){const {all,st}=stateFor(s);Object.assign(st,patch);all[s]=st;writeState(all)}
  async function ensureData(){if(data)return data;if(loading)return loading;loading=fetch(DATA_URL,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error(`curriculum ${r.status}`);return r.json()}).then(x=>data=x).finally(()=>loading=null);return loading}

  function ensureStyle(){
    let s=document.getElementById("sj-curriculum-flow-style");if(!s){s=document.createElement("style");s.id="sj-curriculum-flow-style";document.head.append(s)}
    s.textContent=`
      #sjCurriculumFlowNav{display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none;margin:2px 0 10px;padding:2px 0 5px;border-bottom:1px solid #ececef}
      #sjCurriculumFlowNav::-webkit-scrollbar{display:none}
      #sjCurriculumFlowNav button{flex:0 0 auto;border:0;background:transparent;border-radius:7px;padding:7px 9px;font-size:.72em;color:#77787d;white-space:nowrap}
      #sjCurriculumFlowNav button.active{background:#292a2e;color:#fff;font-weight:700}
      #sjCurriculumFlowNav .sj-flow-back{margin-left:auto;border:1px solid #dedee2;background:#fff;color:#56575c}
      #sjCurriculumFlowBody{padding:2px 0 30px;font-size:var(--curriculum-font-size,17px);line-height:1.8;color:#2d2e32}
      .sj-flow-section-head{display:flex;align-items:center;gap:8px;margin:5px 0 12px;padding-bottom:8px;border-bottom:1px solid #e8e8eb}
      .sj-flow-section-head strong{font-size:1.1em}.sj-flow-section-head span{font-size:.7em;color:#929399}
      .sj-flow-text-card{margin:0 0 12px;padding:14px 15px;border:1px solid #e4e4e7;border-radius:10px;background:#fff}
      .sj-flow-text-card h3{margin:0 0 8px;font-size:.86em;color:#45464b}
      .sj-flow-text{white-space:pre-wrap;word-break:keep-all;overflow-wrap:anywhere}
      .sj-flow-open-source{margin-top:10px;border:1px solid #dedee2;background:#fafafa;border-radius:7px;padding:6px 8px;font-size:.68em;color:#62636a}
      .sj-flow-visual{display:block;max-width:100%;height:auto;margin:10px auto;border:1px solid #e1e1e4;border-radius:7px;background:#fff}
      .sj-content-image-card{margin:0 0 16px;padding:9px;border:1px solid #dfdfe3;border-radius:10px;background:#fff}
      .sj-content-image-card h3{margin:2px 3px 8px;font-size:.78em;color:#55565c}
      .sj-content-table-image{display:block;width:100%;height:auto;border:1px solid #cfd0d4;background:#fff;cursor:zoom-in}
      .sj-content-image-note{margin:7px 2px 0;font-size:.62em;color:#929399}
      .sj-flow-empty{padding:30px 12px;text-align:center;color:#898a90;font-size:.8em}
      .sj-flow-image-modal{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.76);display:flex;flex-direction:column;padding:12px}
      .sj-flow-image-modal.hidden{display:none!important}.sj-flow-image-modal-head{display:flex;justify-content:flex-end;padding-bottom:8px}.sj-flow-image-modal-head button{border:0;border-radius:8px;background:#fff;padding:8px 11px}
      .sj-flow-image-modal-scroll{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#fff;border-radius:8px}.sj-flow-image-modal-scroll img{display:block;min-width:1200px;width:100%;height:auto}
      body.sj-curriculum-flow-custom #curriculumPassage,body.sj-curriculum-flow-custom #curriculumSourceNote,body.sj-curriculum-flow-custom #curriculumEditPanel,body.sj-curriculum-flow-custom #curriculumContext,body.sj-curriculum-flow-custom #curriculumPageDock,body.sj-curriculum-flow-custom #curriculumFloatTools,body.sj-curriculum-flow-custom .curriculum-status{display:none!important}
      body.sj-curriculum-flow-custom #curriculumModebar .curriculum-mode-switch,body.sj-curriculum-flow-custom #curriculumBlankEditBtn,body.sj-curriculum-flow-custom #curriculumResetBtn{display:none!important}
      body.sj-curriculum-flow-enabled #curriculumStandardsBtn{display:none!important}
      @media(max-width:699px){#sjCurriculumFlowNav button{padding:6px 7px;font-size:.68em}.sj-flow-text-card{padding:11px 12px}.sj-flow-image-modal{padding:6px}.sj-flow-image-modal-scroll img{min-width:1000px}}
      @media(monochrome){#sjCurriculumFlowNav button.active{background:#111;color:#fff}.sj-flow-text-card,.sj-content-image-card,.sj-content-table-image{border-color:#111!important}.sj-flow-image-modal{background:#fff}.sj-flow-image-modal-scroll{border:1px solid #111}}
    `;
  }

  function ensureNodes(){
    const passage=document.getElementById("curriculumPassage");if(!passage)return null;
    const parent=passage.parentElement;if(!parent)return null;
    let nav=document.getElementById("sjCurriculumFlowNav");if(!nav){nav=document.createElement("div");nav.id="sjCurriculumFlowNav";parent.insertBefore(nav,document.getElementById("curriculumContext")||passage)}
    let body=document.getElementById("sjCurriculumFlowBody");if(!body){body=document.createElement("div");body.id="sjCurriculumFlowBody";parent.insertBefore(body,passage)}
    let modal=document.getElementById("sjFlowImageModal");if(!modal){modal=document.createElement("div");modal.id="sjFlowImageModal";modal.className="sj-flow-image-modal hidden";modal.innerHTML='<div class="sj-flow-image-modal-head"><button type="button">닫기</button></div><div class="sj-flow-image-modal-scroll"><img alt="내용체계 확대"></div>';modal.querySelector("button").onclick=()=>modal.classList.add("hidden");modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden")});document.body.append(modal)}
    return {nav,body,modal};
  }

  function coreIsStandards(){const b=document.getElementById("curriculumStandardsBtn");return !!(b&&(b.classList.contains("active")||String(b.textContent||"").includes("원문 보기")))}
  function setCoreStandards(on){const b=document.getElementById("curriculumStandardsBtn");if(!b)return;if(coreIsStandards()!==!!on)b.click()}

  function subjectItems(s){return (data?.items||[]).filter(x=>x.s===s)}
  function label(x){return String(x?.logicalLabel||"").trim()}
  function designItems(items){return items.filter(x=>label(x).includes("교육과정 설계의 개요"))}
  function identityItems(items){return items.filter(x=>/(^|\s|\.)성격$/.test(label(x))||/(^|\s|\.)목표$/.test(label(x))||label(x)==="가. 성격"||label(x)==="나. 목표")}
  function contentItems(items){return items.filter(x=>label(x).includes("내용 체계"))}
  function teachingItems(items){
    const start=items.findIndex(x=>/교수[⋅·ㆍ・]?학습.*평가/.test(label(x))||/교수[⋅·ㆍ・]?학습.*평가/.test(String(x.t||"").slice(0,80)));
    if(start<0)return items.filter(x=>/교수[⋅·ㆍ・]?학습|평가/.test(label(x))&&!label(x).includes("적용 시 고려"));
    return items.slice(start).filter(x=>!label(x).includes("성취기준 적용 시 고려"));
  }
  function stripFirstHeading(text){const s=String(text||"");const i=s.indexOf("\n");return i>=0?s.slice(i+1).replace(/^\s+/,""):s}
  function esc(s){return String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[ch]))}
  function textLines(text,max){
    const out=[];for(const raw of String(text||"").split(/\n/)){if(!raw){out.push("");continue}let s=raw;while(s.length>max){let cut=max;for(let i=max;i>Math.max(4,max-12);i--){if(/[\s·⋅,.)]/.test(s[i]||"")){cut=i+1;break}}out.push(s.slice(0,cut).trimEnd());s=s.slice(cut).trimStart()}out.push(s)}return out;
  }
  function colWidths(n){
    if(n===6)return [170,410,145,291,291,293];
    if(n===5)return [180,440,150,415,415];
    if(n===4)return [200,500,180,720];
    if(n===3)return [240,520,840];
    const q=Math.floor(1600/Math.max(1,n)),a=Array(n).fill(q);a[a.length-1]+=1600-q*n;return a;
  }
  function tableSvg(table,title){
    const rows=Array.isArray(table?.rows)?table.rows:[],n=Math.max(1,...rows.map(r=>Array.isArray(r)?r.length:0)),cw=colWidths(n);const x=[0];for(const w of cw)x.push(x.at(-1)+w);
    const placements=[];rows.forEach((row,r)=>{(row||[]).forEach((cell,c)=>{if(!cell)return;placements.push({r,c,cell,rs:Math.max(1,Number(cell.rs)||1),cs:Math.max(1,Number(cell.cs)||1)})})});
    const rh=rows.map(()=>76);
    const need=p=>{const width=x[Math.min(n,p.c+p.cs)]-x[p.c]-20,cap=Math.max(5,Math.floor(width/22)),lines=textLines(p.cell.t,cap);return {lines,h:Math.max(62,lines.length*29+22)}};
    for(const p of placements){const q=need(p);p.lines=q.lines;p.need=q.h;if(p.rs===1)rh[p.r]=Math.max(rh[p.r]||76,q.h)}
    for(const p of placements){if(p.rs<=1)continue;const end=Math.min(rows.length,p.r+p.rs);let have=0;for(let r=p.r;r<end;r++)have+=rh[r];if(have<p.need){const add=(p.need-have)/(end-p.r);for(let r=p.r;r<end;r++)rh[r]+=add}}
    const y=[54];for(const h of rh)y.push(y.at(-1)+h);const H=Math.ceil(y.at(-1)+18),W=1600;let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="white"/><text x="12" y="34" font-family="Apple SD Gothic Neo,Noto Sans KR,sans-serif" font-size="25" font-weight="700" fill="#34353a">${esc(title)}</text>`;
    for(const p of placements){const x0=x[p.c],x1=x[Math.min(n,p.c+p.cs)],y0=y[p.r],y1=y[Math.min(rows.length,p.r+p.rs)],header=p.r<2;svg+=`<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" fill="${header?'#f4f4f6':'#fff'}" stroke="#bfc0c5" stroke-width="1.4"/>`;const fs=22,lh=29,lines=p.lines||[];let ty=y0+25;for(const line of lines){svg+=`<text x="${x0+10}" y="${ty}" font-family="Apple SD Gothic Neo,Noto Sans KR,sans-serif" font-size="${fs}" ${header?'font-weight="700"':''} fill="#292a2e">${esc(line)}</text>`;ty+=lh}}
    svg+="</svg>";return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function openImage(src){const m=document.getElementById("sjFlowImageModal");if(!m)return;const img=m.querySelector("img");img.src=src;m.classList.remove("hidden");m.querySelector(".sj-flow-image-modal-scroll").scrollTo(0,0)}
  function openOriginal(item,section){
    const s=subject();saveSubjectState(s,{section,sourceMode:true});document.body.classList.remove("sj-curriculum-flow-custom");setCoreStandards(false);
    setTimeout(()=>{
      const ob=document.getElementById("curriculumOutlineBtn");if(ob)ob.click();
      setTimeout(()=>{
        const rows=[...document.querySelectorAll("#curriculumOutlinePanel .curriculum-outline-row,.wide-curriculum-row")];const target=rows.find(r=>String(r.textContent||"").trim()===label(item))||rows.find(r=>String(r.textContent||"").includes(label(item)));
        if(target)target.click();
      },120);
    },140);
    queueRender();
  }

  function renderTextSection(body,items,section,title,s){
    body.innerHTML="";const head=document.createElement("div");head.className="sj-flow-section-head";head.innerHTML=`<strong>${title}</strong><span>${s}</span>`;body.append(head);
    if(!items.length){body.innerHTML+='<div class="sj-flow-empty">이 구간의 원문을 찾지 못했습니다.</div>';return}
    for(const item of items){const card=document.createElement("section");card.className="sj-flow-text-card";const h=document.createElement("h3");h.textContent=label(item)||title;const text=document.createElement("div");text.className="sj-flow-text";text.textContent=stripFirstHeading(item.t);card.append(h,text);
      for(const v of item.visuals||[]){const img=document.createElement("img");img.className="sj-flow-visual";img.loading="lazy";img.alt=v.caption||"교육과정 도식";img.src=`./curriculum-assets/${v.src}`;card.append(img)}
      const open=document.createElement("button");open.type="button";open.className="sj-flow-open-source";open.textContent="이 구간 원문에서 연습·편집";open.onclick=()=>openOriginal(item,section);card.append(open);body.append(card)}
  }
  function renderContent(body,items,s){
    body.innerHTML="";const head=document.createElement("div");head.className="sj-flow-section-head";head.innerHTML=`<strong>내용체계</strong><span>${s} · 표는 이미지로 고정 표시</span>`;body.append(head);let count=0;
    for(const item of items){for(let i=0;i<(item.tables||[]).length;i++){const table=item.tables[i],card=document.createElement("section");card.className="sj-content-image-card";const h=document.createElement("h3");h.textContent=(label(item)||"내용 체계")+((item.tables||[]).length>1?` ${i+1}`:"");const src=tableSvg(table,h.textContent);const img=document.createElement("img");img.className="sj-content-table-image";img.alt=`${s} ${h.textContent}`;img.src=src;img.onclick=()=>openImage(src);const note=document.createElement("div");note.className="sj-content-image-note";note.textContent="표를 누르면 크게 볼 수 있습니다. 화면에서는 HTML 표로 다시 조립하지 않습니다.";card.append(h,img,note);body.append(card);count++}}
    if(!count){const e=document.createElement("div");e.className="sj-flow-empty";e.textContent="이 과목의 내용체계 표 데이터를 찾지 못했습니다.";body.append(e)}
  }

  function renderNav(nav,s,st){
    nav.innerHTML="";for(const [key,text] of SECTIONS){const b=document.createElement("button");b.type="button";b.textContent=text;b.classList.toggle("active",!st.sourceMode&&st.section===key);b.onclick=()=>{saveSubjectState(s,{section:key,sourceMode:false});queueRender(true)};nav.append(b)}
    if(st.sourceMode){const back=document.createElement("button");back.type="button";back.className="sj-flow-back";back.textContent="분류 보기";back.onclick=()=>{saveSubjectState(s,{sourceMode:false});queueRender(true)};nav.append(back)}
  }

  async function render(forceScroll=false){
    renderQueued=false;ensureStyle();const nodes=ensureNodes();if(!nodes)return;
    const s=subject();const valid=inCurriculum()&&s&&s!=="전체"&&s!=="총론";document.body.classList.toggle("sj-curriculum-flow-enabled",valid);nodes.nav.classList.toggle("hidden",!valid);nodes.body.classList.toggle("hidden",!valid);
    if(!valid){document.body.classList.remove("sj-curriculum-flow-custom");return}
    try{await ensureData()}catch{nodes.body.innerHTML='<div class="sj-flow-empty">교육과정 데이터를 불러오지 못했습니다.</div>';return}
    const {st}=stateFor(s);if(!SECTIONS.some(x=>x[0]===st.section))st.section="design";renderNav(nodes.nav,s,st);
    if(st.sourceMode){document.body.classList.remove("sj-curriculum-flow-custom");nodes.body.classList.add("hidden");return}
    if(st.section==="standards"){
      document.body.classList.remove("sj-curriculum-flow-custom");nodes.body.classList.add("hidden");setCoreStandards(true);return;
    }
    setCoreStandards(false);document.body.classList.add("sj-curriculum-flow-custom");nodes.body.classList.remove("hidden");const items=subjectItems(s);
    if(st.section==="design")renderTextSection(nodes.body,designItems(items),"design","설계 개요",s);
    else if(st.section==="identity")renderTextSection(nodes.body,identityItems(items),"identity","성격·목표",s);
    else if(st.section==="content")renderContent(nodes.body,contentItems(items),s);
    else if(st.section==="teaching")renderTextSection(nodes.body,teachingItems(items),"teaching","교수·학습·평가",s);
    if(forceScroll)requestAnimationFrame(()=>nodes.nav.scrollIntoView({block:"start"}));
  }
  function queueRender(force=false){if(force){render(force);return}if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>render(false))}

  document.addEventListener("click",e=>{if(e.target?.closest?.("#curriculumSpace,#curriculumSubject,#curriculumStandardsBtn,.curriculum-outline-row,.wide-curriculum-row"))setTimeout(queueRender,180)},{capture:true,passive:true});
  document.addEventListener("change",e=>{if(e.target?.id==="curriculumSubject"){const s=e.target.value;if(s)saveSubjectState(s,{sourceMode:false});setTimeout(()=>queueRender(true),120)}},{capture:true,passive:true});
  const start=()=>{ensureStyle();ensureNodes();queueRender();const mo=new MutationObserver(()=>queueRender());mo.observe(document.getElementById("curriculumView")||document.body,{subtree:true,childList:true});};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
