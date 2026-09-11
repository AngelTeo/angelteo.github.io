// LoveGo v39 · Management-only Recommendation → Assignment confirmation layer
window.addEventListener('load',()=>{
  if(typeof renderAssignments!=='function')return;

  window.recommendationRows=function(studentId){
    const cyc=CLOUD?.cycleMap?.[S.ui.cycle];
    return (S.cloudRecommendations||[])
      .filter(r=>r.student_id===studentId && (!cyc||r.cycle_id===cyc.id) && r.status==='pending')
      .sort((a,b)=>(a.rank_no||99)-(b.rank_no||99));
  };

  window.confirmRecommendedTeachers=async function(studentId,count){
    if(!isAdmin()||!CLOUD.available)return;
    if(currentAssignmentRows(studentId).length){toast('这名学生已有正式 Assignment');return}
    const recs=recommendationRows(studentId).slice(0,Math.max(1,Math.min(4,count||4)));
    if(!recs.length){toast('目前没有可确认的推荐老师');return}
    const names=recs.map(r=>teacherName(r.teacher_id)).join('、');
    if(!confirm(`确认把以下 ${recs.length} 位老师变成本轮正式 Teacher Assignment？\n\n${names}\n\n确认后，这些老师会在 LoveGo 看到该学生。`))return;
    try{
      const q=await sb.rpc('lovego_confirm_recommendations',{p_student_id:studentId,p_recommendation_ids:recs.map(r=>r.id)});
      if(q.error)throw q.error;
      await cloudPullOperational();save();renderAssignments();renderCollect();toast(`✓ 已确认 ${recs.length} 位老师`);
    }catch(e){toast('确认推荐失败：'+String(e.message||e));}
  };

  const originalRenderAssignments=renderAssignments;
  window.renderAssignments=function(){
    if(!isAdmin())return;normaliseAssignmentStore();
    const cls=document.getElementById('assignClass')?.value||S.ui.classId;if(cls)S.ui.classId=cls;
    const students=activeStudentsForClass(S.ui.classId);const root=document.getElementById('assignList'); if(!root)return;
    const opt=(selected='')=>{const hasSelected=selected&&S.teachers.some(t=>t.id===selected);const assignedFallback=selected&&!hasSelected?`<option value="${selected}" selected>已指定老师 · ${teacherName(selected)}</option>`:'';return '<option value="">— 未指定 —</option>'+assignedFallback+S.teachers.map(t=>`<option value="${t.id}" ${t.id===selected?'selected':''}>${t.display_name||t.email||t.id}</option>`).join('')};
    root.innerHTML=students.map(st=>{
      const rows=currentAssignmentRows(st.id);const bySlot={};rows.forEach(a=>bySlot[a.slot_no]=a);
      const hist=S.assignmentHistory.filter(a=>a.student_id===st.id||String(a.id||'').includes(st.id)).length;
      const completion=assignmentCompletion(st.id),ex=getAssignmentException(st.id),ready=loveGoReadiness(st.id);
      const recs=recommendationRows(st.id);
      const recHtml=!rows.length?`<div style="margin-top:9px;padding:9px 11px;background:var(--sur2);border-radius:10px"><div class="meta"><b>系统推荐 · 尚未通知老师</b> · ${recs.length} 位可验证候选</div>${recs.length?`<div class="chips" style="margin-top:6px">${recs.slice(0,8).map(r=>`<span class="badge">#${r.rank_no} ${teacherName(r.teacher_id)} · ${r.source_detail?.class_name||r.department}</span>`).join('')}</div><button class="primary" style="margin-top:8px" onclick="confirmRecommendedTeachers('${st.id}',${Math.min(4,recs.length)})">${recs.length>=4?'确认推荐前4位':`采用现有 ${recs.length} 位推荐`}</button>${recs.length<4?'<div class="meta">确认后仍需 Management 补充长期接触老师；确实不足才批准 Exception。</div>':''}`:'<div class="meta">没有可自动验证的老师；请由 Management 手动指定真实认识该学生的老师。</div>'}</div>`:'';
      return `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><b>${st.name_en||''}${st.name_cn?` · ${st.name_cn}`:''}</b><div class="sub">本轮有效 Teacher Lens：${completion.label}${hist?` · 历史更换 ${hist}`:''}</div><div style="margin-top:5px;font-weight:700;color:${ready.ready?'var(--ok)':'var(--warn)'}">${ready.label}</div>${rows.length<4?(ex?.approved?`<div class="sub" style="margin-top:5px">例外原因：${ex.reason} · <button class="ghost" onclick="revokeFewerTeachersException('${st.id}')">取消例外</button></div>`:`<button class="ghost" style="margin-top:6px" onclick="approveFewerTeachers('${st.id}')">批准少于4位</button>`):''}</div><div style="display:grid;grid-template-columns:repeat(2,minmax(190px,1fr));gap:8px;flex:1;max-width:680px">${[1,2,3,4].map(slot=>{const a=bySlot[slot],s=assignmentStatusForSlot(st.id,slot);return `<label style="font-size:11px;color:var(--mut)">Teacher ${slot} · ${s.label}<select style="width:100%;margin-top:3px" onchange="replaceAssignedTeacher('${st.id}',${slot},this.value)">${opt(a?.teacher_id||'')}</select>${a?.teacher_id?`<button type="button" class="ghost" style="margin-top:4px;width:100%" onclick="viewTeacherReview('${st.id}','${a.teacher_id}')">查看 Review</button>`:''}</label>`}).join('')}</div></div>${recHtml}</div>`;
    }).join('')||'<div class="card"><div class="empty">这个班级没有 active students。</div></div>';
  };
});
