(()=>{
  "use strict";

  const VERSION="2026-09-13-standards-blank-hotfix-v3";
  if(window.__studyJewStandardsBlankHotfix===VERSION)return;
  window.__studyJewStandardsBlankHotfix=VERSION;

  const NOTE_SELECTOR=".curriculum-standard-note-strip input, .curriculum-standard-note-strip textarea";
  const STANDARD_MARK_SELECTOR=".curriculum-standard-text mark";
  const EXPLANATION_BODY_SELECTOR=".curriculum-standard-explanation > span";
  const EXPLANATION_STORE_KEY="study-jew-explanation-blanks-v1";
  const DOUBLE_TAP_MS=520;
  let lastTapAt=0,lastTapMark=null,penState=null,scheduled=false;

  function blankEditButton(){
    const toolbar=document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");
    if(!toolbar)return null;
    return [...toolbar.querySelectorAll("button")].find(b=>String(b.textContent||"").includes("빈칸"))||null;
  }
  function isBlankEditMode(){const b=blankEditButton();return !!(b&&(b.classList.contains("active")||String(b.textContent||"").includes("완료")))}
  function isCopyMode(){return !!document.getElementById("curriculumCopyMode")?.classList.contains("active")}
  function norm(s){return String(s||"").trim().replace(/\s/g,"").toLowerCase()}
  function hash(s){let h=2166136261;for(const ch of String(s||"")){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}

  function loadExplanationStore(){try{const x=JSON.parse(localStorage.getItem(EXPLANATION_STORE_KEY)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
  function saveExplanationStore(st){try{localStorage.setItem(EXPLANATION_STORE_KEY,JSON.stringify(st))}catch{}}
  function validSpans(text,spans){
    const len=String(text||"").length,arr=[];
    for(const sp of spans||[]){let a=Math.max(0,Math.min(len,Number(sp?.[0])||0)),b=Math.max(0,Math.min(len,Number(sp?.[1])||0));if(b<a)[a,b]=[b,a];while(a<b&&/\s/.test(text[a]||""))a++;while(b>a&&/\s/.test(text[b-1]||""))b--;if(b>a)arr.push([a,b])}
    arr.sort((x,y)=>x[0]-y[0]);const out=[];for(const sp of arr){const last=out.at(-1);if(last&&sp[0]<=last[1])last[1]=Math.max(last[1],sp[1]);else out.push(sp)}return out;
  }
  function explanationKey(body,text){const code=body.closest(".curriculum-standard-item")?.querySelector(".curriculum-standard-code")?.textContent||"";return `${code}::${hash(text)}`}
  function explanationSpans(key,text){return validSpans(text,loadExplanationStore()[key]||[])}
  function setExplanationSpans(key,text,spans){const st=loadExplanationStore(),v=validSpans(text,spans);if(v.length)st[key]=v;else delete st[key];saveExplanationStore(st);scheduleEnhance()}

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
body.sj-standard-blank-edit ${STANDARD_MARK_SELECTOR},body.sj-standard-blank-edit .sj-explanation-mark{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
.curriculum-standard-explanation.sj-explanation-editing>span{cursor:text;-webkit-user-select:text!important;user-select:text!important}
.sj-explanation-mark{background:rgba(238,210,73,.45);border-radius:3px;padding:0 1px;color:inherit}
.sj-explanation-blank{display:inline-block;box-sizing:border-box;min-width:4.8em;height:27px;vertical-align:middle;margin:0 2px;padding:2px 5px;border:1px solid #bfc0c5;border-radius:5px;background:#fff;font:inherit;font-size:1em;line-height:1.3;outline:none}
.sj-explanation-blank.done{border:2px solid var(--ui-ok,#2f7d50)!important;background:var(--ui-ok-soft,#edf8f1)!important}.sj-explanation-blank.mismatch{border:2px dashed var(--ui-bad,#b65e55)!important;background:var(--ui-bad-soft,#fff0ee)!important}
@media(monochrome){.sj-explanation-mark{background:#fff!important;border-bottom:2px solid #111}.sj-explanation-blank.done{background:#fff!important;border:2px solid #111!important}.sj-explanation-blank.mismatch{background:#fff!important;border:2px dashed #111!important}}
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

  function renderExplanation(body){
    if(!(body instanceof Element))return;
    if(!body.dataset.sjOriginalExplanation)body.dataset.sjOriginalExplanation=body.textContent||"";
    const text=body.dataset.sjOriginalExplanation,key=explanationKey(body,text),spans=explanationSpans(key,text),edit=isBlankEditMode(),copy=isCopyMode();
    body.dataset.sjExplanationKey=key;body.dataset.sjExplanationText=text;
    const sig=`${edit?1:0}:${copy?1:0}:${JSON.stringify(spans)}`;if(body.dataset.sjRenderSig===sig)return;body.dataset.sjRenderSig=sig;body.innerHTML="";
    let pos=0;
    spans.forEach((sp,idx)=>{
      if(sp[0]>pos)body.append(document.createTextNode(text.slice(pos,sp[0])));const answer=text.slice(sp[0],sp[1]);
      if(edit){const m=document.createElement("mark");m.className="sj-explanation-mark";m.textContent=answer;m.dataset.sjKey=key;m.dataset.sjIndex=String(idx);m.title="두 번 눌러 빈칸 삭제";m.addEventListener("dblclick",e=>{e.preventDefault();e.stopPropagation();setExplanationSpans(key,text,spans.filter((_,i)=>i!==idx))});body.append(m)}
      else{const input=document.createElement("input");input.type="text";input.className="sj-explanation-blank";input.autocomplete="off";input.spellcheck=false;input.autocorrect="off";input.autocapitalize="off";input.enterKeyHint="enter";input.style.width=`${Math.max(4.8,Math.min(20,Array.from(answer).length+1.4))}em`;if(copy)input.placeholder=answer;const check=()=>{input.classList.remove("done","mismatch");if(!input.value)return false;const ok=norm(input.value)===norm(answer);input.classList.add(ok?"done":"mismatch");return ok};input.addEventListener("input",check);input.addEventListener("compositionend",check);body.append(input)}
      pos=sp[1];
    });
    if(pos<text.length)body.append(document.createTextNode(text.slice(pos)));
    body.closest(".curriculum-standard-explanation")?.classList.toggle("sj-explanation-editing",edit);
    bindExplanationEditor(body);
  }

  function addExplanationSelection(body){
    if(!isBlankEditMode())return;const sp=selectedRange(body);if(!sp)return;const text=body.dataset.sjExplanationText||"",key=body.dataset.sjExplanationKey||explanationKey(body,text);setExplanationSpans(key,text,[...explanationSpans(key,text),sp]);try{window.getSelection()?.removeAllRanges()}catch{}
  }
  function bindExplanationEditor(body){
    if(body.dataset.sjBlankBound==="1")return;body.dataset.sjBlankBound="1";
    body.addEventListener("pointerdown",e=>{if(!isBlankEditMode()||e.pointerType!=="pen"||e.target.closest("mark"))return;const o=offsetFromPoint(body,e.clientX,e.clientY);if(o===null)return;e.preventDefault();penState={body,min:o,max:o,id:e.pointerId};try{body.setPointerCapture(e.pointerId)}catch{}});
    body.addEventListener("pointermove",e=>{if(!penState||penState.body!==body||e.pointerId!==penState.id)return;const o=offsetFromPoint(body,e.clientX,e.clientY);if(o===null)return;penState.min=Math.min(penState.min,o);penState.max=Math.max(penState.max,o)});
    body.addEventListener("pointerup",e=>{if(!penState||penState.body!==body||e.pointerId!==penState.id)return;const p=penState;penState=null;const o=offsetFromPoint(body,e.clientX,e.clientY);if(o!==null){p.min=Math.min(p.min,o);p.max=Math.max(p.max,o)}if(p.max>p.min){const text=body.dataset.sjExplanationText||"",key=body.dataset.sjExplanationKey||explanationKey(body,text);setExplanationSpans(key,text,[...explanationSpans(key,text),[p.min,p.max]])}try{window.getSelection()?.removeAllRanges()}catch{}});
    body.addEventListener("mouseup",()=>{if(!isBlankEditMode())return;setTimeout(()=>addExplanationSelection(body),0)});
    body.addEventListener("touchend",()=>{if(!isBlankEditMode())return;setTimeout(()=>addExplanationSelection(body),90)},{passive:true});
  }

  function currentMark(target){const el=target instanceof Element?target:target?.parentElement;const m=el?.closest?.(`${STANDARD_MARK_SELECTOR}, .sj-explanation-mark`);return m&&document.getElementById("curriculumPassage")?.contains(m)?m:null}
  function deleteMarked(mark,event){
    lastTapAt=0;lastTapMark=null;try{event?.preventDefault?.();event?.stopPropagation?.()}catch{}
    if(mark.classList.contains("sj-explanation-mark")){
      const body=mark.closest(EXPLANATION_BODY_SELECTOR),text=body?.dataset.sjExplanationText||body?.dataset.sjOriginalExplanation||"",key=mark.dataset.sjKey||body?.dataset.sjExplanationKey,idx=Number(mark.dataset.sjIndex);if(key&&Number.isInteger(idx))setExplanationSpans(key,text,explanationSpans(key,text).filter((_,i)=>i!==idx));
    }else mark.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,view:window,detail:2}));
    try{window.getSelection()?.removeAllRanges()}catch{}
  }
  function registerTap(event){
    if(!isBlankEditMode())return;const mark=currentMark(event.target);if(!mark)return;const now=Date.now(),same=mark===lastTapMark&&(now-lastTapAt)<=DOUBLE_TAP_MS;lastTapAt=now;lastTapMark=mark;if(same)deleteMarked(mark,event);
  }

  function enhance(){
    scheduled=false;const edit=isBlankEditMode();document.body?.classList.toggle("sj-standard-blank-edit",edit);syncNoteInputs();
    document.querySelectorAll(EXPLANATION_BODY_SELECTOR).forEach(renderExplanation);
  }
  function scheduleEnhance(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}

  function install(){
    installStyles();scheduleEnhance();
    document.addEventListener("pointerup",e=>{if(e.pointerType==="touch"||e.pointerType==="pen")registerTap(e)},{capture:true,passive:false});
    const observer=new MutationObserver(()=>scheduleEnhance());observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
