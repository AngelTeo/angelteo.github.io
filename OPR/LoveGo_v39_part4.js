function assignmentKey(cycle,studentId){return `${cycle}|${studentId}`}
function normaliseAssignmentStore(){
  Object.entries(S.assignments||{}).forEach(([key,val])=>{
    if(!Array.isArray(val))return;
    const legacy=val.filter(Boolean);
    if(!legacy.length || legacy.every(x=>typeof x==='object' && x!==null && 'teacher_id' in x)) return;
    S.assignments[key]=legacy.slice(0,4).map((teacher_id,i)=>({
      id:`local-${key}-${i+1}-${teacher_id}`,
      slot_no:i+1,teacher_id,status:'active',assigned_at:new Date().toISOString(),
      replaced_assignment_id:null,replacement_reason:''
    }));
  });
  S.assignmentHistory ||= [];
}
function currentAssignmentRows(studentId,cycle=S.ui.cycle){
  normaliseAssignmentStore();
  return (S.assignments[assignmentKey(cycle,studentId)]||[])
    .filter(a=>['draft','active','pending','completed'].includes(a.status))
    .sort((a,b)=>a.slot_no-b.slot_no);
}
function getAssignedTeacherIds(studentId,cycle=S.ui.cycle){
  return currentAssignmentRows(studentId,cycle).map(a=>a.teacher_id);
}
function teacherName(id){const t=S.teachers.find(x=>x.id===id);return t?.display_name||t?.email||id}
function activeStudentsForClass(classId){
  const ids=new Set(S.enroll.filter(e=>e.class_id===classId&&e.is_active!==false).map(e=>e.student_id));
  return S.students.filter(s=>ids.has(s.id)&&String(s.status||'').trim().toLowerCase()==='active');
}
function reviewForAssignment(a){
  return Object.values(S.reviews).find(r=>r.assignment_id===a.id||(
    r.cycle_id===S.ui.cycle && r.student_id===S.ui.studentId && r.teacher_id===a.teacher_id && r.assignment_slot===a.slot_no
  ));
}
async function replaceAssignedTeacher(studentId,slot,newTeacherId){
  if(!isAdmin())return;
  normaliseAssignmentStore();
  const key=assignmentKey(S.ui.cycle,studentId);
  const rows=[...(S.assignments[key]||[])];
  const idx=rows.findIndex(a=>a.slot_no===slot);
  const old=idx>=0?rows[idx]:null;
  if(old && old.teacher_id===newTeacherId)return;
  if(CLOUD.available){
    try{
      const oldReviewCloud=old ? Object.values(S.reviews).find(r=>r.assignment_id===old.id) : null;
      if(old){
        let reason='';
        if(oldReviewCloud?.submitted_at || oldReviewCloud?.status==='completed'){
          reason=prompt(`Teacher ${slot} 已经提交。旧 Review 会永久保留，但不再计入最终 evidence。\n请输入换老师原因：`)||'';
          if(!reason){toast('已取消换老师');return}
        }
        await cloudReplaceAssignment(old,newTeacherId,reason);
      }else if(newTeacherId){
        await cloudCreateAssignment(studentId,S.ui.classId,S.ui.dept,newTeacherId,slot);
        await cloudPullOperational();
      }
      save();renderAssignments();renderCollect();toast('✓ Cloud assignment 已更新');return;
    }catch(e){toast('Assignment 更新失败：'+String(e.message||e));return}
  }
  const oldReview=old ? Object.values(S.reviews).find(r=>(r.assignment_id && r.assignment_id===old.id) || (r.cycle_id===S.ui.cycle && r.student_id===studentId && r.teacher_id===old.teacher_id && r.assignment_slot===slot)) : null;
  if(oldReview?.submitted_at || oldReview?.status==='completed'){
    const reason=prompt(`Teacher ${slot} 已经提交。旧 Review 会永久保留，但不再计入最终四份。\n请输入换老师原因：`);
    if(!reason){toast('已取消换老师');renderAssignments();return}
    old.status='archived';old.archived_at=new Date().toISOString();old.replacement_reason=reason;
    oldReview.counts_for_cycle=false;oldReview.invalidated_at=new Date().toISOString();oldReview.invalidation_reason=reason;
    S.assignmentHistory.push({...old});if(idx>=0)rows.splice(idx,1);
  }else if(old){
    old.status='archived';old.archived_at=new Date().toISOString();old.replacement_reason='Reassigned before submission';
    S.assignmentHistory.push({...old});if(idx>=0)rows.splice(idx,1);
  }
  if(newTeacherId){
    const a={id:`local-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`,slot_no:slot,teacher_id:newTeacherId,status:'active',assigned_at:new Date().toISOString(),replaced_assignment_id:old?.id||null,replacement_reason:(oldReview?.submitted_at || oldReview?.status==='completed')?(old?.replacement_reason||''):''};
    rows.push(a);
  }
  S.assignments[key]=rows;save();renderAssignments();renderCollect();
}
function assignmentStatusForSlot(studentId,slot){
  const a=currentAssignmentRows(studentId).find(x=>x.slot_no===slot);
  if(!a)return {label:'未指定',cls:''};
  const r=Object.values(S.reviews).find(x=>x.assignment_id===a.id);
  if(r?.submitted_at || r?.status==='completed')return {label:'已提交',cls:'done'};
  if(r)return {label:'草稿',cls:'draft'};
  return {label:'已指定',cls:'active'};
}
function viewTeacherReview(studentId,teacherId){
  if(!isAdmin())return;
  const reviews=Object.values(S.reviews).filter(r=>r.cycle_id===S.ui.cycle&&r.student_id===studentId&&r.teacher_id===teacherId);
  const r=reviews.sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')))[0];
  const box=document.getElementById('mgmtReviewView'),body=document.getElementById('mgmtReviewBody');
  if(!box||!body)return;box.style.display='';
  if(!r){body.innerHTML='<div class="empty">这位老师还没有保存 Review。</div>';return}
  const st=S.students.find(x=>x.id===studentId);const dl=r.daily_life||{};
  const domainRows=Object.entries(r.domains||{}).map(([code,x])=>`<div style="padding:8px 0;border-bottom:.5px solid var(--bdr)"><b>${code}</b><div class="sub">${(x.obs||[]).join(', ')}${x.note?` · ${x.note}`:''}</div></div>`).join('');
  body.innerHTML=`<div style="margin:10px 0"><b>${st?.name_en||''}${st?.name_cn?` · ${st.name_cn}`:''}</b> · ${teacherName(teacherId)} · ${r.status||'draft'}${r.counts_for_cycle===false?' · 历史/不计本轮':''}</div>${domainRows||'<div class="empty">尚无 domain evidence。</div>'}<div style="margin-top:12px"><b>学生日常</b><div class="sub">Routine：${dl.routine||'—'}<br>Social：${dl.social||'—'}<br>Emotion：${dl.emotion||'—'}<br>Change：${dl.change||'—'}</div></div><div style="margin-top:12px"><b>补充</b><div class="sub">${r.summary||'—'}</div></div>`;
  box.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderAssignSelectors(){
  if(!isAdmin())return;
  const cyc=document.getElementById('assignCycle'),dep=document.getElementById('assignDept');
  if(cyc){cyc.innerHTML=[S.ui.cycle].map(x=>`<option value="${x}">${x}</option>`).join('')}
  if(dep){const ds=[...new Set(S.classes.map(c=>c.department).filter(Boolean))].sort();dep.innerHTML=ds.map(d=>`<option value="${d}" ${d===S.ui.dept?'selected':''}>${d}</option>`).join('');}
  renderAssignClasses();
}
function renderAssignClasses(){
  if(!isAdmin())return;
  const dep=document.getElementById('assignDept')?.value||S.ui.dept;S.ui.dept=dep;
  const sel=document.getElementById('assignClass');
  const list=S.classes.filter(c=>c.department===dep&&c.is_active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  if(!S.ui.classId||!list.some(c=>c.id===S.ui.classId))S.ui.classId=list[0]?.id||null;
  if(sel)sel.innerHTML=list.map(c=>`<option value="${c.id}" ${c.id===S.ui.classId?'selected':''}>${c.display_name||c.class_name}</option>`).join('');
  renderAssignments();
}
