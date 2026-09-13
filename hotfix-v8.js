(()=>{
  "use strict";

  const VERSION="2026-09-13-consideration-pencil-v3-overdraw";
  if(window.__studyJewConsiderationPencilHotfix===VERSION)return;
  window.__studyJewConsiderationPencilHotfix=VERSION;

  const BODY_SELECTOR=".curriculum-standard-consideration > div:last-child";
  const STORE_KEY="study-jew-consideration-blanks-v1";
  let stroke=null;

  function isBlankEditMode(){
    const toolbar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");
    if(!toolbar)return false;
    const b=[...toolbar.querySelectorAll("button")].find(x=>String(x.textContent||"").includes("빈칸"));
    return !!(b&&(b.classList.contains("active")||String(b.textContent||"").includes("완료")));
  }

  function hash(s){let h=2166136261;for(const ch of String(s||"")){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
  function loadStore(){try{const x=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
  function validSpans(text,spans){
    const len=String(text||"").length,arr=[];
    for(const sp of spans||[]){let a=Math.max(0,Math.min(len,Number(sp?.[0])||0)),b=Math.max(0,Math.min(len,Number(sp?.[1])||0));if(b<a)[a,b]=[b,a];while(a<b&&/\s/.test(text[a]||""))a++;while(b>a&&/\s/.test(text[b-1]||""))b--;if(b>a)arr.push([a,b])}
    arr.sort((x,y)=>x[0]-y[0]);const out=[];for(const sp of arr){const last=out.at(-1);if(last&&sp[0]<=last[1])last[1]=Math.max(last[1],sp[1]);else out.push(sp)}return out;
  }
  function originalText(body){return body.dataset.sjOriginalConsideration||body.dataset.sjConsiderationText||body.textContent||""}
  function bodyKey(body,text){return `consideration::${hash(text)}`}
  function saveSpan(body,a,b){
    const text=originalText(body),key=bodyKey(body,text),st=loadStore(),next=validSpans(text,[...(st[key]||[]),[a,b]]);
    if(!next.length)return;
    st[key]=next;
    try{localStorage.setItem(STORE_KEY,JSON.stringify(st))}catch{}
    body.dataset.sjConsiderationSig="";
    document.body.classList.toggle("sj-consideration-paint-pulse");
  }

  function offsetFromPoint(root,x,y){
    let node=null,off=0;
    if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(x,y);node=p?.offsetNode;off=p?.offset||0}
    else if(document.caretRangeFromPoint){const r=document.caretRangeFromPoint(x,y);node=r?.startContainer;off=r?.startOffset||0}
    if(!node||!root.contains(node))return null;
    let total=0,found=null;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let t;
    while((t=w.nextNode())){if(t===node){found=total+Math.max(0,Math.min((t.nodeValue||"").length,off));break}total+=(t.nodeValue||"").length}
    return found;
  }

  function stylusLike(e){
    if(e.pointerType==="pen")return true;
    return e.pointerType==="touch"&&Number(e.width||99)<=4&&Number(e.height||99)<=4&&Number(e.pressure||0)>0;
  }
  function bodyFromEvent(e){const el=e.target instanceof Element?e.target:e.target?.parentElement;return el?.closest?.(BODY_SELECTOR)||null}

  function onDown(e){
    if(!isBlankEditMode()||!stylusLike(e))return;
    const body=bodyFromEvent(e);if(!body)return;
    const o=offsetFromPoint(body,e.clientX,e.clientY);if(o===null)return;
    e.preventDefault();
    stroke={body,id:e.pointerId,min:o,max:o};
    try{body.setPointerCapture(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!stroke||e.pointerId!==stroke.id)return;
    const points=typeof e.getCoalescedEvents==="function"?e.getCoalescedEvents():[e];
    for(const p of points){const o=offsetFromPoint(stroke.body,p.clientX,p.clientY);if(o===null)continue;stroke.min=Math.min(stroke.min,o);stroke.max=Math.max(stroke.max,o)}
    e.preventDefault();
  }
  function onUp(e){
    if(!stroke||e.pointerId!==stroke.id)return;
    const s=stroke;stroke=null;
    const o=offsetFromPoint(s.body,e.clientX,e.clientY);if(o!==null){s.min=Math.min(s.min,o);s.max=Math.max(s.max,o)}
    if(s.max>s.min)saveSpan(s.body,s.min,s.max);
    try{window.getSelection()?.removeAllRanges()}catch{}
    e.preventDefault();
  }
  function onCancel(){stroke=null}

  function install(){
    if(!document.getElementById("sj-consideration-pencil-style")){
      const s=document.createElement("style");s.id="sj-consideration-pencil-style";
      s.textContent=`body.sj-standard-blank-edit ${BODY_SELECTOR}{cursor:text!important;touch-action:pan-y!important;-webkit-user-select:text!important;user-select:text!important}`;
      document.head.append(s);
    }
    document.addEventListener("pointerdown",onDown,{capture:true,passive:false});
    document.addEventListener("pointermove",onMove,{capture:true,passive:false});
    document.addEventListener("pointerup",onUp,{capture:true,passive:false});
    document.addEventListener("pointercancel",onCancel,{capture:true,passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
