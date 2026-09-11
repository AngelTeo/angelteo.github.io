// LoveGo v45 · Teacher visibility / work-scope hardening
// Teachers should only navigate Department/Class contexts that contain a current
// formal assignment for them. Management retains the full operational view.
(()=>{
  const wait=()=>{
    if(!window.__LOVEGO_V45_PRODUCT_HARDENING__||typeof S==='undefined'||typeof CLOUD==='undefined'||typeof window.renderCollect!=='function'){
      setTimeout(wait,80);return;
    }
    install();
  };

  function install(){
    if(window.__LOVEGO_V45_TEACHER_SCOPE__)return;
    window.__LOVEGO_V45_TEACHER_SCOPE__=true;
    const managementRenderCollect=window.renderCollect;

    function myAssignments(){
      const uid=S.who?.id;if(!uid)return [];
      const cyc=CLOUD.cycleMap?.[S.ui.cycle];
      const source=(CLOUD.available&&Array.isArray(S.cloudAssignments))?S.cloudAssignments:Object.values(S.assignments||{}).flat();
      return source.filter(a=>
        a?.teacher_id===uid &&
        !a?.archived_at &&
        ['active','pending','completed'].includes(a?.status) &&
        (!cyc || !a.cycle_id || a.cycle_id===cyc.id || a.cycle_id===S.ui.cycle)
      );
    }

    window.renderCollect=function(){
      if(isAdmin())return managementRenderCollect.apply(this,arguments);

      const cycleGrid=document.getElementById('cycleGrid'),deptGrid=document.getElementById('deptGrid'),classGrid=document.getElementById('classGrid'),summary=document.getElementById('collectSummary'),list=document.getElementById('studentList');
      if(!cycleGrid||!deptGrid||!classGrid||!summary||!list)return;

      cycleGrid.innerHTML=CYCLES.length?CYCLES.map(x=>`<button class="pick ${S.ui.cycle===x.id?'on':''}" onclick="S.ui.cycle='${x.id}';S.ui.dept=null;S.ui.classId=null;save();renderCollect()"><b>${x.name}</b><div class="meta">${x.active?'Active cycle':''}</div></button>`).join(''):'<div class="meta">目前还没有建立 LoveGo Review Cycle。</div>';
      if(!S.ui.cycle){deptGrid.innerHTML='<div class="meta">目前没有活动 Review Cycle。</div>';classGrid.innerHTML='';summary.textContent='';list.innerHTML='';return;}

      const mine=myAssignments();
      if(!mine.length){
        S.ui.dept=null;S.ui.classId=null;
        deptGrid.innerHTML='<div class="meta">Management 还没有把本轮学生正式分配给你。</div>';
        classGrid.innerHTML='';summary.textContent='目前没有 LoveGo Review 需要完成';list.innerHTML='';return;
      }

      const classIds=new Set(mine.map(a=>a.class_id).filter(Boolean));
      const assignedClasses=S.classes.filter(c=>classIds.has(c.id)&&c.is_active!==false);
      const depts=[...new Set(assignedClasses.map(c=>c.department).filter(Boolean))].sort();
      if(!S.ui.dept||!depts.includes(S.ui.dept)){S.ui.dept=depts[0]||null;S.ui.classId=null;}
      deptGrid.innerHTML=depts.map(d=>`<button class="pick ${S.ui.dept===d?'on':''}" onclick="S.ui.dept='${d}';S.ui.classId=null;save();renderCollect()"><b>${d}</b></button>`).join('');

      const classes=assignedClasses.filter(c=>c.department===S.ui.dept).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)||String(a.display_name||a.class_name||'').localeCompare(String(b.display_name||b.class_name||'')));
      if(!S.ui.classId||!classes.some(c=>c.id===S.ui.classId))S.ui.classId=classes[0]?.id||null;
      classGrid.innerHTML=classes.map(c=>`<button class="pick ${S.ui.classId===c.id?'on':''}" onclick="S.ui.classId='${c.id}';save();renderCollect()"><b>${c.display_name||c.class_name}</b></button>`).join('');

      const assignedStudentIds=new Set(mine.filter(a=>a.class_id===S.ui.classId).map(a=>a.student_id));
      const enrolledIds=new Set(S.enroll.filter(e=>e.class_id===S.ui.classId&&e.is_active!==false).map(e=>e.student_id));
      const students=S.students.filter(st=>assignedStudentIds.has(st.id)&&enrolledIds.has(st.id)&&String(st.status||'').trim().toLowerCase()==='active');
      const done=students.filter(st=>{const r=currentReviewForStudent(st.id);return r?.status==='completed'&&!!r?.submitted_at;}).length;
      const todo=students.length-done;
      summary.innerHTML=`<b>${todo}</b> 待完成 · ${done} Completed · ${students.length} Assigned`;
      list.innerHTML=students.map(st=>{const r=currentReviewForStudent(st.id),submitted=r?.status==='completed'&&!!r?.submitted_at;return `<button class="stu" onclick="openReview('${st.id}')"><b>${st.name_en||st.name_cn||st.id}</b><div class="meta">${st.name_cn||''}</div><div style="margin-top:7px"><span class="badge ${submitted?'done':r?'draft':''}">${submitted?'Completed':r?'Draft':'Not started'}</span></div></button>`;}).join('')||'<div class="meta">当前班级没有需要你完成的学生。</div>';
    };
  }
  wait();
})();
