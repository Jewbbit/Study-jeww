const CACHE_NAME="study-jew-pwa-v30-quiz-durable";
const FALLBACK_URL="./edit.html";
const HOTFIX_SRCS=[
  "./hotfix-v6.js?v=20260916-1",
  "./hotfix-v9.js?v=20260913-2",
  "./hotfix-v11.js?v=20260915-3",
  "./hotfix-v19.js?v=20260916-1"
];

const APP_STYLE=`<style id="study-jew-runtime-style">
#plannerQuickBtn{width:auto!important;min-width:38px!important;max-width:none!important;height:33px!important;padding:5px 6px!important;font-size:9px!important;line-height:1!important;white-space:nowrap!important;letter-spacing:-.15px!important;flex:0 0 auto!important}
body.quiz-running .workspace-switch{display:inline-flex!important}
.curriculum-standard-note-strip{grid-template-columns:minmax(0,1.6fr) minmax(160px,.9fr)!important;align-items:start!important}
.curriculum-standard-note-field{align-items:start!important}
.curriculum-standard-note-field textarea{box-sizing:border-box!important;width:100%!important;min-height:31px!important;max-height:110px!important;overflow:auto!important}
.curriculum-standard-note-field:first-child textarea{min-height:48px!important;resize:vertical!important;padding-top:5px!important;padding-bottom:5px!important}
@media(max-width:699px){.curriculum-standard-note-strip{grid-template-columns:1fr!important}.curriculum-standard-note-field:first-child textarea{min-height:54px!important}}
</style>`;

function appShellNavigation(request){
  try{
    const u=new URL(request.url),scope=new URL(self.registration.scope);
    if(u.origin!==scope.origin)return false;
    const base=scope.pathname.replace(/\/$/,"");
    const p=u.pathname.replace(/\/$/,"");
    return p===base||p===`${base}/edit.html`||p===`${base}/index.html`;
  }catch{return false}
}

