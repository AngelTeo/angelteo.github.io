/* LoveGo v46 · SRK legacy reconciliation
   Source basis:
   - current SRK S1-S10 ObsGo authority
   - legacy LOVE LOVE programme evidence (including accessible IN3 form)
   - PTM Card Comment BB/JR/IN 2025 wording patterns
   Principle: preserve one teacher input layer. Legacy labels/phrases are reconciled into observable evidence; report wording stays downstream.
*/
(()=>{
  let installed=false;
  const add=(domainCode,band,rows)=>{
    const d=SRK_TAXONOMY.find(x=>x.code===domainCode); if(!d||!d.beh?.[band])return;
    const labels=new Set(d.beh[band].map(x=>Array.isArray(x)?x[0]:x));
    for(const row of rows)if(!labels.has(row[0]))d.beh[band].push(row);
  };
  const install=()=>{
    if(installed)return true;
    try{
      if(typeof SRK_TAXONOMY==='undefined'||typeof domains!=='function'||typeof behaviourBank!=='function'||typeof ensure!=='function')return false;

      if(!SRK_TAXONOMY.some(d=>d.code==='S11')){
        SRK_TAXONOMY.push({
          grp:'SELF CARE',code:'S11',name:'日常自理',en:'Self-Care & Personal Routines',
          core:'孩子在饮水、进食、如厕与基本个人卫生上，能做到多少？',axis:'AGE',activeBands:['3-4','5-6'],
          privacy:'敏感如厕事故、纸尿裤等细节只可写 internal context；不可直接自动生成家长报告句。',
          beh:{
            '3-4':[
              ['自己进食，年龄合理范围内不需要成人持续喂食',2],
              ['进食时仍需要成人较多协助才能完成',0],
              ['需要喝水时会自己喝，或主动表达喝水需要',2],
              ['会用语言、动作或明确讯号表达如厕需要',2],
              ['在年龄合理范围内参与如厕后的基本步骤',2],
              ['洗手、整理衣物等步骤在提醒一次后能够继续',1],
              ['多数基本自理步骤仍等待成人直接代劳',0]
            ],
            '5-6':[
              ['在学校 routine 中自行饮水，不需要成人反复催促',2],
              ['能够独立进食，并维持基本餐桌习惯',2],
              ['主动表达如厕需要并自行处理大部分如厕步骤',2],
              ['如厕后能处理衣物与洗手等基本卫生步骤',2],
              ['发现个人卫生或自理问题时会自行处理或主动求助',2],
              ['提醒一次后能够完成遗漏的自理步骤',1],
              ['年龄合理范围内的基本自理仍经常依赖成人逐步协助',0]
            ]
          }
        });
      } else {
        const d=SRK_TAXONOMY.find(x=>x.code==='S11');
        d.activeBands=['3-4','5-6'];
        d.core='孩子在饮水、进食、如厕与基本个人卫生上，能做到多少？';
        d.beh['5-6']=[
          ['在学校 routine 中自行饮水，不需要成人反复催促',2],
          ['能够独立进食，并维持基本餐桌习惯',2],
          ['主动表达如厕需要并自行处理大部分如厕步骤',2],
          ['如厕后能处理衣物与洗手等基本卫生步骤',2],
          ['发现个人卫生或自理问题时会自行处理或主动求助',2],
          ['提醒一次后能够完成遗漏的自理步骤',1],
          ['年龄合理范围内的基本自理仍经常依赖成人逐步协助',0]
        ];
      }

      add('S3','3-4',[
        ['对新的材料或活动表现出好奇并愿意探索',2],
        ['需要较多外在鼓励才愿意进入学习活动',0]
      ]);
      add('S3','5-6',[
        ['主动提问、探索或表达对新学习内容的兴趣',2],
        ['主要依赖奖励或成人不断推动才参与当前学习',0]
      ]);
      add('S4','3-4',[
        ['在提醒下照顾自己的书包、水瓶或个人用品',1],
        ['个人物品经常散放，需要成人逐项协助整理',0]
      ]);
      add('S4','5-6',[
        ['自己管理书包、水瓶与常用个人物品',2],
        ['能在熟悉活动中把时间用在当前该完成的事情上',2],
        ['个人物品经常遗失、遗漏或混乱，需要反复提醒',0],
        ['熟悉任务仍经常拖延到需要成人持续催促才完成',0]
      ]);
      add('S6','3-4',[
        ['看到同伴需要帮助时愿意给予简单帮助',2],
        ['在提醒下使用礼貌、尊重的方式与同伴互动',1],
        ['互动中经常用不友善的语言或动作影响同伴',0]
      ]);
      add('S6','5-6',[
        ['主动关心或帮助有需要的同伴',2],
        ['与老师和同伴表达不同意见时保持基本尊重',2],
        ['在小组活动中能够带领或提出想法，同时让同伴参与',2],
        ['自己造成问题后愿意承认、修正或作出补救',2],
        ['经常打断、控制或排斥同伴，影响共同活动',0],
        ['经常使用不礼貌或冒犯性的语言与人互动',0]
      ]);

      const baseDomains=domains;
      domains=function(){
        const list=baseDomains();
        if(S?.ui?.dept!=='SRK')return list;
        const B=DEPT_BAND?.SRK,age=typeof ageFromStudent==='function'?ageFromStudent(currentStudentObj()):null;
        const actual=(B&&typeof age==='number')?B.fromAge(age):null,cls=typeof currentClassObj==='function'?currentClassObj():null;
        const curriculum=(B&&B.fromClass&&typeof curriculumBandOf==='function')?curriculumBandOf(cls?.class_name||cls?.display_name):null;
        const band=actual||curriculum||null;
        return list.filter(d=>!Array.isArray(d.activeBands)||!band||d.activeBands.includes(band));
      };

      const baseEnsure=ensure;
      ensure=function(){
        const r=baseEnsure();
        const v=CLOUD?.cycleMap?.[S?.ui?.cycle]?.taxonomy_version;
        if(v)r.taxonomy_version=v;
        return r;
      };

      const patchShell=()=>{
        document.querySelectorAll('.logout').forEach(el=>el.remove());
        document.querySelectorAll('.ver').forEach(el=>{if(el.textContent!=='v46')el.textContent='v46';});
        if(document.title.startsWith('LoveGo')&&document.title!=='LoveGo v46')document.title='LoveGo v46';
      };
      patchShell(); new MutationObserver(patchShell).observe(document.documentElement,{childList:true,subtree:true});

      installed=true;
      window.__LOVEGO_V46_SRK_RECONCILIATION__={
        installed:true,
        source:'Current SRK + LOVE LOVE legacy + PTM Card Comment legacy',
        changes:['S11 Self-Care all preschool bands','legacy curiosity/motivation into S3','organization/time management into S4','helpful/respectful/social responsibility into S6','cycle taxonomy snapshot on reviews','remove local logout','visible version v46'],
        excluded:['student stereotype labels','teacher liking score','teacher learning-disability diagnosis','duplicate comment picking']
      };
      return true;
    }catch(e){console.error('LoveGo v46 install failed',e);return false;}
  };
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>200)clearInterval(t)},25);}
})();
