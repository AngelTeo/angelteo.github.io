function exceptionKey(studentId,cycle=S.ui.cycle){return `${cycle}|${studentId}`}
function getAssignmentException(studentId){return S.assignmentExceptions?.[exceptionKey(studentId)]||null}
async function approveFewerTeachers(studentId){
  if(!isAdmin())return;
  const current=getAssignedTeacherIds(studentId).length;
  if(current>=4){toast('已经有 4 位老师，不需要例外');return}
  const reason=prompt(`目前只有 ${current} 位老师。\n请输入批准少于 4 位老师的原因：`);
  if(!reason)return;
  if(CLOUD.available){
    try{await cloudSetFewerTeacherException(studentId,current,reason);save();renderAssignments();renderCollect();toast('✓ Cloud 例外已批准');return}
    catch(e){toast('例外批准失败：'+String(e.message||e));return}
  }
  S.assignmentExceptions ||= {};
  S.assignmentExceptions[exceptionKey(studentId)]={approved:true,approved_count:current,reason,approved_by:S.who?.id||null,approved_at:new Date().toISOString()};
  save();renderAssignments();renderCollect();toast('✓ 已批准例外');
}
function revokeFewerTeachersException(studentId){if(!isAdmin())return;delete S.assignmentExceptions?.[exceptionKey(studentId)];save();renderAssignments();renderCollect();toast('已取消例外')}
function assignmentCompletion(studentId){
  const n=getAssignedTeacherIds(studentId).length, ex=getAssignmentException(studentId);
  if(n===4)return {ok:true,label:'4/4 已指定'};
  if(ex?.approved && ex.approved_count===n)return {ok:true,label:`${n}/4 · 已批准例外`};
  return {ok:false,label:`${n}/4 · 未完成`};
}
function loveGoReadiness(studentId){
  const rows=currentAssignmentRows(studentId);const ex=getAssignmentException(studentId);
  const assignmentValid=(rows.length===4)||(ex?.approved&&ex.approved_count===rows.length&&rows.length>0);
  let submitted=0;rows.forEach(a=>{const r=Object.values(S.reviews).find(x=>x.assignment_id===a.id&&x.counts_for_cycle!==false);if(r?.submitted_at || r?.status==='completed')submitted++});
  const expected=rows.length;const ready=assignmentValid&&expected>0&&submitted===expected;
  return {ready,assignmentValid,expected,submitted,label:ready?`Completed · Ready for PTMGo (${submitted}/${expected})`:!assignmentValid?`Assignment incomplete (${rows.length}/4)`:`Pending · ${submitted}/${expected} submitted`};
}
function renderAssignments(){
  if(!isAdmin())return;normaliseAssignmentStore();
  const cls=document.getElementById('assignClass')?.value||S.ui.classId;if(cls)S.ui.classId=cls;
  const students=activeStudentsForClass(S.ui.classId);const root=document.getElementById('assignList'); if(!root)return;
  const opt=(selected='')=>{const hasSelected=selected&&S.teachers.some(t=>t.id===selected);const assignedFallback=selected&&!hasSelected?`<option value="${selected}" selected>已指定老师 · ${teacherName(selected)}</option>`:'';return '<option value="">— 未指定 —</option>'+assignedFallback+S.teachers.map(t=>`<option value="${t.id}" ${t.id===selected?'selected':''}>${t.display_name||t.email||t.id}</option>`).join('')};
  root.innerHTML=students.map(st=>{
    const rows=currentAssignmentRows(st.id);const bySlot={};rows.forEach(a=>bySlot[a.slot_no]=a);
    const hist=S.assignmentHistory.filter(a=>a.student_id===st.id||String(a.id||'').includes(st.id)).length;
    const completion=assignmentCompletion(st.id),ex=getAssignmentException(st.id),ready=loveGoReadiness(st.id);
    return `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><b>${st.name_en||''}${st.name_cn?` · ${st.name_cn}`:''}</b><div class="sub">本轮有效 Teacher Lens：${completion.label}${hist?` · 历史更换 ${hist}`:''}</div><div style="margin-top:5px;font-weight:700;color:${ready.ready?'var(--ok)':'var(--warn)'}">${ready.label}</div>${rows.length<4?(ex?.approved?`<div class="sub" style="margin-top:5px">例外原因：${ex.reason} · <button class="ghost" onclick="revokeFewerTeachersException('${st.id}')">取消例外</button></div>`:`<button class="ghost" style="margin-top:6px" onclick="approveFewerTeachers('${st.id}')">批准少于4位</button>`):''}</div><div style="display:grid;grid-template-columns:repeat(2,minmax(190px,1fr));gap:8px;flex:1;max-width:680px">${[1,2,3,4].map(slot=>{const a=bySlot[slot],s=assignmentStatusForSlot(st.id,slot);return `<label style="font-size:11px;color:var(--mut)">Teacher ${slot} · ${s.label}<select style="width:100%;margin-top:3px" onchange="replaceAssignedTeacher('${st.id}',${slot},this.value)">${opt(a?.teacher_id||'')}</select>${a?.teacher_id?`<button type="button" class="ghost" style="margin-top:4px;width:100%" onclick="viewTeacherReview('${st.id}','${a.teacher_id}')">查看 Review</button>`:''}</label>`}).join('')}</div></div></div>`;
  }).join('')||'<div class="card"><div class="empty">这个班级没有 active students。</div></div>';
}
function assignmentReady(studentId){return assignmentCompletion(studentId).ok}
function currentTeacherAssigned(studentId){
  const uid=S.who?.id;if(!uid)return false;
  if(CLOUD.available && Array.isArray(S.cloudAssignments)){
    const cyc=CLOUD.cycleMap[S.ui.cycle];
    const hit=S.cloudAssignments.some(a=>a.student_id===studentId && a.teacher_id===uid && (!cyc || a.cycle_id===cyc.id) && !a.archived_at && ['active','pending','completed'].includes(a.status));
    if(hit)return true;
  }
  return getAssignedTeacherIds(studentId).includes(uid);
}
function exportCSV(){const rows=[['cycle_id','department','class_id','student_id','teacher_id','status','daily_routine','daily_social','daily_emotion','daily_change','strength','growth','summary']];Object.values(S.reviews).forEach(r=>rows.push([r.cycle_id,r.department,r.class_id,r.student_id,r.teacher_id,r.status,r.daily_life?.routine||'',r.daily_life?.social||'',r.daily_life?.emotion||'',r.daily_life?.change||'',r.strength||'',r.growth||'',r.summary||'']));const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv='\uFEFF'+rows.map(row=>row.map(esc).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='LoveGo_'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(a.href);toast('✓ CSV Exported')}
function toggleAdv(){S.ui.advOpen=!S.ui.advOpen;document.getElementById('adv')?.classList.toggle('open',!!S.ui.advOpen);save()}
function paintAdv(){document.getElementById('adv')?.classList.toggle('open',!!S.ui.advOpen)}
function showGate(title,msg,act=''){document.getElementById('gateTitle').textContent=title;document.getElementById('gateMsg').innerHTML=msg;document.getElementById('gateAct').innerHTML=act;document.getElementById('gate').style.display='flex';document.getElementById('app').style.display='none'}
function openApp(){document.getElementById('gate').style.display='none';document.getElementById('app').style.display='';paintAdv()}
async function logout(){await sb.auth.signOut();location.reload()}
async function init(){load();try{
const sess=await Promise.race([sb.auth.getSession(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('登入状态读取超时，请重试。')),8000))]),session=sess.data?.session;
if(!session){showGate('需要登入','请先从 Academee 平台登入后再进入 LoveGo。','<button class="primary" onclick="location.href=\'../index.html\'">← 回平台</button>');return}
const uid=session.user.id;const [permRes,metaRes]=await Promise.all([sb.rpc('can_access',{p_system:'OPR-LoveGo'}),sb.from('users_meta').select('display_name,role,department,dept_group').eq('user_id',uid).maybeSingle()]);if(permRes.error)throw permRes.error;const perm=Array.isArray(permRes.data)?permRes.data[0]:permRes.data;if(!perm||perm.can_see!==true){showGate('这个帐号没有 LoveGo 权限','请由管理层确认 OPR-LoveGo 权限。','<button class="ghost" onclick="location.href=\'../index.html\'">← 回平台</button>');return}
const md=metaRes.data||{};S.who={id:uid,name:md.display_name||session.user.email,role:md.role||'TEACHER',department:md.department||[],dept_group:md.dept_group||[]};S.perm={can_see:!!perm.can_see,can_edit:!!perm.can_edit,can_approve:!!perm.can_approve};document.getElementById('manageTab').style.display=isAdmin()?'':'none';document.getElementById('assignTab')?.style && (document.getElementById('assignTab').style.display=isAdmin()?'':'none');let [c,st,en,tch]=await Promise.all([sb.from('classes').select('id,department,class_name,display_name,sort_order,is_active'),sb.from('students').select('id,name_en,name_cn,birth_year,date_of_birth,status'),sb.from('student_enrollments').select('student_id,class_id,class_number,session_time,is_active'),isAdmin()?sb.rpc('lovego_teacher_roster'):Promise.resolve({data:[],error:null})]);if(c.error)throw c.error;if(st.error)throw st.error;if(en.error)throw en.error;if(tch.error)throw tch.error;if(metaRes.error)throw metaRes.error;S.classes=c.data||[];S.students=st.data||[];S.enroll=en.data||[];S.teachers=(tch.data||[]).map(x=>({id:x.user_id,display_name:x.display_name,email:x.email}));try{await cloudProbe();if(CLOUD.available)await cloudPullOperational()}catch(e){CLOUD.available=false;CLOUD.reason=String(e.message||e)}
const crs=document.getElementById('cloudReviewStatus');if(crs)crs.textContent=CLOUD.available?'Cloud 已连接；正式 Submit 只在服务器确认成功后显示完成。':'Cloud 尚未部署；目前只能保存本机草稿。';document.getElementById('sync').textContent='● 名单已同步';document.getElementById('m1').innerHTML=`登入者：${S.who.name}<br>角色：${S.who.role}<br>can_see：${S.perm.can_see?'✓':'✕'}<br>can_edit：${S.perm.can_edit?'✓':'✕'}<br>can_approve：${S.perm.can_approve?'✓':'✕'}`;save();openApp();renderCollect()}catch(e){console.error(e);showGate('LoveGo 无法完成初始化',String(e.message||e),'<button class="primary" onclick="location.reload()">重试</button>')}}init();

