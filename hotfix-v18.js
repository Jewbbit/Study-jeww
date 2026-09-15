(()=>{
  "use strict";
  const VERSION="2026-09-15-login-safari-v3-firebase11";
  if(window.__sjLoginSafari===VERSION)return;
  window.__sjLoginSafari=VERSION;

  let busy=false;
  const SDK="11.6.0";
  const appModP=import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
  const authModP=import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`);

  function toast(msg,ms=5200){
    const el=document.getElementById("toast");
    if(!el){console.warn(msg);return}
    el.textContent=msg;el.classList.add("show");
    clearTimeout(el.__sjLoginTimer);el.__sjLoginTimer=setTimeout(()=>el.classList.remove("show"),ms);
  }
  function codeOf(e){return String(e?.code??"").replace(/^auth\//,"")}
  function looksLikeStorage22(e){
    const c=String(e?.code??""),n=String(e?.name||""),m=String(e?.message||"");
    return c==="22"||/QuotaExceeded/i.test(n)||(/quota|storage/i.test(m)&&/exceed|full|limit|available/i.test(m));
  }
  function detailOf(e){
    const parts=[];if(e?.name)parts.push(String(e.name));if(e?.code!=null)parts.push(`code ${String(e.code)}`);if(e?.message)parts.push(String(e.message));
    return parts.join(" · ").slice(0,240)||"unknown";
  }

  async function configurePersistence(auth,authMod){
    try{await authMod.setPersistence(auth,authMod.browserLocalPersistence);return "local"}catch(e1){
      try{await authMod.setPersistence(auth,authMod.browserSessionPersistence);return "session"}catch(e2){
        await authMod.setPersistence(auth,authMod.inMemoryPersistence);return "memory";
      }
    }
  }

  async function popupLogin(auth,provider,authMod){
    try{return await authMod.signInWithPopup(auth,provider)}
    catch(first){
      if(!looksLikeStorage22(first))throw first;
      await authMod.setPersistence(auth,authMod.inMemoryPersistence);
      try{return await authMod.signInWithPopup(auth,provider)}
      catch(second){second.__sjFirstError=first;throw second}
    }
  }

  async function login(){
    if(busy)return;busy=true;
    const btn=document.getElementById("syncBtn");
    if(btn){btn.disabled=true;btn.textContent="…"}
    try{
      const [appMod,authMod]=await Promise.all([appModP,authModP]);
      const apps=appMod.getApps();
      const app=apps[0]||appMod.initializeApp({
        apiKey:"AIzaSyBnGXB1htS_1-Gkk3NCIr-_W3XbFLUzxcU",
        authDomain:"jewstudy-ffb70.firebaseapp.com",
        projectId:"jewstudy-ffb70",
        storageBucket:"jewstudy-ffb70.firebasestorage.app",
        messagingSenderId:"146666834172",
        appId:"1:146666834172:web:fdb09e4c6a9c2ddf796f79"
      });
      const auth=authMod.getAuth(app);
      const persistence=await configurePersistence(auth,authMod);
      const provider=new authMod.GoogleAuthProvider();
      provider.setCustomParameters({prompt:"select_account"});
      await popupLogin(auth,provider,authMod);
      toast(persistence==="memory"?"로그인되었습니다 · 이번 탭에서 로그인 유지":"로그인되었습니다");
    }catch(e){
      console.error("Safari Google login failed",e,e?.__sjFirstError||"");
      const code=codeOf(e);
      if(looksLikeStorage22(e)||looksLikeStorage22(e?.__sjFirstError))toast("로그인 실패 · Safari 저장소 오류(22) · 앱 데이터는 삭제하지 않았습니다");
      else if(code==="popup-blocked")toast("로그인 실패 · Safari 팝업 차단");
      else if(code==="popup-closed-by-user")toast("로그인 창이 닫혔습니다 · 다시 눌러주세요");
      else if(code==="unauthorized-domain")toast("로그인 실패 · unauthorized-domain");
      else if(code==="network-request-failed")toast("로그인 실패 · network-request-failed");
      else if(code==="web-storage-unsupported")toast("로그인 실패 · web-storage-unsupported");
      else toast(`로그인 실패 · ${detailOf(e)}`);
    }finally{
      busy=false;
      const b=document.getElementById("syncBtn");
      if(b&&!b.classList.contains("signed")){b.disabled=false;if(b.textContent==="…")b.textContent="로그인"}
    }
  }

  document.addEventListener("click",e=>{
    const el=e.target instanceof Element?e.target:e.target?.parentElement;
    const btn=el?.closest?.("#syncBtn");
    if(!btn||btn.classList.contains("signed"))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    login();
  },true);
})();
