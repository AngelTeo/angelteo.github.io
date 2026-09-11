async function runLoveGoV61UAT(){
  const results=[];await new Promise(r=>setTimeout(r,700));
  const A=window.LOVEGO_SRK_REGISTRY_ADAPTER;
  results.push(uatCheck('Registry QC',window.LOVEGO_SRK_EVIDENCE_REGISTRY?.validate?.().ok));
  const od=window.LoveGoSRKOD1?.resolve('JR',3);
  results.push(uatCheck('OD-1 JR age3 => AGE3',od?.resolved_age===3&&od?.status==='AGE_UNDER_USE_AGE',JSON.stringify(od)));
  results.push(uatCheck('Runtime QC',window.LOVEGO_SRK_RUNTIME_QC?.qc?.().ok,JSON.stringify(window.LOVEGO_SRK_RUNTIME_QC?.qc?.())));
  results.push(uatCheck('E2E Guard',window.LoveGoSRKE2EGuard?.report?.().ok,JSON.stringify(window.LoveGoSRKE2EGuard?.report?.())));

  resetUAT();await window.saveReview(true);
  results.push(uatCheck('Incomplete submit blocked',__cloudWrites===0,__toasts.join(' | ')));
  resetUAT();fillAllSections();await window.saveReview(true);
  results.push(uatCheck('No Daily Student Life blocked',__cloudWrites===0,__toasts.join(' | ')));

  resetUAT();fillAllSections();document.getElementById('dailyRoutine').value='meaningful routine observation';await window.saveReview(true);
  const r=ensure();
  results.push(uatCheck('Complete submit writes once',__cloudWrites===1,String(__cloudWrites)));
  results.push(uatCheck('Submitted review locked',r.status==='completed'&&!!r.submitted_at&&!!r.locked_at,JSON.stringify({status:r.status,submitted_at:r.submitted_at})));
  results.push(uatCheck('Cloud payload packed in domains JSONB',!!__lastPayload?.domains?.__srk_registry_v1));
  results.push(uatCheck('No top-level srk_registry column',!Object.prototype.hasOwnProperty.call(__lastPayload||{},'srk_registry')));

  await new Promise(r=>setTimeout(r,300));
  const events=window.LoveGoEvidencePlug?.buildReview?.(r)||[];
  results.push(uatCheck('v61 Evidence Plug loaded',window.__LOVEGO_V61_SRK_EVIDENCE_PLUG__?.installed===true));
  results.push(uatCheck('Canonical events exported',events.length===A.sections().length,`events=${events.length}, sections=${A.sections().length}`));
  results.push(uatCheck('Events authoritative after submit',events.length>0&&events.every(e=>e.authoritative===true&&e.identity_complete===true)));
  results.push(uatCheck('Interpretation remains null',events.length>0&&events.every(e=>e.interpretation===null)));
  results.push(uatCheck('Canonical indicator_id present',events.length>0&&events.every(e=>!!e.indicator_id)));
  results.push(uatCheck('Stable evidence_code present',events.length>0&&events.every(e=>!!e.evidence_code)));
  const allSubmitted=window.LoveGoEvidencePlug?.buildAll?.({submittedOnly:true,countsOnly:true})||[];
  results.push(uatCheck('submittedOnly returns current canonical events',allSubmitted.length===events.length,String(allSubmitted.length)));

  const savedId=r.id;delete r.id;
  const incompleteIdentity=window.LoveGoEvidencePlug?.buildReview?.(r)||[];
  results.push(uatCheck('Missing source_record_id fails closed',incompleteIdentity.length>0&&incompleteIdentity.every(e=>e.authoritative===false&&e.identity_complete===false)));
  const noSubmitted=window.LoveGoEvidencePlug?.buildAll?.({submittedOnly:true,countsOnly:true})||[];
  results.push(uatCheck('submittedOnly excludes identity-incomplete events',noSubmitted.length===0,String(noSubmitted.length)));
  r.id=savedId;

  const ok=results.every(x=>x.ok),out=document.getElementById('out');
  if(out){out.className=ok?'ok':'bad';out.textContent=(ok?'PASS':'FAIL')+'\n\n'+results.map(x=>(x.ok?'✓ ':'✕ ')+x.name+(x.detail?' · '+x.detail:'')).join('\n');}
  window.__LOVEGO_V61_UAT_RESULT__={ok,results};return window.__LOVEGO_V61_UAT_RESULT__;
}
setTimeout(runLoveGoV61UAT,1000);
