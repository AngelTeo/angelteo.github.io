/* LoveGo v57 · SRK registry semantic guard
 * Adds OD-1 provenance, conditional opportunity attestation and required familiarity defaults.
 * No developmental level inference.
 */
(()=>{
  'use strict';
  const VERSION='LoveGo-SRK-Semantic-Guard-v1';
  let installed=false;

  function registry(){return window.LOVEGO_SRK_EVIDENCE_REGISTRY||null;}
  function od1(){
    if(!window.LoveGoSRKOD1)return null;
    return window.LoveGoSRKOD1.resolve(window.LoveGoSRKOD1.currentStage());
  }
  function review(){try{return typeof ensure==='function'?ensure():null;}catch(_){return null;}}
  function selectedContext(code){
    const r=review();
    return r?.srk_registry?.context_by_code?.[code]||null;
  }
  function enrichCode(code){
    const row=registry()?.get(code),r=review();
    if(!row||!r?.srk_registry)return;
    const b=r.srk_registry;
    const ctx=b.context_by_code?.[code];
    if(ctx){
      const o=od1();
      ctx.od1=o?{resolved_age:o.resolved_age,status:o.status,class_band:o.class_band,raw_age:o.raw_age,version:'OD1-v1'}:null;
      if(row.opportunity_guard){ctx.opportunity_guard=row.opportunity_guard;ctx.opportunity_met=true;ctx.opportunity_attested_by='TEACHER_SELECTION_OF_CONDITIONAL_WORDING';}
      ctx.semantic_guard_version=VERSION;
    }
    const fam=String(row.task_familiarity||'');
    if(fam.startsWith('REQUIRED:')){
      const required=fam.split(':')[1]||null;
      b.support_by_code ||= {};
      const rec=b.support_by_code[code]||(b.support_by_code[code]={});
      if(required&&!rec.task)rec.task=required;
      rec.familiarity_source='CANONICAL_CODE_PRECONDITION';
      rec.semantic_guard_version=VERSION;
    }
    if(typeof save==='function')save();
  }

  function validate(r){
    const out={ok:true,missing_familiarity:[],missing_od1:[],opportunity_unattested:[]};
    if(S?.ui?.dept!=='SRK'||new URLSearchParams(location.search).get('srk_registry')!=='1')return out;
    const b=r?.srk_registry;if(!b)return out;
    for(const codes of Object.values(b.selected||{}))for(const code of codes||[]){
      const row=registry()?.get(code);if(!row)continue;
      const fam=String(row.task_familiarity||'');
      const s=b.support_by_code?.[code]||{};
      if(fam.startsWith('REQUIRED:')&&!s.task)out.missing_familiarity.push(code);
      const ctx=b.context_by_code?.[code];
      if(!ctx?.od1?.resolved_age)out.missing_od1.push(code);
      if(row.opportunity_guard&&ctx?.opportunity_met!==true)out.opportunity_unattested.push(code);
    }
    out.ok=!out.missing_familiarity.length&&!out.missing_od1.length&&!out.opportunity_unattested.length;
    return out;
  }

  function install(){
    if(installed)return true;
    if(!registry()||!window.LOVEGO_SRK_REGISTRY_ADAPTER||typeof window.toggleSRKRegistryEvidence!=='function')return false;
    const baseToggle=window.toggleSRKRegistryEvidence;
    window.toggleSRKRegistryEvidence=function(sec,code){
      const before=!!selectedContext(code);
      baseToggle(sec,code);
      if(!before&&selectedContext(code))enrichCode(code);
    };
    if(typeof window.lovegoSubmitGateV22==='function'){
      const baseGate=window.lovegoSubmitGateV22;
      window.lovegoSubmitGateV22=function(r){const base=baseGate(r),sg=validate(r);return {ok:base.ok&&sg.ok,checks:{...(base.checks||{}),srk_semantic:sg}};};
    }
    window.LoveGoSRKSemanticGuard=Object.freeze({version:VERSION,enrichCode,validate});
    window.__LOVEGO_V57_SRK_SEMANTIC__={installed:true,version:VERSION};
    installed=true;
    console.info('[LoveGo] v57 SRK semantic guard ready');
    return true;
  }
  if(!install()){let n=0,t=setInterval(()=>{n++;if(install()||n>240)clearInterval(t)},25);}
})();