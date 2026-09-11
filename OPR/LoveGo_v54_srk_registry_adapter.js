/* LoveGo v54 · SRK Canonical Registry Adapter
 * Purpose: bridge the v53 canonical behaviour registry into the existing LoveGo review flow.
 * Safety: production UI remains unchanged unless ?srk_registry=1 is present.
 * No BUILDING/DEVELOPING/SECURE inference. No numeric weight authority.
 */
(()=>{
  'use strict';
  const VERSION='LoveGo-SRK-Registry-Adapter-v1';
  const SECTION_ORDER=['理解要求与执行','参与学习与专注','遇到困难时怎样继续','日常常规与独立','表达需要与求助','同伴互动与合作','情绪恢复','个人自理（AGE 3–4）'];
  const SECTION_CODE={
    '理解要求与执行':'RG1','参与学习与专注':'RG2','遇到困难时怎样继续':'RG3','日常常规与独立':'RG4',
    '表达需要与求助':'RG5','同伴互动与合作':'RG6','情绪恢复':'RG7','个人自理（AGE 3–4）':'RG8'
  };
  const SUPPORT=[['','— 支持程度 —'],['S0','S0 · 无需支持'],['S1','S1 · 轻提示'],['S2','S2 · 引导支持'],['S3','S3 · 持续支持']];
  const RESPONSE=[['','— 孩子回应 —'],['R1','R1 · 仍无法继续'],['R2','R2 · 持续帮助下完成'],['R3','R3 · 在支持下继续'],['R4','R4 · 一个提示后继续'],['R5','R5 · 自己修正 / 恢复'],['R6','R6 · 后续独立完成']];
  const TASK=[['','— 任务熟悉度 —'],['NEW','新任务'],['FAMILIAR','熟悉任务']];

  function registry(){return window.LOVEGO_SRK_EVIDENCE_REGISTRY||null;}
  function enabled(){return S?.ui?.dept==='SRK' && new URLSearchParams(location.search).get('srk_registry')==='1';}
  function stageOfClass(){
    const cls=typeof currentClassObj==='function'?currentClassObj():null;
    const n=String(cls?.class_name||cls?.display_name||'').toUpperCase();
    for(const s of ['BB','JR','IN','SR'])if(new RegExp('(^|[-_.\\s])'+s+'($|[-_.\\s])').test(n))return s;
    return null;
  }
  function resolvedAge(){
    const R=registry(); if(!R)return null;
    const stage=stageOfClass(); if(stage){const a=R.ageForStage(stage);if(a)return a;}
    const st=typeof currentStudentObj==='function'?currentStudentObj():null;
    const raw=typeof ageFromStudent==='function'?ageFromStudent(st):null;
    if(typeof raw!=='number')return null;
    if(raw<3||raw>=7)return null;
    return Math.max(3,Math.min(6,Math.floor(raw)));
  }
  function rows(){const R=registry(),age=resolvedAge();return (!R||!age)?[]:R.visibleRows({age});}
  function sections(){
    const rr=rows();
    return SECTION_ORDER.map(name=>({code:SECTION_CODE[name],name,en:'SRK Evidence',core:'根据这一阶段真实看到的表现记录',rows:rr.filter(r=>r.teacher_ux_section===name)})).filter(x=>x.rows.length);
  }
  function optionHTML(a,val){return a.map(([v,t])=>`<option value="${v}" ${String(val||'')===v?'selected':''}>${t}</option>`).join('');}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function bucket(r,code){r.srk_registry ||= {version:VERSION,selected:{},insufficient:{},note_by_section:{},support_by_code:{},context_by_code:{}};return r.srk_registry;}
  function snapshot(row){
    const st=typeof currentStudentObj==='function'?currentStudentObj():null,cls=typeof currentClassObj==='function'?currentClassObj():null;
    return {evidence_code:row.behaviour_code,indicator_id:row.indicator_id,student_id:S.ui.studentId,class_id:S.ui.classId,department:'SRK',cycle_id:S.ui.cycle,stage:stageOfClass(),resolved_age:resolvedAge(),captured_at:new Date().toISOString(),registry_version:registry()?.meta?.registry_id||null,adapter_version:VERSION};
  }
  function supportBlock(row,b){
    if(row.support_response_capture!=='REQUIRED')return '';
    const s=b.support_by_code[row.behaviour_code]||{};
    const fam=String(row.task_familiarity||'').startsWith('REQUIRED')||row.task_familiarity==='OPTIONAL';
    return `<div style="margin:7px 0 2px 10px;padding:8px;border-left:3px solid var(--bdr);background:var(--sur2)"><div class="sub" style="margin-bottom:6px">Support / Response · ${esc(row.behaviour_code)}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><select onchange="setSRKRegistrySupport('${row.behaviour_code}','level',this.value)" style="min-height:40px;border:.5px solid var(--bdr);border-radius:8px;padding:6px">${optionHTML(SUPPORT,s.level)}</select><select onchange="setSRKRegistrySupport('${row.behaviour_code}','response',this.value)" style="min-height:40px;border:.5px solid var(--bdr);border-radius:8px;padding:6px">${optionHTML(RESPONSE,s.response)}</select>${fam?`<select onchange="setSRKRegistrySupport('${row.behaviour_code}','task',this.value)" style="min-height:40px;border:.5px solid var(--bdr);border-radius:8px;padding:6px">${optionHTML(TASK,s.task)}</select>`:''}</div></div>`;
  }
  function render(){
    if(!enabled())return false;
    const R=registry(); if(!R)return false;
    const r=ensure(),b=bucket(r),age=resolvedAge(),ss=sections();
    const host=document.getElementById('domains'); if(!host)return false;
    host.innerHTML=`<div class="alert"><b>SRK Canonical Evidence Registry</b> · AGE ${age??'—'} · 只记录观察证据，不在这里判断发展等级。</div>`+ss.map(sec=>{
      const selected=new Set(b.selected[sec.code]||[]),ins=!!b.insufficient[sec.code];
      return `<div class="domain"><div class="dh"><div><div class="dn">${sec.name}</div><div class="dd">${sec.core}</div></div></div><div class="db"><div class="sub" style="margin-top:10px">这一阶段，你平常看到哪些表现？可多选。</div><div class="chips">${sec.rows.map(row=>`<button class="chip ${selected.has(row.behaviour_code)?'on':''}" ${ins?'disabled':''} onclick="toggleSRKRegistryEvidence('${sec.code}','${row.behaviour_code}')">${esc(row.teacher_wording_zh)}</button>`).join('')}</div>${sec.rows.filter(row=>selected.has(row.behaviour_code)).map(row=>supportBlock(row,b)).join('')}<button class="chip ${ins?'on':''}" style="margin-top:8px" onclick="toggleSRKRegistryInsufficient('${sec.code}')">无法判断 / Insufficient Observation</button><textarea class="note" placeholder="具体例子 / context（选填）" oninput="setSRKRegistryNote('${sec.code}',this.value)">${esc(b.note_by_section[sec.code]||'')}</textarea></div></div>`;
    }).join('');
    const dl=(r.daily_life&&typeof r.daily_life==='object')?r.daily_life:{routine:'',social:'',emotion:'',change:''};
    ['Routine','Social','Emotion','Change'].forEach(k=>{const el=document.getElementById('daily'+k);if(el)el.value=dl[k.toLowerCase()]||'';});
    const sm=document.getElementById('summary');if(sm)sm.value=r.summary||'';
    return true;
  }
  window.toggleSRKRegistryEvidence=function(sec,code){
    const r=ensure(),b=bucket(r),arr=b.selected[sec]||(b.selected[sec]=[]),p=arr.indexOf(code),row=registry()?.get(code);
    if(!row)return;
    if(p>=0){arr.splice(p,1);delete b.support_by_code[code];delete b.context_by_code[code];}
    else {arr.push(code);b.context_by_code[code]=snapshot(row);}
    b.version=VERSION;r.updated_at=new Date().toISOString();save();render();
  };
  window.toggleSRKRegistryInsufficient=function(sec){
    const r=ensure(),b=bucket(r);b.insufficient[sec]=!b.insufficient[sec];
    if(b.insufficient[sec])for(const code of (b.selected[sec]||[])){delete b.support_by_code[code];delete b.context_by_code[code];} 
    if(b.insufficient[sec])b.selected[sec]=[];save();render();
  };
  window.setSRKRegistryNote=function(sec,val){const r=ensure(),b=bucket(r);b.note_by_section[sec]=val;save();};
  window.setSRKRegistrySupport=function(code,field,val){const r=ensure(),b=bucket(r),x=b.support_by_code[code]||(b.support_by_code[code]={});x[field]=val||null;x.updated_at=new Date().toISOString();if(!x.level&&!x.response&&!x.task)delete b.support_by_code[code];save();render();};

  function validateRegistryReview(r){
    if(!enabled())return {ok:true,mode:'legacy'};
    const b=bucket(r),missing=[],support_missing=[];
    for(const sec of sections()){
      const sel=b.selected[sec.code]||[];
      if(!sel.length&&!b.insufficient[sec.code])missing.push(sec.code);
      for(const code of sel){const row=registry()?.get(code);if(row?.support_response_capture==='REQUIRED'){const s=b.support_by_code[code]||{};if(!s.level||!s.response)support_missing.push(code);}}
    }
    return {ok:missing.length===0&&support_missing.length===0,missing,support_missing,mode:'srk_registry'};
  }

  function exportEvidence(r){
    if(!r?.srk_registry)return [];
    const b=r.srk_registry,out=[];
    for(const [sec,codes] of Object.entries(b.selected||{}))for(const code of codes){
      const row=registry()?.get(code);if(!row)continue;
      out.push({source_system:'LoveGo',source_class:'B',department:'SRK',student_id:r.student_id,class_id:r.class_id,cycle_id:r.cloud_cycle_id||r.cycle_id,teacher_id:r.teacher_id,assignment_id:r.assignment_id||null,evidence_code:code,indicator_id:row.indicator_id,polarity:row.polarity,teacher_section:sec,teacher_wording:row.teacher_wording_zh,support:b.support_by_code?.[code]||null,context:b.context_by_code?.[code]||null,registry_version:registry()?.meta?.registry_id||null,adapter_version:VERSION,interpretation:null});
    }
    return out;
  }

  function install(){
    if(typeof renderDomains!=='function'||typeof ensure!=='function'||!registry())return false;
    const baseRender=renderDomains;
    renderDomains=function(){if(!render())return baseRender();};
    const basePayload=cloudReviewPayload;
    cloudReviewPayload=function(r,submitted=false){
      const p=basePayload(r,submitted);
      if(enabled()){
        const gate=validateRegistryReview(r);
        p.srk_registry=r.srk_registry||null;
        p.srk_evidence_export=exportEvidence(r);
        p.srk_registry_gate=gate;
      }
      return p;
    };
    const baseSubmitGate=window.lovegoSubmitGateV22;
    if(typeof baseSubmitGate==='function')window.lovegoSubmitGateV22=function(r){const base=baseSubmitGate(r),rg=validateRegistryReview(r);return {ok:base.ok&&rg.ok,checks:{...(base.checks||{}),srk_registry:rg}};};
    window.LOVEGO_SRK_REGISTRY_ADAPTER=Object.freeze({version:VERSION,enabled,stageOfClass,resolvedAge,sections,validateRegistryReview,exportEvidence,render});
    console.info('[LoveGo] v54 SRK registry adapter ready',enabled()?'UAT enabled':'production legacy UI preserved');
    return true;
  }
  let n=0,t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);
})();