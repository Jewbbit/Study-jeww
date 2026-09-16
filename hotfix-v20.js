(()=>{
  "use strict";

  const VERSION="2026-09-16-standard-typing-game-v1";
  if(window.__studyJewStandardTypingGame===VERSION)return;
  window.__studyJewStandardTypingGame=VERSION;

  const RECORD_KEY="study-jew-standard-typing-record-v1";
  const SCIENCE_DOMAIN_ORDER=["운동과 에너지","물질","생명","지구와 우주","과학과 사회"];
  const SCIENCE_34={
    "01":"운동과 에너지","02":"생명","03":"생명","04":"생명",
    "05":"물질","06":"지구와 우주","07":"운동과 에너지","08":"과학과 사회",
    "09":"운동과 에너지","10":"물질","11":"지구와 우주","12":"물질",
    "13":"지구와 우주","14":"생명"
  };
  const SCIENCE_56={
    "01":"지구와 우주","02":"운동과 에너지","03":"물질","04":"생명",
    "05":"물질","06":"지구와 우주","07":"운동과 에너지","08":"과학과 사회",
    "09":"물질","10":"운동과 에너지","11":"생명","12":"지구와 우주",
    "13":"지구와 우주","14":"물질","15":"운동과 에너지","16":"과학과 사회"
  };

  let game=null;
  let timerId=0;
  let observer=null;

  function scienceDomainFromCode(code){
    const m=String(code||"").match(/^([46])과(\d{2})[-–—−]/);
    if(!m)return "";
    return (m[1]==="4"?SCIENCE_34:SCIENCE_56)[m[2]]||"";
  }

  function installScienceDomains(){
    const base=window.curriculumStandardsGroups;
    if(typeof base!=="function"||base.__sjScienceDomainV20)return;
    const patched=function(subject){
      const groups=base(subject)||[];
      if(subject!=="과학")return groups;
      const mapped=groups.map(g=>{
        const code=g?.standards?.[0]?.code||"";
        const area=scienceDomainFromCode(code)||g.area;
        return {...g,area};
      });
      // orderedGroups() builds its area rank from first appearance. Seed that
      // order with the five official science domains so both toolbar modes
      // produce a visibly different, meaningful sequence.
      return mapped.sort((a,b)=>{
        const ai=SCIENCE_DOMAIN_ORDER.indexOf(a.area),bi=SCIENCE_DOMAIN_ORDER.indexOf(b.area);
        const ar=ai<0?99:ai,br=bi<0?99:bi;
        return (ar-br)||((Number(a.sourceOrder)||0)-(Number(b.sourceOrder)||0));
      });
    };
    patched.__sjScienceDomainV20=true;
    patched.__sjScienceDomainBase=base;
    window.curriculumStandardsGroups=patched;
  }

  function currentStandardsToolbar(){
    return document.querySelector("#curriculumPassage .curriculum-standards-v2-toolbar");
  }

  function forceOrder(subject,mode){
    try{
      const ui=window.curriculumUi?.();
      if(!ui||!subject)return;
      ui.standardOrderBySubject=ui.standardOrderBySubject||{};
      ui.standardPageBySubject=ui.standardPageBySubject||{};
      ui.standardOrderBySubject[subject]=mode;
      ui.standardPageBySubject[subject]=0;
      window.saveLocal?.();
      window.renderCurriculumStandards?.();
      window.curriculumScrollToReadingTop?.();
    }catch(err){console.warn("standard order switch failed",err)}
  }

  function wireOrderButtons(toolbar){
    if(!toolbar)return;
    for(const b of toolbar.querySelectorAll("button")){
      const text=String(b.textContent||"").trim();
      const mode=text==="학년군 → 영역"?"grade-area":text==="영역 → 학년군"?"area-grade":"";
      if(!mode||b.dataset.sjOrderV20)return;
      b.dataset.sjOrderV20="1";
      b.addEventListener("click",e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        const subject=window.curriculumUi?.()?.subject||"";
        forceOrder(subject,mode);
      },true);
    }
  }

  function shieldNoteTabbing(){
    document.querySelectorAll("#curriculumPassage .curriculum-standard-note-strip input,#curriculumPassage .curriculum-standard-note-strip textarea").forEach(el=>{
      el.tabIndex=-1;
      el.dataset.sjTypingSkip="1";
    });
  }

  function gradeRank(g){
    const s=String(g||"");
    return s.startsWith("1")?1:s.startsWith("3")?2:s.startsWith("5")?3:9;
  }
  function areaName(t){return String(t||"").replace(/^\s*\(\d+\)\s*/,"").replace(/^\s*\d+[.)]\s*/,"").trim()}

  function orderedGroupsForGame(subject){
    const groups=window.curriculumStandardsGroups?.(subject)||[];
    const ui=window.curriculumUi?.()||{};
    const mode=ui.standardOrderBySubject?.[subject]||"grade-area";
    const areaOrder=new Map();let n=0;
    for(const g of groups){const a=areaName(g.area||g.title);if(!areaOrder.has(a))areaOrder.set(a,n++)}
    return [...groups].sort((a,b)=>{
      const aa=areaName(a.area||a.title),ba=areaName(b.area||b.title);
      const ai=areaOrder.get(aa)??99,bi=areaOrder.get(ba)??99;
      return mode==="area-grade"
        ? ((ai-bi)||(gradeRank(a.grade)-gradeRank(b.grade))||((Number(a.sourceOrder)||0)-(Number(b.sourceOrder)||0)))
        : ((gradeRank(a.grade)-gradeRank(b.grade))||(ai-bi)||((Number(a.sourceOrder)||0)-(Number(b.sourceOrder)||0)));
    });
  }

  function validSpans(text,spans){
    const s=String(text||""),len=s.length,out=[];
    for(const sp of spans||[]){
      let a=Math.max(0,Math.min(len,Number(sp?.[0])||0));
      let b=Math.max(0,Math.min(len,Number(sp?.[1])||0));
      if(b<a)[a,b]=[b,a];
      while(a<b&&/\s/.test(s[a]||""))a++;
      while(b>a&&/\s/.test(s[b-1]||""))b--;
      if(b>a)out.push([a,b]);
    }
    out.sort((x,y)=>x[0]-y[0]);
    return out;
  }

  function standardSpans(code,text){
    try{return validSpans(text,window.curriculumStore?.()?.standardBlankOverrides?.[code]||[])}catch{return []}
  }

  function buildTasks(subject,scope){
    const groups=orderedGroupsForGame(subject);
    if(!groups.length)return [];
    let selected=groups;
    if(scope==="page"){
      const raw=Number(window.curriculumUi?.()?.standardPageBySubject?.[subject])||0;
      const idx=Math.max(0,Math.min(groups.length-1,raw));
      selected=[groups[idx]];
    }
    const tasks=[];
    for(const g of selected){
      for(const s of g.standards||[]){
        const text=String(s.text||"");
        const spans=standardSpans(s.code,text);
        spans.forEach((sp,spanIndex)=>{
          const answer=text.slice(sp[0],sp[1]);
          if(!answer.trim())return;
          tasks.push({
            subject,grade:g.grade||"",area:areaName(g.area||g.title),unit:g.title||"",
            code:s.code||"",text,span:sp,spanIndex,answer
          });
        });
      }
    }
    return tasks;
  }

  function normalize(text){
    try{if(typeof window.typingNormalize==="function")return window.typingNormalize(text)}catch{}
    return String(text||"").normalize("NFC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,"");
  }
  function esc(s){return String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]))}
  function formatMs(ms){
    ms=Math.max(0,Number(ms)||0);
    const min=Math.floor(ms/60000),sec=Math.floor(ms%60000/1000),tenth=Math.floor(ms%1000/100);
    return `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}.${tenth}`;
  }

  function readRecords(){try{const x=JSON.parse(localStorage.getItem(RECORD_KEY)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
  function recordKey(subject,scope,count){return `${subject}::${scope}::${count}`}
  function bestFor(subject,scope,count){return Number(readRecords()[recordKey(subject,scope,count)]?.bestMs)||0}
  function storeResult(subject,scope,count,elapsed,hints,skips){
    try{
      const all=readRecords(),key=recordKey(subject,scope,count),old=all[key]||{},best=Number(old.bestMs)||0;
      const recent=Array.isArray(old.recent)?old.recent:[];
      recent.unshift({at:Date.now(),ms:elapsed,hints,skips});
      all[key]={bestMs:!best||elapsed<best?elapsed:best,recent:recent.slice(0,5)};
      localStorage.setItem(RECORD_KEY,JSON.stringify(all));
      return !best||elapsed<best;
    }catch{return false}
  }

  function stopTimer(){if(timerId){clearInterval(timerId);timerId=0}}
  function elapsed(){if(!game?.startedAt)return 0;return (game.endedAt||performance.now())-game.startedAt}
  function updateTimer(){
    const el=document.getElementById("sjStandardTypingTimer");
    if(el)el.textContent=formatMs(elapsed());
  }
  function startTimer(){
    if(!game||game.startedAt)return;
    game.startedAt=performance.now();
    game.endedAt=0;
    updateTimer();
    timerId=setInterval(updateTimer,100);
  }

  function setHint(text,kind=""){
    const el=document.getElementById("sjStandardTypingHint");if(!el)return;
    el.textContent=text||"";el.className=`sj-standard-typing-hint${kind?` ${kind}`:""}`;
  }

  function currentTask(){return game?.tasks?.[game.index]||null}
  function renderTask(){
    if(!game)return;
    const task=currentTask();
    if(!task){finishGame();return}
    const progress=document.getElementById("sjStandardTypingProgress");
    const meta=document.getElementById("sjStandardTypingMeta");
    const prompt=document.getElementById("sjStandardTypingPrompt");
    const input=document.getElementById("sjStandardTypingInput");
    if(progress)progress.textContent=`${game.index+1} / ${game.tasks.length}`;
    if(meta)meta.textContent=[task.subject,task.grade,task.area,task.unit,task.code?`[${task.code}]`:""].filter(Boolean).join(" · ");
    if(prompt){
      const [a,b]=task.span;
      prompt.innerHTML=`${esc(task.text.slice(0,a))}<mark>＿＿＿＿</mark>${esc(task.text.slice(b))}`;
    }
    if(input){
      input.value="";input.classList.remove("done","mismatch");input.dataset.target=task.answer;
      requestAnimationFrame(()=>{try{input.focus({preventScroll:true})}catch{input.focus()}});
    }
    setHint("Enter 정답 제출 · Tab 정답 힌트");
  }

  function finishGame(){
    if(!game||game.finished)return;
    game.finished=true;
    game.endedAt=game.startedAt?performance.now():0;
    stopTimer();updateTimer();
    const ms=elapsed(),newBest=game.startedAt?storeResult(game.subject,game.scope,game.tasks.length,ms,game.hints,game.skips):false;
    const body=document.getElementById("sjStandardTypingBody");if(!body)return;
    const best=bestFor(game.subject,game.scope,game.tasks.length);
    body.innerHTML=`
      <div class="sj-standard-typing-result">
        <strong>${game.startedAt?formatMs(ms):"기록 없음"}</strong>
        <span>${game.tasks.length}문항 · 힌트 ${game.hints} · 건너뜀 ${game.skips}${newBest?" · 최고 기록":""}</span>
        ${best?`<small>최고 ${formatMs(best)}</small>`:""}
        <div class="sj-standard-typing-result-actions">
          <button type="button" id="sjStandardTypingRetry" tabindex="-1">다시하기</button>
          <button type="button" id="sjStandardTypingClose2" tabindex="-1">닫기</button>
        </div>
      </div>`;
    document.getElementById("sjStandardTypingRetry")?.addEventListener("click",()=>restartGame());
    document.getElementById("sjStandardTypingClose2")?.addEventListener("click",closeGame);
  }

  function nextTask(skipped=false){
    if(!game)return;
    if(skipped)game.skips++;
    game.index++;
    if(game.index>=game.tasks.length){finishGame();return}
    renderTask();
  }

  function submitCurrent(){
    const task=currentTask(),input=document.getElementById("sjStandardTypingInput");
    if(!task||!input)return;
    const typed=normalize(input.value),answer=normalize(task.answer);
    if(typed&&typed===answer){
      input.classList.add("done");input.classList.remove("mismatch");
      setHint("정답", "ok");
      setTimeout(()=>nextTask(false),120);
    }else{
      input.classList.add("mismatch");input.classList.remove("done");
      setHint("아직 정답이 아닙니다.","bad");
      try{input.focus({preventScroll:true})}catch{input.focus()}
    }
  }

  function showAnswerHint(){
    const task=currentTask();if(!task||!game)return;
    game.hints++;
    setHint(`정답: ${task.answer}`,"answer");
    clearTimeout(game.hintTimer);
    game.hintTimer=setTimeout(()=>{if(game&&!game.finished)setHint("Enter 정답 제출 · Tab 정답 힌트")},1300);
  }

  function installInputHandlers(input){
    input.addEventListener("input",()=>{
      if(!game||game.finished)return;
      if(!game.startedAt&&normalize(input.value))startTimer();
      const task=currentTask();if(!task)return;
      const typed=normalize(input.value),answer=normalize(task.answer);
      const exact=!!typed&&typed===answer,prefix=!!typed&&answer.startsWith(typed);
      input.classList.toggle("done",exact);
      input.classList.toggle("mismatch",!!typed&&!exact&&!prefix);
    });
    input.addEventListener("keydown",e=>{
      if(e.key==="Tab"&&!e.isComposing&&e.keyCode!==229){e.preventDefault();e.stopPropagation();showAnswerHint()}
      else if(e.key==="Escape"){e.preventDefault();closeGame()}
    });
    if(typeof window.bindSafeEnter==="function")window.bindSafeEnter(input,submitCurrent);
    else input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.isComposing&&e.keyCode!==229){e.preventDefault();submitCurrent()}});
  }

  function gameMarkup(subject,scope,tasks){
    const best=bestFor(subject,scope,tasks.length);
    return `
      <div class="sj-standard-typing-card" role="dialog" aria-modal="true" aria-label="성취기준 타자연습">
        <div class="sj-standard-typing-top">
          <div><strong>성취기준 타자연습</strong><span>${esc(subject)}</span></div>
          <div class="sj-standard-typing-clock"><b id="sjStandardTypingTimer">00:00.0</b>${best?`<small>최고 ${formatMs(best)}</small>`:""}</div>
          <button type="button" id="sjStandardTypingClose" tabindex="-1" aria-label="닫기">×</button>
        </div>
        <div class="sj-standard-typing-scope">
          <button type="button" data-sj-scope="all" class="${scope==="all"?"active":""}" tabindex="-1">과목 전체</button>
          <button type="button" data-sj-scope="page" class="${scope==="page"?"active":""}" tabindex="-1">현재 묶음</button>
          <span>${tasks.length}문항</span>
        </div>
        <div id="sjStandardTypingBody" class="sj-standard-typing-body">
          <div class="sj-standard-typing-status"><span id="sjStandardTypingProgress">1 / ${tasks.length}</span><span id="sjStandardTypingMeta"></span></div>
          <div id="sjStandardTypingPrompt" class="sj-standard-typing-prompt"></div>
          <input id="sjStandardTypingInput" class="sj-standard-typing-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="enter" aria-label="빈칸 답 입력">
          <div id="sjStandardTypingHint" class="sj-standard-typing-hint">Enter 정답 제출 · Tab 정답 힌트</div>
          <div class="sj-standard-typing-actions">
            <button type="button" id="sjStandardTypingReveal" tabindex="-1">정답 보기</button>
            <button type="button" id="sjStandardTypingSkip" tabindex="-1">건너뛰기</button>
            <button type="button" id="sjStandardTypingEnd" tabindex="-1">끝내기</button>
          </div>
        </div>
      </div>`;
  }

  function rebuildGame(scope){
    if(!game)return;
    stopTimer();clearTimeout(game.hintTimer);
    const tasks=buildTasks(game.subject,scope);
    game.scope=scope;game.tasks=tasks;game.index=0;game.startedAt=0;game.endedAt=0;game.finished=false;game.hints=0;game.skips=0;
    const overlay=document.getElementById("sjStandardTypingOverlay");if(!overlay)return;
    if(!tasks.length){
      overlay.innerHTML=`<div class="sj-standard-typing-card empty"><div class="sj-standard-typing-top"><div><strong>성취기준 타자연습</strong><span>${esc(game.subject)}</span></div><button type="button" id="sjStandardTypingClose" tabindex="-1">×</button></div><div class="sj-standard-typing-empty">${scope==="page"?"현재 묶음":"이 과목"}에 등록된 성취기준 빈칸이 없습니다.<small>성취기준의 ‘빈칸 편집’에서 연습할 문구를 먼저 지정해 주세요.</small></div></div>`;
      document.getElementById("sjStandardTypingClose")?.addEventListener("click",closeGame);
      return;
    }
    overlay.innerHTML=gameMarkup(game.subject,scope,tasks);
    document.getElementById("sjStandardTypingClose")?.addEventListener("click",closeGame);
    overlay.querySelectorAll("[data-sj-scope]").forEach(b=>b.addEventListener("click",()=>rebuildGame(b.dataset.sjScope||"all")));
    document.getElementById("sjStandardTypingReveal")?.addEventListener("click",showAnswerHint);
    document.getElementById("sjStandardTypingSkip")?.addEventListener("click",()=>nextTask(true));
    document.getElementById("sjStandardTypingEnd")?.addEventListener("click",finishGame);
    const input=document.getElementById("sjStandardTypingInput");if(input)installInputHandlers(input);
    renderTask();
  }

  function restartGame(){
    if(!game)return;
    rebuildGame(game.scope||"all");
  }

  function openGame(){
    try{
      const ui=window.curriculumUi?.();
      const subject=ui?.subject||"";
      if(!subject||subject==="전체"||subject==="총론")return;
      closeGame();
      game={subject,scope:"all",tasks:[],index:0,startedAt:0,endedAt:0,finished:false,hints:0,skips:0,hintTimer:0,previousFocus:document.activeElement};
      const overlay=document.createElement("div");overlay.id="sjStandardTypingOverlay";overlay.className="sj-standard-typing-overlay";
      document.body.append(overlay);document.body.classList.add("sj-standard-typing-open");
      overlay.addEventListener("pointerdown",e=>{if(e.target===overlay)closeGame()});
      rebuildGame("all");
    }catch(err){console.warn("standard typing game failed",err);closeGame()}
  }

  function closeGame(){
    stopTimer();
    if(game?.hintTimer)clearTimeout(game.hintTimer);
    const prev=game?.previousFocus;
    document.getElementById("sjStandardTypingOverlay")?.remove();
    document.body?.classList.remove("sj-standard-typing-open");
    game=null;
    if(prev?.isConnected){setTimeout(()=>{try{prev.focus({preventScroll:true})}catch{}},0)}
  }

  function ensureTypingButton(toolbar){
    if(!toolbar||toolbar.querySelector("#sjStandardTypingGame"))return;
    const b=document.createElement("button");
    b.id="sjStandardTypingGame";b.type="button";b.textContent="⏱ 타자";b.title="성취기준 빈칸 타자연습";
    b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openGame()});
    const hint=toolbar.querySelector(".hint");
    if(hint)toolbar.insertBefore(b,hint);else toolbar.append(b);
  }

  function ensureStyle(){
    if(document.getElementById("sj-standard-typing-style"))return;
    const s=document.createElement("style");s.id="sj-standard-typing-style";
    s.textContent=`
      body.sj-standard-typing-open{overflow:hidden!important}
      #sjStandardTypingGame{white-space:nowrap!important}
      .sj-standard-typing-overlay{position:fixed;inset:0;z-index:10000;background:rgba(25,25,28,.42);display:grid;place-items:center;padding:12px;padding-top:max(12px,env(safe-area-inset-top));padding-bottom:max(12px,env(safe-area-inset-bottom));backdrop-filter:blur(3px)}
      .sj-standard-typing-card{box-sizing:border-box;width:min(720px,100%);max-height:calc(100dvh - 24px);overflow:auto;background:#fff;border-radius:18px;padding:15px;box-shadow:0 18px 60px rgba(0,0,0,.24)}
      .sj-standard-typing-card.empty{max-width:520px}
      .sj-standard-typing-top{display:grid;grid-template-columns:minmax(0,1fr) auto 34px;align-items:center;gap:10px;border-bottom:1px solid #ececef;padding-bottom:10px}
      .sj-standard-typing-top>div:first-child{min-width:0}.sj-standard-typing-top strong{display:block;font-size:17px}.sj-standard-typing-top span{display:block;color:#85868b;font-size:11px;margin-top:2px}
      .sj-standard-typing-top>button{width:34px;height:34px;border:0;border-radius:9px;background:#f1f1f4;font-size:20px;line-height:1}
      .sj-standard-typing-clock{text-align:right;white-space:nowrap}.sj-standard-typing-clock b{display:block;font-variant-numeric:tabular-nums;font-size:16px}.sj-standard-typing-clock small{display:block;color:#929399;font-size:10px;margin-top:1px}
      .sj-standard-typing-scope{display:flex;align-items:center;gap:5px;padding:10px 0 2px}.sj-standard-typing-scope button,.sj-standard-typing-actions button,.sj-standard-typing-result-actions button{border:1px solid #dedee2;background:#fff;border-radius:8px;padding:6px 9px;font:inherit;font-size:11px;color:#5f6065}.sj-standard-typing-scope button.active{background:#292a2e;color:#fff;border-color:#292a2e}.sj-standard-typing-scope span{margin-left:auto;color:#8b8c91;font-size:11px}
      .sj-standard-typing-body{padding-top:10px}.sj-standard-typing-status{display:flex;align-items:center;gap:8px;color:#7d7e83;font-size:11px;margin-bottom:8px}.sj-standard-typing-status span:first-child{font-weight:700;color:#4f5055;white-space:nowrap}.sj-standard-typing-status span:last-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .sj-standard-typing-prompt{font-size:18px;line-height:1.75;font-weight:620;word-break:keep-all;white-space:pre-wrap;background:#f8f8fa;border-radius:12px;padding:13px 14px;min-height:82px}.sj-standard-typing-prompt mark{background:#ece9ff;color:#5548d9;border-radius:4px;padding:1px 4px}
      .sj-standard-typing-input{box-sizing:border-box;width:100%;margin-top:10px;border:2px solid #d4d4d9;border-radius:11px;padding:11px 12px;font:inherit;font-size:17px;outline:none;background:#fff}.sj-standard-typing-input:focus{border-color:#8e8f95}.sj-standard-typing-input.done{border-color:#2f7d50;background:#edf8f1}.sj-standard-typing-input.mismatch{border-color:#bf5a52;background:#fff4f3}
      .sj-standard-typing-hint{min-height:22px;padding:6px 2px 0;color:#929399;font-size:11px}.sj-standard-typing-hint.ok{color:#2f7d50;font-weight:700}.sj-standard-typing-hint.bad{color:#b54d46}.sj-standard-typing-hint.answer{color:#6557e8;font-weight:700}
      .sj-standard-typing-actions{display:flex;gap:5px;justify-content:flex-end;margin-top:6px}.sj-standard-typing-actions button:last-child{margin-left:auto}
      .sj-standard-typing-result{text-align:center;padding:34px 8px 22px}.sj-standard-typing-result>strong{display:block;font-size:34px;font-variant-numeric:tabular-nums}.sj-standard-typing-result>span,.sj-standard-typing-result>small{display:block;color:#7f8085;margin-top:6px}.sj-standard-typing-result-actions{display:flex;justify-content:center;gap:7px;margin-top:18px}.sj-standard-typing-result-actions button:first-child{background:#292a2e;color:#fff;border-color:#292a2e}
      .sj-standard-typing-empty{text-align:center;padding:34px 12px;color:#5e5f64}.sj-standard-typing-empty small{display:block;margin-top:8px;color:#929399;line-height:1.5}
      @media(max-width:699px){.sj-standard-typing-overlay{padding:7px}.sj-standard-typing-card{max-height:calc(100dvh - 14px);border-radius:14px;padding:11px}.sj-standard-typing-prompt{font-size:16px;padding:11px;line-height:1.65}.sj-standard-typing-input{font-size:16px}.sj-standard-typing-top{grid-template-columns:minmax(0,1fr) auto 32px}.sj-standard-typing-top>button{width:32px;height:32px}.sj-standard-typing-scope{overflow-x:auto;white-space:nowrap}}
    `;
    document.head.append(s);
  }

  function apply(){
    installScienceDomains();
    ensureStyle();
    const toolbar=currentStandardsToolbar();
    if(toolbar){wireOrderButtons(toolbar);ensureTypingButton(toolbar);shieldNoteTabbing()}
  }

  let queued=false;
  function queueApply(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }

  function start(){
    apply();
    const root=document.getElementById("curriculumPassage")||document.body;
    observer=new MutationObserver(queueApply);
    observer.observe(root,{subtree:true,childList:true});
    // If science standards were already on screen before this hotfix loaded,
    // repaint once so the official domain labels/order are used immediately.
    try{
      const ui=window.curriculumUi?.();
      if(ui?.subject==="과학"&&window.curriculumStandardsView?.())window.renderCurriculumStandards?.();
    }catch{}
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
