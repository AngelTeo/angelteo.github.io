/* LoveGo v51 · non-destructive runtime integrity guard
   Runs after all LoveGo modules load. No database writes.
*/
(()=>{
  let installed=false;
  const VERSION='LOVEGO-INTEGRITY-v1';
  const pad=n=>String(n).padStart(2,'0');
  function allSRKCodes(){
    const rows=[];
    for(const d of (typeof SRK_TAXONOMY!=='undefined'?SRK_TAXONOMY:[])){
      if(!d?.beh||Array.isArray(d.beh))continue;
      for(const [band,bank] of Object.entries(d.beh)){
        if(!Array.isArray(bank))continue;
        bank.forEach((_,i)=>rows.push({code:`SRK-${d.code}-${String(band).replace('-','')}-${pad(i+1)}`,domain:d.code,band,index:i}));
      }
    }
    return rows;
  }
  function run(){
    const checks=[];const ck=(id,ok,detail='')=>checks.push({id,ok:!!ok,detail});
    const codes=allSRKCodes(),uniq=new Set(codes.map(x=>x.code));
    ck('IG-01-STABLE-CODE-UNIQUE',uniq.size===codes.length,`${uniq.size}/${codes.length}`);
    const s10=(typeof SRK_TAXONOMY!=='undefined'?SRK_TAXONOMY:[]).find(x=>x.code==='S10');
    ck('IG-02-S10-NO-AGGREGATE',!!s10?.noAggregateScore,s10?.name||'missing');
    ck('IG-03-S10-RENAMED',s10?.name==='学习掌握与迁移',s10?.name||'missing');
    const s11=(typeof SRK_TAXONOMY!=='undefined'?SRK_TAXONOMY:[]).find(x=>x.code==='S11');
    ck('IG-04-I5-UI-AGE34',Array.isArray(s11?.activeBands)&&s11.activeBands.length===1&&s11.activeBands[0]==='3-4',JSON.stringify(s11?.activeBands||null));
    const routeAudit=window.LoveGoSRKCanonicalRoutes?.validateRegistry?.();
    ck('IG-05-ROUTING-REGISTRY',routeAudit?.ok===true,JSON.stringify(routeAudit||null));
    ck('IG-06-EVIDENCE-PLUG',window.LoveGoEvidencePlug?.schema_version==='lovego-evidence-v1',window.LoveGoEvidencePlug?.schema_version||'missing');
    ck('IG-07-ROUTING-VERSION',typeof window.LoveGoEvidencePlug?.routing_version==='string',window.LoveGoEvidencePlug?.routing_version||'missing');
    let s10Direct=0,i5At5=0,contextAuto=0;
    if(window.LoveGoSRKCanonicalRoutes?.resolve){
      for(const x of codes){
        const ev4={department:'SRK',evidence_code:x.code,context_snapshot:{age_years_at_capture:4.2}};
        const ev5={department:'SRK',evidence_code:x.code,context_snapshot:{age_years_at_capture:5.2}};
        const r4=window.LoveGoSRKCanonicalRoutes.resolve(ev4),r5=window.LoveGoSRKCanonicalRoutes.resolve(ev5);
        if(x.domain==='S10')s10Direct+=r4.direct.length+r5.direct.length;
        i5At5+=r5.direct.filter(r=>r.indicator_id==='I5').length;
        if(r4.contextual_auto_consumable!==false||r5.contextual_auto_consumable!==false)contextAuto++;
      }
    }
    ck('IG-08-S10-DIRECT-ZERO',s10Direct===0,String(s10Direct));
    ck('IG-09-I5-AGE5-ZERO',i5At5===0,String(i5At5));
    ck('IG-10-CONTEXTUAL-FAIL-CLOSED',contextAuto===0,String(contextAuto));
    ck('IG-11-LOGOUT-UI-REMOVED',document.querySelectorAll('.logout').length===0,String(document.querySelectorAll('.logout').length));
    const passed=checks.filter(x=>x.ok).length,failed=checks.filter(x=>!x.ok);
    return {version:VERSION,passed,total:checks.length,ok:failed.length===0,checks,failed,at:new Date().toISOString()};
  }
  function install(){
    if(installed)return true;
    try{
      if(typeof SRK_TAXONOMY==='undefined'||!window.LoveGoSRKCanonicalRoutes||!window.LoveGoEvidencePlug)return false;
      window.LoveGoIntegrity={version:VERSION,run};
      /* Shell patch can be a few ms later; run once now and once after DOM settles. */
      window.__LOVEGO_V51_INTEGRITY__=run();
      setTimeout(()=>{window.__LOVEGO_V51_INTEGRITY__=run();if(!window.__LOVEGO_V51_INTEGRITY__.ok)console.error('LoveGo integrity guard failed',window.__LOVEGO_V51_INTEGRITY__);},100);
      installed=true;return true;
    }catch(e){console.error('LoveGo v51 integrity install failed',e);return false;}
  }
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);}
})();
