/* LoveGo v61 · SRK canonical Evidence Plug adapter
 * Extends the existing read-only LoveGoEvidencePlug so canonical SRK Registry
 * evidence is exported instead of legacy S1-S10 domain observations whenever
 * registry evidence exists. No scoring, no interpretation, no downstream write.
 */
(()=>{
  'use strict';
  const VERSION='LoveGo-SRK-Evidence-Plug-v1';
  const SCHEMA='lovego-evidence-v1.1';
  let installed=false;

  function packed(r){return r?.domains?.__srk_registry_v1||null;}
  function registryState(r){return r?.srk_registry||packed(r)?.registry||null;}
  function packedEvidence(r){const x=packed(r)?.evidence;return Array.isArray(x)?x:[];}
  function eventId(r,code){return ['lovego',r?.assignment_id||r?.id||'local',code].join(':');}
  function authoritative(r){return r?.status==='completed'&&!!r?.submitted_at&&r?.counts_for_cycle!==false;}
  function fromLocalRegistry(r){
    if(!registryState(r))return [];
    try{
      const A=window.LOVEGO_SRK_REGISTRY_ADAPTER;
      if(A&&typeof A.exportEvidence==='function')return A.exportEvidence(r)||[];
    }catch(_){ }
    return [];
  }
  function normalize(r,e){
    const ctx=e?.context&&typeof e.context==='object'?e.context:null;
    return {
      schema_version:SCHEMA,
      event_id:eventId(r,e?.evidence_code||'UNKNOWN'),
      source_system:'LoveGo',source_class:'B',evidence_type:'OBSERVATION_BEHAVIOUR',
      source_record_id:r?.id||null,
      evidence_code:e?.evidence_code||null,indicator_id:e?.indicator_id||null,
      evidence_label:e?.teacher_wording||null,
      student_id:r?.student_id||e?.student_id||null,
      department:'SRK',cycle_id:r?.cycle_id||e?.cycle_id||null,cloud_cycle_id:r?.cloud_cycle_id||null,
      class_id:r?.class_id||e?.class_id||ctx?.class_id||null,
      teacher_id:r?.teacher_id||e?.teacher_id||null,assignment_id:r?.assignment_id||e?.assignment_id||null,
      taxonomy_version:r?.taxonomy_version||null,
      registry_version:e?.registry_version||packed(r)?.registry?.version||null,
      adapter_version:e?.adapter_version||null,
      teacher_section:e?.teacher_section||null,
      polarity:e?.polarity||null,
      context_snapshot:ctx?{...ctx}:null,
      support_response:e?.support?{...e.support}:null,
      review_status:r?.status||'draft',submitted_at:r?.submitted_at||null,
      counts_for_cycle:r?.counts_for_cycle!==false,
      authoritative:authoritative(r),
      captured_at:ctx?.captured_at||r?.updated_at||null,
      interpretation:null,
      plug_version:VERSION
    };
  }
  function registryEvents(r){
    if(r?.department!=='SRK'||!registryState(r))return null;
    const src=packedEvidence(r).length?packedEvidence(r):fromLocalRegistry(r);
    return src.map(e=>normalize(r,e));
  }
  function install(){
    if(installed)return true;
    const base=window.LoveGoEvidencePlug;
    if(!base||typeof base.buildReview!=='function'||typeof base.buildAll!=='function')return false;
    const baseBuildReview=base.buildReview;
    function buildReview(r){const re=registryEvents(r);return re===null?baseBuildReview(r):re;}
    function buildAll({submittedOnly=false,countsOnly=true}={}){
      const rows=Object.values(S?.reviews||{}),seen=new Set(),out=[];
      for(const r of rows){
        if(!r)continue;const key=r.id||r.assignment_id||r;if(seen.has(key))continue;seen.add(key);
        if(submittedOnly&&!authoritative(r))continue;
        if(countsOnly&&r.counts_for_cycle===false)continue;
        out.push(...buildReview(r));
      }
      return out;
    }
    window.LoveGoEvidencePlug=Object.freeze({...base,schema_version:SCHEMA,buildReview,buildAll,srk_registry_adapter:VERSION});
    window.__LOVEGO_V61_SRK_EVIDENCE_PLUG__={installed:true,version:VERSION,schema_version:SCHEMA,rules:['registry evidence supersedes legacy SRK UX observations when present','draft remains non-authoritative','submitted+counting review is authoritative','interpretation remains null','read-only']};
    installed=true;
    console.info('[LoveGo] v61 SRK Evidence Plug adapter ready');
    return true;
  }
  if(!install()){let n=0,t=setInterval(()=>{n++;if(install()||n>340)clearInterval(t)},25);}
})();
