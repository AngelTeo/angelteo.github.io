// LoveGo v45 · Product hardening for Owner review / UAT readiness
// Keeps the locked model intact: report identity = cycle + department + student;
// class remains assignment/evidence provenance.
(()=>{
  const wait=()=>{
    if(typeof S==='undefined'||typeof CLOUD==='undefined'||typeof currentAssignmentRows!=='function'||typeof reviewKey!=='function'||!window.__LOVEGO_V44_QUEUE__){
      setTimeout(wait,80);return;
    }
    install();
  };

  function install(){
    if(window.__LOVEGO_V45_PRODUCT_HARDENING__)return;
    window.__LOVEGO_V45_PRODUCT_HARDENING__=true;

    // Prevent a fallback review lookup from ever crossing Department/Class context.
    window.currentReviewForStudent=function(sid){
      normaliseAssignmentStore();
      const rows=currentAssignmentRows(sid,S.ui.cycle,S.ui.classId);
      const mine=rows.find(a=>a.teacher_id===S.who?.id);
      if(mine){
        const byAssignment=S.reviews[`assignment:${mine.id}`]||Object.values(S.reviews).find(r=>r.assignment_id===mine.id);
        if(byAssignment)return byAssignment;
      }
      const exactLocal=S.reviews[reviewKey(sid)];
      if(exactLocal)return exactLocal;
      const cloudCycleId=CLOUD.cycleMap?.[S.ui.cycle]?.id;
      return Object.values(S.reviews).find(r=>
        r.student_id===sid &&
        r.teacher_id===S.who?.id &&
        r.department===S.ui.dept &&
        r.class_id===S.ui.classId &&
        (r.cycle_id===S.ui.cycle || r.cycle_id===cloudCycleId)
      );
    };

    // Management review lookup must also stay inside the selected report context.
    window.viewTeacherReview=function(studentId,teacherId){
      if(!isAdmin())return;
      const cloudCycleId=CLOUD.cycleMap?.[S.ui.cycle]?.id;
      const reviews=Object.values(S.reviews).filter(r=>
        r.student_id===studentId &&
        r.teacher_id===teacherId &&
        r.department===S.ui.dept &&
        r.class_id===S.ui.classId &&
        (r.cycle_id===S.ui.cycle || r.cycle_id===cloudCycleId)
      );
      const r=reviews.sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')))[0];
      const box=document.getElementById('mgmtReviewView'),body=document.getElementById('mgmtReviewBody');
      if(!box||!body)return;
      box.style.display='';
      if(!r){body.innerHTML='<div class="empty">这位老师在当前 Department / Class 还没有保存 Review。</div>';return;}
      const st=S.students.find(x=>x.id===studentId),dl=r.daily_life||{};
      const domainRows=Object.entries(r.domains||{}).map(([code,x])=>`<div style="padding:8px 0;border-bottom:.5px solid var(--bdr)"><b>${code}</b><div class="sub">${(x.obs||[]).join(', ')}${x.note?` · ${x.note}`:''}</div></div>`).join('');
      body.innerHTML=`<div style="margin:10px 0"><b>${st?.name_en||''}${st?.name_cn?` · ${st.name_cn}`:''}</b> · ${teacherName(teacherId)} · ${S.ui.dept} · ${r.status||'draft'}${r.counts_for_cycle===false?' · 历史/不计本轮':''}</div>${domainRows||'<div class="empty">尚无 domain evidence。</div>'}<div style="margin-top:12px"><b>学生日常</b><div class="sub">Routine：${dl.routine||'—'}<br>Social：${dl.social||'—'}<br>Emotion：${dl.emotion||'—'}<br>Change：${dl.change||'—'}</div></div><div style="margin-top:12px"><b>补充</b><div class="sub">${r.summary||'—'}</div></div>`;
      box.scrollIntoView({behavior:'smooth',block:'start'});
    };

    // Owner / Management may inspect the exact Teacher Review UI without creating
    // an assignment, draft, or cloud record. This is deliberately read-only.
    const teacherOpenReview=window.openReview;
    window.openReview=function(id){
      if(!isAdmin())return teacherOpenReview(id);
      S.ui.studentId=id;
      const st=S.students.find(x=>x.id===id),cls=S.classes.find(c=>c.id===S.ui.classId);
      document.getElementById('reviewName').textContent=st?.name_en||st?.name_cn||id;
      const age=ageFromStudent(st);
      document.getElementById('reviewMeta').textContent=`${S.ui.dept} · ${cls?.display_name||cls?.class_name||''} · ${age==null?'Age —':'Age '+age} · ${S.ui.cycle} · Owner Preview`;
      document.getElementById('cloudReviewStatus').textContent='Owner Preview · 只读，不会建立 Draft、Assignment 或 Cloud 数据。';
      document.getElementById('domains').innerHTML=domains().map(d=>{
        const items=behaviourBank(d).map(v=>Array.isArray(v)?v[0]:v),axis=domainAxisLabel(d);
        return `<div class="domain"><div class="dh"><div><div class="dn">${d.code} · ${d.name}</div><div class="dd">${d.en||''}${d.core?' · '+d.core:''}${axis?' · '+axis:''}</div></div></div><div class="db"><div class="sub" style="margin-top:10px">这一阶段，你平常看到哪些表现？可多选。</div><div class="chips">${items.map(o=>`<button class="chip" disabled>${o}</button>`).join('')}</div><button class="chip" style="margin-top:8px" disabled>无法判断 / Insufficient Observation</button><textarea class="note" disabled placeholder="具体例子 / context（选填）"></textarea></div></div>`;
      }).join('');
      ['Routine','Social','Emotion','Change'].forEach(k=>{const el=document.getElementById('daily'+k);if(el){el.value='';el.disabled=true;}});
      const sum=document.getElementById('summary');if(sum){sum.value='';sum.disabled=true;}
      document.querySelectorAll('#s-review .actions button').forEach(b=>b.disabled=true);
      go('review');
    };

    window.openLoveGoReportContext=function(studentId,department,classId){
      S.ui.dept=department;S.ui.classId=classId;S.ui.studentId=studentId;save();go('assign');
      setTimeout(()=>{renderAssignSelectors();document.getElementById('assignList')?.scrollIntoView({behavior:'smooth',block:'start'});},0);
    };

    // Management Progress must be one row per Department Report, never one row
    // per student aggregated across departments.
    const teacherRenderProgress=window.renderProgress;
    window.renderProgress=async function(){
      if(!isAdmin())return teacherRenderProgress.apply(this,arguments);
      const root=document.getElementById('progressBody'),intro=document.getElementById('progressIntro');
      if(!root)return;
      const cyc=CLOUD.cycleMap?.[S.ui.cycle];
      if(intro)intro.textContent='每一行代表 1 份 Department Report；不同部门不会合并。';
      if(!cyc){root.innerHTML='<div class="card"><div class="meta">请选择 Review Cycle。</div></div>';return;}
      root.innerHTML='<div class="card"><div class="meta">正在读取本轮 Department Report Progress…</div></div>';
      try{
        const q=await sb.from('lovego_ptmgo_gate').select('*').eq('cycle_id',cyc.id);
        if(q.error)throw q.error;
        const rows=(q.data||[]).sort((a,b)=>String(a.department||'').localeCompare(String(b.department||''))||String(S.students.find(s=>s.id===a.student_id)?.name_en||'').localeCompare(String(S.students.find(s=>s.id===b.student_id)?.name_en||'')));
        const ready=rows.filter(x=>x.ready_for_ptmgo).length;
        const assigned=rows.filter(x=>Number(x.assigned_count||0)>0).length;
        const submitted=rows.reduce((n,x)=>n+Number(x.submitted_count||0),0);
        const expected=rows.reduce((n,x)=>n+Number(x.expected_count||0),0);
        const label={REPORT_AUTHORITY_REQUIRED:'主班待决定',ASSIGNMENT_REQUIRED:'待分配老师',ASSIGNMENT_INCOMPLETE:'Assignment 未完整',TEACHER_REVIEW_PENDING:'等待老师 Review',READY:'Ready'};
        const cards=rows.map(x=>{
          const st=S.students.find(s=>s.id===x.student_id)||{};
          const cl=S.classes.find(c=>c.id===x.authority_class_id)||{};
          const canOpen=!!x.authority_class_id;
          return `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><b>${st.name_en||st.name_cn||x.student_id}${st.name_cn&&st.name_en?' · '+st.name_cn:''}</b><div class="meta">${x.department||''} · ${cl.display_name||cl.class_name||(x.authority_resolved?'—':'主班未决定')}</div><div style="margin-top:7px"><span class="badge ${x.ready_for_ptmgo?'done':Number(x.submitted_count||0)?'draft':''}">${Number(x.submitted_count||0)} / ${Number(x.expected_count||0)} submitted</span> <span class="badge ${x.ready_for_ptmgo?'done':''}">${label[x.gate_status]||x.gate_status||'Pending'}</span></div></div>${canOpen?`<button class="ghost" onclick="openLoveGoReportContext('${x.student_id}','${x.department}','${x.authority_class_id}')">打开班级 Assignment</button>`:''}</div></div>`;
        }).join('');
        root.innerHTML=`<div class="grid" style="margin-bottom:12px"><div class="card"><div class="title">Department Reports</div><h1 style="margin:0">${rows.length}</h1></div><div class="card"><div class="title">Assignment started</div><h1 style="margin:0">${assigned} / ${rows.length}</h1></div><div class="card"><div class="title">Teacher submissions</div><h1 style="margin:0">${submitted} / ${expected}</h1></div><div class="card"><div class="title">Ready</div><h1 style="margin:0">${ready} / ${rows.length}</h1></div></div>${cards||'<div class="card"><div class="meta">本轮还没有 Department Report Context。</div></div>'}`;
      }catch(e){root.innerHTML=`<div class="card"><div class="meta">Progress 读取失败：${String(e.message||e)}</div></div>`;}
    };

    function patchShell(){
      document.title='LoveGo v45';
      document.querySelectorAll('.ver').forEach(x=>x.textContent='v45');

      const collectHero=document.querySelector('#s-collect .hero .sub');
      if(collectHero&&isAdmin())collectHero.textContent='Owner Preview：你可以直接打开任何学生查看老师填写页；Preview 为只读，不会建立任何测试或正式数据。';

      const assignHero=document.querySelector('#s-assign .hero .sub');
      if(assignHero)assignHero.textContent='管理层按 Department → Class 指定本轮负责老师。保存后，该班当前有效学生继承这组 Assignment；只有真正需要不同负责老师的个别学生才使用 Student Override。';

      const reviewInfo=document.querySelector('#mgmtReviewView .sub');
      if(reviewInfo)reviewInfo.textContent='这里显示老师在当前 Department / Class 提交的 LoveGo 原始观察。管理层可查看 Draft / Submitted 状态；查看不会修改老师原始记录。';

      document.querySelectorAll('#s-manage .lines').forEach(el=>{
        el.innerHTML=el.innerHTML
          .replace('版本：v39','版本：v45')
          .replace('Storage key：<span class="tech">lovego_v39</span>','Storage key：<span class="tech">lovego</span>')
          .replace('Teacher assignment：Management manually assigns up to 4 teachers per student; one class may have multiple teachers','Teacher assignment：Management manually assigns responsible teachers by Class; Student Override is exception-only')
          .replace('PTMGo readiness：all current valid assigned teachers must Submit; management may preview partial evidence anytime','Department readiness：all current valid assigned teachers must Submit; management may preview partial evidence anytime');
      });
    }

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchShell,{once:true});
    else patchShell();
  }
  wait();
})();
