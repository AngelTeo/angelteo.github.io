/* LoveGo v56 · SRK OD-1 resolver + UI hardening
 * Canonical stage lock: BB=3, JR=4, IN=5, SR=6.
 * OD-1: age<3 => pending; age<class-band => use age; age>class-band => use class-band; equal => class-match.
 * Feature-gated registry remains UAT-only. This file does not compute B/D/S.
 */
(()=>{
  'use strict';
  const VERSION='LoveGo-SRK-OD1-v1';
  const STAGE_BAND=Object.freeze({BB:3,JR:4,IN:5,SR:6});

  function currentRawAge(){
    try{
      const st=typeof currentStudentObj==='function'?currentStudentObj():null;
      const raw=typeof ageFromStudent==='function'?ageFromStudent(st):null;
      return typeof raw==='number'&&Number.isFinite(raw)?raw:null;
    }catch(_){return null;}
  }
  function resolve(stage,rawAge=currentRawAge()){
    const s=String(stage||'').trim().toUpperCase();
    const band=STAGE_BAND[s]||null;
    if(!band)return Object.freeze({resolved_age:null,status:'PENDING_STAGE',stage:s||null,class_band:null,raw_age:rawAge});
    if(typeof rawAge!=='number'||!Number.isFinite(rawAge))return Object.freeze({resolved_age:null,status:'PENDING_OD1A',stage:s,class_band:band,raw_age:null});
    const age=Math.floor(rawAge);
    if(age<3)return Object.freeze({resolved_age:null,status:'PENDING_OD1A',stage:s,class_band:band,raw_age:rawAge});
    if(age<band)return Object.freeze({resolved_age:age,status:'AGE_UNDER_USE_AGE',stage:s,class_band:band,raw_age:rawAge});
    if(age>band)return Object.freeze({resolved_age:band,status:'CLASS_OVER_USE_CLASS',stage:s,class_band:band,raw_age:rawAge});
    return Object.freeze({resolved_age:band,status:'CLASS_MATCH',stage:s,class_band:band,raw_age:rawAge});
  }

  function patchRegistryAgeResolver(){
    const base=window.LOVEGO_SRK_EVIDENCE_REGISTRY;
    if(!base||base.__od1_wrapped)return false;
    const wrapped=Object.freeze({
      ...base,
      __od1_wrapped:true,
      ageForStage(stage){return resolve(stage).resolved_age;}
    });
    window.LOVEGO_SRK_EVIDENCE_REGISTRY=wrapped;
    return true;
  }

  function hideLogoutUI(){
    try{
      document.querySelectorAll('button.logout').forEach(el=>el.remove());
      let st=document.getElementById('lovego-v56-hide-logout');
      if(!st){st=document.createElement('style');st.id='lovego-v56-hide-logout';st.textContent='.logout{display:none!important}';document.head.appendChild(st);}
    }catch(_){ }
  }

  function currentStage(){
    try{
      const cls=typeof currentClassObj==='function'?currentClassObj():null;
      const n=String(cls?.class_name||cls?.display_name||'').toUpperCase();
      const m=n.match(/(?:^|[-_.\s])(BB|JR|IN|SR)(?:$|[-_.\s0-9])/);
      return m?m[1]:null;
    }catch(_){return null;}
  }

  function installSubmitFailClose(){
    if(typeof window.lovegoSubmitGateV22!=='function'||window.__LOVEGO_V56_GATE__)return false;
    const base=window.lovegoSubmitGateV22;
    window.lovegoSubmitGateV22=function(r){
      const out=base(r);
      if(S?.ui?.dept!=='SRK'||new URLSearchParams(location.search).get('srk_registry')!=='1')return out;
      const od=resolve(currentStage());
      const ok=!!od.resolved_age;
      return {ok:out.ok&&ok,checks:{...(out.checks||{}),srk_od1:{ok,...od}}};
    };
    window.__LOVEGO_V56_GATE__=true;
    return true;
  }

  function install(){
    hideLogoutUI();
    const patched=patchRegistryAgeResolver();
    installSubmitFailClose();
    if(patched){
      window.LoveGoSRKOD1=Object.freeze({version:VERSION,stage_band:STAGE_BAND,resolve,currentStage,currentRawAge});
      window.__LOVEGO_V56_OD1__={installed:true,version:VERSION};
      console.info('[LoveGo] v56 SRK OD-1 resolver ready',resolve(currentStage()));
      return true;
    }
    return false;
  }

  if(!install()){
    let n=0;const t=setInterval(()=>{n++;hideLogoutUI();installSubmitFailClose();if(install()||n>240)clearInterval(t);},25);
  }
})();