// v40 governance override: management assigns teachers by CLASS, not student-by-student.
async function fetchClassAssignment(classId){
  if(!CLOUD.available||!isAdmin())return [];
  const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)return [];
  const q=await sb.from('lovego_class_assignment').select('*').eq('cycle_id',cyc.id).eq('class_id',classId).eq('status','active').is('archived_at',null).order('slot_no');
  if(q.error)throw q.error;return q.data||[];
}
function classRecommendationTeacherIds(classId){
  const cyc=CLOUD.cycleMap[S.ui.cycle];
  const studentIds=new Set(activeStudentsForClass(classId).map(x=>x.id));
  const score=new Map();
  for(const r of (S.cloudRecommendations||[])){
    if(cyc&&r.cycle_id!==cyc.id)continue;if(!studentIds.has(r.student_id))continue;
    score.set(r.teacher_id,(score.get(r.teacher_id)||0)+(9-Number(r.rank_no||8)));
  }
  return [...score.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}
async function saveClassAssignment(){
  if(!isAdmin()||!CLOUD.available)return;
  const classId=document.getElementById('assignClass')?.value||S.ui.classId;
  const cyc=CLOUD.cycleMap[S.ui.cycle];if(!classId||!cyc)return;
  const ids=[1,2,3,4].map(i=>document.getElementById(`classTeacher${i}`)?.value||'').filter(Boolean);
  if(!ids.length){toast('请至少选择 1 位负责老师');return}
  if(new Set(ids).size!==ids.length){toast('同一班不能重复选择同一位老师');return}
  try{
    const q=await sb.rpc('lovego_set_class_assignment',{p_cycle_id:cyc.id,p_class_id:classId,p_teacher_ids:ids});
    if(q.error)throw q.error;
    await cloudPullOperational();
    toast(`✓ 班级 Assignment 已保存 · ${ids.length} 位老师`);
    await renderAssignments();renderCollect();
  }catch(e){toast('班级 Assignment 保存失败：'+String(e.message||e));}
}
async function renderAssignments(){
  if(!isAdmin())return;
  const cls=document.getElementById('assignClass')?.value||S.ui.classId;if(cls)S.ui.classId=cls;
  const root=document.getElementById('assignList');if(!root||!S.ui.classId)return;
  const cl=S.classes.find(x=>x.id===S.ui.classId);const students=activeStudentsForClass(S.ui.classId);
  root.innerHTML='<div class="card"><div class="empty">正在读取这个班级的 Assignment…</div></div>';
  try{
    const rows=await fetchClassAssignment(S.ui.classId);const bySlot=Object.fromEntries(rows.map(x=>[x.slot_no,x]));
    const suggested=classRecommendationTeacherIds(S.ui.classId).slice(0,6);
    const opt=(selected='')=>'<option value="">— 未指定 —</option>'+S.teachers.map(t=>`<option value="${t.id}" ${t.id===selected?'selected':''}>${t.display_name||t.email||t.id}</option>`).join('');
    const assignedNames=rows.map(x=>teacherName(x.teacher_id));
    const studentAssigned=students.filter(st=>currentAssignmentRows(st.id).length>0).length;
    root.innerHTML=`<div class="card"><div class="title">班级负责老师 · Class Assignment</div><div style="font-size:18px;font-weight:800;margin-bottom:4px">${cl?.display_name||cl?.class_name||''}</div><div class="sub">管理层在这里决定这个班本轮由哪些老师负责。保存后，该班所有 Active Students 自动继承同一组 Teacher Assignment；不需要逐个学生重复选择。</div><div style="display:grid;grid-template-columns:repeat(2,minmax(190px,1fr));gap:9px;margin-top:14px">${[1,2,3,4].map(i=>`<label style="font-size:11px;color:var(--mut)">Teacher ${i}<select id="classTeacher${i}" style="width:100%;margin-top:3px">${opt(bySlot[i]?.teacher_id||'')}</select></label>`).join('')}</div><div class="sub" style="margin-top:10px">系统参考（不是自动 Assignment）：${suggested.length?suggested.map(teacherName).join(' · '):'暂无可验证推荐'}</div><div class="actions"><button class="primary" onclick="saveClassAssignment()">保存这个班的 Assignment</button></div></div><div class="card"><div class="title">班级覆盖</div><div class="lines">Active Students：<b>${students.length}</b><br>当前班级老师：<b>${assignedNames.length?assignedNames.join(' · '):'尚未指定'}</b><br>已产生正式 Student Assignment：<b>${studentAssigned}/${students.length}</b></div><div class="sub" style="margin-top:8px">学生级别只用于少数例外/Override；班级 Assignment 才是主规则。</div></div>`;
  }catch(e){root.innerHTML=`<div class="card"><div class="empty">读取班级 Assignment 失败：${String(e.message||e)}</div></div>`}
}
