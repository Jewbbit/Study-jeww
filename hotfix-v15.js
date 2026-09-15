(()=>{
  "use strict";
  const VERSION="2026-09-15-curriculum-subject-flow-v2";
  if(window.__sjCurriculumSubjectFlow2===VERSION)return;
  window.__sjCurriculumSubjectFlow2=VERSION;

  const DATA_URL="./curriculum-v6.json?v=20260913-logical-v6";
  const STATE_KEY="study-jew-curriculum-flow-v2";
  const SECTIONS=[["design","설계 개요"],["identity","성격·목표"],["content","내용체계"],["standards","성취기준"],["teaching","교수·학습·평가"]];
  let data=null,loading=null,queued=false;

  function readState(){try{const x=JSON.parse(localStorage.getItem(STATE_KEY)||"{}");return x&&typeof x==="object"?x:{}}catch{return {}}}
  function writeState(x){try{localStorage.setItem(STATE_KEY,JSON.stringify(x))}catch{}}
  function subject(){return document.getElementById("curriculumSubject")?.value||"전체"}
  function activeCurriculum(){return !!document.getElementById("curriculumSpace")?.classList.contains("active")}
  function stateFor(s){const all=readState();if(!all[s])all[s]={section:"design",sourceMode:false};return {all,st:all[s]}}
  function saveState(s,patch){const {all,st}=stateFor(s);Object.assign(st,patch);all[s]=st;writeState(all)}
  async function ensureData(){if(data)return data;if(loading)return loading;loading=fetch(DATA_URL,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(x=>data=x).finally(()=>loading=null);return loading}

  function style(){
    let s=document.getElementById("sj-curriculum-flow-v2-style");if(!s){s=document.createElement("style");s.id="sj-curriculum-flow-v2-style";document.head.append(s)}
    s.textContent=`
#sjCurriculumFlowNav2{display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none;margin:1px 0 9px;padding:2px 0 5px;border-bottom:1px solid #ececef}
#sjCurriculumFlowNav2::-webkit-scrollbar{display:none}#sjCurriculumFlowNav2 button{flex:0 0 auto;border:0;background:transparent;border-radius:7px;padding:7px 9px;font-size:.72em;color:#77787d;white-space:nowrap}#sjCurriculumFlowNav2 button.active{background:#292a2e;color:#fff;font-weight:700}#sjCurriculumFlowNav2 .sj-flow-back{margin-left:auto;border:1px solid #dedee2;background:#fff;color:#56575c}
#sjCurriculumFlowBody2{padding:1px 0 30px;font-size:var(--curriculum-font-size,17px);line-height:1.8;color:#2d2e32}.sj-flow2-head{display:flex;align-items:center;gap:8px;margin:4px 0 11px;padding-bottom:8px;border-bottom:1px solid #e8e8eb}.sj-flow2-head strong{font-size:1.08em}.sj-flow2-head span{font-size:.68em;color:#929399}
.sj-flow2-card{margin:0 0 11px;padding:13px 14px;border:1px solid #e4e4e7;border-radius:9px;background:#fff}.sj-flow2-card h3{margin:0 0 7px;font-size:.84em;color:#45464b}.sj-flow2-text{white-space:pre-wrap;word-break:keep-all;overflow-wrap:anywhere}.sj-flow2-open{margin-top:9px;border:1px solid #dedee2;background:#fafafa;border-radius:7px;padding:6px 8px;font-size:.66em;color:#62636a}.sj-flow2-visual{display:block;max-width:100%;height:auto;margin:10px auto;border:1px solid #e1e1e4;border-radius:7px;background:#fff}
.sj-table2-card{margin:0 0 15px;padding:8px;border:1px solid #dfdfe3;border-radius:9px;background:#fff}.sj-table2-card h3{margin:2px 3px 7px;font-size:.76em;color:#55565c}.sj-table2-img{display:block;width:100%;height:auto;border:1px solid #cfd0d4;background:#fff;cursor:zoom-in}.sj-table2-note{margin:6px 2px 0;font-size:.6em;color:#929399}.sj-flow2-empty{padding:28px 12px;text-align:center;color:#898a90;font-size:.78em}
#sjFlowImageModal2{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.76);display:flex;flex-direction:column;padding:12px}#sjFlowImageModal2.hidden{display:none!important}#sjFlowImageModal2 .head{display:flex;justify-content:flex-end;padding-bottom:8px}#sjFlowImageModal2 .head button{border:0;border-radius:8px;background:#fff;padding:8px 11px}#sjFlowImageModal2 .scroll{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#fff;border-radius:8px}#sjFlowImageModal2 .scroll img{display:block;min-width:1200px;width:100%;height:auto}
body.sj-flow2-custom #curriculumPassage,body.sj-flow2-custom #curriculumSourceNote,body.sj-flow2-custom #curriculumEditPanel,body.sj-flow2-custom #curriculumContext,body.sj-flow2-custom #curriculumPageDock,body.sj-flow2-custom #curriculumFloatTools,body.sj-flow2-custom .curriculum-status{display:none!important}body.sj-flow2-custom #curriculumModebar .curriculum-mode-switch,body.sj-flow2-custom #curriculumBlankEditBtn,body.sj-flow2-custom #curriculumResetBtn{display:none!important}body.sj-flow2-enabled #curriculumStandardsBtn{display:none!important}
@media(max-width:699px){#sjCurriculumFlowNav2 button{padding:6px 7px;font-size:.67em}.sj-flow2-card{padding:10px 11px}#sjFlowImageModal2{padding:6px}#sjFlowImageModal2 .scroll img{min-width:1000px}}@media(monochrome){#sjCurriculumFlowNav2 button.active{background:#111;color:#fff}.sj-flow2-card,.sj-table2-card,.sj-table2-img{border-color:#111!important}#sjFlowImageModal2{background:#fff}}
`;
  }

  function nodes(){
    const passage=document.getElementById("curriculumPassage"),parent=passage?.parentElement;if(!passage||!parent)return null;
    let nav=document.getElementById("sjCurriculumFlowNav2");if(!nav){nav=document.createElement("div");nav.id="sjCurriculumFlowNav2";parent.insertBefore(nav,document.getElementById("curriculumContext")||passage)}
    let body=document.getElementById("sjCurriculumFlowBody2");if(!body){body=document.createElement("div");body.id="sjCurriculumFlowBody2";parent.insertBefore(body,passage)}
    let modal=document.getElementById("sjFlowImageModal2");if(!modal){modal=document.createElement("div");modal.id="sjFlowImageModal2";modal.className="hidden";modal.innerHTML='<div class="head"><button type="button">닫기</button></div><div class="scroll"><img alt="내용체계 확대"></div>';modal.querySelector("button").onclick=()=>modal.classList.add("hidden");modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden")});document.body.append(modal)}
    return {nav,body,modal};
  }
  function coreStandards(){const b=document.getElementById("curriculumStandardsBtn");return !!(b&&(b.classList.contains("active")||String(b.textContent||"").includes("원문 보기")))}
  function setCoreStandards(on){const b=document.getElementById("curriculumStandardsBtn");if(b&&coreStandards()!==!!on)b.click()}
  function items(s){return (data?.items||[]).filter(x=>x.s===s)}
  function lab(x){return String(x?.logicalLabel||"").trim()}
  function design(xs){return xs.filter(x=>lab(x).includes("교육과정 설계의 개요"))}
  function identity(xs){return xs.filter(x=>/(^|\s|\.)성격$/.test(lab(x))||/(^|\s|\.)목표$/.test(lab(x)))}
  function content(xs){return xs.filter(x=>lab(x).includes("내용 체계"))}
  function teaching(xs){const i=xs.findIndex(x=>/교수[⋅·ㆍ・]?학습.*평가/.test(lab(x))||/교수[⋅·ㆍ・]?학습.*평가/.test(String(x.t||"").slice(0,90)));return i>=0?xs.slice(i).filter(x=>!lab(x).includes("성취기준 적용 시 고려")):xs.filter(x=>/교수[⋅·ㆍ・]?학습|평가/.test(lab(x))&&!lab(x).includes("적용 시 고려"))}
  function stripHeading(t){const s=String(t||""),i=s.indexOf("\n");return i>=0?s.slice(i+1).replace(/^\s+/,""):s}
  function esc(s){return String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[ch]))}
  function wrap(text,max){const out=[];for(const raw of String(text||"").split(/\n/)){if(!raw){out.push("");continue}let s=raw;while(s.length>max){let cut=max;for(let i=max;i>Math.max(4,max-12);i--){if(/[\s·⋅,.)]/.test(s[i]||"")){cut=i+1;break}}out.push(s.slice(0,cut).trimEnd());s=s.slice(cut).trimStart()}out.push(s)}return out}
  function widths(n){if(n===6)return [170,410,145,291,291,293];if(n===5)return [180,440,150,415,415];if(n===4)return [200,500,180,720];if(n===3)return [240,520,840];const q=Math.floor(1600/Math.max(1,n)),a=Array(n).fill(q);a[a.length-1]+=1600-q*n;return a}
  function tableImage(table,title){
    const rows=Array.isArray(table?.rows)?table.rows:[],n=Math.max(1,...rows.map(r=>Array.isArray(r)?r.length:0)),cw=widths(n),x=[0];for(const w of cw)x.push(x.at(-1)+w);const cells=[];rows.forEach((row,r)=>(row||[]).forEach((cell,c)=>{if(cell)cells.push({r,c,cell,rs:Math.max(1,Number(cell.rs)||1),cs:Math.max(1,Number(cell.cs)||1)})}));const rh=rows.map(()=>74);
    for(const p of cells){const w=x[Math.min(n,p.c+p.cs)]-x[p.c]-20,lines=wrap(p.cell.t,Math.max(5,Math.floor(w/22)));p.lines=lines;p.need=Math.max(60,lines.length*28+22);if(p.rs===1)rh[p.r]=Math.max(rh[p.r],p.need)}
    for(const p of cells){if(p.rs<=1)continue;const e=Math.min(rows.length,p.r+p.rs);let have=0;for(let r=p.r;r<e;r++)have+=rh[r];if(have<p.need){const add=(p.need-have)/(e-p.r);for(let r=p.r;r<e;r++)rh[r]+=add}}
    const y=[52];for(const h of rh)y.push(y.at(-1)+h);const H=Math.ceil(y.at(-1)+16);let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${H}" viewBox="0 0 1600 ${H}"><rect width="1600" height="${H}" fill="white"/><text x="12" y="33" font-family="Apple SD Gothic Neo,Noto Sans KR,sans-serif" font-size="24" font-weight="700" fill="#34353a">${esc(title)}</text>`;
    for(const p of cells){const x0=x[p.c],x1=x[Math.min(n,p.c+p.cs)],y0=y[p.r],y1=y[Math.min(rows.length,p.r+p.rs)],head=p.r<2;svg+=`<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" fill="${head?'#f4f4f6':'#fff'}" stroke="#bfc0c5" stroke-width="1.3"/>`;let ty=y0+24;for(const line of p.lines||[]){svg+=`<text x="${x0+10}" y="${ty}" font-family="Apple SD Gothic Neo,Noto Sans KR,sans-serif" font-size="21" ${head?'font-weight="700"':''} fill="#292a2e">${esc(line)}</text>`;ty+=28}}
    svg+="</svg>";return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  function zoom(src){const m=document.getElementById("sjFlowImageModal2");if(!m)return;m.querySelector("img").src=src;m.classList.remove("hidden");m.querySelector(".scroll").scrollTo(0,0)}

  function openOriginal(item,section){const s=subject();saveState(s,{section,sourceMode:true});document.body.classList.remove("sj-flow2-custom");setCoreStandards(false);setTimeout(()=>{document.getElementById("curriculumOutlineBtn")?.click();setTimeout(()=>{const rs=[...document.querySelectorAll("#curriculumOutlinePanel .curriculum-outline-row,.wide-curriculum-row")],t=rs.find(r=>String(r.textContent||"").trim()===lab(item))||rs.find(r=>String(r.textContent||"").includes(lab(item)));t?.click()},130)},150);schedule()}
  function renderText(body,xs,section,title,s){body.innerHTML="";const head=document.createElement("div");head.className="sj-flow2-head";head.innerHTML=`<strong>${title}</strong><span>${s}</span>`;body.append(head);if(!xs.length){body.innerHTML+='<div class="sj-flow2-empty">이 구간의 원문을 찾지 못했습니다.</div>';return}for(const item of xs){const card=document.createElement("section");card.className="sj-flow2-card";const h=document.createElement("h3");h.textContent=lab(item)||title;const t=document.createElement("div");t.className="sj-flow2-text";t.textContent=stripHeading(item.t);card.append(h,t);for(const v of item.visuals||[]){const img=document.createElement("img");img.className="sj-flow2-visual";img.loading="lazy";img.alt=v.caption||"교육과정 도식";img.src=`./curriculum-assets/${v.src}`;card.append(img)}const b=document.createElement("button");b.type="button";b.className="sj-flow2-open";b.textContent="이 구간 원문에서 연습·편집";b.onclick=()=>openOriginal(item,section);card.append(b);body.append(card)}}
  function renderContent(body,xs,s){body.innerHTML="";const head=document.createElement("div");head.className="sj-flow2-head";head.innerHTML=`<strong>내용체계</strong><span>${s} · 이미지 표시</span>`;body.append(head);let n=0;for(const item of xs){for(let i=0;i<(item.tables||[]).length;i++){const title=(lab(item)||"내용 체계")+((item.tables||[]).length>1?` ${i+1}`:""),src=tableImage(item.tables[i],title),card=document.createElement("section");card.className="sj-table2-card";const h=document.createElement("h3");h.textContent=title;const img=document.createElement("img");img.className="sj-table2-img";img.alt=`${s} ${title}`;img.src=src;img.onclick=()=>zoom(src);const note=document.createElement("div");note.className="sj-table2-note";note.textContent="표를 누르면 크게 볼 수 있습니다.";card.append(h,img,note);body.append(card);n++}}if(!n){const e=document.createElement("div");e.className="sj-flow2-empty";e.textContent="내용체계 표 데이터를 찾지 못했습니다.";body.append(e)}}
  function renderNav(nav,s,st){nav.innerHTML="";for(const [k,t] of SECTIONS){const b=document.createElement("button");b.type="button";b.textContent=t;b.classList.toggle("active",!st.sourceMode&&st.section===k);b.onclick=()=>{saveState(s,{section:k,sourceMode:false});render(true)};nav.append(b)}if(st.sourceMode){const back=document.createElement("button");back.type="button";back.className="sj-flow-back";back.textContent="분류 보기";back.onclick=()=>{saveState(s,{sourceMode:false});render(true)};nav.append(back)}}

  async function render(scroll=false){queued=false;style();const n=nodes();if(!n)return;const s=subject(),ok=activeCurriculum()&&s&&s!=="전체"&&s!=="총론";document.body.classList.toggle("sj-flow2-enabled",ok);n.nav.classList.toggle("hidden",!ok);n.body.classList.toggle("hidden",!ok);if(!ok){document.body.classList.remove("sj-flow2-custom");return}try{await ensureData()}catch{n.body.innerHTML='<div class="sj-flow2-empty">교육과정 데이터를 불러오지 못했습니다.</div>';return}const {st}=stateFor(s);if(!SECTIONS.some(x=>x[0]===st.section))st.section="design";renderNav(n.nav,s,st);if(st.sourceMode){document.body.classList.remove("sj-flow2-custom");n.body.classList.add("hidden");return}if(st.section==="standards"){document.body.classList.remove("sj-flow2-custom");n.body.classList.add("hidden");setCoreStandards(true);return}setCoreStandards(false);document.body.classList.add("sj-flow2-custom");n.body.classList.remove("hidden");const xs=items(s);if(st.section==="design")renderText(n.body,design(xs),"design","설계 개요",s);else if(st.section==="identity")renderText(n.body,identity(xs),"identity","성격·목표",s);else if(st.section==="content")renderContent(n.body,content(xs),s);else renderText(n.body,teaching(xs),"teaching","교수·학습·평가",s);if(scroll)requestAnimationFrame(()=>n.nav.scrollIntoView({block:"start"}))}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>render(false))}

  document.addEventListener("click",e=>{if(e.target?.closest?.("#curriculumSpace,#curriculumStandardsBtn,.curriculum-outline-row,.wide-curriculum-row"))setTimeout(schedule,180)},{capture:true,passive:true});
  document.addEventListener("change",e=>{if(e.target?.id==="curriculumSubject"){const s=e.target.value;if(s)saveState(s,{sourceMode:false});setTimeout(()=>render(true),120)}},{capture:true,passive:true});
  const start=()=>{style();nodes();setTimeout(schedule,250)};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
