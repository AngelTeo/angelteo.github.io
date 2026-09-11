/* LoveGo v59 · SRK registry submit bridge
 * The legacy saveReview() validates legacy domains directly and therefore cannot
 * be authoritative for ?srk_registry=1. This bridge routes SRK Registry UAT
 * through the composed LoveGo submit gate (v54/v56/v57/v58) before cloud write.
 * Drafts remain allowed while incomplete. No developmental interpretation.
 */
(()=>{
  'use strict';
  const VERSION='LoveGo-SRK-Submit-Bridge-v1';
  let installed=false;

  function registryMode(){
    return S?.ui?.dept==='SRK' && new URLSearchParams(location.search).get('srk_registry')==='1';
  }
  function syncNarrative(r){
    const val=id=>document.getElementById(id)?.value||'';
    r.daily_life={routine:val('dailyRoutine'),social:val('dailySocial'),emotion:val('dailyEmotion'),change:val('dailyChange')};
    r.summary=val('summary');
    r.updated_at=new Date().toISOString();
    return r;
  }
  function gateMessage(g){
    const checks=g?.checks||{};
    const rg=checks.srk_registry;
    if(rg?.missing?.length)return `还有 ${rg.missing.length} 个观察区未完成`;
    if(rg?.support_missing?.length)return `还有 ${rg.support_missing.length} 项 Support / Response 未完成`;
    const od=checks.srk_od1;
    if(od?.ok===false)return '学生年龄 / 班级阶段资料不足，暂不能提交';
    const sg=checks.srk_semantic;
    if(sg?.missing_familiarity?.length)return '还有需要确认的新任务 / 熟悉任务资料';
    if(sg?.missing_od1?.length)return 'Evidence 缺少有效 AGE resolution';
    if(sg?.opportunity_unattested?.length)return 'Evidence 缺少必要观察机会确认';
    if(checks.srk_runtime?.ok===false)return 'SRK Registry Runtime QC 未通过，已停止提交';
    if(checks.daily?.ok===false)return '请至少留下一项有意义的生活片段';
    return '这份 Review 仍有未完成项目';
  }

  async function saveRegistryReview(submit){
    let r=ensure();
    if(r.status==='completed'&&r.submitted_at){toast('这份 Review 已提交并锁定');return;}
    syncNarrative(r);

    if(submit){
      const gate=typeof window.lovegoSubmitGateV22==='function'?window.lovegoSubmitGateV22(r):{ok:false,checks:{srk_runtime:{ok:false}}};
      if(!gate.ok){
        r.srk_last_submit_gate=gate;
        r.status='draft';
        delete r.submitted_at;delete r.locked_at;
        save();
        toast(gateMessage(gate));
        return;
      }
      r.srk_last_submit_gate=gate;
      r.status='completed';r.submitted_at=new Date().toISOString();r.locked_at=r.submitted_at;
      save();
      try{
        const res=await cloudUpsertReview(r,true);
        r.status='completed';r.submitted_at=res.submitted_at;r.locked_at=res.locked_at;save();
        toast('✓ 已提交到 Cloud');go('collect');return;
      }catch(e){
        r.status='draft';delete r.submitted_at;delete r.locked_at;save();
        toast('提交失败：'+String(e.message||e));return;
      }
    }

    save();
    try{
      if(CLOUD.available){await cloudUpsertReview(r,false);save();toast('✓ Cloud 草稿已保存');}
      else{save();toast('✓ 仅本机草稿已保存');}
    }catch(e){save();toast('Cloud 储存失败；已保留本机草稿');console.error(e);}
    go('collect');
  }

  function install(){
    if(installed)return true;
    if(typeof window.saveReview!=='function'||typeof ensure!=='function'||typeof cloudUpsertReview!=='function'||!window.LOVEGO_SRK_RUNTIME_QC)return false;
    const base=window.saveReview;
    window.saveReview=function(submit){
      if(!registryMode())return base(submit);
      return saveRegistryReview(!!submit);
    };
    window.LoveGoSRKSubmitBridge=Object.freeze({version:VERSION,registryMode,syncNarrative,saveRegistryReview});
    window.__LOVEGO_V59_SRK_SUBMIT_BRIDGE__={installed:true,version:VERSION,rule:'registry mode never uses legacy domain validation for submit'};
    installed=true;
    console.info('[LoveGo] v59 SRK submit bridge ready');
    return true;
  }

  if(!install()){let n=0,t=setInterval(()=>{n++;if(install()||n>300)clearInterval(t)},25);}
})();
