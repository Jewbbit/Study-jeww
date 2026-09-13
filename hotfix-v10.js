(()=>{
  "use strict";

  const VERSION="2026-09-13-curriculum-recovery-v1";
  if(window.__studyJewCurriculumRecovery===VERSION)return;
  window.__studyJewCurriculumRecovery=VERSION;

  const APP_KEY="study-jew-v4";
  const QUICK_KEY="study-jew-v4-study-edit";
  const BACKUP_KEY="study-jew-curriculum-safety-v1";
  const PENDING_KEY="study-jew-curriculum-restore-pending-v1";
  const RESTORED_KEY="study-jew-curriculum-auto-restored-v1";
  const BEFORE_KEY="study-jew-curriculum-before-restore-v1";
  const EXPLANATION_KEY="study-jew-explanation-blanks-v1";
  const CONSIDERATION_KEY="study-jew-consideration-blanks-v1";

  function parse(raw){try{return JSON.parse(raw||"null")}catch{return null}}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
  function object(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
  function curriculumFromRaw(raw){return clone(parse(raw)?.study?.curriculumPractice||null)}
  function score(v){
    if(v==null)return 0;
    if(Array.isArray(v))return v.reduce((n,x)=>n+score(x),v.length?1:0);
    if(typeof v==="object")return Object.entries(v).reduce((n,[k,x])=>n+(x==null?0:1)+score(x),0);
    if(typeof v==="string")return v.trim()?1:0;
    if(typeof v==="boolean")return v?1:0;
    if(typeof v==="number")return Number.isFinite(v)&&v!==0?1:0;
    return 0;
  }
  function countStandards(cp){
    const c=object(cp),sp=object(c.standardBlankOverrides),notes=object(c.standardNotes);
    let blanks=0;for(const xs of Object.values(sp))if(Array.isArray(xs))blanks+=xs.length;
    let filledNotes=0;for(const n of Object.values(notes)){if(!n||typeof n!=="object")continue;if(String(n.content||"").trim())filledNotes++;if(String(n.memo||"").trim())filledNotes++}
    return {blanks,filledNotes};
  }
  function backups(){const x=parse(localStorage.getItem(BACKUP_KEY));return Array.isArray(x)?x.filter(v=>v&&typeof v==="object"):[]}
  function snapshotCp(entry){return clone(entry?.quick||entry?.main||null)}

  function writeRecovered(entry,reason="restore"){
    const cp=snapshotCp(entry);if(!cp)return false;
    const now=Date.now()+10000;
    try{
      const app=parse(localStorage.getItem(APP_KEY))||{};
      if(!app.study||typeof app.study!=="object")app.study={};
      app.study.curriculumPractice=clone(cp);app.study.updatedAt=now;
      localStorage.setItem(APP_KEY,JSON.stringify(app));

      const quick=parse(localStorage.getItem(QUICK_KEY))||{};
      const study=quick.study&&typeof quick.study==="object"?quick.study:clone(app.study);
      study.curriculumPractice=clone(cp);study.updatedAt=now;
      localStorage.setItem(QUICK_KEY,JSON.stringify({study,updatedAt:now}));

      if(entry.explanation&&typeof entry.explanation==="object")localStorage.setItem(EXPLANATION_KEY,JSON.stringify(entry.explanation));
      if(entry.consideration&&typeof entry.consideration==="object")localStorage.setItem(CONSIDERATION_KEY,JSON.stringify(entry.consideration));
      localStorage.setItem(RESTORED_KEY,JSON.stringify({at:Date.now(),backupAt:Number(entry.at)||0,reason}));
      return true;
    }catch{return false}
  }

  // 수동 복구를 예약한 경우 모듈이 localStorage를 읽기 전에 먼저 적용한다.
  const pending=parse(localStorage.getItem(PENDING_KEY));
  if(pending?.entry){
    try{localStorage.removeItem(PENDING_KEY)}catch{}
    writeRecovered(pending.entry,"manual");
  }else{
    // 최근 새로고침 직후 현재 상태가 안전 백업보다 현저히 작아진 경우에만 자동 복구한다.
    const list=backups(),current=curriculumFromRaw(localStorage.getItem(QUICK_KEY))||curriculumFromRaw(localStorage.getItem(APP_KEY));
    const currentScore=score(current),recent=list.filter(x=>Date.now()-(Number(x.at)||0)<2*60*60*1000);
    const best=recent.map(x=>({entry:x,cp:snapshotCp(x),s:score(snapshotCp(x))})).filter(x=>x.cp).sort((a,b)=>b.s-a.s||((Number(b.entry.at)||0)-(Number(a.entry.at)||0)))[0];
    const already=parse(localStorage.getItem(RESTORED_KEY));
    if(best&&best.s>=Math.max(4,currentScore+4)&&Number(already?.backupAt||0)!==Number(best.entry.at||0)){
      try{localStorage.setItem(BEFORE_KEY,JSON.stringify({at:Date.now(),curriculumPractice:current}))}catch{}
      writeRecovered(best.entry,"auto-loss-guard");
    }
  }

  function fmtTime(ts){try{return new Date(Number(ts)||0).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch{return ""}}
  function installRecoveryUi(){
    const list=backups();if(!list.length||document.getElementById("sjCurriculumBackupBtn"))return;
    const btn=document.createElement("button");btn.id="sjCurriculumBackupBtn";btn.type="button";btn.textContent="백업";btn.title="교육과정 편집 백업 보기";
    btn.style.cssText="position:fixed;right:12px;bottom:12px;z-index:9998;border:1px solid #d7d7dc;background:#fff;color:#555;border-radius:9px;padding:6px 9px;font:inherit;font-size:11px;box-shadow:0 3px 12px rgba(0,0,0,.12)";
    btn.onclick=()=>{
      document.getElementById("sjCurriculumBackupModal")?.remove();
      const back=document.createElement("div");back.id="sjCurriculumBackupModal";back.style.cssText="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;padding:18px";
      const box=document.createElement("div");box.style.cssText="width:min(420px,100%);max-height:78vh;overflow:auto;background:#fff;border-radius:14px;padding:14px;box-shadow:0 12px 40px rgba(0,0,0,.2)";
      const h=document.createElement("strong");h.textContent="교육과정 편집 백업";box.append(h);
      const p=document.createElement("p");p.textContent="복구할 시점을 직접 고르세요. 선택하기 전에는 현재 데이터를 덮어쓰지 않습니다.";p.style.cssText="font-size:11px;color:#777;line-height:1.5";box.append(p);
      [...list].reverse().forEach(entry=>{
        const cp=snapshotCp(entry),c=countStandards(cp),b=document.createElement("button");b.type="button";
        const ex=Object.keys(object(entry.explanation)).length,co=Object.keys(object(entry.consideration)).length;
        b.textContent=`${fmtTime(entry.at)} · 성취기준 빈칸 ${c.blanks} · 내용/메모 ${c.filledNotes} · 해설 ${ex} · 고려 ${co}`;
        b.style.cssText="display:block;width:100%;margin:6px 0;border:1px solid #e2e2e6;background:#fafafa;border-radius:8px;padding:9px;text-align:left;font:inherit;font-size:11px";
        b.onclick=()=>{
          if(!confirm(`${fmtTime(entry.at)} 백업으로 교육과정 편집 내용을 복구할까요?`))return;
          try{localStorage.setItem(PENDING_KEY,JSON.stringify({entry,requestedAt:Date.now()}))}catch{return}
          location.reload();
        };
        box.append(b);
      });
      const close=document.createElement("button");close.type="button";close.textContent="닫기";close.style.cssText="width:100%;margin-top:8px;border:0;background:transparent;padding:8px;color:#777";close.onclick=()=>back.remove();box.append(close);back.append(box);back.onclick=e=>{if(e.target===back)back.remove()};document.body.append(back);
    };
    document.body.append(btn);

    const restored=parse(localStorage.getItem(RESTORED_KEY));
    if(restored&&Date.now()-(Number(restored.at)||0)<15000){
      const toast=document.createElement("div");toast.textContent="교육과정 편집 안전 백업을 복구했습니다";toast.style.cssText="position:fixed;left:50%;bottom:52px;transform:translateX(-50%);z-index:9999;background:#222;color:#fff;border-radius:16px;padding:7px 11px;font-size:11px";document.body.append(toast);setTimeout(()=>toast.remove(),4200);
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installRecoveryUi,{once:true});else installRecoveryUi();
})();
