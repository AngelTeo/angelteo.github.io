/* LoveGo v60.1 · SRK end-to-end guard
 * Final UAT fail-close layer for canonical registry mode.
 * If the dedicated v59 submit bridge is missing, registry submission is blocked
 * rather than falling back to legacy saveReview validation.
 */
(()=>{
  'use strict';
  const VERSION='LoveGo-SRK-E2E-Guard-v1.1';
  let installed=false;
  function registryMode(){return S?.ui?.dept==='SRK'&&new URLSearchParams(location.search).get('srk_registry')==='1';}
  function report(){
    const R=window.LOVEGO_SRK_EVIDENCE_REGISTRY;
    const rq=R?.validate?.()||{ok:false,errors:['REGISTRY_NOT_READY']};
    const checks={registry:!!rq.ok,adapter:!!window.LOVEGO_SRK_REGISTRY_ADAPTER,cloud_guard:!!window.__LOVEGO_V55_SRK_CLOUD_GUARD__?.installed,od1:!!window.__LOVEGO_V56_OD1__?.installed,semantic:!!window.__LOVEGO_V57_SRK_SEMANTIC__?.installed,runtime:!!window.__LOVEGO_V58_RUNTIME_QC__?.installed,submit_bridge:!!window.__LOVEGO_V59_SRK_SUBMIT_BRIDGE__?.installed,no_level_authority:R?.meta?.interpretation_authority===false&&R?.meta?.direct_level_values===false};
    return Object.freeze({ok:Object.values(checks).every(Boolean),checks,registry_errors:rq.errors||[],version:VERSION});
  }
  function install(){
    if(installed)return true;
    if(typeof window.saveReview!=='function')return false;
    const base=window.saveReview;
    window.saveReview=function(submit){
      if(registryMode()&&submit&&!report().ok){toast('SRK Registry 尚未通过完整 Runtime QC，已停止提交');return;}
      return base(submit);
    };
    window.LoveGoSRKE2EGuard=Object.freeze({version:VERSION,report,registryMode});
    window.__LOVEGO_V60_SRK_E2E__={installed:true,version:VERSION,last:report()};
    installed=true;
    console.info('[LoveGo] v60.1 SRK end-to-end guard',report());
    return true;
  }
  if(!install()){let n=0,t=setInterval(()=>{n++;if(install()||n>320)clearInterval(t)},25);}
  if(!document.getElementById('lovego-v61-srk-evidence-plug')){
    const s=document.createElement('script');s.id='lovego-v61-srk-evidence-plug';s.src='LoveGo_v61_srk_evidence_plug_adapter.js';s.async=false;document.head.appendChild(s);
  }
})();
