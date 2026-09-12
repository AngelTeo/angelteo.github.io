/* LoveGo v55.1 · SRK registry cloud-schema guard + hydration
 * Keeps feature-gated registry evidence inside the existing domains JSONB payload.
 * Rehydrates registry state after cloud pull so draft selections survive reload.
 */
(()=>{
  'use strict';
  let installed=false;
  const VERSION='LoveGo-SRK-Registry-Cloud-Guard-v1.1';

  function hydrate(r){
    if(!r||r.srk_registry)return r;
    const packed=r.domains?.__srk_registry_v1;
    if(packed?.registry && typeof packed.registry==='object'){
      r.srk_registry=packed.registry;
      r.srk_registry_hydrated_from='domains.__srk_registry_v1';
    }
    return r;
  }

  function install(){
    if(installed)return true;
    if(typeof cloudReviewPayload!=='function'||typeof ensure!=='function'||!window.LOVEGO_SRK_REGISTRY_ADAPTER)return false;

    const baseEnsure=ensure;
    ensure=function(){return hydrate(baseEnsure());};

    const basePayload=cloudReviewPayload;
    cloudReviewPayload=function(r,submitted=false){
      hydrate(r);
      const p=basePayload(r,submitted);
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

    window.__LOVEGO_V55_SRK_CLOUD_GUARD__={
      installed:true,
      version:VERSION,
      rule:'registry payload uses existing domains JSONB; no new top-level DB columns',
      hydration:'domains.__srk_registry_v1.registry -> review.srk_registry'
    };
    window.LoveGoSRKCloudGuard=Object.freeze({version:VERSION,hydrate});
    installed=true;
    console.info('[LoveGo] v55.1 SRK registry cloud guard ready');
    return true;
  }

  let n=0,t=setInterval(()=>{n++;if(install()||n>240)clearInterval(t)},25);
})();