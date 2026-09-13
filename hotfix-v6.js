(()=>{
  "use strict";

  const NOTE_SELECTOR = ".curriculum-standard-note-element, .curriculum-standard-note-memo";
  const DOUBLE_TAP_MS = 380;
  let lastTapAt = 0;
  let lastTapMark = null;

  function isBlankEditMode(){
    return document.body?.classList.contains("standard-blank-edit");
  }

  function syncNoteInputs(root=document){
    const inputs = root.querySelectorAll ? root.querySelectorAll(NOTE_SELECTOR) : [];
    const locked = isBlankEditMode();
    inputs.forEach((input)=>{
      // 안내용 예시 문구는 실제 메모/내용 요소와 헷갈리므로 표시하지 않는다.
      input.removeAttribute("placeholder");

      if(locked){
        if(input.dataset.blankModeLock !== "1"){
          input.dataset.blankModeLock = "1";
          input.dataset.blankModePrevReadonly = input.readOnly ? "1" : "0";
          input.dataset.blankModePrevTabindex = input.hasAttribute("tabindex")
            ? input.getAttribute("tabindex")
            : "__none__";
        }
        input.readOnly = true;
        input.setAttribute("tabindex", "-1");
        if(document.activeElement === input) input.blur();
      }else if(input.dataset.blankModeLock === "1"){
        input.readOnly = input.dataset.blankModePrevReadonly === "1";
        const prevTab = input.dataset.blankModePrevTabindex;
        if(prevTab === "__none__") input.removeAttribute("tabindex");
        else if(prevTab != null) input.setAttribute("tabindex", prevTab);
        delete input.dataset.blankModeLock;
        delete input.dataset.blankModePrevReadonly;
        delete input.dataset.blankModePrevTabindex;
      }
    });
  }

  function installStyles(){
    if(document.getElementById("standard-blank-note-hotfix-style")) return;
    const style = document.createElement("style");
    style.id = "standard-blank-note-hotfix-style";
    style.textContent = `
      body.standard-blank-edit .curriculum-standard-note-input{
        pointer-events:none !important;
        -webkit-user-select:none !important;
        user-select:none !important;
        caret-color:transparent !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 기존 코드는 mouse dblclick만 처리해서 iPad/모바일의 더블탭이 빠진다.
  // 두 번째 탭에서 기존 dblclick 핸들러를 그대로 재사용해 mark를 제거한다.
  function onTouchEndCapture(event){
    if(!isBlankEditMode()) return;
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const mark = target?.closest?.('mark[data-standard-blank="1"]');
    if(!mark) return;

    const now = Date.now();
    const isDoubleTap = mark === lastTapMark && (now - lastTapAt) <= DOUBLE_TAP_MS;
    lastTapAt = now;
    lastTapMark = mark;

    if(!isDoubleTap) return;

    lastTapAt = 0;
    lastTapMark = null;
    event.preventDefault();
    event.stopPropagation();

    mark.dispatchEvent(new MouseEvent("dblclick", {
      bubbles:true,
      cancelable:true,
      view:window,
      detail:2
    }));

    try{ window.getSelection()?.removeAllRanges(); }catch(_error){}
  }

  function install(){
    installStyles();
    syncNoteInputs();

    document.addEventListener("touchend", onTouchEndCapture, {capture:true, passive:false});

    const observer = new MutationObserver((mutations)=>{
      let modeChanged = false;
      const addedRoots = [];

      for(const mutation of mutations){
        if(mutation.type === "attributes" && mutation.target === document.body){
          modeChanged = true;
        }
        if(mutation.type === "childList"){
          mutation.addedNodes.forEach((node)=>{
            if(node instanceof Element) addedRoots.push(node);
          });
        }
      }

      if(modeChanged) syncNoteInputs();
      addedRoots.forEach((root)=>{
        if(root.matches?.(NOTE_SELECTOR)) syncNoteInputs(root.parentElement || document);
        else if(root.querySelector?.(NOTE_SELECTOR)) syncNoteInputs(root);
      });
    });

    observer.observe(document.body, {
      subtree:true,
      childList:true,
      attributes:true,
      attributeFilter:["class"]
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", install, {once:true});
  }else{
    install();
  }
})();