async function injectHotfix(response){
  if(!response||!response.ok)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;

  let html=await response.text();
  html=html
    .replace(/<script[^>]+src=["'][^"']*hotfix(?:-v\d+)?\.js[^"']*["'][^>]*><\/script>\s*/gi,"")
    .replace(/<style id=["'](?:mission-progress-fit|standard-note-room|study-jew-runtime-style)["'][^>]*>[\s\S]*?<\/style>\s*/gi,"")
    .replace('<button id="curriculumSpace" class="workspace-btn">교육과정</button>','<button id="curriculumSpace" class="workspace-btn">교육과정</button>\n      <button id="reviewSpace" class="workspace-btn" type="button" onclick="window.location.href=\'./review.html\'">검수</button>')
    .replace('const BANK_STATS_QUICK_KEY=KEY+"-bank-stats-quick";',`const BANK_STATS_QUICK_KEY=KEY+"-bank-stats-quick";
const BANK_STATS_PATCH_KEY=KEY+"-bank-stats-patches-v1";
const BANK_STATS_DIRTY_KEY=KEY+"-bank-stats-dirty-v1";
const BANK_ADVENTURE_QUICK_KEY=KEY+"-bank-adventure-quick-v1";
const CURRICULUM_LOCAL_KEY=KEY+"-curriculum-local-v1";
const CURRICULUM_CLOUD_MIN_DELAY=12000;`)
    .replace('}catch(e){console.warn("study quick restore failed",e)}',`}catch(e){console.warn("study quick restore failed",e)}
function curriculumLocalRead(){
  try{const x=JSON.parse(localStorage.getItem(CURRICULUM_LOCAL_KEY)||"null");return x?.curriculumPractice&&typeof x.curriculumPractice==="object"?x:null}catch{return null}
}
function curriculumLocalSidecar(key){
  try{const x=JSON.parse(localStorage.getItem(key)||"null");return x&&typeof x==="object"&&!Array.isArray(x)?x:null}catch{return null}
}
function curriculumLocalMaterialize(env){
  if(!env?.curriculumPractice||typeof env.curriculumPractice!=="object")return null;
  const cp=JSON.parse(JSON.stringify(env.curriculumPractice));
  const exp=curriculumLocalSidecar("study-jew-explanation-blanks-v1"),con=curriculumLocalSidecar("study-jew-consideration-blanks-v1");
  if(exp)cp.explanationBlankOverrides=JSON.parse(JSON.stringify(exp));
  if(con)cp.considerationBlankOverrides=JSON.parse(JSON.stringify(con));
  return cp;
}
function curriculumLocalSnapshotValue(){
  const cp=app.study?.curriculumPractice;if(!cp||typeof cp!=="object")return null;
  const out=JSON.parse(JSON.stringify(cp));
  const exp=curriculumLocalSidecar("study-jew-explanation-blanks-v1"),con=curriculumLocalSidecar("study-jew-consideration-blanks-v1");
  if(exp)out.explanationBlankOverrides=JSON.parse(JSON.stringify(exp));
  if(con)out.considerationBlankOverrides=JSON.parse(JSON.stringify(con));
  return out;
}
function saveCurriculumLocalNow(reason="edit"){
  const cp=curriculumLocalSnapshotValue();if(!cp)return false;
  try{
    localStorage.setItem(CURRICULUM_LOCAL_KEY,JSON.stringify({version:1,updatedAt:Date.now(),reason,curriculumPractice:cp}));
    return true;
  }catch(e){console.warn("curriculum local save failed",e);return false}
}
function restoreCurriculumLocalNow(){
  const env=curriculumLocalRead(),cp=curriculumLocalMaterialize(env);if(!cp)return false;
  if(!app.study||typeof app.study!=="object")app.study={};
  app.study.curriculumPractice=cp;
  return true;
}
function sjReadStandardSidecar(key){
  try{const raw=localStorage.getItem(key);if(raw===null)return {exists:false,value:{}};const x=JSON.parse(raw||"{}");return {exists:true,value:x&&typeof x==="object"&&!Array.isArray(x)?x:{}}}catch{return {exists:false,value:{}}}
}
function syncStandardExtraBlanksIntoStudy(){
  const st=curriculumStore(),exp=sjReadStandardSidecar("study-jew-explanation-blanks-v1"),con=sjReadStandardSidecar("study-jew-consideration-blanks-v1");
  if(exp.exists)st.explanationBlankOverrides=exp.value;
  if(con.exists)st.considerationBlankOverrides=con.value;
}
function syncStandardExtraBlanksOutOfStudy(){
  const st=app.study?.curriculumPractice;if(!st||typeof st!=="object")return;
  if(st.explanationBlankOverrides&&typeof st.explanationBlankOverrides==="object")try{localStorage.setItem("study-jew-explanation-blanks-v1",JSON.stringify(st.explanationBlankOverrides))}catch{}
  if(st.considerationBlankOverrides&&typeof st.considerationBlankOverrides==="object")try{localStorage.setItem("study-jew-consideration-blanks-v1",JSON.stringify(st.considerationBlankOverrides))}catch{}
}
restoreCurriculumLocalNow();
window.sjCurriculumLocalStatus=()=>{const x=curriculumLocalRead(),cp=x?.curriculumPractice||app.study?.curriculumPractice||{};return {local:!!x,updatedAt:Number(x?.updatedAt)||0,considerationAssignments:Object.keys(cp.considerationAssignments||{}).length,standardBlanks:Object.keys(cp.standardBlankOverrides||{}).length,standardNotes:Object.keys(cp.standardNotes||{}).length}};
window.sjSaveCurriculumStandardEdits=()=>{syncStandardExtraBlanksIntoStudy();saveCurriculumLocalNow("manual-save");markStudyCloud();return true};`)
    .replace(`try{
  const quickBankStats=JSON.parse(localStorage.getItem(BANK_STATS_QUICK_KEY)||"null");
  if(quickBankStats?.stats&&(Number(quickBankStats.updatedAt)||0)>=(Number(app.bank?.statsUpdatedAt)||0)){
    app.bank.stats=quickBankStats.stats;
    app.bank.statsUpdatedAt=Number(quickBankStats.updatedAt)||0;
  }
}catch(e){console.warn("bank stats quick restore failed",e)}`,`try{
  const quickBankStats=JSON.parse(localStorage.getItem(BANK_STATS_QUICK_KEY)||"null");
  if(quickBankStats?.stats&&(Number(quickBankStats.updatedAt)||0)>=(Number(app.bank?.statsUpdatedAt)||0)){
    app.bank.stats=quickBankStats.stats;
    app.bank.statsUpdatedAt=Number(quickBankStats.updatedAt)||0;
  }
}catch(e){console.warn("bank stats quick restore failed",e)}
try{
  const pending=JSON.parse(localStorage.getItem(BANK_STATS_PATCH_KEY)||"null");
  if(pending?.items&&typeof pending.items==="object"){
    for(const [id,entry] of Object.entries(pending.items))if(entry?.stat&&typeof entry.stat==="object")app.bank.stats[id]=entry.stat;
    app.bank.statsUpdatedAt=Math.max(Number(app.bank.statsUpdatedAt)||0,Number(pending.updatedAt)||0);
  }
}catch(e){console.warn("bank stats patch restore failed",e)}
try{
  const pendingAdventure=JSON.parse(localStorage.getItem(BANK_ADVENTURE_QUICK_KEY)||"null");
  if(pendingAdventure?.adventure&&typeof pendingAdventure.adventure==="object"&&(pendingAdventure.dirty||(Number(pendingAdventure.updatedAt)||0)>=(Number(app.bank.statsUpdatedAt)||0))){
    app.ui.quizAdventure=pendingAdventure.adventure;
    app.bank.statsUpdatedAt=Math.max(Number(app.bank.statsUpdatedAt)||0,Number(pendingAdventure.updatedAt)||0);
  }
}catch(e){console.warn("bank adventure quick restore failed",e)}`)
    .replace(`function saveBankStatsQuickNow(){
  clearTimeout(bankStatsQuickTimer);bankStatsQuickTimer=null;
  try{localStorage.setItem(BANK_STATS_QUICK_KEY,JSON.stringify({stats:app.bank.stats,updatedAt:app.bank.statsUpdatedAt||Date.now()}))}
  catch(e){console.warn("bank stats quick save failed",e)}
}
function scheduleBankStatsQuickSave(){
  clearTimeout(bankStatsQuickTimer);
  bankStatsQuickTimer=setTimeout(saveBankStatsQuickNow,650);
}`,`function saveBankStatsQuickNow(){
  clearTimeout(bankStatsQuickTimer);bankStatsQuickTimer=null;
  try{
    localStorage.setItem(BANK_STATS_QUICK_KEY,JSON.stringify({stats:app.bank.stats,updatedAt:app.bank.statsUpdatedAt||Date.now()}));
    localStorage.removeItem(BANK_STATS_PATCH_KEY);
  }catch(e){console.warn("bank stats quick save failed",e)}
}
function scheduleBankStatsQuickSave(){
  clearTimeout(bankStatsQuickTimer);
  bankStatsQuickTimer=setTimeout(saveBankStatsQuickNow,650);
}
function bankStatsPatchEnvelope(){
  try{const x=JSON.parse(localStorage.getItem(BANK_STATS_PATCH_KEY)||"null");return x&&typeof x==="object"?x:{updatedAt:0,items:{}}}catch{return {updatedAt:0,items:{}}}
}
function saveBankStatPatchNow(itemOrId){
  const id=typeof itemOrId==="string"?itemOrId:(itemOrId?.id||canonicalProblemId(itemOrId));
  if(!id||!app.bank.stats?.[id])return;
  const env=bankStatsPatchEnvelope();if(!env.items||typeof env.items!=="object")env.items={};
  env.updatedAt=Number(app.bank.statsUpdatedAt)||Date.now();
  env.items[id]={stat:JSON.parse(JSON.stringify(app.bank.stats[id])),updatedAt:env.updatedAt};
  try{localStorage.setItem(BANK_STATS_PATCH_KEY,JSON.stringify(env))}catch(e){console.warn("bank stats patch save failed",e)}
}
function saveBankAdventureQuickNow(dirty=true){
  try{localStorage.setItem(BANK_ADVENTURE_QUICK_KEY,JSON.stringify({adventure:app.ui.quizAdventure||{activeSheetId:"",configs:{}},updatedAt:app.bank.statsUpdatedAt||Date.now(),dirty:!!dirty}))}
  catch(e){console.warn("bank adventure quick save failed",e)}
}
function bankStatsDirtyRead(){
  try{const x=JSON.parse(localStorage.getItem(BANK_STATS_DIRTY_KEY)||"null");return x&&typeof x==="object"?x:null}catch{return null}
}
function bankStatsMarkDirty(updatedAt=app.bank.statsUpdatedAt||Date.now()){
  const prev=bankStatsDirtyRead(),at=Math.max(Number(prev?.updatedAt)||0,Number(updatedAt)||Date.now());
  try{localStorage.setItem(BANK_STATS_DIRTY_KEY,JSON.stringify({updatedAt:at}))}catch(e){console.warn("bank stats dirty save failed",e)}
  return at;
}
function bankStatsHasDirty(){
  if(Number(bankStatsDirtyRead()?.updatedAt)||0)return true;
  try{const p=JSON.parse(localStorage.getItem(BANK_STATS_PATCH_KEY)||"null");if(p?.items&&Object.keys(p.items).length)return true}catch{}
  try{const a=JSON.parse(localStorage.getItem(BANK_ADVENTURE_QUICK_KEY)||"null");if(a?.dirty)return true}catch{}
  return false;
}
function bankStatsClearDirtyIf(sentAt){
  const cur=bankStatsDirtyRead();
  if(!cur||Number(cur.updatedAt||0)<=Number(sentAt||0))try{localStorage.removeItem(BANK_STATS_DIRTY_KEY)}catch{}
}`)
    .replace('function markBankStatsCloud(){app.bank.statsUpdatedAt=Date.now();scheduleBankStatsQuickSave();scheduleBankStatsCloud()}',`function markBankStatsCloud(itemOrId=null){
  app.bank.statsUpdatedAt=Date.now();
  if(itemOrId)saveBankStatPatchNow(itemOrId);else saveBankStatsQuickNow();
  bankStatsMarkDirty(app.bank.statsUpdatedAt);
  scheduleBankStatsQuickSave();
  scheduleBankStatsCloud();
}`)
    .replace('  markBankStatsCloud();\n}\nfunction clearWrong(item){const st=getStat(item);st.needsReview=false;markBankStatsCloud();renderQuiz()}',`  markBankStatsCloud(item);
}
function clearWrong(item){const st=getStat(item);st.needsReview=false;markBankStatsCloud(item);renderQuiz()}`)
    .replace('qStar.onclick=()=>{st.flagged=!st.flagged;markBankStatsCloud();renderQuizQuestion()};','qStar.onclick=()=>{st.flagged=!st.flagged;markBankStatsCloud(item);renderQuizQuestion()};')
    .replace('st.flagReason=v.trim();markBankStatsCloud();renderQuizQuestion()','st.flagReason=v.trim();markBankStatsCloud(item);renderQuizQuestion()')
    .replace(`function scheduleBankStatsCloud(){
  if(!cloudUser||applyingRemote)return;
  clearTimeout(statsTimer);
  // 폰/리더기에서는 연속 답변 사이의 대형 stats 문서 직렬화를 묶어서 처리한다.
  const delay=window.matchMedia("(max-width:699px)").matches?1500:700;
  statsTimer=setTimeout(async()=>{
    try{await setDoc(bankStatsDoc(cloudUser.uid),{stats:app.bank.stats,adventure:app.ui.quizAdventure||{activeSheetId:"",configs:{}},updatedAt:app.bank.statsUpdatedAt||Date.now()});updateSync("✓",true)}
    catch(e){console.error(e);updateSync("!",false)}
  },delay);
}`,`function scheduleBankStatsCloud({immediate=false}={}){
  if(applyingRemote)return;
  if(!cloudUser){bankStatsMarkDirty(app.bank.statsUpdatedAt||Date.now());return}
  clearTimeout(statsTimer);
  const delay=immediate?0:(window.matchMedia("(max-width:699px)").matches?1500:700);
  statsTimer=setTimeout(async()=>{
    statsTimer=null;
    if(!cloudUser||applyingRemote){bankStatsMarkDirty(app.bank.statsUpdatedAt||Date.now());return}
    const sentAt=Number(app.bank.statsUpdatedAt)||Date.now();
    const sentStats=JSON.parse(JSON.stringify(app.bank.stats||{}));
    const sentAdventure=JSON.parse(JSON.stringify(app.ui.quizAdventure||{activeSheetId:"",configs:{}}));
    bankStatsMarkDirty(sentAt);
    try{
      await setDoc(bankStatsDoc(cloudUser.uid),{stats:sentStats,adventure:sentAdventure,updatedAt:sentAt});
      const currentAt=Number(app.bank.statsUpdatedAt)||0,dirtyAt=Number(bankStatsDirtyRead()?.updatedAt)||0;
      if(currentAt<=sentAt&&dirtyAt<=sentAt){
        saveBankStatsQuickNow();saveBankAdventureQuickNow(false);bankStatsClearDirtyIf(sentAt);updateSync("✓",true);
      }else{
        updateSync("…",true);scheduleBankStatsCloud({immediate:true});
      }
    }catch(e){
      console.error(e);bankStatsMarkDirty(Math.max(sentAt,Number(app.bank.statsUpdatedAt)||0));updateSync("!",false)
    }
  },delay);
}`)
    .replace(`function markAdventureStructureDirty(){
  adventureStructureDirty=true;
  saveLocal();
  if(bankStatsHydrated&&cloudUser&&!applyingRemote)flushAdventureStructureCloud();
}`,`function markAdventureStructureDirty(){
  adventureStructureDirty=true;
  app.bank.statsUpdatedAt=Date.now();
  saveBankAdventureQuickNow(true);bankStatsMarkDirty(app.bank.statsUpdatedAt);saveLocal();
  if(bankStatsHydrated&&cloudUser&&!applyingRemote)flushAdventureStructureCloud();
}`)
    .replace(`function flushAdventureStructureCloud(){
  if(!adventureStructureDirty||!bankStatsHydrated||!cloudUser||applyingRemote)return false;
  adventureStructureDirty=false;
  app.bank.statsUpdatedAt=Date.now();
  saveLocal();
  scheduleBankStatsCloud();
  return true;
}`,`function flushAdventureStructureCloud(){
  if(!adventureStructureDirty||!bankStatsHydrated||!cloudUser||applyingRemote)return false;
  adventureStructureDirty=false;
  app.bank.statsUpdatedAt=Date.now();
  saveBankAdventureQuickNow(true);bankStatsMarkDirty(app.bank.statsUpdatedAt);saveLocal();
  scheduleBankStatsCloud();
  return true;
}`)
    .replace(`function markAdventureCloud(){
  app.bank.statsUpdatedAt=Date.now();
  saveLocal();scheduleBankStatsCloud();
}`,`function markAdventureCloud(){
  app.bank.statsUpdatedAt=Date.now();
  saveBankAdventureQuickNow(true);bankStatsMarkDirty(app.bank.statsUpdatedAt);saveLocal();scheduleBankStatsCloud();
}`)
    .replace('function mergeCloudStudy(remote){\n  const localPlanner=app.study.planner;','function mergeCloudStudy(remote){\n  const localCurriculum=curriculumLocalRead();\n  const localPlanner=app.study.planner;')
    .replace('app.study=incoming;cleanup();\n  if(typeof invalidateCurriculumDerived==="function")invalidateCurriculumDerived();',`app.study=incoming;cleanup();
  if(localCurriculum?.curriculumPractice){const localCp=curriculumLocalMaterialize(localCurriculum);if(localCp)app.study.curriculumPractice=localCp}
  else if(app.study?.curriculumPractice)saveCurriculumLocalNow("cloud-seed");
  syncStandardExtraBlanksOutOfStudy();
  if(typeof invalidateCurriculumDerived==="function")invalidateCurriculumDerived();`)
    .replace('function scheduleCurriculumCloud(delay=3200){\n  clearTimeout(curriculumCloudTimer);curriculumCloudTimer=setTimeout(()=>{curriculumCloudTimer=0;markStudyCloud()},delay);\n}',`function scheduleCurriculumCloud(delay=3200){
  saveCurriculumLocalNow("curriculum-change");
  const wait=Math.max(CURRICULUM_CLOUD_MIN_DELAY,Number(delay)||0);
  clearTimeout(curriculumCloudTimer);curriculumCloudTimer=setTimeout(()=>{curriculumCloudTimer=0;markStudyCloud()},wait);
}`)
    .replace('function flushCurriculumCloud(){if(curriculumCloudTimer){clearTimeout(curriculumCloudTimer);curriculumCloudTimer=0;markStudyCloud()}}','function flushCurriculumCloud(){saveCurriculumLocalNow("flush");if(curriculumCloudTimer){clearTimeout(curriculumCloudTimer);curriculumCloudTimer=0;markStudyCloud()}}')
    .replace('function setPage(subject,idx,focusBlank){const ui=curriculumUi(),groups=orderedGroups(subject);','function setPage(subject,idx,focusBlank){saveCurriculumLocalNow("standard-page");const ui=curriculumUi(),groups=orderedGroups(subject);')
    .replace('be.onclick=()=>{ui.standardBlankEdit=!ui.standardBlankEdit;standardSelection=null;saveLocal();renderCurriculumStandards()}','be.onclick=()=>{saveCurriculumLocalNow("blank-toggle");ui.standardBlankEdit=!ui.standardBlankEdit;standardSelection=null;saveLocal();renderCurriculumStandards()}')
    .replace('if(!alreadyInMemoryStudy)app.ui.typingPractice=true;','if(!alreadyInMemoryStudy)app.ui.typingPractice=false;')
    .replace('app.ui.workspace="memory";\n  if(app.study.mode==="songs"||app.study.mode==="planner"||app.study.mode==="edit")app.study.mode="study";',`app.ui.workspace="memory";
  if(currentStudySheetLooksEmpty()){
    let picked=null;
    for(const s of app.study.subjects||[]){
      const sheet=(s.sheets||[]).find(x=>(x.rows||[]).some(r=>r&&((r.type==="section"||r.type==="label")?String(r.title||"").trim():String(r.category||r.correct||r.memo||"").trim())));
      if(sheet){picked=[s,sheet];break}
    }
    if(picked){app.study.subjectId=picked[0].id;picked[0].currentId=picked[1].id}
  }
  if(app.study.mode==="songs"||app.study.mode==="planner"||app.study.mode==="edit")app.study.mode="study";`)
    .replace(/\s*if\(!useCompactMissionPanel\(\)\)\{\s*button\.textContent="오늘";\s*button\.setAttribute\("aria-label","하루 미션"\);\s*return;\s*\}\s*(?=const x=plannerDaySummary\(plannerToday\(\)\);)/,"\n")
    .replace(/button\.textContent="✓";(?=\s*button\.classList\.add\("mission-complete"\))/,'button.textContent=`${x.done}/${x.total}`;')
    .replace(/const el=key==="memo"\?document\.createElement\("textarea"\):document\.createElement\("input"\);if\(el\.tagName==="INPUT"\)el\.type="text";else el\.rows=1;/g,'const el=document.createElement("textarea");el.rows=key==="content"?2:1;')
    .replace('function plannerMissionsForDate(round,date,{includeExcluded=false}={}){\n  return (round?.missions||[]).filter(m=>plannerMissionDisplayDate(round,m)===date&&(includeExcluded||!plannerMissionExcluded(round,m)));\n}',`function plannerMissionsForDate(round,date,{includeExcluded=false}={}){
  return (round?.missions||[]).filter(m=>plannerMissionDisplayDate(round,m)===date&&(includeExcluded||!plannerMissionExcluded(round,m)));
}
function plannerMissionsForDayView(round,date){
  const exact=plannerMissionsForDate(round,date);
  if(date!==plannerToday())return exact;
  const seen=new Set(exact);
  const overdue=(round?.missions||[]).filter(m=>String(m.date||"")<date&&!plannerMissionExcluded(round,m)&&!plannerMissionDone(round,m)&&!seen.has(m));
  overdue.sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
  return [...overdue,...exact];
}`)
    .replace('for(const r of p.rounds)for(const m of plannerMissionsForDate(r,date))missions.push([r,m]);','for(const r of p.rounds)for(const m of plannerMissionsForDayView(r,date))missions.push([r,m]);')
    .replace('const missions=plannerMissionsForDate(r,selected);','const missions=plannerMissionsForDayView(r,selected);')
    .replace('const missions=plannerMissionsForDate(round,date);total+=missions.length;done+=missions.filter(m=>plannerMissionDone(round,m)).length;','const missions=plannerMissionsForDayView(round,date);total+=missions.length;done+=missions.filter(m=>plannerMissionDone(round,m)).length;')
    .replace('if(m.date<today&&!plannerMissionExcluded(r,m)&&!plannerMissionDone(r,m))overdue.push([r,m]);','if(selected!==today&&m.date<today&&!plannerMissionExcluded(r,m)&&!plannerMissionDone(r,m))overdue.push([r,m]);')
    .replace('const localStatsWereNewer=(app.bank.statsUpdatedAt||0)>remoteStatsAt;\n    if(stat.exists()){',`const localStatsWereNewer=(app.bank.statsUpdatedAt||0)>remoteStatsAt;
    const localStatsDirty=bankStatsHasDirty();
    if(localStatsDirty&&remoteStatsAt>=(app.bank.statsUpdatedAt||0)){
      app.bank.statsUpdatedAt=Math.max(Date.now(),remoteStatsAt+1);bankStatsMarkDirty(app.bank.statsUpdatedAt);
    }
    if(stat.exists()){`)
    .replace('if((d.updatedAt||0)>(app.bank.statsUpdatedAt||0)){\n        app.bank.stats=d.stats||{};',`if(!localStatsDirty&&(d.updatedAt||0)>(app.bank.statsUpdatedAt||0)){
        app.bank.stats=d.stats||{};`)
    .replace('app.bank.statsUpdatedAt=d.updatedAt||0;saveBankStatsQuickNow();saveLocal();renderQuiz();','app.bank.statsUpdatedAt=d.updatedAt||0;saveBankStatsQuickNow();saveBankAdventureQuickNow(false);bankStatsClearDirtyIf(d.updatedAt||0);saveLocal();renderQuiz();')
    .replace('if(!flushAdventureStructureCloud()&&(localStatsWereNewer||!stat.exists()))scheduleBankStatsCloud();','if(!flushAdventureStructureCloud()&&(localStatsDirty||localStatsWereNewer||!stat.exists()))scheduleBankStatsCloud({immediate:localStatsDirty});')
    .replace('// 같은 기기에서 방금 보낸 stats snapshot(동일 timestamp)은 화면을 다시 그리지 않는다.\n      if((d.updatedAt||0)<=(app.bank.statsUpdatedAt||0))return;\n      applyingRemote=true;',`// 같은 기기에서 방금 보낸 stats snapshot(동일 timestamp)은 화면을 다시 그리지 않는다.
      if((d.updatedAt||0)<=(app.bank.statsUpdatedAt||0))return;
      if(bankStatsHasDirty()){scheduleBankStatsCloud({immediate:true});return}
      applyingRemote=true;`)
    .replace('app.bank.statsUpdatedAt=d.updatedAt||Date.now();saveBankStatsQuickNow();saveLocal();','app.bank.statsUpdatedAt=d.updatedAt||Date.now();saveBankStatsQuickNow();saveBankAdventureQuickNow(false);bankStatsClearDirtyIf(d.updatedAt||0);saveLocal();')
    .replace('    },err=>console.error("bank stats realtime",err));\n\n    updateSync("✓",true);\n  }catch(e){',`    },err=>console.error("bank stats realtime",err));

    if(bankStatsHasDirty()){updateSync("…",true);scheduleBankStatsCloud({immediate:true})}
    else updateSync("✓",true);
  }catch(e){`)
    .replace('window.addEventListener("online",()=>{\n  if(!cloudUser)return;\n  plannerRetryDirtyMissionStates({wait:false});',`window.addEventListener("online",()=>{
  if(!cloudUser)return;
  if(bankStatsHasDirty())scheduleBankStatsCloud({immediate:true});
  plannerRetryDirtyMissionStates({wait:false});`)
    .replace('  // 폰을 다시 열었을 때 2분 타이머와 무관하게 미전송 완료 체크부터 즉시 재전송한다.\n  const dirty=plannerHasDirtyMissionState();',`  if(bankStatsHasDirty())scheduleBankStatsCloud({immediate:true});
  // 폰을 다시 열었을 때 2분 타이머와 무관하게 미전송 완료 체크부터 즉시 재전송한다.
  const dirty=plannerHasDirtyMissionState();`);

  html=html.includes("</head>")?html.replace("</head>",`${APP_STYLE}\n</head>`):APP_STYLE+html;
  const tags=HOTFIX_SRCS.map(src=>`<script src="${src}"></script>`).join("\n");
  html=html.includes("</body>")?html.replace("</body>",`${tags}\n</body>`):html+tags;

  const headers=new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    const response=await fetch(FALLBACK_URL,{cache:"no-store"});
    const patched=await injectHotfix(response);
    await cache.put(FALLBACK_URL,patched.clone());
  }).then(()=>self.skipWaiting()))
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const req=event.request;
  if(req.mode!=="navigate"||!appShellNavigation(req))return;
  event.respondWith(fetch(req,{cache:"no-store"}).then(async res=>{
    const patched=await injectHotfix(res);
    if(patched&&patched.ok){const copy=patched.clone();caches.open(CACHE_NAME).then(cache=>cache.put(FALLBACK_URL,copy)).catch(()=>{})}
    return patched;
  }).catch(()=>caches.match(FALLBACK_URL)))
});