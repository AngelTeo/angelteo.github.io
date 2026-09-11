/* LoveGo v55 · SRK registry cloud-schema guard
 * Prevents the feature-gated v54 UAT adapter from sending unknown top-level DB columns.
 * Registry evidence is carried inside the existing domains JSONB payload only.
 */
(()=>{
  'use strict';
  let installed=false;
  const VERSION='LoveGo-SRK-Registry-Cloud-Guard-v1';
  function install(){
    if(installed)return true;
    if(typeof cloudReviewPayload!=='function'||!window.LOVEGO_SRK_REGISTRY_ADAPTER)return false;
    const base=cloudReviewPayload;
    cloudReviewPayload=function(r,submitted=false){
      const p=base(r,submitted);
      if(p && Object.prototype.hasOwnProperty.call(p,'srk_registry')){
        const registry=p.srk_registry||null;
        const evidence=p.srk_evidence_export||[];
        const gate=p.srk_registry_gate||null;
        delete p.srk_registry;
        delete p.srk_evidence_export;
        delete p.srk_registry_gate;
        p.domains={...(p.domains||{}),__srk_registry_v1:{registry,evidence,gate,version:VERSION,interpretation:null}};
      }
      return p;
    };
    window.__LOVEGO_V55_SRK_CLOUD_GUARD__={installed:true,version:VERSION,rule:'registry payload uses existing domains JSONB; no new top-level DB columns'};
    installed=true;
    console.info('[LoveGo] v55 SRK registry cloud-schema guard ready');
    return true;
  }
  let n=0,t=setInterval(()=>{n++;if(install()||n>240)clearInterval(t)},25);
})();