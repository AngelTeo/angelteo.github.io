// LoveGo v41 · Student Override management
// Base rule stays CLASS assignment. This layer handles rare student-specific exceptions only.
(()=>{
  const wait=()=>{
    if(!window.__LOVEGO_V40_DASHBOARD__||typeof window.renderAssignments!=='function'||typeof sb==='undefined'||typeof S==='undefined'||typeof CLOUD==='undefined'){
      setTimeout(wait,100);return;
    }
    install();
  };
  function install(){
    if(window.__LOVEGO_V41_OVERRIDE__)return;
    window.__LOVEGO_V41_OVERRIDE__=true;

    function ensureModal(){
      if(document.getElementById('lovegoOverrideModal'))return;
      const m=document.createElement('div');
      m.id='lovegoOverrideModal';
      m.style='display:none;position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:10000;padding:18px;overflow:auto';
      m.innerHTML=`<div style="max-width:920px;margin:30px auto;background:#fff;border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.2)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="eyebrow">Student Exception</div><h2 style="margin:5px 0" id="overrideTitle">个别学生调整</h2><div class="sub">班级 Assignment 是主规则。只有这个学生确实需要不同负责老师时才在这里调整。</div></div><button class="ghost" onclick="closeStudentOverride()">关闭</button></div><div id="overrideBody" style="margin-top:14px"></div></div>`;
      document.body.appendChild(m);
    }
    window.closeStudentOverride=()=>{const m=document.getElementById('lovegoOverrideModal');if(m)m.style.display='none';};

    function teacherOptions(selected='',exclude=[]){
      const ex=new Set(exclude.filter(Boolean));
      return '<option value="">— 选择老师 —</option>'+S.teachers.filter(t=>!ex.has(t.id)||t.id===selected).map(t=>`<option value="${t.id}" ${t.id===selected?'selected':''}>${t.display_name||t.email||t.id}</option>`).join('');
    }
    function currentRows(studentId){
      const cyc=CLOUD.cycleMap[S.ui.cycle];
      return (S.cloudAssignments||[]).filter(a=>a.student_id===studentId&&(!cyc||a.cycle_id===cyc.id)&&!a.archived_at&&['active','pending','completed'].includes(a.status)).sort((a,b)=>a.slot_no-b.slot_no);
    }
    async function activeOverrides(classId){
      const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)return [];
      const q=await sb.from('lovego_student_override').select('*').eq('cycle_id',cyc.id).eq('class_id',classId).eq('status','active').is('archived_at',null);
      if(q.error)throw q.error;return q.data||[];
    }
    async function classBase(classId){
      const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)return [];
      const q=await sb.from('lovego_class_assignment').select('*').eq('cycle_id',cyc.id).eq('class_id',classId).eq('status','active').is('archived_at',null).order('slot_no');
      if(q.error)throw q.error;return q.data||[];
    }

    window.openStudentOverrides=async function(classId){
      if(!isAdmin())return;
      ensureModal();
      const modal=document.getElementById('lovegoOverrideModal'),body=document.getElementById('overrideBody');
      const cl=S.classes.find(c=>c.id===classId);
      document.getElementById('overrideTitle').textContent=`个别学生调整 · ${cl?.display_name||cl?.class_name||''}`;
      modal.style.display='block';body.innerHTML='<div class="empty">正在读取…</div>';
      try{
        const [base,ovs]=await Promise.all([classBase(classId),activeOverrides(classId)]);
        const students=activeStudentsForClass(classId).sort((a,b)=>String(a.name_en||a.name_cn||'').localeCompare(String(b.name_en||b.name_cn||'')));
        if(!base.length){body.innerHTML='<div class="alert">请先完成这个班的 Class Assignment，才需要处理个别学生例外。</div>';return;}
        const ovByStudent={};for(const o of ovs)(ovByStudent[o.student_id] ||= []).push(o);
        body.innerHTML=`<div class="card"><div class="title">选择学生</div><select id="overrideStudent" style="width:100%"><option value="">— 选择需要例外调整的学生 —</option>${students.map(s=>`<option value="${s.id}">${s.name_en||s.name_cn||s.id}${s.name_cn&&s.name_en?' · '+s.name_cn:''}${ovByStudent[s.id]?.length?' · 已有例外':''}</option>`).join('')}</select></div><div id="overrideStudentDetail"></div>`;
        document.getElementById('overrideStudent').onchange=e=>renderStudentOverrideDetail(classId,e.target.value,base,ovs);
        const first=students.find(s=>ovByStudent[s.id]?.length);
        if(first){document.getElementById('overrideStudent').value=first.id;renderStudentOverrideDetail(classId,first.id,base,ovs);}
      }catch(e){body.innerHTML=`<div class="alert">读取失败：${String(e.message||e)}</div>`;}
    };

    window.renderStudentOverrideDetail=function(classId,studentId,base,ovs){
      const root=document.getElementById('overrideStudentDetail');if(!root)return;
      if(!studentId){root.innerHTML='';return;}
      const st=S.students.find(s=>s.id===studentId),rows=currentRows(studentId),bySlot=Object.fromEntries(rows.map(r=>[r.slot_no,r])),baseBy=Object.fromEntries(base.map(r=>[r.slot_no,r]));
      const activeOv=(ovs||[]).filter(o=>o.student_id===studentId);const ovBy=Object.fromEntries(activeOv.map(o=>[o.slot_no,o]));
      const existingTeachers=rows.map(r=>r.teacher_id);
      root.innerHTML=`<div class="card"><div style="font-size:18px;font-weight:800">${st?.name_en||st?.name_cn||studentId}${st?.name_cn&&st?.name_en?' · '+st.name_cn:''}</div><div class="sub">只改变与班级默认不同的 slot。没有特殊情况的 slot 保持不动。</div>${[1,2,3,4].filter(i=>baseBy[i]).map(i=>{const b=baseBy[i],cur=bySlot[i],ov=ovBy[i],changed=cur&&cur.teacher_id!==b.teacher_id;return `<div style="margin-top:12px;padding:12px;border:.5px solid var(--bdr);border-radius:12px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><b>Teacher ${i}</b><div class="meta">班级默认：${teacherName(b.teacher_id)} · 当前：${cur?teacherName(cur.teacher_id):'—'}</div>${ov?`<div class="meta" style="color:var(--warn)">例外原因：${ov.reason}</div>`:''}</div><span class="badge ${changed?'draft':'done'}">${changed?'Student Override':'跟随班级'}</span></div><div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:9px"><select id="override_${studentId}_${i}">${teacherOptions(cur?.teacher_id||'',existingTeachers.filter(id=>id!==cur?.teacher_id))}</select><button class="primary" onclick="applyStudentOverride('${classId}','${studentId}',${i})">${changed?'更换例外老师':'设为例外'}</button></div>${changed?`<button class="ghost" style="margin-top:7px;width:100%" onclick="revertStudentOverride('${classId}','${studentId}',${i})">恢复班级默认 · ${teacherName(b.teacher_id)}</button>`:''}</div>`}).join('')}</div>`;
    };

    window.applyStudentOverride=async function(classId,studentId,slot){
      const cyc=CLOUD.cycleMap[S.ui.cycle],sel=document.getElementById(`override_${studentId}_${slot}`);if(!cyc||!sel?.value)return;
      const reason=prompt('请简短记录为什么这名学生需要由不同老师负责：')||'';
      if(!reason.trim()){toast('Student Override 必须记录原因');return;}
      try{
        const q=await sb.rpc('lovego_set_student_override',{p_cycle_id:cyc.id,p_student_id:studentId,p_slot_no:slot,p_new_teacher_id:sel.value,p_reason:reason.trim()});
        if(q.error)throw q.error;
        await cloudPullOperational();toast('✓ Student Override 已保存');
        await openStudentOverrides(classId);renderCollect();renderProgress();
      }catch(e){toast('Override 失败：'+String(e.message||e));}
    };
    window.revertStudentOverride=async function(classId,studentId,slot){
      const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)return;
      const reason=prompt('请记录恢复班级默认 Assignment 的原因：')||'';
      if(!reason.trim()){toast('恢复也必须留下原因');return;}
      try{
        const q=await sb.rpc('lovego_revert_student_override',{p_cycle_id:cyc.id,p_student_id:studentId,p_slot_no:slot,p_reason:reason.trim()});
        if(q.error)throw q.error;
        await cloudPullOperational();toast('✓ 已恢复班级默认');
        await openStudentOverrides(classId);renderCollect();renderProgress();
      }catch(e){toast('恢复失败：'+String(e.message||e));}
    };

    const oldRender=window.renderAssignments;
    window.renderAssignments=async function(){
      const out=await oldRender.apply(this,arguments);
      try{
        const dep=document.getElementById('assignDept')?.value||S.ui.dept;
        const classes=S.classes.filter(c=>c.is_active!==false&&(!dep||c.department===dep)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)||String(a.display_name||a.class_name||'').localeCompare(String(b.display_name||b.class_name||'')));
        const cards=[...document.querySelectorAll('#assignList > .card')];
        cards.forEach((card,i)=>{
          const c=classes[i];if(!c||card.querySelector('.student-override-btn'))return;
          const actions=card.querySelector('.actions');if(!actions)return;
          const btn=document.createElement('button');btn.className='ghost student-override-btn';btn.textContent='个别学生调整';btn.onclick=()=>openStudentOverrides(c.id);actions.insertBefore(btn,actions.firstChild);
        });
      }catch(e){console.warn('LoveGo override UI attach failed',e);}
      return out;
    };
  }
  wait();
})();