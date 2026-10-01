(()=>{
  "use strict";

  const VERSION="2026-09-15-standards-blank-hotfix-v5-pencil";
  if(window.__studyJewStandardsBlankHotfix===VERSION)return;
  window.__studyJewStandardsBlankHotfix=VERSION;

  const APP_KEY="study-jew-v4";
  const QUICK_KEY="study-jew-v4-study-edit";
  const BACKUP_KEY="study-jew-curriculum-safety-v1";
  const NOTE_SELECTOR=".curriculum-standard-note-strip input, .curriculum-standard-note-strip textarea";
  const STANDARD_MARK_SELECTOR=".curriculum-standard-text mark";
  const EXPLANATION_BODY_SELECTOR=".curriculum-standard-explanation > span";
  const CONSIDERATION_BODY_SELECTOR=".curriculum-standard-consideration > div:last-child";
  const EXPLANATION_STORE_KEY="study-jew-explanation-blanks-v1";
  const CONSIDERATION_STORE_KEY="study-jew-consideration-blanks-v1";
  const DOUBLE_TAP_MS=650;
  const DUPLICATE_EVENT_MS=95;

  let lastTapAt=0,lastTapMark=null,lastPhysicalAt=0,lastPhysicalMark=null;
  let penState=null,touchPenState=null,scheduled=false,flushTimer=0,selectionTimer=0;

  function parse(raw){try{return JSON.parse(raw||"null")}catch{return null}}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
  function curriculumFrom(raw){const x=parse(raw);return clone(x?.study?.curriculumPractice||null)}
  function extraField(key){return key===EXPLANATION_STORE_KEY?"explanationBlankOverrides":key===CONSIDERATION_STORE_KEY?"considerationBlankOverrides":""}
  function object(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
  function loadObject(key){
    const field=extraField(key),merged={};
    if(field){
      for(const storageKey of [APP_KEY,QUICK_KEY]){
        const x=parse(localStorage.getItem(storageKey)),v=x?.study?.curriculumPractice?.[field];
        if(v&&typeof v==="object"&&!Array.isArray(v))Object.assign(merged,v);
      }
    }
    const local=parse(localStorage.getItem(key));if(local&&typeof local==="object"&&!Array.isArray(local))Object.assign(merged,local);
    return merged;
  }
  function saveObject(key,value){
    try{localStorage.setItem(key,JSON.stringify(value))}catch{}
    const field=extraField(key);if(!field)return;
    const now=Date.now();
    for(const storageKey of [APP_KEY,QUICK_KEY]){
      try{
        const x=parse(localStorage.getItem(storageKey));if(!x||typeof x!=="object"||!x.study||typeof x.study!=="object")continue;
        if(!x.study.curriculumPractice||typeof x.study.curriculumPractice!=="object")x.study.curriculumPractice={};
        x.study.curriculumPractice[field]=clone(value)||{};x.study.updatedAt=now;if(storageKey===QUICK_KEY)x.updatedAt=now;
        localStorage.setItem(storageKey,JSON.stringify(x));
      }catch{}
    }
  }

  function snapshotSafety(reason="auto"){
    try{
      const entry={
        at:Date.now(),reason,
        main:curriculumFrom(localStorage.getItem(APP_KEY)),
        quick:curriculumFrom(localStorage.getItem(QUICK_KEY)),
        explanation:loadObject(EXPLANATION_STORE_KEY),
        consideration:loadObject(CONSIDERATION_STORE_KEY)
      };
      if(!entry.main&&!entry.quick&&!Object.keys(entry.explanation).length&&!Object.keys(entry.consideration).length)return;
      const old=parse(localStorage.getItem(BACKUP_KEY));
      const list=Array.isArray(old)?old:[];
      list.push(entry);
      localStorage.setItem(BACKUP_KEY,JSON.stringify(list.slice(-6)));
    }catch{}
  }

  snapshotSafety("preload");

  function forceAppFlushSoon(){
    clearTimeout(flushTimer);
    flushTimer=setTimeout(()=>{
      flushTimer=0;
      try{
        const ev=typeof PageTransitionEvent==="function"?new PageTransitionEvent("pagehide",{persisted:false}):new Event("pagehide");
        window.dispatchEvent(ev);
      }catch{try{window.dispatchEvent(new Event("pagehide"))}catch{}}
      setTimeout(()=>snapshotSafety("after-edit"),850);
    },180);
  }

  function blankEditButton(){
    const toolbar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");
    if(!toolbar)return null;
    return [...toolbar.querySelectorAll("button")].find(b=>String(b.textContent||"").includes("빈칸"))||null;
  }
  function isBlankEditMode(){const b=blankEditButton();return !!(b&&(b.classList.contains("active")||String(b.textContent||"").includes("완료")))}
  function isCopyMode(){return !!document.getElementById("curriculumCopyMode")?.classList.contains("active")}
  function norm(s){return String(s||"").trim().replace(/\s/g,"").toLowerCase()}
  function hash(s){let h=2166136261;for(const ch of String(s||"")){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}

  function validSpans(text,spans){
    const len=String(text||"").length,arr=[];
    for(const sp of spans||[]){let a=Math.max(0,Math.min(len,Number(sp?.[0])||0)),b=Math.max(0,Math.min(len,Number(sp?.[1])||0));if(b<a)[a,b]=[b,a];while(a<b&&/\s/.test(text[a]||""))a++;while(b>a&&/\s/.test(text[b-1]||""))b--;if(b>a)arr.push([a,b])}
    arr.sort((x,y)=>x[0]-y[0]);const out=[];for(const sp of arr){const last=out.at(-1);if(last&&sp[0]<=last[1])last[1]=Math.max(last[1],sp[1]);else out.push(sp)}return out;
  }

  function bodyType(body){if(body?.matches?.(EXPLANATION_BODY_SELECTOR))return "explanation";if(body?.matches?.(CONSIDERATION_BODY_SELECTOR))return "consideration";return ""}
  function bodyStoreKey(type){return type==="explanation"?EXPLANATION_STORE_KEY:CONSIDERATION_STORE_KEY}
  function bodyOriginalKey(type){return type==="explanation"?"sjOriginalExplanation":"sjOriginalConsideration"}
  function bodyTextKey(type){return type==="explanation"?"sjExplanationText":"sjConsiderationText"}
  function bodyDataKey(type){return type==="explanation"?"sjExplanationKey":"sjConsiderationKey"}
  function bodySigKey(type){return type==="explanation"?"sjExplanationSig":"sjConsiderationSig"}
  function bodyBoundKey(type){return type==="explanation"?"sjExplanationBound":"sjConsiderationBound"}
  function bodyMarkClass(type){return type==="explanation"?"sj-explanation-mark":"sj-consideration-mark"}
  function bodyBlankClass(type){return type==="explanation"?"sj-explanation-blank":"sj-consideration-blank"}
  function bodyKey(body,text,type){
    if(type==="explanation"){
      const code=body.closest(".curriculum-standard-item")?.querySelector(".curriculum-standard-code")?.textContent||"";
      return `${code}::${hash(text)}`;
    }
    return `consideration::${hash(text)}`;
  }
  function spansFor(body,text,type){const key=bodyKey(body,text,type),st=loadObject(bodyStoreKey(type));return {key,spans:validSpans(text,st[key]||[])} }
  function setBodySpans(body,text,type,spans){
    const {key}=spansFor(body,text,type),st=loadObject(bodyStoreKey(type)),v=validSpans(text,spans);
    if(v.length)st[key]=v;else delete st[key];
    saveObject(bodyStoreKey(type),st);snapshotSafety(`${type}-blank`);body.dataset[bodySigKey(type)]="";scheduleEnhance();
  }

  function syncNoteInputs(root=document){
    const inputs=root.querySelectorAll?root.querySelectorAll(NOTE_SELECTOR):[],locked=isBlankEditMode();
    inputs.forEach(input=>{
      input.removeAttribute("placeholder");input.placeholder="";
      if(locked){
        if(input.dataset.sjBlankLock!=="1"){
          input.dataset.sjBlankLock="1";
          input.dataset.sjPrevReadonly=input.readOnly?"1":"0";
          input.dataset.sjPrevDisabled=input.disabled?"1":"0";
          input.dataset.sjPrevTab=input.hasAttribute("tabindex")?input.getAttribute("tabindex"):"__none__";
        }
        input.readOnly=true;input.disabled=true;input.setAttribute("tabindex","-1");if(document.activeElement===input)input.blur();
      }else if(input.dataset.sjBlankLock==="1"){
        input.readOnly=input.dataset.sjPrevReadonly==="1";input.disabled=input.dataset.sjPrevDisabled==="1";
        const t=input.dataset.sjPrevTab;if(t==="__none__")input.removeAttribute("tabindex");else if(t!=null)input.setAttribute("tabindex",t);
        delete input.dataset.sjBlankLock;delete input.dataset.sjPrevReadonly;delete input.dataset.sjPrevDisabled;delete input.dataset.sjPrevTab;
      }
    });
  }

  function installStyles(){
    let s=document.getElementById("standard-blank-note-hotfix-style");if(!s){s=document.createElement("style");s.id="standard-blank-note-hotfix-style";document.head.append(s)}
    s.textContent=`
.curriculum-standard-note-strip input::placeholder,.curriculum-standard-note-strip textarea::placeholder{color:transparent!important;opacity:0!important}
body.sj-standard-blank-edit .curriculum-standard-note-strip input,body.sj-standard-blank-edit .curriculum-standard-note-strip textarea{pointer-events:none!important;caret-color:transparent!important;opacity:1!important;-webkit-text-fill-color:currentColor!important}
body.sj-standard-blank-edit ${STANDARD_MARK_SELECTOR},body.sj-standard-blank-edit .sj-explanation-mark,body.sj-standard-blank-edit .sj-consideration-mark{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
${EXPLANATION_BODY_SELECTOR},${CONSIDERATION_BODY_SELECTOR}{touch-action:pan-y!important;-webkit-user-select:text!important;user-select:text!important}
.curriculum-standard-explanation.sj-explanation-editing>span,.curriculum-standard-consideration.sj-consideration-editing>div:last-child{cursor:text!important;touch-action:pan-y!important;-webkit-user-select:text!important;user-select:text!important}
.sj-explanation-mark,.sj-consideration-mark{background:rgba(238,210,73,.45);border-radius:3px;padding:0 1px;color:inherit}
.sj-explanation-blank,.sj-consideration-blank{display:inline-block;box-sizing:border-box;min-width:4.8em;height:27px;vertical-align:middle;margin:0 2px;padding:2px 5px;border:1px solid #bfc0c5;border-radius:5px;background:#fff;font:inherit;font-size:1em;line-height:1.3;outline:none}
.sj-explanation-blank.done,.sj-consideration-blank.done{border:2px solid var(--ui-ok,#2f7d50)!important;background:var(--ui-ok-soft,#edf8f1)!important}
.sj-explanation-blank.mismatch,.sj-consideration-blank.mismatch{border:2px dashed var(--ui-bad,#b65e55)!important;background:var(--ui-bad-soft,#fff0ee)!important}
@media(monochrome){.sj-explanation-mark,.sj-consideration-mark{background:#fff!important;border-bottom:2px solid #111}.sj-explanation-blank.done,.sj-consideration-blank.done{background:#fff!important;border:2px solid #111!important}.sj-explanation-blank.mismatch,.sj-consideration-blank.mismatch{background:#fff!important;border:2px dashed #111!important}}
`;
  }

  function offsetFromPoint(root,x,y){
    let node=null,off=0;
    if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(x,y);node=p?.offsetNode;off=p?.offset||0}else if(document.caretRangeFromPoint){const r=document.caretRangeFromPoint(x,y);node=r?.startContainer;off=r?.startOffset||0}
    if(!node||!root.contains(node))return null;let total=0,found=null;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let t;
    while((t=w.nextNode())){if(t===node){found=total+Math.max(0,Math.min((t.nodeValue||"").length,off));break}total+=(t.nodeValue||"").length}return found;
  }
  function selectedRange(root){
    const sel=window.getSelection();if(!sel||sel.rangeCount<1||sel.isCollapsed)return null;const r=sel.getRangeAt(0);if(!root.contains(r.commonAncestorContainer))return null;
    const pre=document.createRange();pre.selectNodeContents(root);pre.setEnd(r.startContainer,r.startOffset);const a=pre.toString().length,b=a+r.toString().length;return b>a?[a,b]:null;
  }

  function renderExtraBody(body){
    if(!(body instanceof Element))return;const type=bodyType(body);if(!type)return;
    const originalKey=bodyOriginalKey(type),textKey=bodyTextKey(type),dataKey=bodyDataKey(type),sigKey=bodySigKey(type);
    if(!body.dataset[originalKey])body.dataset[originalKey]=body.textContent||"";
    const text=body.dataset[originalKey],found=spansFor(body,text,type),spans=found.spans,edit=isBlankEditMode(),copy=isCopyMode();
    body.dataset[dataKey]=found.key;body.dataset[textKey]=text;
    const sig=`${edit?1:0}:${copy?1:0}:${JSON.stringify(spans)}`;if(body.dataset[sigKey]===sig)return;body.dataset[sigKey]=sig;body.innerHTML="";
    let pos=0;
    spans.forEach((sp,idx)=>{
      if(sp[0]>pos)body.append(document.createTextNode(text.slice(pos,sp[0])));const answer=text.slice(sp[0],sp[1]);
      if(edit){
        const m=document.createElement("mark");m.className=bodyMarkClass(type);m.textContent=answer;m.dataset.sjIndex=String(idx);m.title="두 번 눌러 빈칸 삭제";
        m.addEventListener("dblclick",e=>{e.preventDefault();e.stopPropagation();setBodySpans(body,text,type,spans.filter((_,i)=>i!==idx))});body.append(m);
      }else{
        const input=document.createElement("input");input.type="text";input.className=bodyBlankClass(type);input.autocomplete="off";input.spellcheck=false;input.autocorrect="off";input.autocapitalize="off";input.enterKeyHint="enter";input.style.width=`${Math.max(4.8,Math.min(20,Array.from(answer).length+1.4))}em`;if(copy)input.placeholder=answer;
        const check=()=>{input.classList.remove("done","mismatch");if(!input.value)return false;const ok=norm(input.value)===norm(answer);input.classList.add(ok?"done":"mismatch");return ok};input.addEventListener("input",check);input.addEventListener("compositionend",check);body.append(input);
      }
      pos=sp[1];
    });
    if(pos<text.length)body.append(document.createTextNode(text.slice(pos)));
    body.closest(type==="explanation"?".curriculum-standard-explanation":".curriculum-standard-consideration")?.classList.toggle(type==="explanation"?"sj-explanation-editing":"sj-consideration-editing",edit);
    bindExtraEditor(body,type);
  }

  function addExtraSelection(body,type){
    if(!isBlankEditMode())return false;const sp=selectedRange(body);if(!sp)return false;const text=body.dataset[bodyTextKey(type)]||body.dataset[bodyOriginalKey(type)]||body.textContent||"";const found=spansFor(body,text,type);setBodySpans(body,text,type,[...found.spans,sp]);try{window.getSelection()?.removeAllRanges()}catch{};return true;
  }
  function stylusPointer(e){
    if(e.pointerType==="pen")return true;
    if(e.pointerType!=="touch")return false;
    const w=Number(e.width||0),h=Number(e.height||0),p=Number(e.pressure||0);
    return p>0&&(w<=10||!w)&&(h<=10||!h);
  }
  function stylusTouch(t){
    if(!t)return false;
    if(String(t.touchType||"").toLowerCase()==="stylus")return true;
    const rx=Number(t.radiusX||0),ry=Number(t.radiusY||0),force=Number(t.force||0);
    return force>0&&(rx<=3||!rx)&&(ry<=3||!ry);
  }
  function updateStrokePoint(state,x,y){
    if(!state?.body)return;const o=offsetFromPoint(state.body,x,y);if(o===null)return;state.min=Math.min(state.min,o);state.max=Math.max(state.max,o);
  }
  function finishStroke(state){
    if(!state?.body||state.max<=state.min)return;const type=state.type,text=state.body.dataset[bodyTextKey(type)]||state.body.dataset[bodyOriginalKey(type)]||state.body.textContent||"",found=spansFor(state.body,text,type);setBodySpans(state.body,text,type,[...found.spans,[state.min,state.max]]);try{window.getSelection()?.removeAllRanges()}catch{}
  }
  function bindExtraEditor(body,type){
    const boundKey=bodyBoundKey(type);if(body.dataset[boundKey]==="1")return;body.dataset[boundKey]="1";
    body.addEventListener("pointerdown",e=>{if(!isBlankEditMode()||!stylusPointer(e))return;const o=offsetFromPoint(body,e.clientX,e.clientY);if(o===null)return;e.preventDefault();penState={body,type,min:o,max:o,id:e.pointerId};try{body.setPointerCapture(e.pointerId)}catch{}} ,{passive:false});
    body.addEventListener("pointermove",e=>{if(!penState||penState.body!==body||e.pointerId!==penState.id)return;const points=typeof e.getCoalescedEvents==="function"?e.getCoalescedEvents():[e];for(const p of points)updateStrokePoint(penState,p.clientX,p.clientY);e.preventDefault()},{passive:false});
    body.addEventListener("pointerup",e=>{if(!penState||penState.body!==body||e.pointerId!==penState.id)return;const p=penState;penState=null;updateStrokePoint(p,e.clientX,e.clientY);finishStroke(p);e.preventDefault()},{passive:false});
    body.addEventListener("pointercancel",()=>{penState=null},{passive:true});
    body.addEventListener("touchstart",e=>{if(!isBlankEditMode())return;const t=[...e.changedTouches].find(stylusTouch);if(!t)return;const o=offsetFromPoint(body,t.clientX,t.clientY);if(o===null)return;touchPenState={body,type,min:o,max:o,id:t.identifier};e.preventDefault()},{passive:false});
    body.addEventListener("touchmove",e=>{if(!touchPenState||touchPenState.body!==body)return;const t=[...e.changedTouches].find(x=>x.identifier===touchPenState.id);if(!t)return;updateStrokePoint(touchPenState,t.clientX,t.clientY);e.preventDefault()},{passive:false});
    body.addEventListener("touchend",e=>{if(touchPenState&&touchPenState.body===body){const t=[...e.changedTouches].find(x=>x.identifier===touchPenState.id);if(t){const p=touchPenState;touchPenState=null;updateStrokePoint(p,t.clientX,t.clientY);finishStroke(p);e.preventDefault();return}}if(!isBlankEditMode())return;setTimeout(()=>addExtraSelection(body,type),220)},{passive:false});
    body.addEventListener("mouseup",()=>{if(!isBlankEditMode())return;setTimeout(()=>addExtraSelection(body,type),20)});
  }

  function selectionBody(){
    const sel=window.getSelection();if(!sel||sel.rangeCount<1||sel.isCollapsed)return null;let node=sel.anchorNode;const el=node instanceof Element?node:node?.parentElement;if(!el)return null;
    return el.closest?.(`${EXPLANATION_BODY_SELECTOR},${CONSIDERATION_BODY_SELECTOR}`)||null;
  }
  function scheduleSelectionCapture(){
    clearTimeout(selectionTimer);if(!isBlankEditMode())return;
    selectionTimer=setTimeout(()=>{selectionTimer=0;const body=selectionBody();if(!body)return;const type=bodyType(body);if(type)addExtraSelection(body,type)},420);
  }

  function currentMark(target){const el=target instanceof Element?target:target?.parentElement;const m=el?.closest?.(`${STANDARD_MARK_SELECTOR},.sj-explanation-mark,.sj-consideration-mark`);return m&&document.getElementById("curriculumPassage")?.contains(m)?m:null}
  function deleteMarked(mark,event){
    lastTapAt=0;lastTapMark=null;try{event?.preventDefault?.();event?.stopPropagation?.()}catch{}
    if(mark.classList.contains("sj-explanation-mark")||mark.classList.contains("sj-consideration-mark")){
      const body=mark.closest(`${EXPLANATION_BODY_SELECTOR},${CONSIDERATION_BODY_SELECTOR}`),type=bodyType(body);if(body&&type){const text=body.dataset[bodyTextKey(type)]||body.dataset[bodyOriginalKey(type)]||"",found=spansFor(body,text,type),idx=Number(mark.dataset.sjIndex);if(Number.isInteger(idx))setBodySpans(body,text,type,found.spans.filter((_,i)=>i!==idx))}
    }else{
      mark.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,view:window,detail:2}));forceAppFlushSoon();
    }
    try{window.getSelection()?.removeAllRanges()}catch{}
  }
  function registerTap(event){
    if(!isBlankEditMode())return;const mark=currentMark(event.target);if(!mark)return;const now=Date.now();
    if(mark===lastPhysicalMark&&(now-lastPhysicalAt)<DUPLICATE_EVENT_MS)return;
    lastPhysicalAt=now;lastPhysicalMark=mark;
    const same=mark===lastTapMark&&(now-lastTapAt)<=DOUBLE_TAP_MS;lastTapAt=now;lastTapMark=mark;if(same)deleteMarked(mark,event);
  }

  function enhance(){
    scheduled=false;const edit=isBlankEditMode();document.body?.classList.toggle("sj-standard-blank-edit",edit);syncNoteInputs();
    document.querySelectorAll(EXPLANATION_BODY_SELECTOR).forEach(renderExtraBody);
    document.querySelectorAll(CONSIDERATION_BODY_SELECTOR).forEach(renderExtraBody);
  }
  function scheduleEnhance(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}

  function install(){
    installStyles();scheduleEnhance();
    document.addEventListener("selectionchange",scheduleSelectionCapture,{passive:true});
    document.addEventListener("pointerup",e=>{
      if(e.pointerType==="touch"||e.pointerType==="pen"||!e.pointerType)registerTap(e);
      if(e.target instanceof Element&&e.target.closest(".curriculum-standard-text"))forceAppFlushSoon();
    },{capture:true,passive:false});
    document.addEventListener("touchend",e=>registerTap(e),{capture:true,passive:false});
    document.addEventListener("input",e=>{if(e.target instanceof Element&&e.target.matches(NOTE_SELECTOR))forceAppFlushSoon()},{capture:true,passive:true});
    const observer=new MutationObserver(()=>scheduleEnhance());observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
    window.addEventListener("sj-standards-extra-change",()=>{snapshotSafety("extra-change");scheduleEnhance()});
    setTimeout(()=>snapshotSafety("ready"),1600);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();