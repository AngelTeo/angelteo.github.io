/* LoveGo v52 · SRK stage context enrichment
   Stores raw age + curriculum-stage signals for later canonical AGE 3/4/5/6 resolution.
   Does NOT itself decide the final canonical age band.
*/
(()=>{
  let installed=false;
  const VERSION='SRK-STAGE-CONTEXT-v1';
  function stageFromClassName(name){
    const n=String(name||'').toUpperCase();
    const m=n.match(/(?:^|[-_.\s])(BB|JR|IN|SR)(?:$|[-_.\s0-9])/);
    return m?m[1]:null;
  }
  function ageSource(st){
    if(st?.date_of_birth)return 'DATE_OF_BIRTH';
    if(typeof st?.birth_year==='number')return 'BIRTH_YEAR';
    return 'UNKNOWN';
  }
  function enrich(r){
    if(S?.ui?.dept!=='SRK'||!r)return r;
    const st=typeof currentStudentObj==='function'?currentStudentObj():null;
    const cls=typeof currentClassObj==='function'?currentClassObj():null;
    const stage=stageFromClassName(cls?.class_name||cls?.display_name);
    for(const x of Object.values(r.domains||{})){
      if(!x?.evidence_context_by_code)continue;
      for(const ctx of Object.values(x.evidence_context_by_code)){
        if(!ctx||typeof ctx!=='object')continue;
        if(!('curriculum_stage' in ctx))ctx.curriculum_stage=stage;
        if(!('age_source' in ctx))ctx.age_source=ageSource(st);
        ctx.stage_context_version=VERSION;
      }
    }
    r.stage_context_version=VERSION;return r;
  }
  function install(){
    if(installed)return true;
    try{
      if(typeof ensure!=='function')return false;
      const baseEnsure=ensure;ensure=function(){return enrich(baseEnsure());};
      if(typeof cloudReviewPayload==='function'){const basePayload=cloudReviewPayload;cloudReviewPayload=function(r,submitted=false){enrich(r);return basePayload(r,submitted);};}
      window.LoveGoSRKStageContext={version:VERSION,stageFromClassName,enrich};
      window.__LOVEGO_V52_STAGE_CONTEXT__={installed:true,version:VERSION,principle:'store raw age/stage signals; final canonical age resolution remains downstream'};
      installed=true;return true;
    }catch(e){console.error('LoveGo v52 stage context install failed',e);return false;}
  }
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);}

  // v53-v55 are additive adapters. The registry UI remains UAT-only behind ?srk_registry=1.
  function loadOnce(src,id){
    if(document.getElementById(id))return;
    const s=document.createElement('script');s.id=id;s.src=src;s.async=false;document.head.appendChild(s);
  }
  loadOnce('LoveGo_v53_srk_evidence_registry.js','lovego-v53-srk-registry');
  loadOnce('LoveGo_v54_srk_registry_adapter.js','lovego-v54-srk-adapter');
  loadOnce('LoveGo_v55_srk_cloud_guard.js','lovego-v55-srk-cloud-guard');
})();