/* LoveGo v46 · SRK legacy reconciliation
   Authority: PTM Track B B0 audit + 38 Indicator Golden Rubric FINAL.
   Purpose: restore the one legacy construct proven missing from current SRK teacher observation: I5 Self-Care & Personal Routines (Age 3–4 only).
   Existing SRK S7 covers Understand/Follows Directions; S9 covers Attention Span, so those are NOT duplicated.
   PTM Card Comment phrase bank remains downstream/system-derived and is NOT exposed as duplicate teacher input.
*/
(()=>{
  let installed=false;
  const install=()=>{
    if(installed)return true;
    try{
      if(typeof SRK_TAXONOMY==='undefined'||typeof domains!=='function'||typeof behaviourBank!=='function')return false;

      // Age 3–4 only. Do not duplicate S4 belongings/routine; keep this domain strictly personal self-care.
      if(!SRK_TAXONOMY.some(d=>d.code==='S11')){
        SRK_TAXONOMY.push({
          grp:'SELF CARE',code:'S11',name:'日常自理',en:'Self-Care & Personal Routines',
          core:'孩子在进食、饮水、如厕需求和基本个人自理上，能做到多少？',axis:'AGE',
          activeBands:['3-4'],
          privacy:'纸尿裤、如厕事故等敏感细节只可 internal note，不作为自动家长报告文案。',
          beh:{
            '3-4':[
              ['自己进食，年龄合理范围内不需要成人持续喂食',2],
              ['进食时仍需要成人较多协助才能完成',0],
              ['需要喝水时会自己喝，或主动表达喝水需要',2],
              ['会用语言、动作或明确讯号表达如厕需要',2],
              ['在年龄合理范围内参与/完成如厕后的基本步骤',2],
              ['基本自理步骤在提醒一次后能够继续完成',1],
              ['多数基本自理步骤仍等待成人直接代劳',0]
            ],
            '5-6':[]
          }
        });
      }

      // Respect age-band applicability: Age 5–6 must not be forced to mark I5/S11 as Insufficient Observation.
      const baseDomains=domains;
      domains=function(){
        const list=baseDomains();
        if(S?.ui?.dept!=='SRK')return list;
        const B=DEPT_BAND?.SRK;
        const age=typeof ageFromStudent==='function'?ageFromStudent(currentStudentObj()):null;
        const actual=(B&&typeof age==='number')?B.fromAge(age):null;
        const cls=typeof currentClassObj==='function'?currentClassObj():null;
        const curriculum=(B&&B.fromClass&&typeof curriculumBandOf==='function')?curriculumBandOf(cls?.class_name||cls?.display_name):null;
        const band=actual||curriculum||null;
        return list.filter(d=>!Array.isArray(d.activeBands)||!band||d.activeBands.includes(band));
      };

      // Remove redundant LoveGo logout control; Academee/SSO owns session exit.
      const hideLogout=()=>document.querySelectorAll('.logout').forEach(el=>el.remove());
      hideLogout();
      new MutationObserver(hideLogout).observe(document.documentElement,{childList:true,subtree:true});

      installed=true;
      window.__LOVEGO_V46_SRK_RECONCILIATION__={installed:true,source:'PTM Track B B0 + Golden Rubric FINAL',changes:['SRK S11 Self-Care age 3-4','age applicability filter','remove local logout']};
      return true;
    }catch(e){console.error('LoveGo v46 install failed',e);return false;}
  };
  if(!install()){
    let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);
  }
})();
