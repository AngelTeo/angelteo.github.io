// LoveGo v42 · Reporting Context Authority
// One student may have multiple independent reports. Boundary = cycle + department/class + student.
(()=>{
  const wait=()=>{
    if(typeof S==='undefined'||typeof CLOUD==='undefined'||typeof currentAssignmentRows!=='function'||typeof renderProgress!=='function'){
      setTimeout(wait,100);return;
    }
    install();
  };
  function install(){
    if(window.__LOVEGO_V42_CONTEXT__)return;
    window.__LOVEGO_V42_CONTEXT__=true;

    window.assignmentKey=function(cycle,studentId,classId=S.ui.classId){return `${cycle}|${classId||'NOCLASS'}|${studentId}`;};
    window.currentAssignmentRows=function(studentId,cycle=S.ui.cycle,classId=S.ui.classId){
      normaliseAssignmentStore();
      if(CLOUD.available&&Array.isArray(S.cloudAssignments)){
        const cyc=CLOUD.cycleMap[cycle];
        return S.cloudAssignments.filter(a=>a.student_id===studentId&&a.class_id===classId&&(!cyc||a.cycle_id===cyc.id)&&!a.archived_at&&['draft','active','pending','completed'].includes(a.status)).sort((a,b)=>a.slot_no-b.slot_no);
      }
      return (S.assignments[assignmentKey(cycle,studentId,classId)]||[]).filter(a=>['draft','active','pending','completed'].includes(a.status)).sort((a,b)=>a.slot_no-b.slot_no);
    };
    window.getAssignedTeacherIds=function(studentId,cycle=S.ui.cycle,classId=S.ui.classId){return currentAssignmentRows(studentId,cycle,classId).map(a=>a.teacher_id);};
    window.exceptionKey=function(studentId,cycle=S.ui.cycle,classId=S.ui.classId){return `${cycle}|${classId||'NOCLASS'}|${studentId}`;};
    window.getAssignmentException=function(studentId,classId=S.ui.classId){return S.assignmentExceptions?.[exceptionKey(studentId,S.ui.cycle,classId)]||null;};
    window.currentTeacherAssigned=function(studentId){
      const uid=S.who?.id;if(!uid||!S.ui.classId)return false;
      const cyc=CLOUD.cycleMap[S.ui.cycle];
      if(CLOUD.available&&Array.isArray(S.cloudAssignments))return S.cloudAssignments.some(a=>a.student_id===studentId&&a.class_id===S.ui.classId&&a.teacher_id===uid&&(!cyc||a.cycle_id===cyc.id)&&!a.archived_at&&['active','pending','completed'].includes(a.status));
      return getAssignedTeacherIds(studentId,S.ui.cycle,S.ui.classId).includes(uid);
    };
    window.assignmentCompletion=function(studentId){
      const n=currentAssignmentRows(studentId,S.ui.cycle,S.ui.classId).length,ex=getAssignmentException(studentId,S.ui.classId);
      if(n===4)return {ok:true,label:'4/4 已指定'};
      if(ex?.approved&&ex.approved_count===n)return {ok:true,label:`${n}/4 · 已批准例外`};
      return {ok:false,label:`${n}/4 · 未完成`};
    };
    window.loveGoReadiness=function(studentId){
      const rows=currentAssignmentRows(studentId,S.ui.cycle,S.ui.classId),ex=getAssignmentException(studentId,S.ui.classId);
      const assignmentValid=(rows.length===4)||(ex?.approved&&ex.approved_count===rows.length&&rows.length>0);
      let submitted=0;for(const a of rows){const r=Object.values(S.reviews).find(x=>x.assignment_id===a.id&&x.counts_for_cycle!==false);if(r?.submitted_at||r?.status==='completed')submitted++;}
      const expected=rows.length,ready=assignmentValid&&expected>0&&submitted===expected;
      return {ready,assignmentValid,expected,submitted,label:ready?`Completed · Ready for PTMGo (${submitted}/${expected})`:!assignmentValid?`Assignment incomplete (${rows.length}/4)`:`Pending · ${submitted}/${expected} submitted`};
    };

    const oldRenderProgress=window.renderProgress;
    window.renderProgress=function(){
      if(!isAdmin())return oldRenderProgress();
      const root=document.getElementById('progressBody'),intro=document.getElementById('progressIntro');if(!root)return;
      if(intro)intro.textContent='每个 Department / Class 是独立报告边界；同一学生参加多个课程，会分别产生各自的 Report readiness。';
      const cyc=CLOUD.cycleMap[S.ui.cycle];
      const current=(S.cloudAssignments||[]).filter(a=>(!cyc||a.cycle_id===cyc.id)&&!a.archived_at&&['active','pending','completed'].includes(a.status));
      const contextKeys=[...new Set(current.map(a=>`${a.class_id}|${a.student_id}`))];
      const rows=contextKeys.map(k=>{
        const [classId,sid]=k.split('|'),as=current.filter(a=>a.class_id===classId&&a.student_id===sid).sort((a,b)=>a.slot_no-b.slot_no);
        const st=S.students.find(x=>x.id===sid)||{},cls=S.classes.find(c=>c.id===classId)||{};
        const ex=S.assignmentExceptions?.[`${S.ui.cycle}|${classId}|${sid}`];
        const submitted=as.filter(a=>{const r=Object.values(S.reviews).find(x=>x.assignment_id===a.id&&x.counts_for_cycle!==false);return r?.status==='completed'&&!!r?.submitted_at;}).length;
        const valid=(as.length===4)||(ex?.approved&&ex.approved_count===as.length&&as.length>0),ready=valid&&as.length>0&&submitted===as.length;
        return {classId,sid,as,st,cls,submitted,valid,ready};
      }).sort((a,b)=>String(a.cls.department||'').localeCompare(String(b.cls.department||''))||String(a.cls.display_name||a.cls.class_name||'').localeCompare(String(b.cls.display_name||b.cls.class_name||''))||String(a.st.name_en||a.st.name_cn||'').localeCompare(String(b.st.name_en||b.st.name_cn||'')));
      const totalAssigned=rows.reduce((n,x)=>n+x.as.length,0),totalSubmitted=rows.reduce((n,x)=>n+x.submitted,0),readyCount=rows.filter(x=>x.ready).length;
      const byDept={};for(const x of rows){const d=x.cls.department||x.as[0]?.department||'—';byDept[d] ||= {total:0,ready:0};byDept[d].total++;if(x.ready)byDept[d].ready++;}
      const deptSummary=Object.entries(byDept).map(([d,v])=>`<span class="badge ${v.ready===v.total&&v.total?'done':''}">${d} · ${v.ready}/${v.total} Ready</span>`).join(' ');
      const cards=rows.map(x=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><b>${x.st.name_en||x.st.name_cn||x.sid}${x.st.name_cn&&x.st.name_en?' · '+x.st.name_cn:''}</b><div class="meta"><b>${x.cls.department||x.as[0]?.department||''}</b> · ${x.cls.display_name||x.cls.class_name||''} · 独立报告</div><div style="margin-top:7px"><span class="badge ${x.ready?'done':x.submitted?'draft':''}">${x.submitted} / ${x.as.length} submitted</span> <span class="badge ${x.ready?'done':''}">${x.ready?'Ready for PTMGo':x.valid?'Not ready':'Assignment incomplete'}</span></div></div><button class="ghost" onclick="openReportingContext('${x.classId}','${x.sid}')">查看这个报告</button></div></div>`).join('');
      root.innerHTML=`<div class="grid" style="margin-bottom:12px"><div class="card"><div class="title">Reports / Contexts</div><h1 style="margin:0">${rows.length}</h1></div><div class="card"><div class="title">Teacher submissions</div><h1 style="margin:0">${totalSubmitted} / ${totalAssigned}</h1></div><div class="card"><div class="title">Ready for PTMGo</div><h1 style="margin:0">${readyCount} / ${rows.length}</h1></div></div><div class="card"><div class="title">By Department</div>${deptSummary||'<span class="meta">暂无 Assignment</span>'}</div>${cards||'<div class="card"><div class="meta">本轮还没有正式 Teacher Assignment。</div></div>'}`;
    };
    window.openReportingContext=function(classId,studentId){
      const cls=S.classes.find(c=>c.id===classId);if(!cls)return;
      S.ui.dept=cls.department;S.ui.classId=classId;S.ui.studentId=studentId;save();
      go('assign');setTimeout(()=>{renderAssignSelectors();const el=document.querySelector(`#assignList .card [onclick*="openStudentOverrides('${classId}')"]`);el?.closest('.card')?.scrollIntoView({behavior:'smooth',block:'start'});},30);
    };
  }
  wait();
})();