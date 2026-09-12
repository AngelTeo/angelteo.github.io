/* LoveGo v47 · SRK evidence contract
   Purpose:
   - keep S1-S10 as teacher-friendly UX sections, never aggregate developmental scores
   - attach stable evidence codes to selected SRK observations
   - add SRK-only Support / Response / Task Familiarity capture without schema migration
   - fail closed: only high-confidence canonical links are declared; ambiguous evidence remains daily/context evidence
   - preserve legacy obs[] indices for backwards compatibility
*/
(()=>{
  let installed=false;
  const VERSION='SRK-EVIDENCE-CONTRACT-v1';
  const SUPPORT_LEVELS=[
    {code:'S0',name:'无需支持'},
    {code:'S1',name:'轻提示'},
    {code:'S2',name:'引导支持'},
    {code:'S3',name:'持续支持'}
  ];
  const RESPONSES=[
    {code:'R1',name:'仍无法继续'},
    {code:'R2',name:'持续帮助下完成'},
    {code:'R3',name:'在支持下继续'},
    {code:'R4',name:'一个提示后继续'},
    {code:'R5',name:'自己修正 / 恢复'},
    {code:'R6',name:'后续独立完成'}
  ];
  const TASKS=[{code:'NEW',name:'新任务'},{code:'FAMILIAR',name:'熟悉任务'}];

  const pad=n=>String(n).padStart(2,'0');
  function bandForDomain(d){
    if(!d||!d.beh||Array.isArray(d.beh))return null;
    const bank=behaviourBank(d);
    if(d.beh['3-4']===bank)return '3-4';
    if(d.beh['5-6']===bank)return '5-6';
    return null;
  }
  function evidenceCode(domainCode,band,index){
    return `SRK-${domainCode}-${String(band||'NA').replace('-','')}-${pad(index+1)}`;
  }

  /* High-confidence canonical links only. Empty = useful evidence but no automatic 38-link yet. */
  const DIRECT={
    'SRK-S1-34-01':['C5'],'SRK-S1-34-04':['C5'],'SRK-S1-34-05':['I1'],'SRK-S1-34-06':['C5'],
    'SRK-S1-56-01':['I1'],'SRK-S1-56-05':['C5'],'SRK-S1-56-07':['I1'],
    'SRK-S2-34-01':['C1','I5'],'SRK-S2-34-02':['I4'],'SRK-S2-34-04':['C1'],'SRK-S2-34-06':['C1'],'SRK-S2-34-07':['C1'],
    'SRK-S2-56-01':['C1'],'SRK-S2-56-05':['I4'],'SRK-S2-56-08':['C1'],
    'SRK-S3-34-04':['H3'],'SRK-S3-34-05':['H3'],'SRK-S3-34-06':['H3'],
    'SRK-S3-56-02':['H3'],'SRK-S3-56-05':['H3'],'SRK-S3-56-06':['H3'],
    'SRK-S4-34-01':['I2'],'SRK-S4-34-02':['I2'],'SRK-S4-34-04':['I1'],'SRK-S4-34-06':['I4'],
    'SRK-S4-56-03':['I1'],'SRK-S4-56-05':['I2'],'SRK-S4-56-09':['I1'],
    'SRK-S5-34-03':['C5'],'SRK-S5-34-05':['C5'],'SRK-S5-34-07':['C5'],
    'SRK-S5-56-04':['C5'],'SRK-S5-56-08':['C5'],'SRK-S5-56-09':['C5'],'SRK-S5-56-10':['C5'],
    'SRK-S6-34-03':['C4'],'SRK-S6-34-04':['C3'],'SRK-S6-34-05':['C3'],'SRK-S6-34-06':['C1'],
    'SRK-S6-56-02':['C3'],'SRK-S6-56-03':['C3'],'SRK-S6-56-04':['C1'],'SRK-S6-56-05':['C3'],'SRK-S6-56-08':['C4'],
    'SRK-S7-34-05':['H2'],'SRK-S7-34-06':['H1'],'SRK-S7-34-07':['H1'],
    'SRK-S7-56-02':['H2'],'SRK-S7-56-05':['H2'],'SRK-S7-56-06':['H1'],'SRK-S7-56-08':['H2'],'SRK-S7-56-09':['H1'],
    'SRK-S8-34-02':['H5'],'SRK-S8-34-04':['H5'],'SRK-S8-34-05':['I4'],'SRK-S8-34-06':['H5'],'SRK-S8-34-07':['H5'],
    'SRK-S8-56-01':['I4','H5'],'SRK-S8-56-03':['H5'],'SRK-S8-56-04':['I4'],'SRK-S8-56-05':['I4'],'SRK-S8-56-06':['H5'],'SRK-S8-56-07':['H5'],'SRK-S8-56-08':['I4'],'SRK-S8-56-10':['H5'],
    'SRK-S9-34-02':['H3'],'SRK-S9-34-03':['H3'],'SRK-S9-34-04':['H3'],'SRK-S9-34-05':['H3'],'SRK-S9-34-07':['H3'],'SRK-S9-34-08':['H3'],'SRK-S9-34-09':['H3'],
    'SRK-S9-56-02':['H3'],'SRK-S9-56-03':['H3'],'SRK-S9-56-04':['H3'],'SRK-S9-56-05':['H3'],'SRK-S9-56-07':['H3'],'SRK-S9-56-08':['H3'],'SRK-S9-56-09':['H3'],
    'SRK-S11-34-01':['I5'],'SRK-S11-34-02':['I5'],'SRK-S11-34-03':['I5'],'SRK-S11-34-04':['I5'],'SRK-S11-34-05':['I5'],'SRK-S11-34-06':['I5'],'SRK-S11-34-07':['I5']
  };

  const CONTEXTUAL={
    'SRK-S1-34-03':['C5','C2'],'SRK-S1-34-08':['I1','C5'],
    'SRK-S1-56-02':['I1','H3'],'SRK-S1-56-03':['I1','H2'],'SRK-S1-56-04':['C2','H5'],'SRK-S1-56-06':['I1','C5'],
    'SRK-S2-34-05':['E-L2','B-L2','M-L2'],'SRK-S2-34-08':['C1','I4'],
    'SRK-S2-56-02':['E-L2','B-L2','M-L2'],'SRK-S2-56-03':['C1','E-L2','B-L2','M-L2'],'SRK-S2-56-04':['E-L2','B-L2','M-L2'],'SRK-S2-56-06':['C1','C3','C4'],'SRK-S2-56-07':['C1','E-L2','B-L2','M-L2'],
    'SRK-S3-34-01':['C2','H3'],'SRK-S3-34-02':['H3','S3'],'SRK-S3-34-03':['H1','H3'],'SRK-S3-34-07':['C2','H3'],
    'SRK-S3-56-01':['H1','H2','H3'],'SRK-S3-56-03':['H3'],'SRK-S3-56-04':['H3','H4'],'SRK-S3-56-07':['H3','I3'],'SRK-S3-56-08':['H3','I3'],
    'SRK-S4-34-03':['I2','H4'],'SRK-S4-34-05':['I5','I3'],'SRK-S4-34-07':['I1','I3','H2','H4','H3'],'SRK-S4-34-08':['I3'],'SRK-S4-34-09':['I3','H2','I1'],
    'SRK-S4-56-01':['I2','H1'],'SRK-S4-56-02':['I2','H4'],'SRK-S4-56-04':['I1','H3','H4'],'SRK-S4-56-06':['I3','I4','H5'],'SRK-S4-56-07':['I1','I3','H2','H4','H3'],'SRK-S4-56-08':['I3','I1'],'SRK-S4-56-10':['I3'],
    'SRK-S5-34-01':['C5','C3'],'SRK-S5-34-04':['C5'],'SRK-S5-34-06':['I1','C5'],'SRK-S5-34-08':['C5','C3'],
    'SRK-S5-56-01':['C3','C5'],'SRK-S5-56-02':['C1','C5'],'SRK-S5-56-03':['C5','H5','H3'],'SRK-S5-56-05':['C5','H5','I4'],'SRK-S5-56-06':['I4','C5'],'SRK-S5-56-07':['C5'],
    'SRK-S6-34-01':['C2'],'SRK-S6-34-02':['C4','C2'],'SRK-S6-34-07':['C4','C5'],'SRK-S6-34-08':['C3'],'SRK-S6-34-09':['C4','C2'],'SRK-S6-34-10':['C3','C4'],
    'SRK-S6-56-01':['C2'],'SRK-S6-56-06':['C4'],'SRK-S6-56-07':['C3','C4'],'SRK-S6-56-09':['C4','C2'],'SRK-S6-56-10':['C3','C4'],
    'SRK-S7-34-01':['H3'],'SRK-S7-34-02':['H1','H2'],'SRK-S7-34-03':['H1','H2'],'SRK-S7-34-04':['I1','H2'],'SRK-S7-34-08':['H1','H2'],'SRK-S7-34-09':['H2'],
    'SRK-S7-56-01':['H1','H2'],'SRK-S7-56-03':['H2'],'SRK-S7-56-04':['H1'],'SRK-S7-56-07':['H1','H2'],
    'SRK-S8-34-01':['H1','H5'],'SRK-S8-34-03':['H1'],'SRK-S8-34-08':['I3','H5'],
    'SRK-S8-56-02':['H5'],'SRK-S8-56-09':['I4','I3'],
    'SRK-S9-34-01':['H3'],'SRK-S9-34-06':['H3','I1'],'SRK-S9-56-01':['H3'],'SRK-S9-56-06':['H3','I1']
  };

  const TASK_RELEVANT=new Set(['S3','S4','S7','S8','S9','S10']);
  const SUPPORT_WORDS=/(提醒|提示|帮助|协助|支持|安抚|陪伴|带领|示范|追问|重述|重复|逐步|成人|老师走到身边|催促|代劳|介入|鼓励)/;
  function evidenceMeta(d,index){
    const band=bandForDomain(d),code=evidenceCode(d.code,band,index),bank=behaviourBank(d);
    const row=bank[index],label=Array.isArray(row)?row[0]:row;
    return {
      evidence_code:code,band,label:label||'',
      canonical_links:(DIRECT[code]||[]).map(indicator_id=>({indicator_id,link_type:'DIRECT'})),
      contextual_candidates:(CONTEXTUAL[code]||[]),
      support_sensitive:SUPPORT_WORDS.test(label||''),
      task_relevant:TASK_RELEVANT.has(d.code),source_class:'B',mapping_version:VERSION
    };
  }
  function syncDomainEvidence(r,d){
    const x=r.domains?.[d.code]; if(!x)return;
    x.evidence_codes=(x.obs||[]).map(i=>evidenceMeta(d,i).evidence_code);
    x.evidence_contract_version=VERSION;x.support_by_code ||= {};
    for(const k of Object.keys(x.support_by_code))if(!x.evidence_codes.includes(k))delete x.support_by_code[k];
  }
  function syncAllEvidence(r){
    if(S?.ui?.dept!=='SRK'||!r)return r;
    for(const d of domains())syncDomainEvidence(r,d);
    r.evidence_contract_version=VERSION;return r;
  }
  function inferExplicitSupport(label){
    const s=String(label||'');
    if(/提醒一次后|一个提示后|一次提醒后/.test(s))return {level:'S1',response:'R4',inferred:true};
    if(/持续一对一|持续由成人|成人持续|反复提醒|逐步带领|每个步骤都需要成人|成人替自己完成/.test(s))return {level:'S3',response:null,inferred:true};
    return null;
  }
  function btnRow(items,current,onclick){
    return `<div class="chips" style="margin-top:6px">${items.map(o=>`<button type="button" class="chip ${current===o.code?'on':''}" onclick="${onclick}('${o.code}')">${o.code} · ${o.name}</button>`).join('')}</div>`;
  }
  function supportHTML(d,x){
    if(S?.ui?.dept!=='SRK')return '';
    const selected=(x.obs||[]).filter(i=>{const m=evidenceMeta(d,i);return m.support_sensitive||x.support_by_code?.[m.evidence_code];});
    if(!selected.length)return '';
    return selected.map(i=>{
      const m=evidenceMeta(d,i),s=x.support_by_code?.[m.evidence_code]||inferExplicitSupport(m.label)||{},safeCode=m.evidence_code.replace(/'/g,'');
      const support=btnRow(SUPPORT_LEVELS,s.level||null,`setSRKEvidenceSupport.bind(null,'${d.code}','${safeCode}','level')`);
      const response=btnRow(RESPONSES,s.response||null,`setSRKEvidenceSupport.bind(null,'${d.code}','${safeCode}','response')`);
      const task=m.task_relevant?btnRow(TASKS,s.task||null,`setSRKEvidenceSupport.bind(null,'${d.code}','${safeCode}','task')`):'';
      return `<div style="margin-top:10px;padding:10px;border:.5px solid var(--bdr);border-radius:12px;background:rgba(0,0,0,.015)"><div class="sub"><b>Support / Response</b> · ${m.label}</div><div class="sub" style="margin-top:6px">老师当时给了多少支持？</div>${support}<div class="sub" style="margin-top:6px">之后孩子怎样？</div>${response}${m.task_relevant?`<div class="sub" style="margin-top:6px">当时是新任务还是熟悉任务？</div>${task}`:''}</div>`;
    }).join('');
  }

  function install(){
    if(installed)return true;
    try{
      if(typeof SRK_TAXONOMY==='undefined'||typeof ensure!=='function'||typeof renderDomains!=='function'||typeof behaviourBank!=='function')return false;
      const s11=SRK_TAXONOMY.find(x=>x.code==='S11');
      if(s11){s11.activeBands=['3-4'];s11.noAggregateScore=true;s11.canonicalRole='I5_EVIDENCE';}
      SRK_TAXONOMY.forEach(d=>{d.noAggregateScore=true;d.teacherUxSection=true;});
      const s10=SRK_TAXONOMY.find(x=>x.code==='S10');
      if(s10){s10.name='学习掌握与迁移';s10.en='Learning Acquisition & Transfer';s10.core='教过以后，孩子怎样把理解和方法带到相似或稍有变化的任务？';s10.note='只记录具体、已教学任务中的可观察证据；不形成“学习能力”总评分。';}

      const baseEnsure=ensure;
      ensure=function(){return syncAllEvidence(baseEnsure());};
      const baseToggleInsufficient=toggleInsufficient;
      toggleInsufficient=function(c){
        baseToggleInsufficient(c);
        if(S?.ui?.dept==='SRK'){
          const r=ensure(),x=r.domains?.[c];
          if(x?.insufficient_observation){x.evidence_codes=[];x.support_by_code={};x.evidence_contract_version=VERSION;save();}
        }
      };
      toggleObs=function(c,i){
        const r=ensure(),x=r.domains[c]||(r.domains[c]={obs:[],insufficient_observation:false,note:''});
        if(x.insufficient_observation)return;
        const d=domains().find(v=>v.code===c);if(!d)return;
        const p=x.obs.indexOf(i);if(p>=0)x.obs.splice(p,1);else x.obs.push(i);
        syncDomainEvidence(r,d);
        if(p<0){const m=evidenceMeta(d,i),auto=inferExplicitSupport(m.label);if(auto)x.support_by_code[m.evidence_code]={...auto};}
        save();renderDomains();
      };
      window.setSRKEvidenceSupport=function(domainCode,eCode,field,val){
        const r=ensure(),d=domains().find(v=>v.code===domainCode);if(!d)return;
        const x=r.domains[domainCode]||(r.domains[domainCode]={obs:[],insufficient_observation:false,note:''});x.support_by_code ||= {};
        const rec=x.support_by_code[eCode]||(x.support_by_code[eCode]={});rec[field]=(rec[field]===val?null:val);rec.inferred=false;
        if(!rec.level&&!rec.response&&!rec.task)delete x.support_by_code[eCode];x.evidence_contract_version=VERSION;save();renderDomains();
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
      cloudReviewPayload=function(r,submitted=false){syncAllEvidence(r);const p=basePayload(r,submitted);p.taxonomy_version=r.taxonomy_version||p.taxonomy_version;return p;};
      window.__LOVEGO_V47_SRK_EVIDENCE__={installed:true,version:VERSION,rules:['S1-S10 UX-only','S11 canonical I5 AGE3-4 only','stable evidence codes','support-by-evidence','0/1/2 not consumed as canonical meaning'],directMappings:Object.keys(DIRECT).length,contextualMappings:Object.keys(CONTEXTUAL).length};
      installed=true;return true;
    }catch(e){console.error('LoveGo v47 SRK evidence install failed',e);return false;}
  }
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);}
})();
