// LoveGo v43 · Department report authority UI + PTMGo gate
// Rule: 1 Student × 1 Department × 1 Cycle = 1 Report.
(()=>{
  const wait=()=>{
    if(!window.__LOVEGO_V42_CONTEXT__||typeof window.renderAssignments!=='function'||typeof window.renderProgress!=='function'||typeof sb==='undefined'||typeof S==='undefined'||typeof CLOUD==='undefined'){
      setTimeout(wait,100);return;
    }
    install();
  };
  function install(){
    if(window.__LOVEGO_V43_REPORT_AUTHORITY__)return;
    window.__LOVEGO_V43_REPORT_AUTHORITY__=true;

    async function unresolvedContexts(department=null){
      const cyc=CLOUD.cycleMap[S.ui.cycle];if(!cyc)return [];
      let q=sb.from('lovego_department_report_context').select('*').eq('cycle_id',cyc.id).eq('authority_resolved',false);
      if(department)q=q.eq('department',department);
      const r=await q;if(r.error)throw r.error;return r.data||[];
    }
    function studentLabel(id){const s=S.students.find(x=>x.id===id)||{};return `${s.name_en||s.name_cn||id}${s.name_cn&&s.name_en?' · '+s.name_cn:''}`;}
    function classLabel(id){const c=S.classes.find(x=>x.id===id)||{};return c.display_name||c.class_name||id;}

    window.saveReportAuthority=async function(studentId,department){
      const cyc=CLOUD.cycleMap[S.ui.cycle],sel=document.getElementById(`reportAuthority_${studentId}_${department}`);if(!cyc||!sel?.value)return;
      try{
        const q=await sb.rpc('lovego_set_report_authority',{p_cycle_id:cyc.id,p_student_id:studentId,p_department:department,p_class_id:sel.value});
        if(q.error)throw q.error;
        toast(`✓ ${studentLabel(studentId)} · ${department} 主班已确定`);
        await renderAssignments();
        renderProgress();
      }catch(e){toast('主班保存失败：'+String(e.message||e));}
    };

    function authorityCard(rows,department){
      if(!rows.length)return '';
      return `<div class="card" style="border:2px solid var(--warn);margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap"><div><div class="eyebrow">Report Authority Required</div><div style="font-size:18px;font-weight:800">同部门多班 · 先选择本轮报告主班</div><div class="sub">每个学生每个 Department 每轮只出 1 份报告。主班决定默认 Teacher Assignment；其他班不会再产生第二份报告。</div></div><span class="badge draft">${rows.length} 个待处理</span></div>${rows.map(r=>`<div style="margin-top:12px;padding:12px;border:.5px solid var(--bdr);border-radius:12px"><div style="font-weight:800">${studentLabel(r.student_id)} <span class="badge">${department||r.department}</span></div><div class="meta" style="margin:4px 0 8px">Active Classes：${(r.class_ids||[]).map(classLabel).join(' · ')}</div><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><select id="reportAuthority_${r.student_id}_${r.department}" style="width:100%"><option value="">— 请选择本轮报告主班 —</option>${(r.class_ids||[]).map(id=>`<option value="${id}">${classLabel(id)}</option>`).join('')}</select><button class="primary" onclick="saveReportAuthority('${r.student_id}','${r.department}')">确定主班</button></div></div>`).join('')}</div>`;
    }

    const oldAssignments=window.renderAssignments;
    window.renderAssignments=async function(){
      const out=await oldAssignments.apply(this,arguments);
      if(!isAdmin())return out;
      const root=document.getElementById('assignList');if(!root)return out;
      try{
        const dep=document.getElementById('assignDept')?.value||S.ui.dept;
        const unresolved=await unresolvedContexts(dep);
        if(unresolved.length)root.insertAdjacentHTML('afterbegin',authorityCard(unresolved,dep));
      }catch(e){console.warn('LoveGo report authority UI failed',e);}
      return out;
    };

    const oldProgress=window.renderProgress;
    window.renderProgress=async function(){
      const out=await oldProgress.apply(this,arguments);
      if(!isAdmin())return out;
      const root=document.getElementById('progressBody');if(!root)return out;
      try{
        const unresolved=await unresolvedContexts();
        const cyc=CLOUD.cycleMap[S.ui.cycle];
        const readiness=cyc?await sb.from('lovego_student_readiness').select('*').eq('cycle_id',cyc.id):{data:[],error:null};
        if(readiness.error)throw readiness.error;
        const ready=(readiness.data||[]).filter(x=>x.ready_for_ptmgo).length,total=(readiness.data||[]).length;
        const gate=`<div class="card" style="border-left:5px solid var(--layer);margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="eyebrow">PTMGo Gate</div><div style="font-size:18px;font-weight:800">${unresolved.length?'先解决 Report Authority':'Report Authority 已清'}</div><div class="meta">Ready for PTMGo：${ready} / ${total} reporting contexts${unresolved.length?` · 还有 ${unresolved.length} 个同部门多班未选择主班`:''}</div></div><span class="badge ${unresolved.length?'draft':'done'}">${unresolved.length?'BLOCKED':'OPEN'}</span></div></div>`;
        root.insertAdjacentHTML('afterbegin',gate+(unresolved.length?authorityCard(unresolved,null):''));
      }catch(e){console.warn('LoveGo PTMGo gate failed',e);}
      return out;
    };
  }
  wait();
})();