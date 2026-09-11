// LoveGo v45 · Product hardening for Owner review / UAT readiness
// Keeps the locked model intact: report identity = cycle + department + student;
// class remains assignment/evidence provenance.
(()=>{
  const wait=()=>{
    if(typeof S==='undefined'||typeof CLOUD==='undefined'||typeof currentAssignmentRows!=='function'||typeof reviewKey!=='function'){
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
    if(typeof window.viewTeacherReview==='function'){
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
    }

    function patchShell(){
      document.title='LoveGo v45';
      document.querySelectorAll('.ver').forEach(x=>x.textContent='v45');

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
