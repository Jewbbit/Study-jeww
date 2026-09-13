from pathlib import Path
import re, subprocess, tempfile, sys

p=Path('edit.html')
html=p.read_text(encoding='utf-8')
MARK='sj-curriculum-direct-v10'
if MARK in html:
    print('already patched')
    raise SystemExit(0)

# 1) 성취기준 v2는 메인 module 밖에 있어 module-scope 함수에 접근하지 못했다.
#    기존 코드를 그대로 추출해 메인 module 마지막으로 이동한다.
pat=re.compile(r'\n?<script id="curriculum-standards-pages-v2">\s*(.*?)\s*</script>\s*', re.S)
m=pat.search(html)
if not m:
    raise SystemExit('standards v2 script not found')
standards_code=m.group(1)
html=html[:m.start()]+'\n<!-- curriculum standards v2 runs inside the main module -->\n'+html[m.end():]

# 2) 오른쪽 보조패널에 성취기준 독립 탭을 추가한다. 기존 빈 탭은 그대로 둔다.
needle='''        <button id="widePlannerBlankTab" class="wide-planner-blank-tab" type="button" role="tab" aria-label="빈 탭" title="빈 탭">&nbsp;</button>\n        <button id="widePlannerCurriculumTab" type="button" role="tab" aria-label="교육과정 목차" title="교육과정 목차">교육과정</button>'''
replacement='''        <button id="widePlannerBlankTab" class="wide-planner-blank-tab" type="button" role="tab" aria-label="빈 탭" title="빈 탭">&nbsp;</button>\n        <button id="widePlannerStandardsTab" type="button" role="tab" aria-label="성취기준" title="성취기준">성취기준</button>\n        <button id="widePlannerCurriculumTab" type="button" role="tab" aria-label="교육과정 목차" title="교육과정 목차">교육과정</button>'''
if html.count(needle)!=1:
    raise SystemExit(f'right tab marker mismatch: {html.count(needle)}')
html=html.replace(needle,replacement,1)

