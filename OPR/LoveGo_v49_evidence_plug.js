/* LoveGo v49 · Evidence Plug v1
   Normalized read-only output contract for downstream PTMGo/integration.
   Does not score, interpret or write downstream data.
*/
(()=>{
  let installed=false;
  const SCHEMA='lovego-evidence-v1';
  const pad=n=>String(n).padStart(2,'0');
  function currentDomain(code){return (typeof domains==='function'?domains():[]).find(d=>d.code===code)||null;}
  function bankForDomain(d){try{return d?behaviourBank(d):[];}catch(_){return [];}}
  function labelAt(d,index){const row=bankForDomain(d)[index];return Array.isArray(row)?String(row[0]||''):String(row||'');}
  function genericCode(r,domainCode,index){return `${String(r.department||'UNK')}-${domainCode}-${pad(index+1)}`;}
  function srkCode(r,domainCode,index,x){const p=(x.obs||[]).indexOf(index);return (Array.isArray(x?.evidence_codes)?x.evidence_codes[p]:null)||genericCode(r,domainCode,index);}
  function backfillLabelSnapshots(r){
    if(!r?.domains)return r;
    for(const [domainCode,x] of Object.entries(r.domains)){
      if(!x||!Array.isArray(x.obs))continue;
      const d=currentDomain(domainCode);if(!d)continue;
      x.evidence_context_by_code ||= {};
      x.obs.forEach((idx,pos)=>{
        const code=(r.department==='SRK')?(x.evidence_codes?.[pos]||genericCode(r,domainCode,idx)):genericCode(r,domainCode,idx);
        const ctx=x.evidence_context_by_code[code]||(x.evidence_context_by_code[code]={});
        if(!ctx.label_snapshot){ctx.label_snapshot=labelAt(d,idx);ctx.label_snapshot_source='CURRENT_TAXONOMY_BACKFILL';}
        ctx.evidence_code ||= code;ctx.teacher_section ||= domainCode;
      });
    }
    return r;
  }
  function eventId(r,code){return ['lovego',r.assignment_id||r.id||'local',code].join(':');}
  function buildReview(r){
    backfillLabelSnapshots(r);const out=[];
    for(const [domainCode,x] of Object.entries(r?.domains||{})){
      if(!x||!Array.isArray(x.obs)||x.insufficient_observation===true)continue;
      const d=currentDomain(domainCode);
      x.obs.forEach((idx,pos)=>{
        const code=(r.department==='SRK')?srkCode(r,domainCode,idx,x):genericCode(r,domainCode,idx);
        const ctx=x.evidence_context_by_code?.[code]||{},support=x.support_by_code?.[code]||null;
        out.push({
          schema_version:SCHEMA,event_id:eventId(r,code),source_system:'LoveGo',source_class:'B',evidence_type:'OBSERVATION_BEHAVIOUR',
          evidence_code:code,evidence_label:ctx.label_snapshot||labelAt(d,idx)||null,
          student_id:r.student_id||null,department:r.department||null,cycle_id:r.cycle_id||null,cloud_cycle_id:r.cloud_cycle_id||null,
          class_id:r.class_id||ctx.class_id||null,teacher_id:r.teacher_id||null,assignment_id:r.assignment_id||null,taxonomy_version:r.taxonomy_version||null,
          teacher_section:domainCode,teacher_section_name:d?.name||null,observation_index:idx,
          context_snapshot:Object.keys(ctx).length?{...ctx}:null,
          support_response:support?{level:support.level||null,response:support.response||null,task_familiarity:support.task||null,updated_at:support.updated_at||null}:null,
          note:String(x.note||'').trim()||null,review_status:r.status||'draft',submitted_at:r.submitted_at||null,counts_for_cycle:r.counts_for_cycle!==false,
          captured_at:ctx.captured_at||r.updated_at||null,interpretation:null
        });
      });
    }
    return out;
  }
  function buildAll({submittedOnly=false,countsOnly=true}={}){
    const rows=Object.values(S?.reviews||{}),seen=new Set(),out=[];
    for(const r of rows){
      if(!r)continue;const key=r.id||r.assignment_id||r;if(seen.has(key))continue;seen.add(key);
      if(submittedOnly&&!(r.submitted_at||r.status==='completed'))continue;if(countsOnly&&r.counts_for_cycle===false)continue;
      out.push(...buildReview(r));
    }
    return out;
  }
  function install(){
    if(installed)return true;
    try{
      if(typeof S==='undefined'||typeof domains!=='function'||typeof behaviourBank!=='function')return false;
      if(typeof ensure==='function'){const baseEnsure=ensure;ensure=function(){return backfillLabelSnapshots(baseEnsure());};}
      if(typeof cloudReviewPayload==='function'){const basePayload=cloudReviewPayload;cloudReviewPayload=function(r,submitted=false){backfillLabelSnapshots(r);return basePayload(r,submitted);};}
      window.LoveGoEvidencePlug={schema_version:SCHEMA,buildReview,buildAll};
      window.__LOVEGO_V49_EVIDENCE_PLUG__={installed:true,schema_version:SCHEMA,principles:['read-only normalized output','no 0/1/2 weights','no level inference','report identity = cycle + department + student']};
      installed=true;return true;
    }catch(e){console.error('LoveGo v49 evidence plug install failed',e);return false;}
  }
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);}
})();
