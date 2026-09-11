/* Mock-only LoveGo SRK E2E UAT bootstrap. No Supabase client, no network writes. */
let CLOUD={available:true,cycleMap:{UAT:{id:'cycle-cloud'}}};
let S={ui:{dept:'SRK',classId:'class-jr',studentId:'student-1',cycle:'UAT'},who:{id:'teacher-1',role:'TEACHER'},classes:[{id:'class-jr',class_name:'SRK-JR.1',display_name:'JR 1'}],students:[{id:'student-1',date_of_birth:'2023-09-01'}],reviews:{},assignments:{},enroll:[]};
let __cloudWrites=0,__lastPayload=null,__toasts=[];
function ageFromStudent(){return 3;}
function currentClassObj(){return S.classes[0];}
function currentStudentObj(){return S.students[0];}
function normaliseAssignmentStore(){}
function currentAssignmentRows(){return [{id:'assignment-1',teacher_id:'teacher-1',slot_no:1}];}
function ensure(){const k='assignment:assignment-1';if(!S.reviews[k])S.reviews[k]={id:'review-1',assignment_id:'assignment-1',cycle_id:'UAT',cloud_cycle_id:'cycle-cloud',student_id:'student-1',class_id:'class-jr',department:'SRK',teacher_id:'teacher-1',taxonomy_version:'ObsGo-authority-v1',status:'draft',counts_for_cycle:true,domains:{},daily_life:{routine:'',social:'',emotion:'',change:''},summary:''};return S.reviews[k];}
function save(){}
function domains(){return [];}
function behaviourBank(){return [];}
function renderDomains(){}
function go(){}
function toast(x){__toasts.push(String(x));}
function cloudReviewPayload(r,submitted=false){return {assignment_id:r.assignment_id,cycle_id:r.cloud_cycle_id,student_id:r.student_id,class_id:r.class_id,department:r.department,teacher_id:r.teacher_id,taxonomy_version:r.taxonomy_version,status:submitted?'completed':'draft',domains:r.domains||{},daily_life:r.daily_life||{},summary:r.summary||null,...(submitted?{submitted_at:new Date().toISOString(),locked_at:new Date().toISOString()}:{})};}
async function cloudUpsertReview(r,submitted=false){__cloudWrites++;__lastPayload=cloudReviewPayload(r,submitted);const now=new Date().toISOString();return {id:r.id,status:submitted?'completed':'draft',submitted_at:submitted?now:null,locked_at:submitted?now:null};}
function lovegoSubmitGateV22(){return {ok:true,checks:{}};}
async function saveReview(){throw new Error('LEGACY_SAVE_SHOULD_NOT_RUN_IN_REGISTRY_MODE');}
function resetUAT(){S.reviews={};__cloudWrites=0;__lastPayload=null;__toasts=[];for(const id of ['dailyRoutine','dailySocial','dailyEmotion','dailyChange','summary']){const el=document.getElementById(id);if(el)el.value='';}}
function uatCheck(name,ok,detail=''){return {name,ok:!!ok,detail};}
function fillAllSections(){const A=window.LOVEGO_SRK_REGISTRY_ADAPTER;for(const sec of A.sections()){const row=sec.rows.find(r=>r.support_response_capture!=='REQUIRED'&&!r.opportunity_guard&&!String(r.task_familiarity||'').startsWith('REQUIRED'))||sec.rows[0];window.toggleSRKRegistryEvidence(sec.code,row.behaviour_code);}}
