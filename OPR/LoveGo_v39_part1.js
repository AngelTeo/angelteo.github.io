
const APP_VERSION=44,KEY='lovego_v44';
const SUPABASE_URL='https://qnpvqsvvsgsantekgfbz.supabase.co';
const SUPABASE_KEY='sb_publishable_v3Y3BD3XiPz33t-hfdX58g_BaFIkjPF';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});

let CLOUD={available:false,reason:'not_checked',cycleMap:{}};
async function cloudProbe(){
  const q=await sb.from('lovego_cycle').select('id,cycle_code,name,status,taxonomy_version').limit(20);
  if(q.error){CLOUD={available:false,reason:q.error.message||'LoveGo cloud unavailable',cycleMap:{}};return CLOUD;}
  CLOUD.available=true;CLOUD.reason='ok';CLOUD.cycleMap=Object.fromEntries((q.data||[]).map(x=>[x.cycle_code,x]));
  CYCLES=(q.data||[]).map(x=>({id:x.cycle_code,name:x.name||x.cycle_code,active:x.status==='active'}));
  if(!S.ui.cycle || !CLOUD.cycleMap[S.ui.cycle]){const preferred=CYCLES.find(x=>x.active)||CYCLES[0]||null;S.ui.cycle=preferred?.id||null;}
  return CLOUD;
}
function cloudReviewPayload(r,submitted=false){return {assignment_id:r.assignment_id,cycle_id:r.cloud_cycle_id,student_id:r.student_id,class_id:r.class_id,department:r.department,teacher_id:r.teacher_id,taxonomy_version:r.taxonomy_version,status:submitted?'completed':'draft',domains:r.domains||{},daily_life:r.daily_life||{},strength_refs:r.strength_refs||[],growth_refs:r.growth_refs||[],strength_note:r.strength_note||null,growth_note:r.growth_note||null,strength_growth_overlap_note:r.strength_growth_overlap_note||null,summary:r.summary||null,...(submitted?{submitted_at:new Date().toISOString(),locked_at:new Date().toISOString()}:{})};}
async function cloudUpsertReview(r,submitted=false){if(!CLOUD.available)throw new Error('LoveGo Cloud 尚未启用');if(!r.assignment_id)throw new Error('没有有效 Teacher Assignment');const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)throw new Error('当前周期尚未建立在 LoveGo Cloud');r.cloud_cycle_id=cyc.id;const payload=cloudReviewPayload(r,submitted);const q=await sb.from('lovego_review').upsert(payload,{onConflict:'assignment_id'}).select('id,status,submitted_at,locked_at').single();if(q.error)throw q.error;Object.assign(r,q.data||{});return q.data;}
async function cloudCreateAssignment(studentId,classId,department,teacherId,slotNo){if(!CLOUD.available)throw new Error('LoveGo Cloud 尚未启用');const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)throw new Error('当前周期尚未建立在 Cloud');const q=await sb.from('lovego_assignment').insert({cycle_id:cyc.id,student_id:studentId,class_id:classId,department,teacher_id:teacherId,slot_no:slotNo,status:'active',assigned_by:S.who.id}).select('*').single();if(q.error)throw q.error;return q.data;}
async function cloudReplaceAssignment(oldAssignment,newTeacherId,reason){if(!CLOUD.available)throw new Error('LoveGo Cloud 尚未启用');const q=await sb.rpc('lovego_replace_assignment',{p_assignment_id:oldAssignment.id,p_new_teacher_id:newTeacherId,p_reason:reason||''});if(q.error)throw q.error;await cloudPullOperational();return q.data;}
async function cloudSetFewerTeacherException(studentId,count,reason){if(!CLOUD.available)throw new Error('LoveGo Cloud 尚未启用');const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)throw new Error('当前周期尚未建立在 Cloud');const payload={cycle_id:cyc.id,student_id:studentId,source_class_id:S.ui.classId,source_type:'student_manual',approved_teacher_count:count,reason,approved_by:S.who.id,status:'active'};const q=await sb.from('lovego_assignment_exception').upsert(payload,{onConflict:'cycle_id,source_class_id,student_id'}).select('*').single();if(q.error)throw q.error;await cloudPullOperational();return q.data;}
async function cloudPullOperational(){
  if(!CLOUD.available)return;
  const [a,rv,ex,rec]=await Promise.all([
    sb.from('lovego_assignment').select('*'),
    sb.from('lovego_review').select('*'),
    isAdmin()?sb.from('lovego_assignment_exception').select('*'):Promise.resolve({data:[],error:null}),
    isAdmin()?sb.from('lovego_assignment_recommendation').select('*').order('rank_no'):Promise.resolve({data:[],error:null})
  ]);
  for(const q of [a,rv,ex,rec])if(q.error)throw q.error;
  S.cloudAssignments=a.data||[];S.cloudReviews=rv.data||[];S.cloudExceptions=ex.data||[];S.cloudRecommendations=rec.data||[];
  S.assignments={};const byContext={};
  for(const x of S.cloudAssignments){const cyc=(Object.values(CLOUD.cycleMap).find(c=>c.id===x.cycle_id)?.cycle_code)||S.ui.cycle;const key=`${cyc}|${x.class_id}|${x.student_id}`;(byContext[key] ||= []).push({...x});}
  for(const [k,rows] of Object.entries(byContext))S.assignments[k]=rows;
  for(const x of S.cloudReviews)S.reviews[`assignment:${x.assignment_id}`]={...x};
  S.assignmentExceptions={};for(const x of S.cloudExceptions){const cyc=(Object.values(CLOUD.cycleMap).find(c=>c.id===x.cycle_id)?.cycle_code)||S.ui.cycle;S.assignmentExceptions[`${cyc}|${x.source_class_id}|${x.student_id}`]={approved:x.status==='active',approved_count:x.approved_teacher_count,reason:x.reason,approved_by:x.approved_by,approved_at:x.approved_at,id:x.id};}
}
(()=>{['LoveGo_v40_dashboard.js','LoveGo_v41_student_override.js','LoveGo_v42_reporting_context.js','LoveGo_v43_ptmgo_gate.js','LoveGo_v44_work_queue.js'].forEach(src=>{const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s);});})();