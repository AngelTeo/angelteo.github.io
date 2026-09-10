const DEPT_TAXONOMY={SRT:SRT_TAXONOMY,SRK:SRK_TAXONOMY,ATC:ATC_TAXONOMY,GAK:GAK_TAXONOMY};
const DEPT_BAND={
  SRK:{bands:['3-4','5-6'],fromAge:a=>a<4.75?'3-4':'5-6',fromClass:true},
  GAK:{bands:['3-4','5-6'],fromAge:a=>a<4.75?'3-4':'5-6',fromClass:true},
  ATC:{bands:['7-9','10-12'],fromAge:a=>a<10?'7-9':'10-12',fromClass:false}
};
function curriculumBandOf(className){
  const n=String(className||'').toUpperCase();
  if(/\b(BB|JR)\b|-(BB|JR)\./.test(n)||/(^|-)(BB|JR)\./.test(n)) return '3-4';
  if(/\b(IN|SR)\b|-(IN|SR)\./.test(n)||/(^|-)(IN|SR)\./.test(n)) return '5-6';
  return null;
}
function ageFromStudent(s){
  if(!s)return null;
  if(s.date_of_birth){
    const d=new Date(s.date_of_birth+'T12:00:00');
    if(!isNaN(d))return Math.floor((Date.now()-d.getTime())/(365.2425*864e5)*10)/10;
  }
  if(typeof s.birth_year==='number')return new Date().getFullYear()-s.birth_year;
  return null;
}
function currentClassObj(){return S.classes.find(c=>c.id===S.ui.classId)||null}
function currentStudentObj(){return S.students.find(s=>s.id===S.ui.studentId)||null}
function behaviourBank(d){
  if(Array.isArray(d.beh))return d.beh;
  const B=DEPT_BAND[S.ui.dept]; if(!B)return [];
  const age=ageFromStudent(currentStudentObj());
  const actual=(typeof age==='number')?B.fromAge(age):null;
  const cls=currentClassObj();
  const curriculum=B.fromClass?curriculumBandOf(cls?.class_name||cls?.display_name):null;
  let band=curriculum||actual||null;
  if(d.axis==='AGE'||d.axis==='AGE + TASK CONTEXT')band=actual||band;
  return (band&&d.beh[band])||[];
}
function domainAxisLabel(d){
  if(!d.axis)return '';
  const B=DEPT_BAND[S.ui.dept], age=ageFromStudent(currentStudentObj());
  const actual=(B&&typeof age==='number')?B.fromAge(age):null;
  const cls=currentClassObj();
  const curriculum=(B&&B.fromClass)?curriculumBandOf(cls?.class_name||cls?.display_name):null;
  const bits=[];
  if(d.axis.includes('AGE'))bits.push(actual?`Age band ${actual}`:'Age unavailable');
  if(d.axis.includes('CLASS')||d.axis.includes('CURRICULUM'))bits.push(curriculum?`Class band ${curriculum}`:'Class band unavailable');
  if(d.axis.includes('TASK CONTEXT'))bits.push('Task context');
  return bits.join(' · ');
}
let S={ui:{cycle:null,dept:null,classId:null,studentId:null,advOpen:false},who:null,perm:null,classes:[],students:[],enroll:[],teachers:[],assignments:{},assignmentHistory:[],assignmentExceptions:{},reviews:{}};
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x)S={...S,...x,ui:{...S.ui,...(x.ui||{})}}}catch(e){}}
function save(){localStorage.setItem(KEY,JSON.stringify(S));document.getElementById('saved').textContent='仅本机草稿 '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});document.getElementById('mcount').textContent=Object.keys(S.reviews).length}
function toast(x){const e=document.getElementById('toast');e.textContent=x;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),1800)}
function isAdmin(){return ['OWNER','TOP_MGMT','MGMT','ADMIN'].includes(S.who?.role||'')}function go(p){if((p==='manage'||p==='assign')&&!isAdmin()){toast('没有管理权限');p='collect'}document.querySelectorAll('.screen').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.ntab').forEach(x=>x.classList.remove('on'));document.getElementById('s-'+p).classList.add('on');document.querySelector('.ntab[data-p="'+p+'"]')?.classList.add('on');if(p==='collect')renderCollect();if(p==='progress')renderProgress()}
function reviewKey(sid){return [S.ui.cycle,S.ui.dept,S.ui.classId,sid,S.who?.id||'local'].join('|')}
function currentReviewForStudent(sid){
  normaliseAssignmentStore();
  const rows=currentAssignmentRows(sid);
  const mine=rows.find(a=>a.teacher_id===S.who?.id);
  if(mine){
    const byAssignment=S.reviews[`assignment:${mine.id}`]||Object.values(S.reviews).find(r=>r.assignment_id===mine.id);
    if(byAssignment)return byAssignment;
  }
  return S.reviews[reviewKey(sid)]||Object.values(S.reviews).find(r=>r.cycle_id===S.ui.cycle&&r.student_id===sid&&r.teacher_id===S.who?.id);
}
function domains(){return DEPT_TAXONOMY[S.ui.dept]||[]}
function renderCollect(){
  document.getElementById('cycleGrid').innerHTML=CYCLES.length?CYCLES.map(x=>`<button class="pick ${S.ui.cycle===x.id?'on':''}" onclick="S.ui.cycle='${x.id}';save();renderCollect()"><b>${x.name}</b><div class="meta">${x.active?'Active cycle':''}</div></button>`).join(''):'<div class="meta">目前还没有建立 LoveGo Review Cycle。</div>';
  if(!S.ui.cycle){
    document.getElementById('deptGrid').innerHTML='<div class="meta">建立 Review Cycle 后才开始分配老师与收集 Review。</div>';
    document.getElementById('classGrid').innerHTML='';
    document.getElementById('collectSummary').textContent='暂无活动周期';
    document.getElementById('studentList').innerHTML='';
    return;
  }
  let ds=[...new Set(S.classes.map(x=>x.department).filter(Boolean))];
  if(!isAdmin()){
    const allowed=[...(S.who?.department||[]),...(S.who?.dept_group||[])].map(String);
    if(allowed.length)ds=ds.filter(d=>allowed.includes(d));
  }
  if(!ds.length)ds=['SRK','GAK','ATC','SRT'];
  if(!S.ui.dept || !ds.includes(S.ui.dept)){S.ui.dept=ds[0]||null;S.ui.classId=null;}
  document.getElementById('deptGrid').innerHTML=ds.map(d=>`<button class="pick ${S.ui.dept===d?'on':''}" onclick="S.ui.dept='${d}';S.ui.classId=null;save();renderCollect()"><b>${d}</b></button>`).join('');
  let cs=S.classes.filter(x=>x.department===S.ui.dept&&x.is_active!==false);
  if(cs.length===1 && !S.ui.classId){S.ui.classId=cs[0].id;save();}
  document.getElementById('classGrid').innerHTML=cs.length?cs.map(c=>`<button class="pick ${S.ui.classId===c.id?'on':''}" onclick="S.ui.classId='${c.id}';save();renderCollect()"><b>${c.display_name||c.class_name}</b></button>`).join(''):'<div class="meta">正在等待 Academee 班级名单。</div>';
  let ids=S.enroll.filter(e=>e.class_id===S.ui.classId&&e.is_active!==false).map(e=>e.student_id);
  let st=S.students.filter(x=>ids.includes(x.id)&&String(x.status||'').trim().toLowerCase()==='active');
  if(!isAdmin())st=st.filter(x=>currentTeacherAssigned(x.id));
  let done=st.filter(x=>{const r=currentReviewForStudent(x.id);return r?.status==='completed'&&!!r?.submitted_at}).length;
  document.getElementById('collectSummary').textContent=st.length?`${done} / ${st.length} completed`:(S.ui.classId?'目前没有分配给你的学生':'请选择班级');
  document.getElementById('studentList').innerHTML=st.map(x=>{let r=currentReviewForStudent(x.id);const submitted=r?.status==='completed'&&!!r?.submitted_at;return `<button class="stu" onclick="openReview('${x.id}')"><b>${x.name_en||x.name_cn||x.id}</b><div class="meta">${x.name_cn||''}</div><div style="margin-top:7px"><span class="badge ${submitted?'done':r?'draft':''}">${submitted?'Completed':r?'Draft':'Not started'}</span></div></button>`}).join('');
}
function openReview(id){if(S.perm&&S.perm.can_edit===false){toast('你只有查看权限');return}if(!currentTeacherAssigned(id)){if(isAdmin()){toast('管理层请从 Teacher Assignment 查看老师提交的 Review');go('assign');return}toast('这名学生没有指定给你');return}S.ui.studentId=id;save();let st=S.students.find(x=>x.id===id);document.getElementById('reviewName').textContent=st?.name_en||st?.name_cn||id;const age=ageFromStudent(st),cls=currentClassObj();document.getElementById('reviewMeta').textContent=`${S.ui.dept} · ${cls?.display_name||cls?.class_name||''} · ${age==null?'Age —':'Age '+age} · ${S.ui.cycle} · Teacher Lens`;renderDomains();go('review')}
function ensure(){
  normaliseAssignmentStore();
  const rows=currentAssignmentRows(S.ui.studentId);
  const a=rows.find(x=>x.teacher_id===S.who?.id)||null;
  const assignmentId=a?.id||null;
  const k=assignmentId?`assignment:${assignmentId}`:`${S.ui.cycle}|${S.ui.studentId}|${S.who?.id||'admin'}`;
  if(!S.reviews[k])S.reviews[k]={
    id:`local-review-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`,
    assignment_id:assignmentId,assignment_slot:a?.slot_no||null,
    cycle_id:S.ui.cycle,cloud_cycle_id:CLOUD.cycleMap[S.ui.cycle]?.id||null,
    student_id:S.ui.studentId,class_id:S.ui.classId,
    department:S.ui.dept,teacher_id:S.who?.id||null,taxonomy_version:'ObsGo-authority-v1',
    status:'draft',counts_for_cycle:true,domains:{},
    daily_life:{routine:'',social:'',emotion:'',change:''},
    strength_refs:[],growth_refs:[],strength_note:'',growth_note:'',
    strength_growth_overlap_note:'',summary:'',updated_at:new Date().toISOString()
  };
  const r=S.reviews[k];
  r.strength_refs ||= []; r.growth_refs ||= [];
  r.strength_note ??= r.strength||''; r.growth_note ??= r.growth||'';
  return r;
}
function indicatorRows(){
  return domains().flatMap(d=>{
    const items=behaviourBank(d).map(v=>Array.isArray(v)?v[0]:v);
    return items.map((label,i)=>({domain_code:d.code,domain_name:d.name,indicator_code:`${d.code}-I${i+1}`,index:i,label}));
  });
}
function refKey(x){return `${x.domain_code}|${x.indicator_code}`}
function refLabel(ref){
  const row=indicatorRows().find(x=>x.domain_code===ref.domain_code&&x.indicator_code===ref.indicator_code);
  return row?.label||`${ref.domain_code} · ${ref.indicator_code}`;
}
function isInsufficient(r,code){return r.domains?.[code]?.insufficient_observation===true}
function renderDomains(){
  let r=ensure();
  document.getElementById('domains').innerHTML=domains().map(d=>{
    let x=r.domains[d.code]||{obs:[],insufficient_observation:false,note:''};
    const items=behaviourBank(d).map(v=>Array.isArray(v)?v[0]:v),axis=domainAxisLabel(d);
    return `<div class="domain"><div class="dh"><div><div class="dn">${d.code} · ${d.name}</div><div class="dd">${d.en||''}${d.core?' · '+d.core:''}${axis?' · '+axis:''}</div></div></div><div class="db">
      <div class="sub" style="margin-top:10px">这一阶段，你平常看到哪些表现？可多选。</div>
      <div class="chips">${items.map((o,i)=>`<button class="chip ${x.obs?.includes(i)?'on':''}" ${x.insufficient_observation?'disabled':''} onclick="toggleObs('${d.code}',${i})">${o}</button>`).join('')}</div>
      <button class="chip ${x.insufficient_observation?'on':''}" style="margin-top:8px" onclick="toggleInsufficient('${d.code}')">无法判断 / Insufficient Observation</button>
      <textarea class="note" placeholder="具体例子 / context（选填）" oninput="setNote('${d.code}',this.value)">${x.note||''}</textarea>
    </div></div>`;
  }).join('');
  const dl=(r.daily_life&&typeof r.daily_life==='object')?r.daily_life:{routine:'',social:'',emotion:'',change:''};
  ['Routine','Social','Emotion','Change'].forEach(k=>document.getElementById('daily'+k).value=dl[k.toLowerCase()]||'');
  document.getElementById('summary').value=r.summary||'';
}
function toggleObs(c,i){
  let r=ensure(),x=r.domains[c]||(r.domains[c]={obs:[],insufficient_observation:false,note:''});
  if(x.insufficient_observation)return;
  let p=x.obs.indexOf(i);p>=0?x.obs.splice(p,1):x.obs.push(i);save();renderDomains();
}
function toggleInsufficient(c){
  let r=ensure(),x=r.domains[c]||(r.domains[c]={obs:[],insufficient_observation:false,note:''});
  x.insufficient_observation=!x.insufficient_observation;
  if(x.insufficient_observation){x.obs=[];r.strength_refs=r.strength_refs.filter(v=>v.domain_code!==c);r.growth_refs=r.growth_refs.filter(v=>v.domain_code!==c)}
  save();renderDomains();
}
function setNote(c,v){let r=ensure(),x=r.domains[c]||(r.domains[c]={obs:[],insufficient_observation:false,note:''});x.note=v;save()}
function renderPriorities(){
  const r=ensure(),rows=indicatorRows(), render=(kind)=>{
    const refs=r[kind+'_refs']||[], chosen=new Set(refs.map(refKey));
    const grouped=domains().map(d=>{
      const rr=rows.filter(x=>x.domain_code===d.code);
      if(isInsufficient(r,d.code))return '';
      return `<div style="margin-top:10px"><div class="meta"><b>${d.code} · ${d.name}</b></div><div class="chips">${rr.map(x=>`<button class="chip ${chosen.has(refKey(x))?'on':''}" onclick="togglePriority('${kind}','${d.code}','${x.indicator_code}',${x.index})">${x.label}</button>`).join('')}</div></div>`;
    }).join('');
    document.getElementById(kind+'Choices').innerHTML=grouped||'<div class="meta">先完成长期观察。</div>';
  };
  render('strength');render('growth');
  const overlap=strengthGrowthOverlap(r);
  document.getElementById('overlapBox').innerHTML=overlap.length?`<div class="alert" style="margin-top:10px">同一个表现同时被选为 Strength 与 Growth。请简单说明不同情境：<textarea class="note" id="overlapNote" oninput="ensure().strength_growth_overlap_note=this.value;save()">${r.strength_growth_overlap_note||''}</textarea></div>`:'';
}
function togglePriority(kind,domainCode,indicatorCode,index){
  const r=ensure(),arr=r[kind+'_refs']||[];
  if(isInsufficient(r,domainCode)){toast('这个 Domain 已选择无法判断');return}
  const k=`${domainCode}|${indicatorCode}`,pos=arr.findIndex(x=>refKey(x)===k);
  if(pos>=0)arr.splice(pos,1);
  else {
    if(arr.length>=3){toast(`${kind==='strength'?'Strength':'Growth'} 最多 3 个`);return}
    arr.push({taxonomy_version:r.taxonomy_version,domain_code:domainCode,indicator_code:indicatorCode,indicator_index:index});
  }
  r[kind+'_refs']=arr;save();renderPriorities();
}
function validateReviewV33(r){
  const missing=domains().filter(d=>{const x=r.domains?.[d.code]||{};return !x.insufficient_observation && !(Array.isArray(x.obs)&&x.obs.length)});
  const daily=Object.values(r.daily_life||{}).some(v=>String(v||'').trim());
  return {ok:!missing.length&&daily,missing,daily};
}
async function saveReview(submit){
  let r=ensure();if(r.status==='completed'&&r.submitted_at){toast('这份 Review 已提交并锁定');return}
  r.daily_life={routine:document.getElementById('dailyRoutine').value,social:document.getElementById('dailySocial').value,emotion:document.getElementById('dailyEmotion').value,change:document.getElementById('dailyChange').value};
  r.summary=document.getElementById('summary').value;
  r.updated_at=new Date().toISOString();
  if(submit){
    const g=validateReviewV33(r);
    if(g.missing.length){toast(`还有 ${g.missing.length} 个 Domain 未完成`);return}
    if(!g.daily){toast('请至少留下一项有意义的生活片段');return}
    r.status='completed';r.submitted_at=new Date().toISOString();r.locked_at=r.submitted_at;
  }
  save();if(submit){
    try{
      const res=await cloudUpsertReview(r,true);
      r.status='completed';r.submitted_at=res.submitted_at;r.locked_at=res.locked_at;save();
      toast('✓ 已提交到 Cloud');go('collect');return;
    }catch(e){r.status='draft';delete r.submitted_at;delete r.locked_at;save();toast('提交失败：'+String(e.message||e));return}
  }
  try{
    if(CLOUD.available){await cloudUpsertReview(r,false);save();toast('✓ Cloud 草稿已保存')}
    else{save();toast('✓ 仅本机草稿已保存')}
  }catch(e){save();toast('Cloud 储存失败；已保留本机草稿');console.error(e)}
  go('collect');
}
function renderProgress(){
  const root=document.getElementById('progressBody'),intro=document.getElementById('progressIntro');
  if(!isAdmin()){
    const assigned=[];
    Object.values(S.assignments||{}).flat().forEach(a=>{if(a?.teacher_id===S.who?.id&&!a.archived_at&&['active','pending','completed'].includes(a.status))assigned.push(a)});
    const done=assigned.filter(a=>{const r=Object.values(S.reviews).find(x=>x.assignment_id===a.id&&x.counts_for_cycle!==false);return r?.status==='completed'&&!!r?.submitted_at}).length;
    if(intro)intro.textContent='这里只看你的完成情况；不会显示其他老师对学生的答案。';
    root.innerHTML=`<div class="card"><div class="title">My Completion</div><h1 style="margin:0 0 8px">${done} / ${assigned.length}</h1><div class="progress"><div style="width:${assigned.length?done/assigned.length*100:0}%"></div></div><div class="meta" style="margin-top:8px">只计算已经正式提交的 Review；草稿仍可继续填写。</div></div>`;
    return;
  }
  if(intro)intro.textContent='查看本轮所有学生的 Teacher Review 完成情况与 PTMGo readiness。';
  const cyc=CLOUD.cycleMap[S.ui.cycle];
  const current=(Array.isArray(S.cloudAssignments)?S.cloudAssignments:Object.values(S.assignments||{}).flat()).filter(a=>(!cyc||a.cycle_id===cyc.id)&&!a.archived_at&&['active','pending','completed'].includes(a.status));
  const studentIds=[...new Set(current.map(a=>a.student_id))];
  const rows=studentIds.map(sid=>{
    const st=S.students.find(x=>x.id===sid)||{};
    const as=current.filter(a=>a.student_id===sid).sort((a,b)=>a.slot_no-b.slot_no);
    const submitted=as.filter(a=>{const r=Object.values(S.reviews).find(x=>x.assignment_id===a.id&&x.counts_for_cycle!==false);return r?.status==='completed'&&!!r?.submitted_at}).length;
    const ex=getAssignmentException(sid), assignmentValid=(as.length===4)||(ex?.approved&&ex.approved_count===as.length&&as.length>0);
    const ready=assignmentValid&&as.length>0&&submitted===as.length;
    const enr=S.enroll.find(e=>e.student_id===sid&&e.is_active!==false), cls=S.classes.find(c=>c.id===(enr?.class_id||as[0]?.class_id));
    return {sid,st,as,submitted,ready,assignmentValid,cls};
  }).sort((a,b)=>String(a.cls?.display_name||a.cls?.class_name||'').localeCompare(String(b.cls?.display_name||b.cls?.class_name||''))||String(a.st?.name_en||a.st?.name_cn||'').localeCompare(String(b.st?.name_en||b.st?.name_cn||'')));
  const totalAssigned=rows.reduce((n,x)=>n+x.as.length,0),totalSubmitted=rows.reduce((n,x)=>n+x.submitted,0),readyCount=rows.filter(x=>x.ready).length;
  const cards=rows.map(x=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><b>${x.st?.name_en||x.st?.name_cn||x.sid}</b><div class="meta">${x.cls?.department||x.as[0]?.department||''} · ${x.cls?.display_name||x.cls?.class_name||''}</div><div style="margin-top:7px"><span class="badge ${x.ready?'done':x.submitted?'draft':''}">${x.submitted} / ${x.as.length} submitted</span> <span class="badge ${x.ready?'done':''}">${x.ready?'Ready for PTMGo':x.assignmentValid?'Not ready':'Assignment incomplete'}</span></div></div><button class="ghost" onclick="openMgmtStudent('${x.sid}')">查看老师提交</button></div></div>`).join('');
  root.innerHTML=`<div class="grid" style="margin-bottom:12px"><div class="card"><div class="title">Students</div><h1 style="margin:0">${rows.length}</h1></div><div class="card"><div class="title">Teacher submissions</div><h1 style="margin:0">${totalSubmitted} / ${totalAssigned}</h1></div><div class="card"><div class="title">Ready for PTMGo</div><h1 style="margin:0">${readyCount} / ${rows.length}</h1></div></div>${cards||'<div class="card"><div class="meta">本轮还没有 Teacher Assignment。</div></div>'}`;
}
function openMgmtStudent(studentId){
  if(!isAdmin())return;
  const rows=currentAssignmentRows(studentId),a=rows[0];
  const enr=S.enroll.find(e=>e.student_id===studentId&&e.is_active!==false),cls=S.classes.find(c=>c.id===(enr?.class_id||a?.class_id));
  if(cls){S.ui.dept=cls.department||a?.department||S.ui.dept;S.ui.classId=cls.id}
  S.ui.studentId=studentId;save();go('assign');renderAssignSelectors();
  setTimeout(()=>document.getElementById('assignList')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
}
function exportData(){let p={meta:{system:'LoveGo',version:APP_VERSION,exportTime:new Date().toISOString(),teacher:S.who?.id||null},reviews:S.reviews};let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));a.download='LoveGo_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);toast('✓ Exported')}
function importData(ev){let f=ev.target.files[0];ev.target.value='';if(!f)return;let rd=new FileReader();rd.onload=()=>{try{let p=JSON.parse(rd.result);if(!p.reviews)throw 0;S.reviews={...S.reviews,...p.reviews};save();renderCollect();toast('✓ Imported · Merge')}catch(e){toast('✕ Invalid file')}};rd.readAsText(f)}
