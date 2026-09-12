/* LoveGo · SRK runtime QC */
(()=>{
  'use strict';
  const VERSION='LoveGo-SRK-Runtime-QC';
  let installed=false;
  function registryMode(){return S?.ui?.dept==='SRK'&&new URLSearchParams(location.search).get('srk_registry')==='1';}
  function qc(){
    const R=window.LOVEGO_SRK_EVIDENCE_REGISTRY;
    const registry=R?.validate?.()||{ok:false,errors:['REGISTRY_NOT_READY']};
    const checks={registry:!!registry.ok,adapter:!!window.LOVEGO_SRK_REGISTRY_ADAPTER,cloud_guard:!!window.__LOVEGO_V55_SRK_CLOUD_GUARD__?.installed,od1:!!window.__LOVEGO_V56_OD1__?.installed,semantic:!!window.__LOVEGO_V57_SRK_SEMANTIC__?.installed,no_level_authority:R?.meta?.interpretation_authority===false&&R?.meta?.direct_level_values===false};
    return Object.freeze({ok:Object.values(checks).every(Boolean),checks,registry_errors:registry.errors||[],version:VERSION});
  }
  function syncShell(){document.querySelectorAll('.ver').forEach(el=>el.textContent='LIVE');document.querySelectorAll('button.logout').forEach(el=>el.remove());}
  function showFailClosed(report){if(!registryMode()||report.ok)return;const host=document.getElementById('domains');if(host)host.innerHTML='<div class="alert" style="color:var(--danger)"><b>SRK Observation 暂停</b> · Runtime QC 未通过。不会提交任何 Evidence。</div>';}
  function install(){if(installed)return true;syncShell();if(typeof window.lovegoSubmitGateV22!=='function')return false;const base=window.lovegoSubmitGateV22;window.lovegoSubmitGateV22=function(r){const out=base(r),report=qc();if(!registryMode())return out;return {ok:out.ok&&report.ok,checks:{...(out.checks||{}),srk_runtime:report}};};const report=qc();showFailClosed(report);window.LOVEGO_SRK_RUNTIME_QC=Object.freeze({version:VERSION,qc,registryMode});window.__LOVEGO_V58_RUNTIME_QC__={installed:true,version:VERSION,last:report};installed=true;return true;}
  if(!install()){let n=0,t=setInterval(()=>{n++;syncShell();if(install()||n>260)clearInterval(t)},25);}
})();