# 3) 별도 서비스워커 주입 없이, 현재 edit.html의 module 안에서만 오른쪽 성취기준 탭과
#    내용 체계 전용 보기를 연결한다. 내용 체계는 curriculum-v6의 공식 표 메타데이터를
#    페이지 쪼개기와 무관하게 모아서 보여 준다.
addon=r'''

/* sj-curriculum-direct-v10: right standards tab + stable content-system view */
;(()=>{
  if(globalThis.__sjCurriculumDirectV10)return;globalThis.__sjCurriculumDirectV10=1;
  let contentSystemOpen=false,contentSystemSubject='';

  const style=document.createElement('style');
  style.id='sj-curriculum-direct-v10';
  style.textContent=`
@media(min-width:700px) and (min-height:600px){
  #widePlannerSide .wide-planner-inner,#widePlannerList{overflow-x:hidden!important;overscroll-behavior-x:none!important}
  #widePlannerList .planner-task,#widePlannerList .planner-task-link,#widePlannerList .planner-task-check,#widePlannerList .planner-task-exclude{touch-action:pan-y!important}
  #widePlannerList .planner-task{left:0!important;right:auto!important;translate:0 0!important;max-width:100%!important}
  .wide-planner-tabs{gap:1px!important}
  .wide-planner-tabs button{min-width:0!important;padding-left:5px!important;padding-right:5px!important;font-size:9.5px!important}
  .wide-planner-tabs .wide-planner-blank-tab{width:18px!important;min-width:18px!important;padding:0!important}
}
.curriculum-line.curriculum-hanging{padding-left:min(var(--curriculum-hang,1.08em),1.24em)!important;text-indent:calc(-1 * min(var(--curriculum-hang,1.08em),1.24em))!important}
.sj-standard-side-head{position:sticky;top:0;z-index:4;background:#fff;padding:7px 2px 8px;border-bottom:1px solid #ececef}
.sj-standard-side-tools{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:5px;align-items:center}
.sj-standard-side-tools select,.sj-standard-side-tools button{height:31px;min-width:0;border:1px solid #d9d9dd;border-radius:7px;background:#fff;padding:4px 7px;font-size:9.6px;color:#55565b}
.sj-standard-side-tools button.active{background:#303136;color:#fff;border-color:#303136;font-weight:750}
.sj-standard-side-order{display:flex;gap:4px;margin-top:6px}
.sj-standard-side-order button{flex:1;border:1px solid #dedee1;background:#fff;border-radius:999px;padding:5px 6px;font-size:9px;color:#696a70}
.sj-standard-side-order button.active{background:#303136;color:#fff;border-color:#303136;font-weight:750}
.sj-standard-side-meta{display:block;margin-top:6px;font-size:8.8px;color:#85868b;line-height:1.4}
.sj-standard-side-row{display:block;width:100%;border:0;border-bottom:1px solid #f0f0f2;background:#fff;text-align:left;padding:8px 7px;color:#3f4045}
.sj-standard-side-row.current{background:#f2f2f4;font-weight:750}
.sj-standard-side-row strong{display:block;font-size:10.5px;line-height:1.42}
.sj-standard-side-row span{display:block;margin-top:2px;font-size:8.8px;color:#88898e}
.sj-content-system-btn.active{background:#303136!important;color:#fff!important;border-color:#303136!important;font-weight:750!important}
body.sj-content-system #curriculumContext,body.sj-content-system .curriculum-status,body.sj-content-system #curriculumEditPanel,body.sj-content-system #curriculumBookmarkPanel,body.sj-content-system #curriculumPageDock,body.sj-content-system #curriculumFloatTools{display:none!important}
.sj-content-root{padding:2px 0 38px}
.sj-content-head{position:sticky;top:0;z-index:12;display:flex;align-items:center;gap:6px;padding:7px 3px 8px;background:rgba(255,255,255,.97);border-bottom:1px solid #e4e4e7;margin-bottom:9px}
.sj-content-head strong{flex:1;min-width:0;font-size:.86em}.sj-content-head button{border:1px solid #d9d9dd;background:#fff;border-radius:7px;padding:6px 9px;font-size:.68em;color:#55565b}
.sj-content-note{padding:8px 10px;margin-bottom:12px;border-left:3px solid #c5c6ca;background:#fafafa;font-size:.7em;color:#74757b;line-height:1.55}
.sj-content-block{margin:0 0 16px}.sj-content-block>h3{margin:12px 2px 7px;font-size:.82em;color:#34353a}
.sj-content-root .curriculum-table-wrap{margin:0!important;border-radius:7px!important;overflow-x:auto!important;overflow-y:hidden!important}
.sj-content-root .sj-content-block+.sj-content-block{margin-top:12px}
.sj-content-root .curriculum-table{display:table!important;width:100%!important;max-width:none!important;table-layout:fixed!important;border-collapse:collapse!important}
.sj-content-root .curriculum-table tbody{display:table-row-group!important;padding:0!important;background:#fff!important;gap:0!important}
.sj-content-root .curriculum-table tr{display:table-row!important;position:static!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important}
.sj-content-root .curriculum-table td{display:table-cell!important;width:auto!important;min-width:0!important;max-width:none!important;vertical-align:middle!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:break-word!important}
.sj-content-empty{padding:30px 12px;text-align:center;color:#7d7e83;font-size:.8em}
@media(max-width:699px){.sj-content-root .curriculum-table{min-width:680px!important}.sj-content-head{top:0}.sj-standard-side-tools{grid-template-columns:1fr}}
@media(monochrome){.sj-standard-side-tools button.active,.sj-standard-side-order button.active,.sj-content-system-btn.active{background:#111!important;color:#fff!important;border-color:#111!important}}
`;
  document.head.append(style);

  const standardsTab=document.getElementById('widePlannerStandardsTab');
  const lockX=()=>{for(const el of [document.querySelector('#widePlannerSide .wide-planner-inner'),document.getElementById('widePlannerList')]){if(!el||el.dataset.sjV10x)return;el.dataset.sjV10x='1';el.addEventListener('scroll',()=>{if(el.scrollLeft!==0)el.scrollLeft=0},{passive:true})}};
  const gradeRank=g=>String(g||'').startsWith('1')?1:String(g||'').startsWith('3')?2:String(g||'').startsWith('5')?3:9;
  const areaName=t=>String(t||'').replace(/^\s*\(\d+\)\s*/,'').replace(/^\s*\d+[.)]\s*/,'').trim();
  const standardGroups=subject=>{
    const groups=curriculumStandardsGroups(subject)||[],mode=curriculumUi().standardOrderBySubject?.[subject]||'grade-area',areaOrder=new Map();let n=0;
    for(const g of groups){const a=areaName(g.area||g.title);if(!areaOrder.has(a))areaOrder.set(a,n++)}
    return [...groups].sort((a,b)=>mode==='area-grade'?((areaOrder.get(areaName(a.area||a.title))-areaOrder.get(areaName(b.area||b.title)))||(gradeRank(a.grade)-gradeRank(b.grade))||(a.sourceOrder-b.sourceOrder)):((gradeRank(a.grade)-gradeRank(b.grade))||(areaOrder.get(areaName(a.area||a.title))-areaOrder.get(areaName(b.area||b.title)))||(a.sourceOrder-b.sourceOrder)));
  };
  const standardsSubject=()=>{
    const ui=curriculumUi(),candidates=(curriculumData?.subjects||[]).filter(s=>curriculumStandardsGroups(s).length);
    const s=[ui.sideSubject,ui.subject,curriculumCurrentItem()?.s,...candidates].find(x=>x&&x!=='전체'&&curriculumStandardsGroups(x).length);
    return s||candidates[0]||'';
  };
  const setStandardPage=(subject,idx)=>{
    const ui=curriculumUi(),groups=standardGroups(subject);ui.subject=subject;ui.sideSubject=subject;ui.standardPageBySubject=ui.standardPageBySubject||{};ui.standardPageBySubject[subject]=Math.max(0,Math.min(groups.length-1,Number(idx)||0));saveLocal();
    if(!curriculumStandardsView())setCurriculumViewMode('standards');else renderCurriculumStandards();
    curriculumScrollToReadingTop();renderWidePlannerSide();
  };
  const setStandardOrder=(subject,mode)=>{const ui=curriculumUi();ui.standardOrderBySubject=ui.standardOrderBySubject||{};ui.standardPageBySubject=ui.standardPageBySubject||{};ui.standardOrderBySubject[subject]=mode;ui.standardPageBySubject[subject]=0;saveLocal();renderCurriculumStandards();renderWidePlannerSide()};

  function renderStandardsSide(){
    const list=document.getElementById('widePlannerList'),count=document.getElementById('widePlannerCount');if(!list||!count)return;
    list.innerHTML='';count.textContent='';lockX();
    if(!curriculumData){const empty=document.createElement('div');empty.className='wide-planner-empty';empty.textContent='성취기준 자료를 불러오는 중…';list.append(empty);ensureCurriculumData().then(()=>renderWidePlannerSide()).catch(()=>{empty.textContent='성취기준 자료를 불러오지 못했습니다.'});return}
    const subject=standardsSubject();if(!subject){const empty=document.createElement('div');empty.className='wide-planner-empty';empty.textContent='표시할 성취기준이 없습니다.';list.append(empty);return}
    const groups=standardGroups(subject),ui=curriculumUi(),idx=Math.max(0,Math.min(groups.length-1,Number(ui.standardPageBySubject?.[subject])||0));count.textContent=groups.length?`${groups.length}쪽`:'';
    const head=document.createElement('div');head.className='sj-standard-side-head';
    const tools=document.createElement('div');tools.className='sj-standard-side-tools';
    const sel=document.createElement('select');sel.setAttribute('aria-label','성취기준 과목');for(const s of curriculumData.subjects||[]){if(!curriculumStandardsGroups(s).length)continue;const o=document.createElement('option');o.value=s;o.textContent=s;o.selected=s===subject;sel.append(o)}sel.onchange=()=>{ui.sideSubject=sel.value;ui.subject=sel.value;ui.standardPageBySubject=ui.standardPageBySubject||{};ui.standardPageBySubject[sel.value]=0;saveLocal();setCurriculumViewMode('standards');renderWidePlannerSide()};
    const edit=document.createElement('button');edit.type='button';edit.textContent=ui.standardBlankEdit?'✓ 빈칸':'✎ 빈칸';edit.classList.toggle('active',!!ui.standardBlankEdit);edit.onclick=()=>{ui.standardBlankEdit=!ui.standardBlankEdit;saveLocal();renderCurriculumStandards();renderWidePlannerSide()};
    const mode=document.createElement('button');mode.type='button';mode.textContent=ui.mode==='copy'?'보고':'암기';mode.title=ui.mode==='copy'?'보고쓰기':'안보고쓰기';mode.onclick=()=>setCurriculumMode(ui.mode==='copy'?'recall':'copy');tools.append(sel,edit,mode);
    const order=document.createElement('div');order.className='sj-standard-side-order';for(const [v,label] of [['grade-area','학년→영역'],['area-grade','영역→학년']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.classList.toggle('active',(ui.standardOrderBySubject?.[subject]||'grade-area')===v);b.onclick=()=>setStandardOrder(subject,v);order.append(b)}
    const meta=document.createElement('span');meta.className='sj-standard-side-meta';meta.textContent=groups[idx]?`${idx+1}/${groups.length} · ${groups[idx].grade||''} ${areaName(groups[idx].area||groups[idx].title)}`:`${groups.length}개 묶음`;
    head.append(tools,order,meta);list.append(head);
    groups.forEach((g,i)=>{const row=document.createElement('button');row.type='button';row.className='sj-standard-side-row'+(i===idx?' current':'');const a=areaName(g.area||g.title)||'성취기준';row.innerHTML=`<strong>${escapeHtml(g.grade||'')} · ${escapeHtml(a)}</strong><span>${g.standards?.length||0}개 성취기준</span>`;row.onclick=()=>setStandardPage(subject,i);list.append(row)});
  }

  function sideTabState(tab){
    const ids={today:'widePlannerTodayTab',songs:'widePlannerSongTab',progress:'widePlannerProgressTab',blank:'widePlannerBlankTab',standards:'widePlannerStandardsTab',curriculum:'widePlannerCurriculumTab'};
    for(const [k,id] of Object.entries(ids)){const b=document.getElementById(id);if(!b)continue;const on=k===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false')}
  }

  const baseRenderSide=renderWidePlannerSide;
  renderWidePlannerSide=function(){
    if(widePlannerSideTab==='standards'){
      const saved=widePlannerSideTab;widePlannerSideTab='blank';baseRenderSide();widePlannerSideTab=saved;
      if(!widePlannerSideEligible())return;document.getElementById('widePlannerDateNav')?.classList.add('hidden');sideTabState('standards');renderStandardsSide();return;
    }
    const out=baseRenderSide();sideTabState(widePlannerSideTab);lockX();decorateCurriculumTools();return out;
  };

  const baseSetSideTab=setWidePlannerSideTab;
  setWidePlannerSideTab=function(tab){
    if(tab==='standards'){
      widePlannerSideTab='standards';
      if((app.ui.workspace||'memory')!=='curriculum')openCurriculumWorkspace();
      if(curriculumData){const s=standardsSubject();if(s){curriculumUi().subject=s;curriculumUi().sideSubject=s}setCurriculumViewMode('standards')}
      else ensureCurriculumData().then(()=>{const s=standardsSubject();if(s){curriculumUi().subject=s;curriculumUi().sideSubject=s}setCurriculumViewMode('standards');renderWidePlannerSide()}).catch(()=>renderWidePlannerSide());
      renderWidePlannerSide();return;
    }
    if(tab==='curriculum'&&(app.ui.workspace||'memory')==='curriculum'&&curriculumStandardsView())setCurriculumViewMode('book');
    return baseSetSideTab(tab);
  };
  standardsTab?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setWidePlannerSideTab('standards')});

  function contentSubject(){const s=contentSystemSubject||curriculumUi().sideSubject||(curriculumUi().subject!=='전체'?curriculumUi().subject:'')||curriculumCurrentItem()?.s||'';return s}
  function isContentStart(item){const x=`${item?.logicalLabel||''}\n${String(item?.t||'').slice(0,180)}`;return /가\.\s*내용\s*체계/.test(x)||/(?:^|\n)내용\s*체계(?:\n|$)/.test(x)}
  function isStandardsStart(item){const x=`${item?.logicalLabel||''}\n${String(item?.t||'').slice(0,180)}`;return /나\.\s*성취기준/.test(x)||/(?:^|\n)성취기준(?:\n|$)/.test(x)&&curriculumStandardsList(item).length>0}
  function contentItems(subject){const arr=curriculumDerivedItems().filter(x=>x.s===subject);let start=arr.findIndex(isContentStart);if(start<0)start=arr.findIndex(x=>curriculumTables(x).length);if(start<0)return [];let end=arr.findIndex((x,i)=>i>start&&isStandardsStart(x));if(end<0)end=arr.length;return arr.slice(start,end).filter(x=>curriculumTables(x).length)}
  function closeContentSystem({render=true}={}){contentSystemOpen=false;contentSystemSubject='';document.body.classList.remove('sj-content-system');if(render){baseRenderCurrent();renderWidePlannerSide()}}
  function renderContentSystem(){
    if(!contentSystemOpen)return;const subject=contentSubject(),box=document.getElementById('curriculumPassage');if(!box)return;document.body.classList.add('sj-content-system');
    document.getElementById('curriculumTitle').textContent=`${subject} · 내용 체계`;document.getElementById('curriculumMeta').textContent='내용 체계표';document.getElementById('curriculumSourceNote').textContent='내용 체계표만 따로 모아 원래 표 구조로 봅니다. 이 화면에서는 빈칸을 만들지 않습니다.';
    box.innerHTML='';box.classList.remove('editing','source-editing');const root=document.createElement('div');root.className='sj-content-root';const head=document.createElement('div');head.className='sj-content-head';const title=document.createElement('strong');title.textContent=`${subject} 내용 체계`;const close=document.createElement('button');close.type='button';close.textContent='원문';close.onclick=()=>closeContentSystem();head.append(title,close);root.append(head);
    const note=document.createElement('div');note.className='sj-content-note';note.textContent='장 구분 때문에 표가 중간에서 끊기지 않도록 내용 체계 구간의 표를 여기서 연속으로 표시합니다.';root.append(note);
    const items=contentItems(subject);if(!items.length){const empty=document.createElement('div');empty.className='sj-content-empty';empty.textContent='이 과목의 내용 체계표를 찾지 못했습니다.';root.append(empty)}
    else{const dummy={session:curriculumSession(),rendered:new Set()};for(const item of items){const tables=curriculumTables(item);if(!tables.length)continue;const sec=document.createElement('section');sec.className='sj-content-block';const label=String(item.logicalLabel||'').trim();if(label&&!/가\.\s*내용\s*체계/.test(label)){const h=document.createElement('h3');h.textContent=label;sec.append(h)}for(const t of tables)appendCurriculumTable(sec,item,t,'practice',[],dummy);root.append(sec)}}
    box.append(root);renderWidePlannerSide();
  }
  const baseRenderCurrent=renderCurriculumCurrent;
  renderCurriculumCurrent=function(){if(contentSystemOpen){renderContentSystem();return}document.body.classList.remove('sj-content-system');return baseRenderCurrent()};
  function openContentSystem(subject){const s=subject||contentSubject();if(!s)return toast('과목을 먼저 선택하세요');if((app.ui.workspace||'memory')!=='curriculum')openCurriculumWorkspace();if(curriculumStandardsView())setCurriculumViewMode('book');contentSystemOpen=true;contentSystemSubject=s;curriculumUi().sideSubject=s;if(curriculumUi().subject==='전체')curriculumUi().subject=s;saveLocal();renderContentSystem()}
  function decorateCurriculumTools(){
    if(widePlannerSideTab!=='curriculum')return;const tools=document.querySelector('#widePlannerList .wide-curriculum-study-tools');if(!tools)return;const subject=curriculumSideOutlineSubject();let b=tools.querySelector('.sj-content-system-btn');if(!b){b=document.createElement('button');b.type='button';b.className='sj-content-system-btn';tools.insertBefore(b,tools.firstChild)}b.textContent=contentSystemOpen&&contentSubject()===subject?'✓ 내용체계':'내용체계';b.classList.toggle('active',contentSystemOpen&&contentSubject()===subject);b.onclick=()=>{if(contentSystemOpen&&contentSubject()===subject)closeContentSystem();else openContentSystem(subject)};
  }

  lockX();renderWidePlannerSide();
})();
'''

# main module 찾기
start=html.find('<script type="module">')
if start<0: raise SystemExit('main module start not found')
end=html.find('</script>', start)
if end<0: raise SystemExit('main module end not found')
insert='\n\n/* standards v2 moved from outside module */\n'+standards_code+'\n'+addon+'\n'
html=html[:end]+insert+html[end:]

p.write_text(html,encoding='utf-8')

# module JavaScript 문법 검사. import URL은 node --check에서 파싱 가능하다.
html2=p.read_text(encoding='utf-8')
s=html2.find('<script type="module">')+len('<script type="module">')
e=html2.find('</script>',s)
module=html2[s:e]
Path('/tmp/study-module.mjs').write_text(module,encoding='utf-8')
r=subprocess.run(['node','--check','/tmp/study-module.mjs'],capture_output=True,text=True)
if r.returncode:
    print(r.stdout);print(r.stderr,file=sys.stderr);raise SystemExit(r.returncode)
print('patched edit.html; module syntax OK')
