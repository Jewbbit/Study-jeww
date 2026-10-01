(()=>{
  "use strict";
  const VERSION="2026-10-01-repeat-round-enter-v1";
  if(window.__studyJewQuizPath===VERSION)return;
  window.__studyJewQuizPath=VERSION;

  window.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.code!=="Enter"&&e.code!=="NumpadEnter")return;
    if(typeof app==="undefined"||app?.ui?.workspace!=="bank"||app?.ui?.bankMode!=="quiz"||app?.ui?.quizHomeMode!=="path")return;
    if(typeof quizSession!=="undefined"&&quizSession)return;
    const tag=document.activeElement?.tagName;
    if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;

    const sheetId=typeof adventureStore==="function"?(adventureStore().activeSheetId||""):"";
    const round=typeof activeProgressRound==="function"?activeProgressRound():null;
    if(!sheetId||!round)return;

    const cfg=typeof adventureConfig==="function"?adventureConfig(sheetId,{quiet:true}):null;
    const order=cfg?.order||(typeof adventureSheetState==="function"?adventureSheetState(sheetId).activeOrder:"sequence")||"sequence";
    const missions=typeof roundPathMissions==="function"
      ?roundPathMissions(round,sheetId,order).slice().sort((a,b)=>Number(a.setIndex)-Number(b.setIndex))
      :[];
    const nextMission=missions.find(m=>typeof plannerMissionDone==="function"&&!plannerMissionDone(round,m));
    if(!nextMission||typeof startAdventureRoundMission!=="function")return;

    e.preventDefault();
    e.stopPropagation();
    startAdventureRoundMission(round,nextMission);
  },true);
})();
