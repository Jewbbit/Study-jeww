(()=>{
  "use strict";

  const VERSION="2026-09-16-curriculum-local-first-v1";
  if(window.__studyJewCurriculumLocalFirst===VERSION)return;
  window.__studyJewCurriculumLocalFirst=VERSION;

  const LOCAL_KEY="study-jew-curriculum-local-v1";
  const EXP_KEY="study-jew-explanation-blanks-v1";
  const CON_KEY="study-jew-consideration-blanks-v1";
  const DB_NAME="study-jew-local-v1";
  const DB_STORE="kv";
  const DB_KEY="curriculum";
  const CLOUD_DELAY=8000;

  let memoryEnvelope=null;
  let cloudTimer=0;
  let restoring=false;
  let idbReady=false;

  function parse(raw){try{return JSON.parse(raw||"null")}catch{return null}}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
  function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
  function meaningful(v){
    if(v==null)return false;
    if(Array.isArray(v))return v.length>0;
    if(typeof v==="object")return Object.values(v).some(meaningful);
    if(typeof v==="string")return !!v.trim();
    if(typeof v==="boolean")return v;
    if(typeof v==="number")return Number.isFinite(v)&&v!==0;
    return false;
  }
  function currentCp(){return window.app?.study?.curriculumPractice&&typeof window.app.study.curriculumPractice==="object"?window.app.study.curriculumPractice:null}
  function readSidecar(key){const x=parse(localStorage.getItem(key));return x&&typeof x==="object"&&!Array.isArray(x)?x:null}
  function withLegacySidecars(cp){
    const out=clone(cp)||{};
    const exp=readSidecar(EXP_KEY),con=readSidecar(CON_KEY);
    if(exp)out.explanationBlankOverrides=clone(exp);
    if(con)out.considerationBlankOverrides=clone(con);
    return out;
  }
  function readEnvelope(){
    if(memoryEnvelope?.curriculumPractice)return memoryEnvelope;
    const x=parse(localStorage.getItem(LOCAL_KEY));
    if(x?.curriculumPractice&&typeof x.curriculumPractice==="object"){
      memoryEnvelope=x;
      return x;
    }
    return null;
  }
  function writeLocalStorage(env){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(env));return true}catch{return false}}

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error("indexedDB unavailable"));return}
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("indexedDB open failed"));
    });
  }
  async function idbPut(env){
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(env,DB_KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});
      db.close();idbReady=true;
    }catch{}
  }
  async function idbGet(){
    try{
      const db=await openDb();
      const value=await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readonly"),req=tx.objectStore(DB_STORE).get(DB_KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)});
      db.close();idbReady=true;return value;
    }catch{return null}
  }

  function saveQuick(){
    try{if(typeof window.saveStudyQuickNow==="function")window.saveStudyQuickNow()}catch{}
  }
  function persistNow(reason="local"){
    if(restoring)return readEnvelope();
    const cp=currentCp();
    if(!cp)return readEnvelope();
    const existing=readEnvelope();
    if(!existing&&!meaningful(cp))return null;
    const finalCp=withLegacySidecars(cp);
    const env={version:1,updatedAt:Date.now(),reason,curriculumPractice:finalCp};
    memoryEnvelope=env;
    writeLocalStorage(env);
    idbPut(env);
    saveQuick();
    return env;
  }
  function applyEnvelope(env,{render=true}={}){
    if(!env?.curriculumPractice||!window.app?.study)return false;
    restoring=true;
    try{
      window.app.study.curriculumPractice=clone(env.curriculumPractice)||{};
      window.app.study.updatedAt=Math.max(Number(window.app.study.updatedAt)||0,Number(env.updatedAt)||0);
      const cp=window.app.study.curriculumPractice;
      if(cp.explanationBlankOverrides&&typeof cp.explanationBlankOverrides==="object")try{localStorage.setItem(EXP_KEY,JSON.stringify(cp.explanationBlankOverrides))}catch{}
      if(cp.considerationBlankOverrides&&typeof cp.considerationBlankOverrides==="object")try{localStorage.setItem(CON_KEY,JSON.stringify(cp.considerationBlankOverrides))}catch{}
      memoryEnvelope={...env,curriculumPractice:clone(cp)};
      writeLocalStorage(memoryEnvelope);
      idbPut(memoryEnvelope);
      saveQuick();
    }finally{restoring=false}
    if(render&&window.app?.ui?.workspace==="curriculum"){
      try{if(typeof window.renderCurriculum==="function")window.renderCurriculum()}catch{}
      try{if(typeof window.renderWidePlannerSide==="function")window.renderWidePlannerSide()}catch{}
    }
    return true;
  }

  function bootstrap(){
    const env=readEnvelope();
    if(env){applyEnvelope(env,{render:false});return}
    const cp=currentCp();
    if(cp&&meaningful(cp))persistNow("bootstrap-existing");
    idbGet().then(saved=>{
      if(readEnvelope()||!saved?.curriculumPractice)return;
      memoryEnvelope=saved;applyEnvelope(saved,{render:true});
    });
  }

  const baseSchedule=typeof window.scheduleCurriculumCloud==="function"?window.scheduleCurriculumCloud:null;
  if(baseSchedule){
    window.scheduleCurriculumCloud=function(){
      persistNow("curriculum-change");
      clearTimeout(cloudTimer);
      cloudTimer=setTimeout(()=>{cloudTimer=0;try{baseSchedule(0)}catch{}},CLOUD_DELAY);
    };
  }

  const baseSaveLocal=typeof window.saveLocal==="function"?window.saveLocal:null;
  if(baseSaveLocal){
    window.saveLocal=function(...args){
      const out=baseSaveLocal.apply(this,args);
      try{
        const cp=currentCp(),env=readEnvelope();
        if(window.app?.ui?.workspace==="curriculum"&&(env||meaningful(cp)))persistNow("save-local");
      }catch{}
      return out;
    };
  }

  const baseMerge=typeof window.mergeCloudStudy==="function"?window.mergeCloudStudy:null;
  if(baseMerge){
    window.mergeCloudStudy=function(...args){
      const localBefore=readEnvelope()||persistNow("before-cloud");
      const out=baseMerge.apply(this,args);
      const after=()=>{
        if(localBefore?.curriculumPractice)applyEnvelope(localBefore,{render:true});
        else if(currentCp()&&meaningful(currentCp()))persistNow("cloud-seed");
      };
      if(out&&typeof out.then==="function")out.finally(()=>setTimeout(after,0));else setTimeout(after,0);
      return out;
    };
  }

  const baseManual=typeof window.sjSaveCurriculumStandardEdits==="function"?window.sjSaveCurriculumStandardEdits:null;
  window.sjSaveCurriculumStandardEdits=function(...args){
    persistNow("manual-save");
    return baseManual?baseManual.apply(this,args):true;
  };

  function relevantTarget(target){
    const el=target instanceof Element?target:target?.parentElement;
    if(!el)return false;
    return !!el.closest("#curriculumView,#widePlannerSide");
  }
  function afterUiEvent(e){if(!relevantTarget(e.target))return;setTimeout(()=>persistNow(`ui-${e.type}`),0)}
  document.addEventListener("input",afterUiEvent,false);
  document.addEventListener("change",afterUiEvent,false);
  document.addEventListener("compositionend",afterUiEvent,false);
  document.addEventListener("pointerup",afterUiEvent,false);

  window.addEventListener("pagehide",()=>persistNow("pagehide"),{capture:true});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")persistNow("hidden")});

  window.sjCurriculumLocalStatus=()=>{
    const env=readEnvelope(),cp=env?.curriculumPractice||currentCp()||{};
    return {
      version:VERSION,
      local:!!env,
      updatedAt:Number(env?.updatedAt)||0,
      considerationAssignments:Object.keys(obj(cp.considerationAssignments)).length,
      standardBlanks:Object.keys(obj(cp.standardBlankOverrides)).length,
      standardNotes:Object.keys(obj(cp.standardNotes)).length,
      explanationBlanks:Object.keys(obj(cp.explanationBlankOverrides)).length,
      considerationBlanks:Object.keys(obj(cp.considerationBlankOverrides)).length,
      idbReady
    };
  };

  bootstrap();
})();
