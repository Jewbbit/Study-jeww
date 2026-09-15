(()=>{
  "use strict";
  const VERSION="2026-09-15-standards-extra-pencil-v1";
  if(window.__sjStandardsExtraPencil===VERSION)return;
  window.__sjStandardsExtraPencil=VERSION;

  const EXPLANATION_SELECTOR=".curriculum-standard-explanation > span";
  const CONSIDERATION_SELECTOR=".curriculum-standard-consideration > div:last-child";
  const EXPLANATION_KEY="study-jew-explanation-blanks-v1";
  const CONSIDERATION_KEY="study-jew-consideration-blanks-v1";
  const APP_KEYS=["study-jew-v4","study-jew-v4-study-edit"];
  let stroke=null,touchStroke=null,raf=0;

  function parse(raw){try{return JSON.parse(raw||"null")}catch{return null}}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
  function isBlankEdit(){
    const bar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");
    if(!bar)return false;
    const b=[...bar.querySelectorAll("button")].find(x=>String(x.textContent||"").includes("빈칸"));
    return !!(b&&(b.classList.contains("active")||String(b.textContent||"").includes("완료")));
  }
  function closestBody(target){
    const el=target instanceof Element?target:target?.parentElement;
    return el?.closest?.(`${EXPLANATION_SELECTOR},${CONSIDERATION_SELECTOR}`)||null;
  }
  function typeOf(body){return body?.matches?.(EXPLANATION_SELECTOR)?"explanation":body?.matches?.(CONSIDERATION_SELECTOR)?"consideration":""}
  function storeKey(type){return type==="explanation"?EXPLANATION_KEY:CONSIDERATION_KEY}
  function fieldKey(type){return type==="explanation"?"explanationBlankOverrides":"considerationBlankOverrides"}
  function textOf(body,type){
    return String(type==="explanation"?(body.dataset.sjExplanationText||body.dataset.sjOriginalExplanation||body.textContent||""):(body.dataset.sjConsiderationText||body.dataset.sjOriginalConsideration||body.textContent||""));
  }
  function hash(s){let h=2166136261;for(const ch of String(s||"")){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
  function blankKey(body,text,type){
    if(type==="explanation"){
      const code=body.closest(".curriculum-standard-item")?.querySelector(".curriculum-standard-code")?.textContent||"";
      return `${code}::${hash(text)}`;
    }
    return `consideration::${hash(text)}`;
  }
  function validSpans(text,spans){
    const len=String(text||"").length,arr=[];
    for(const sp of spans||[]){
      let a=Math.max(0,Math.min(len,Number(sp?.[0])||0)),b=Math.max(0,Math.min(len,Number(sp?.[1])||0));
      if(b<a)[a,b]=[b,a];while(a<b&&/\s/.test(text[a]||""))a++;while(b>a&&/\s/.test(text[b-1]||""))b--;if(b>a)arr.push([a,b]);
    }
    arr.sort((x,y)=>x[0]-y[0]);const out=[];
    for(const sp of arr){const last=out.at(-1);if(last&&sp[0]<=last[1])last[1]=Math.max(last[1],sp[1]);else out.push(sp.slice())}
    return out;
  }
  function loadStore(type){const x=parse(localStorage.getItem(storeKey(type)));return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}
  function saveStore(type,value){
    try{localStorage.setItem(storeKey(type),JSON.stringify(value))}catch{}
    const field=fieldKey(type),now=Date.now();
    for(const k of APP_KEYS){
      try{
        const x=parse(localStorage.getItem(k));if(!x||typeof x!=="object"||!x.study||typeof x.study!=="object")continue;
        if(!x.study.curriculumPractice||typeof x.study.curriculumPractice!=="object")x.study.curriculumPractice={};
        x.study.curriculumPractice[field]=clone(value)||{};x.study.updatedAt=now;if(k.endsWith("study-edit"))x.updatedAt=now;
        localStorage.setItem(k,JSON.stringify(x));
      }catch{}
    }
  }
  function pointOffset(root,x,y){
    try{
      let node=null,off=0;
      if(typeof document.caretPositionFromPoint==="function"){
        const p=document.caretPositionFromPoint(x,y);if(p){node=p.offsetNode;off=p.offset}
      }
      if(!node&&typeof document.caretRangeFromPoint==="function"){
        const r=document.caretRangeFromPoint(x,y);if(r){node=r.startContainer;off=r.startOffset}
      }
      if(!node||!(node===root||root.contains(node)))return null;
      const r=document.createRange();r.selectNodeContents(root);r.setEnd(node,off);
      return Math.max(0,Math.min((root.textContent||"").length,r.toString().length));
    }catch{return null}
  }
  function domPoint(root,offset){
    let left=Math.max(0,Number(offset)||0),last=null,node;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while((node=w.nextNode())){last=node;const len=(node.nodeValue||"").length;if(left<=len)return {node,offset:left};left-=len}
    return last?{node:last,offset:(last.nodeValue||"").length}:{node:root,offset:0};
  }
  function showSelection(st){
    if(!st?.body)return;try{
      const a=domPoint(st.body,st.min),b=domPoint(st.body,st.max),r=document.createRange();r.setStart(a.node,a.offset);r.setEnd(b.node,b.offset);
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);st.body.classList.add("sj-extra-pen-dragging");
    }catch{}
  }
  function update(st,x,y){const o=pointOffset(st.body,x,y);if(o===null)return false;st.min=Math.min(st.min,o);st.max=Math.max(st.max,o);return true}
  function finish(st){
    if(!st?.body)return;
    st.body.classList.remove("sj-extra-pen-dragging");
    try{window.getSelection()?.removeAllRanges()}catch{}
    if(!st.moved||st.max<=st.min)return;
    const spans=validSpans(st.text,[[...st.spans],].flat().concat([[st.min,st.max]]));
    const store=loadStore(st.type);if(spans.length)store[st.key]=spans;else delete store[st.key];saveStore(st.type,store);
    if(st.type==="explanation")st.body.dataset.sjExplanationSig="";else st.body.dataset.sjConsiderationSig="";
    window.dispatchEvent(new CustomEvent("sj-standards-extra-change",{detail:{type:st.type,key:st.key}}));
  }
  function pointerStylus(e){
    if(e.pointerType==="pen")return true;
    if(e.pointerType!=="touch")return false;
    const w=Number(e.width||0),h=Number(e.height||0),p=Number(e.pressure||0);return p>0&&(w<=8||!w)&&(h<=8||!h);
  }
  function touchStylus(t){
    if(!t)return false;if(String(t.touchType||"").toLowerCase()==="stylus")return true;
    const rx=Number(t.radiusX||0),ry=Number(t.radiusY||0),f=Number(t.force||0);return f>0&&(rx<=4||!rx)&&(ry<=4||!ry);
  }
  function makeStroke(body,id,x,y){
    const type=typeOf(body),text=textOf(body,type),o=pointOffset(body,x,y);if(!type||o===null)return null;
    const key=blankKey(body,text,type),store=loadStore(type),spans=validSpans(text,store[key]||[]);
    return {body,type,text,key,spans,id,startX:x,startY:y,min:o,max:o,moved:false};
  }

  function installStyle(){
    let s=document.getElementById("sj-extra-pencil-style");if(!s){s=document.createElement("style");s.id="sj-extra-pencil-style";document.head.append(s)}
    s.textContent=`
      body.sj-standard-blank-edit ${EXPLANATION_SELECTOR},body.sj-standard-blank-edit ${CONSIDERATION_SELECTOR}{touch-action:none!important;-webkit-user-select:text!important;user-select:text!important;cursor:crosshair!important}
      body.sj-standard-blank-edit ${EXPLANATION_SELECTOR}.sj-extra-pen-dragging::selection,body.sj-standard-blank-edit ${EXPLANATION_SELECTOR}.sj-extra-pen-dragging *::selection,body.sj-standard-blank-edit ${CONSIDERATION_SELECTOR}.sj-extra-pen-dragging::selection,body.sj-standard-blank-edit ${CONSIDERATION_SELECTOR}.sj-extra-pen-dragging *::selection{background:#f0df78!important;color:inherit!important}
    `;
  }

  document.addEventListener("pointerdown",e=>{
    if(!isBlankEdit()||!pointerStylus(e))return;const body=closestBody(e.target);if(!body)return;
    const st=makeStroke(body,e.pointerId,e.clientX,e.clientY);if(!st)return;stroke=st;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{body.setPointerCapture(e.pointerId)}catch{};try{window.getSelection()?.removeAllRanges()}catch{}
  },{capture:true,passive:false});
  document.addEventListener("pointermove",e=>{
    if(!stroke||stroke.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const pts=typeof e.getCoalescedEvents==="function"?e.getCoalescedEvents():[e];let ok=false;for(const p of pts)ok=update(stroke,p.clientX,p.clientY)||ok;
    if(Math.hypot(e.clientX-stroke.startX,e.clientY-stroke.startY)>4)stroke.moved=true;
    if(ok&&!raf)raf=requestAnimationFrame(()=>{raf=0;if(stroke)showSelection(stroke)});
  },{capture:true,passive:false});
  document.addEventListener("pointerup",e=>{
    if(!stroke||stroke.id!==e.pointerId)return;const st=stroke;stroke=null;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();update(st,e.clientX,e.clientY);finish(st);
  },{capture:true,passive:false});
  document.addEventListener("pointercancel",e=>{if(stroke&&stroke.id===e.pointerId){stroke.body?.classList.remove("sj-extra-pen-dragging");stroke=null;try{window.getSelection()?.removeAllRanges()}catch{}}},{capture:true,passive:true});

  document.addEventListener("touchstart",e=>{
    if(!isBlankEdit())return;const body=closestBody(e.target);if(!body)return;const t=[...e.changedTouches].find(touchStylus);if(!t)return;
    const st=makeStroke(body,t.identifier,t.clientX,t.clientY);if(!st)return;touchStroke=st;e.preventDefault();e.stopPropagation();
  },{capture:true,passive:false});
  document.addEventListener("touchmove",e=>{
    if(!touchStroke)return;const t=[...e.changedTouches].find(x=>x.identifier===touchStroke.id);if(!t)return;e.preventDefault();e.stopPropagation();update(touchStroke,t.clientX,t.clientY);if(Math.hypot(t.clientX-touchStroke.startX,t.clientY-touchStroke.startY)>4)touchStroke.moved=true;showSelection(touchStroke);
  },{capture:true,passive:false});
  document.addEventListener("touchend",e=>{
    if(!touchStroke)return;const t=[...e.changedTouches].find(x=>x.identifier===touchStroke.id);if(!t)return;const st=touchStroke;touchStroke=null;e.preventDefault();e.stopPropagation();update(st,t.clientX,t.clientY);finish(st);
  },{capture:true,passive:false});

  installStyle();
})();
