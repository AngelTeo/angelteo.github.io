/* LoveGo v48 · SRK support-response UX hardening
   - compact SRK-only Support / Response controls
   - snapshot age/class/cycle context at evidence capture time
   - no rubric scoring; no B/D/S inference
*/
(()=>{
  let installed=false;
  const VERSION='SRK-EVIDENCE-CONTEXT-v1';
  const SUPPORT=[['','— 支持程度 —'],['S0','S0 · 无需支持'],['S1','S1 · 轻提示'],['S2','S2 · 引导支持'],['S3','S3 · 持续支持']];
  const RESPONSE=[['','— 孩子回应 —'],['R1','R1 · 仍无法继续'],['R2','R2 · 持续帮助下完成'],['R3','R3 · 在支持下继续'],['R4','R4 · 一个提示后继续'],['R5','R5 · 自己修正 / 恢复'],['R6','R6 · 后续独立完成']];
  const TASK=[['','— 任务熟悉度 —'],['NEW','新任务'],['FAMILIAR','熟悉任务']];
  const TASK_RELEVANT=new Set(['S3','S4','S7','S8','S9','S10']);
  const SUPPORT_WORDS=/(提醒|提示|帮助|协助|支持|安抚|陪伴|带领|示范|追问|重述|重复|逐步|成人|老师走到身边|催促|代劳|介入|鼓励)/;
  const pad=n=>String(n).padStart(2,'0');
  function bandFor(d){
    if(!d?.beh||Array.isArray(d.beh))return null;
    const bank=behaviourBank(d);
    if(bank===d.beh['3-4'])return '3-4';
    if(bank===d.beh['5-6'])return '5-6';
    return null;
  }
  function ecode(d,i){return `SRK-${d.code}-${String(bandFor(d)||'NA').replace('-','')}-${pad(i+1)}`;}
  function labelFor(d,i){const x=behaviourBank(d)[i];return Array.isArray(x)?x[0]:String(x||'');}
  function contextSnapshot(d,i,source='SELECTION_TIME'){
    const st=typeof currentStudentObj==='function'?currentStudentObj():null;
    const cls=typeof currentClassObj==='function'?currentClassObj():null;
    const age=typeof ageFromStudent==='function'?ageFromStudent(st):null;
    return {
      evidence_code:ecode(d,i),teacher_section:d.code,presentation_band:bandFor(d),
      age_years_at_capture:typeof age==='number'?age:null,
      curriculum_band:typeof curriculumBandOf==='function'?curriculumBandOf(cls?.class_name||cls?.display_name):null,
      class_id:S?.ui?.classId||null,class_name:cls?.display_name||cls?.class_name||null,
      student_id:S?.ui?.studentId||null,department:S?.ui?.dept||null,cycle_id:S?.ui?.cycle||null,
      captured_at:new Date().toISOString(),snapshot_source:source,context_version:VERSION
    };
  }
  function syncContext(r,source='V48_MIGRATED'){
    if(S?.ui?.dept!=='SRK'||!r)return r;
    for(const d of domains()){
      const x=r.domains?.[d.code];if(!x)continue;
      x.evidence_context_by_code ||= {};
      const selected=new Set((x.obs||[]).map(i=>ecode(d,i)));
      for(const i of (x.obs||[])){
        const c=ecode(d,i);if(!x.evidence_context_by_code[c])x.evidence_context_by_code[c]=contextSnapshot(d,i,source);
      }
      for(const c of Object.keys(x.evidence_context_by_code))if(!selected.has(c))delete x.evidence_context_by_code[c];
      x.evidence_context_version=VERSION;
    }
    return r;
  }
  function optionHTML(rows,val){return rows.map(([v,t])=>`<option value="${v}" ${String(val||'')===v?'selected':''}>${t}</option>`).join('');}
  function supportHTML(d,x){
    if(S?.ui?.dept!=='SRK')return '';
    const selected=(x.obs||[]).filter(i=>{const c=ecode(d,i),label=labelFor(d,i);return SUPPORT_WORDS.test(label)||x.support_by_code?.[c];});
    if(!selected.length)return '';
    return `<div style="margin-top:10px"><div class="sub"><b>Support / Response</b> · 只有涉及老师支持的观察才需要补充。</div>${selected.map(i=>{
      const c=ecode(d,i),label=labelFor(d,i),s=x.support_by_code?.[c]||{};
      const task=TASK_RELEVANT.has(d.code)?`<select aria-label="任务熟悉度" onchange="setSRKEvidenceSupport('${d.code}','${c}','task',this.value)" style="min-height:42px;border:.5px solid var(--bdr);border-radius:9px;padding:7px;background:#fff">${optionHTML(TASK,s.task)}</select>`:'';
      return `<div style="margin-top:8px;padding:9px 10px;border:.5px solid var(--bdr);border-radius:11px;background:var(--sur2)"><div class="sub" style="margin-bottom:7px">${label}</div><div style="display:flex;flex-wrap:wrap;gap:6px"><select aria-label="支持程度" onchange="setSRKEvidenceSupport('${d.code}','${c}','level',this.value)" style="min-height:42px;border:.5px solid var(--bdr);border-radius:9px;padding:7px;background:#fff">${optionHTML(SUPPORT,s.level)}</select><select aria-label="孩子回应" onchange="setSRKEvidenceSupport('${d.code}','${c}','response',this.value)" style="min-height:42px;border:.5px solid var(--bdr);border-radius:9px;padding:7px;background:#fff">${optionHTML(RESPONSE,s.response)}</select>${task}</div></div>`;
    }).join('')}</div>`;
  }
  function install(){
    if(installed)return true;
    try{
      if(typeof ensure!=='function'||typeof renderDomains!=='function'||typeof toggleObs!=='function'||typeof behaviourBank!=='function')return false;
      const baseEnsure=ensure;
      ensure=function(){return syncContext(baseEnsure());};
      const baseToggleObs=toggleObs;
      toggleObs=function(c,i){
        const d=domains().find(x=>x.code===c);baseToggleObs(c,i);
        if(S?.ui?.dept!=='SRK'||!d)return;
        const r=ensure(),x=r.domains?.[c];if(!x)return;
        const code=ecode(d,i);x.evidence_context_by_code ||= {};
        if((x.obs||[]).includes(i)){if(!x.evidence_context_by_code[code])x.evidence_context_by_code[code]=contextSnapshot(d,i,'SELECTION_TIME');}
        else delete x.evidence_context_by_code[code];
        x.evidence_context_version=VERSION;save();
      };
      window.setSRKEvidenceSupport=function(domainCode,eCode,field,val){
        const r=ensure(),x=r.domains?.[domainCode];if(!x)return;
        x.support_by_code ||= {};const rec=x.support_by_code[eCode]||(x.support_by_code[eCode]={});
        rec[field]=val||null;rec.inferred=false;rec.updated_at=new Date().toISOString();
        if(!rec.level&&!rec.response&&!rec.task)delete x.support_by_code[eCode];save();renderDomains();
      };
      renderDomains=function(){
        const r=ensure();
        document.getElementById('domains').innerHTML=domains().map(d=>{
          const x=r.domains[d.code]||{obs:[],insufficient_observation:false,note:'',support_by_code:{}};
          const items=behaviourBank(d).map(v=>Array.isArray(v)?v[0]:v),axis=domainAxisLabel(d),sup=supportHTML(d,x);
          return `<div class="domain"><div class="dh"><div><div class="dn">${d.code} · ${d.name}</div><div class="dd">${d.en||''}${d.core?' · '+d.core:''}${axis?' · '+axis:''}</div></div></div><div class="db"><div class="sub" style="margin-top:10px">这一阶段，你平常看到哪些表现？可多选。</div><div class="chips">${items.map((o,i)=>`<button class="chip ${x.obs?.includes(i)?'on':''}" ${x.insufficient_observation?'disabled':''} onclick="toggleObs('${d.code}',${i})">${o}</button>`).join('')}</div>${sup}<button class="chip ${x.insufficient_observation?'on':''}" style="margin-top:8px" onclick="toggleInsufficient('${d.code}')">无法判断 / Insufficient Observation</button><textarea class="note" placeholder="具体例子 / context（选填）" oninput="setNote('${d.code}',this.value)">${x.note||''}</textarea></div></div>`;
        }).join('');
        const dl=(r.daily_life&&typeof r.daily_life==='object')?r.daily_life:{routine:'',social:'',emotion:'',change:''};
        ['Routine','Social','Emotion','Change'].forEach(k=>{const el=document.getElementById('daily'+k);if(el)el.value=dl[k.toLowerCase()]||'';});
        const sm=document.getElementById('summary');if(sm)sm.value=r.summary||'';
      };
      const basePayload=cloudReviewPayload;
      cloudReviewPayload=function(r,submitted=false){syncContext(r);return basePayload(r,submitted);};
      window.__LOVEGO_V48_SRK_CONTEXT__={installed:true,version:VERSION,features:['compact support-response','age/class/cycle evidence snapshot','no score inference']};
      installed=true;return true;
    }catch(e){console.error('LoveGo v48 SRK UX install failed',e);return false;}
  }
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);}
})();
