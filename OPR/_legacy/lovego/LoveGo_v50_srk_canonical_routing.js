/* LoveGo v50 · SRK canonical routing guard
   Canonical authority: PTM 38 Golden Rubric + NR-2 Class-B behaviour-code scope.
   IMPORTANT:
   - route != level
   - candidate_polarity != final evidence role
   - contextual candidates are NEVER auto-consumed
   - S10 has no generic canonical route
*/
(()=>{
  let installed=false;
  const VERSION='SRK-CANONICAL-ROUTING-v1';
  const CLASS_B=new Set(['E-L1','E-L2','B-L1','B-L2','M-L1','M-L2','M2','M4','M5','S1','S2','S3','H1','H2','H3','H4','H5','I1','I2','I3','I4','I5','C1','C2','C3','C4','C5']);
  const R=(indicator_id,candidate_polarity='POSITIVE')=>({indicator_id,route_type:'DIRECT',candidate_polarity,final_role:null});
  const DIRECT={
    /* S1 School Adjustment: only unambiguous routine/recovery observations route directly. */
    'SRK-S1-34-04':[R('C5')],
    'SRK-S1-34-05':[R('I1')],
    'SRK-S1-34-06':[R('C5','SUPPORT')],
    'SRK-S1-56-01':[R('I1')],
    'SRK-S1-56-05':[R('C5')],
    'SRK-S1-56-07':[R('I1','SUPPORT')],

    /* S2 Communication: self-expression/help-seeking only. Target-language L2 needs language context, so not direct here. */
    'SRK-S2-34-02':[R('I4')],
    'SRK-S2-34-04':[R('C1')],
    'SRK-S2-56-01':[R('C1')],
    'SRK-S2-56-05':[R('I4')],
    'SRK-S2-56-08':[R('C1','SUPPORT')],

    /* S3 Learning Engagement */
    'SRK-S3-34-04':[R('H3')],
    'SRK-S3-34-05':[R('H3')],
    'SRK-S3-34-06':[R('H3','SUPPORT')],
    'SRK-S3-56-02':[R('H3')],
    'SRK-S3-56-05':[R('H3')],
    'SRK-S3-56-06':[R('H3','SUPPORT')],

    /* S4 Independence & Routine */
    'SRK-S4-34-01':[R('I2')],
    'SRK-S4-34-02':[R('I2')],
    'SRK-S4-34-04':[R('I1')],
    'SRK-S4-34-06':[R('I4')],
    'SRK-S4-56-03':[R('I1')],
    'SRK-S4-56-05':[R('I2')],
    'SRK-S4-56-09':[R('I1','SUPPORT')],
    'SRK-S4-56-10':[R('I3','SUPPORT')],

    /* S5 Self-Regulation */
    'SRK-S5-34-03':[R('C5')],
    'SRK-S5-34-05':[R('C5')],
    'SRK-S5-34-07':[R('C5','SUPPORT')],
    'SRK-S5-56-04':[R('C5')],
    'SRK-S5-56-08':[R('C5','SUPPORT')],
    'SRK-S5-56-09':[R('C5','SUPPORT')],
    'SRK-S5-56-10':[R('C5','SUPPORT')],

    /* S6 Social Interaction */
    'SRK-S6-34-03':[R('C4')],
    'SRK-S6-34-04':[R('C3')],
    'SRK-S6-34-05':[R('C3')],
    'SRK-S6-34-06':[R('C1')],
    'SRK-S6-56-02':[R('C3')],
    'SRK-S6-56-03':[R('C3')],
    'SRK-S6-56-04':[R('C1')],
    'SRK-S6-56-05':[R('C3')],
    'SRK-S6-56-08':[R('C4')],

    /* S7 Understanding vs Follow-through */
    'SRK-S7-34-05':[R('H2')],
    'SRK-S7-34-06':[R('H1','SUPPORT')],
    'SRK-S7-34-07':[R('H1','SUPPORT')],
    'SRK-S7-56-02':[R('H2')],
    'SRK-S7-56-05':[R('H2')],
    'SRK-S7-56-06':[R('H1')],
    'SRK-S7-56-08':[R('H2','SUPPORT')],
    'SRK-S7-56-09':[R('H1','SUPPORT')],

    /* S8 Learning Approach */
    'SRK-S8-34-02':[R('H5')],
    'SRK-S8-34-04':[R('H5')],
    'SRK-S8-34-05':[R('I4')],
    'SRK-S8-34-06':[R('H5')],
    'SRK-S8-34-07':[R('H5','SUPPORT')],
    'SRK-S8-56-01':[R('H5')],
    'SRK-S8-56-03':[R('H5')],
    'SRK-S8-56-04':[R('I4')],
    'SRK-S8-56-05':[R('I4')],
    'SRK-S8-56-06':[R('H5')],
    'SRK-S8-56-07':[R('H5')],
    'SRK-S8-56-08':[R('I4','SUPPORT')],
    'SRK-S8-56-10':[R('H5','SUPPORT')],

    /* S9 Attention = H3 only where actual task engagement/recovery is explicit. */
    'SRK-S9-34-02':[R('H3')],
    'SRK-S9-34-03':[R('H3')],
    'SRK-S9-34-04':[R('H3')],
    'SRK-S9-34-05':[R('H3')],
    'SRK-S9-34-07':[R('H3','SUPPORT')],
    'SRK-S9-34-08':[R('H3','SUPPORT')],
    'SRK-S9-34-09':[R('H3','SUPPORT')],
    'SRK-S9-56-02':[R('H3')],
    'SRK-S9-56-03':[R('H3')],
    'SRK-S9-56-04':[R('H3')],
    'SRK-S9-56-05':[R('H3')],
    'SRK-S9-56-07':[R('H3','SUPPORT')],
    'SRK-S9-56-08':[R('H3','SUPPORT')],
    'SRK-S9-56-09':[R('H3','SUPPORT')],

    /* S11 Self-Care maps to I5 only. v47 hides S11 outside presentation band 3-4; exact-age guard below also enforces AGE 3-4. */
    'SRK-S11-34-01':[R('I5')],
    'SRK-S11-34-02':[R('I5','SUPPORT')],
    'SRK-S11-34-03':[R('I5')],
    'SRK-S11-34-04':[R('I5')],
    'SRK-S11-34-05':[R('I5')],
    'SRK-S11-34-06':[R('I5')],
    'SRK-S11-34-07':[R('I5','SUPPORT')]
  };

  /* These are suggestions for a later context resolver. They are deliberately not emitted as direct routes. */
  const CONTEXTUAL={
    'SRK-S2-34-01':['C1','I5'],
    'SRK-S2-34-05':['E-L2','B-L2','M-L2'],
    'SRK-S2-56-02':['E-L2','B-L2','M-L2'],
    'SRK-S2-56-03':['C1','E-L2','B-L2','M-L2'],
    'SRK-S2-56-04':['E-L2','B-L2','M-L2'],
    'SRK-S3-56-01':['H1','H2','H3'],
    'SRK-S4-34-05':['I5','I3'],
    'SRK-S4-34-07':['I1','I3','H2','H4','H3'],
    'SRK-S4-56-01':['I2','H1'],
    'SRK-S4-56-02':['I2','H4'],
    'SRK-S4-56-04':['I1','H3','H4'],
    'SRK-S5-34-01':['C5','C3'],
    'SRK-S5-34-06':['I1','C5'],
    'SRK-S6-34-07':['C4','C5'],
    'SRK-S7-34-02':['H1','H2'],
    'SRK-S7-34-03':['H1','H2'],
    'SRK-S7-34-04':['I1','H2'],
    'SRK-S7-34-08':['H1','H2'],
    'SRK-S7-34-09':['H2'],
    'SRK-S7-56-01':['H1','H2'],
    'SRK-S7-56-03':['H2'],
    'SRK-S7-56-04':['H1'],
    'SRK-S7-56-07':['H1','H2'],
    'SRK-S8-34-01':['H1','H5'],
    'SRK-S8-34-03':['H1'],
    'SRK-S8-34-08':['I3','H5'],
    'SRK-S8-56-02':['H5'],
    'SRK-S8-56-09':['I4','I3'],
    'SRK-S9-34-01':['H3'],
    'SRK-S9-34-06':['H3','I1'],
    'SRK-S9-56-01':['H3'],
    'SRK-S9-56-06':['H3','I1']
  };

  function exactAge(context){
    const a=Number(context?.age_years_at_capture);return Number.isFinite(a)?Math.floor(a):null;
  }
  function routeAllowed(route,context){
    if(!CLASS_B.has(route.indicator_id))return false;
    const age=exactAge(context);
    if(route.indicator_id==='I5')return age===3||age===4;
    return true;
  }
  function resolve(event){
    if(!event||event.department!=='SRK')return {mapping_version:VERSION,direct:[],contextual_candidates:[]};
    const raw=DIRECT[event.evidence_code]||[];
    const direct=raw.filter(r=>routeAllowed(r,event.context_snapshot)).map(r=>({...r,mapping_version:VERSION}));
    const contextual_candidates=(CONTEXTUAL[event.evidence_code]||[]).filter(x=>CLASS_B.has(x));
    return {mapping_version:VERSION,direct,contextual_candidates,contextual_auto_consumable:false};
  }
  function validateRegistry(){
    const ids=Object.values(DIRECT).flat().map(x=>x.indicator_id);
    const bad=ids.filter(x=>!CLASS_B.has(x));
    const s10=Object.keys(DIRECT).filter(k=>k.startsWith('SRK-S10-'));
    const i5bad=Object.entries(DIRECT).filter(([k,v])=>v.some(x=>x.indicator_id==='I5')&&!k.includes('-34-'));
    return {ok:!bad.length&&!s10.length&&!i5bad.length,direct_codes:Object.keys(DIRECT).length,bad_non_class_b:bad,s10_direct:s10,i5_non_34:i5bad.map(x=>x[0])};
  }
  function install(){
    if(installed)return true;
    try{
      window.LoveGoSRKCanonicalRoutes={version:VERSION,class_b:[...CLASS_B],resolve,validateRegistry};
      if(window.LoveGoEvidencePlug?.buildReview){
        const baseBuildReview=window.LoveGoEvidencePlug.buildReview;
        const baseBuildAll=window.LoveGoEvidencePlug.buildAll;
        window.LoveGoEvidencePlug.buildReview=function(r){return baseBuildReview(r).map(ev=>{const route=resolve(ev);return {...ev,canonical_routes:route.direct,contextual_candidates:route.contextual_candidates,mapping_version:route.mapping_version,contextual_auto_consumable:false};});};
        window.LoveGoEvidencePlug.buildAll=function(opts={}){
          /* Rebuild through the wrapped buildReview so canonical routing is consistent. */
          const rows=Object.values(S?.reviews||{}),seen=new Set(),out=[];
          for(const r of rows){if(!r)continue;const key=r.id||r.assignment_id||r;if(seen.has(key))continue;seen.add(key);if(opts.submittedOnly&&!(r.submitted_at||r.status==='completed'))continue;if(opts.countsOnly!==false&&r.counts_for_cycle===false)continue;out.push(...window.LoveGoEvidencePlug.buildReview(r));}
          return out;
        };
        window.LoveGoEvidencePlug.routing_version=VERSION;
      }
      const audit=validateRegistry();
      if(!audit.ok)throw new Error('canonical routing registry invalid: '+JSON.stringify(audit));
      window.__LOVEGO_V50_CANONICAL_ROUTING__={installed:true,...audit,version:VERSION};
      installed=true;return true;
    }catch(e){console.error('LoveGo v50 canonical routing install failed',e);return false;}
  }
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);}
})();
