// LoveGo v40 · Management class-assignment dashboard
// Authority: Management manually decides responsible teachers by CLASS.
// System recommendations are reference only and never auto-assign.
(()=>{
  const wait=()=>{
    if(typeof window.go!=='function'||typeof window.renderAssignments!=='function'||typeof window.openApp!=='function'||typeof window.fetchClassAssignment!=='function'){
      setTimeout(wait,80);return;
    }
    install();
  };
  function install(){
    if(window.__LOVEGO_V40_DASHBOARD__)return;
    window.__LOVEGO_V40_DASHBOARD__=true;

    function ensureAssignTab(){
      if(!document.querySelector('.topbar')||!isAdmin())return;
      let tab=document.getElementById('assignTab');
      if(!tab){
        tab=document.createElement('button');
        tab.className='ntab';tab.id='assignTab';tab.dataset.p='assign';tab.textContent='分配老师';
        tab.onclick=()=>go('assign');
        const manage=document.getElementById('manageTab');
        manage?.parentNode?.insertBefore(tab,manage||null);
      }
      tab.style.display='';
    }

    const oldOpenApp=window.openApp;
    window.openApp=function(){oldOpenApp();ensureAssignTab();};
    const oldGo=window.go;
    window.go=function(p){
      const out=oldGo(p);
      if(p==='assign'&&isAdmin())setTimeout(()=>renderAssignSelectors(),0);
      return out;
    };
    ensureAssignTab();

    window.renderAssignSelectors=function(){
      if(!isAdmin())return;
      const cyc=document.getElementById('assignCycle'),dep=document.getElementById('assignDept'),cls=document.getElementById('assignClass');
      if(cyc){cyc.innerHTML=CYCLES.map(x=>`<option value="${x.id}" ${x.id===S.ui.cycle?'selected':''}>${x.name||x.id}</option>`).join('');cyc.onchange=()=>{S.ui.cycle=cyc.value;renderAssignments();};}
      const ds=[...new Set(S.classes.filter(c=>c.is_active!==false).map(c=>c.department).filter(Boolean))].sort();
      if(!S.ui.dept||!ds.includes(S.ui.dept))S.ui.dept=ds[0]||null;
      if(dep){dep.innerHTML=ds.map(d=>`<option value="${d}" ${d===S.ui.dept?'selected':''}>${d}</option>`).join('');dep.onchange=()=>{S.ui.dept=dep.value;renderAssignments();};}
      if(cls)cls.style.display='none';
      renderAssignments();
    };
    window.renderAssignClasses=function(){const dep=document.getElementById('assignDept')?.value;if(dep)S.ui.dept=dep;renderAssignments();};

    function teacherOptions(selected=''){
      return '<option value="">— 未指定 —</option>'+S.teachers.map(t=>`<option value="${t.id}" ${t.id===selected?'selected':''}>${t.display_name||t.email||t.id}</option>`).join('');
    }
    function suggestedForClass(classId){return (typeof classRecommendationTeacherIds==='function'?classRecommendationTeacherIds(classId):[]).slice(0,6);}
    function classActiveStudents(classId){return activeStudentsForClass(classId).length;}
    function idsForClass(classId){return [1,2,3,4].map(i=>document.getElementById(`class_${classId}_teacher_${i}`)?.value||'').filter(Boolean);}

    window.saveClassAssignmentFor=async function(classId){
      if(!isAdmin()||!CLOUD.available)return;
      const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)return;
      const ids=idsForClass(classId);
      if(!ids.length){toast('请至少选择 1 位负责老师');return;}
      if(new Set(ids).size!==ids.length){toast('同一班不能重复选择同一位老师');return;}
      try{
        const q=await sb.rpc('lovego_set_class_assignment',{p_cycle_id:cyc.id,p_class_id:classId,p_teacher_ids:ids});
        if(q.error)throw q.error;
        await cloudPullOperational();
        toast(`✓ 已保存 · ${teacherNameList(ids)}`);
        renderAssignments();renderCollect();
      }catch(e){toast('班级 Assignment 保存失败：'+String(e.message||e));}
    };
    function teacherNameList(ids){return ids.map(id=>teacherName(id)).join(' · ');}

    window.renderAssignments=async function(){
      if(!isAdmin())return;
      const root=document.getElementById('assignList');if(!root)return;
      const dep=document.getElementById('assignDept')?.value||S.ui.dept;S.ui.dept=dep;
      const classes=S.classes.filter(c=>c.is_active!==false&&(!dep||c.department===dep)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)||String(a.display_name||a.class_name||'').localeCompare(String(b.display_name||b.class_name||'')));
      if(!classes.length){root.innerHTML='<div class="card"><div class="empty">这个 Department 没有 Active Class。</div></div>';return;}
      root.innerHTML='<div class="card"><div class="empty">正在读取班级 Assignment…</div></div>';
      try{
        const all=await Promise.all(classes.map(async c=>[c.id,await fetchClassAssignment(c.id)]));
        const assignmentMap=Object.fromEntries(all);
        const assignedClasses=classes.filter(c=>(assignmentMap[c.id]||[]).length).length;
        const totalStudents=classes.reduce((n,c)=>n+classActiveStudents(c.id),0);
        const summary=`<div class="grid" style="margin-bottom:12px"><div class="card"><div class="title">Department</div><h1 style="margin:0">${dep||'All'}</h1></div><div class="card"><div class="title">Classes assigned</div><h1 style="margin:0">${assignedClasses} / ${classes.length}</h1></div><div class="card"><div class="title">Active Students</div><h1 style="margin:0">${totalStudents}</h1></div></div>`;
        const cards=classes.map(c=>{
          const rows=assignmentMap[c.id]||[],bySlot=Object.fromEntries(rows.map(x=>[x.slot_no,x]));
          const students=classActiveStudents(c.id),suggested=suggestedForClass(c.id);
          const current=rows.length?teacherNameList(rows.map(x=>x.teacher_id)):'尚未指定';
          return `<div class="card" style="border-left:4px solid var(--layer)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><div style="font-size:18px;font-weight:800">${c.display_name||c.class_name||''}</div><div class="meta">${students} Active Students · 当前：${current}</div></div><span class="badge ${rows.length?'done':''}">${rows.length?`${rows.length} 位老师`:'未设定'}</span></div><div style="display:grid;grid-template-columns:repeat(4,minmax(145px,1fr));gap:8px;margin-top:12px">${[1,2,3,4].map(i=>`<label style="font-size:11px;color:var(--mut)">Teacher ${i}<select id="class_${c.id}_teacher_${i}" style="width:100%;margin-top:3px">${teacherOptions(bySlot[i]?.teacher_id||'')}</select></label>`).join('')}</div><div class="meta" style="margin-top:8px">参考：${suggested.length?suggested.map(teacherName).join(' · '):'暂无系统参考'} <span style="opacity:.7">（只供参考，不会自动分配）</span></div><div class="actions"><button class="primary" onclick="saveClassAssignmentFor('${c.id}')">保存 ${c.display_name||c.class_name||'这个班'}</button></div></div>`;
        }).join('');
        root.innerHTML=summary+cards;
        if(window.innerWidth<720){root.querySelectorAll('[style*="grid-template-columns:repeat(4"]').forEach(x=>x.style.gridTemplateColumns='repeat(2,minmax(140px,1fr))');}
      }catch(e){root.innerHTML=`<div class="card"><div class="empty">读取班级 Assignment 失败：${String(e.message||e)}</div></div>`;}
    };
  }
  wait();
})();
