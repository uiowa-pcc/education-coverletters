const STORAGE_KEYS = {
  cover: 'uiowaCoeCoverLetterPlan',
  schoolResearch: ['uiowaCoeSchoolResearch','coeSchoolResearch','educatorSchoolResearch'],
  experiences: ['uiowaCoeExperiences','coeExperiences','educatorExperiences'],
  skills: ['uiowaCoeSkills','coeSkills','educatorSkills'],
  tailoring: ['uiowaCoeTailoring','coeTailoring','educatorTailoring']
};

const PRIORITIES = [
  {id:'relationships',label:'Building positive relationships with students',terms:['relationship','rapport','belonging','student-centered','student centered','engagement','supportive environment']},
  {id:'differentiate',label:'Differentiating instruction',terms:['differentiat','individualized','individualised','adapt instruction','small group','scaffold','diverse learners']},
  {id:'inclusive',label:'Creating an inclusive classroom',terms:['inclusive','equity','culturally responsive','diverse','accessibility','all learners','special education','iep','504']},
  {id:'collaboration',label:'Collaborating with colleagues',terms:['collaborat','team','co-teach','co teach','professional learning community','plc']},
  {id:'assessment',label:'Using assessment or data to guide instruction',terms:['assessment','data','progress monitor','formative','summative','student data']},
  {id:'families',label:'Communicating with families',terms:['family','families','parent','guardian','caregiver','home-school','home school']},
  {id:'management',label:'Supporting classroom expectations and behavior',terms:['classroom management','behavior','behaviour','expectations','routines','pbis']},
  {id:'technology',label:'Using technology to support learning',terms:['technology','digital tools','instructional technology','learning management']},
  {id:'content',label:'Strong content-area instruction',terms:['content knowledge','literacy','mathematics','math','science','social studies','reading','writing']},
  {id:'leadership',label:'Contributing beyond the classroom',terms:['leadership','extracurricular','club','coach','committee','school community']}
];

const PROMPTS = {
  relationships:'Think of a student or group you worked to understand, encourage, engage, or support.',
  differentiate:'Think of a time you changed instruction, grouping, materials, pacing, or support because students needed something different.',
  inclusive:'Think of a time you made learning more accessible, inclusive, or responsive to individual students.',
  collaboration:'Think of a time you planned, problem-solved, or supported students with another teacher or professional.',
  assessment:'Think of a time student work, assessment results, observations, or other information changed what you did next.',
  families:'Think of a time you communicated with a parent, caregiver, or family — or helped prepare that communication.',
  management:'Think of a time you helped establish expectations, redirect behavior, improve routines, or keep students engaged.',
  technology:'Think of a time technology helped students participate, practice, create, communicate, or understand something.',
  content:'Think of a lesson or learning experience where your content knowledge helped you make the learning clearer or stronger.',
  leadership:'Think of a time you contributed to a team, activity, program, or school community beyond your basic responsibilities.'
};

let state = load(STORAGE_KEYS.cover) || {step:1, application:{}, priorities:[], evidence:{}, research:{}, draftMode:'plan'};

function load(key){
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function loadFirst(keys){
  for(const key of keys){ const v=load(key); if(v) return v; }
  return null;
}
function save(){ localStorage.setItem(STORAGE_KEYS.cover, JSON.stringify(state)); }
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function normText(v){ if(!v) return ''; if(typeof v==='string') return v; return JSON.stringify(v); }

const app=document.getElementById('app');
const progressBar=document.getElementById('progressBar');
const progressText=document.getElementById('progressText');
document.getElementById('restartBtn').onclick=()=>{ if(confirm('Start this cover letter plan over?')){state={step:1,application:{},priorities:[],evidence:{},research:{},draftMode:'plan'};save();render();}};

function setStep(n){state.step=n;save();render();window.scrollTo({top:0,behavior:'smooth'});}
function template(id){return document.getElementById(id).content.cloneNode(true)}
function render(){
  progressBar.style.width=`${(state.step/6)*100}%`;
  progressText.textContent=`Step ${state.step} of 6`;
  app.innerHTML=''; app.appendChild(template(`step${state.step}`));
  const back=app.querySelector('[data-back]'); if(back) back.onclick=()=>setStep(Math.max(1,state.step-1));
  if(state.step===1) render1();
  if(state.step===2) render2();
  if(state.step===3) render3();
  if(state.step===4) render4();
  if(state.step===5) render5();
  if(state.step===6) render6();
}

function getPriorData(){return {
  research:loadFirst(STORAGE_KEYS.schoolResearch),
  experiences:loadFirst(STORAGE_KEYS.experiences),
  skills:loadFirst(STORAGE_KEYS.skills),
  tailoring:loadFirst(STORAGE_KEYS.tailoring)
}}

function render1(){
  const a=state.application||{};
  ['position','school','district','jobDescription'].forEach(id=>{const el=document.getElementById(id); if(el) el.value=a[id]||''});
  const prior=getPriorData(); const box=document.getElementById('savedApplicationArea');
  const t=prior.tailoring;
  if(t){
    const txt=normText(t);
    const guessedTitle=t.position||t.jobTitle||t.title||'Previous job posting';
    const guessedSchool=t.school||t.organization||t.employer||'';
    box.innerHTML=`<div class="notice"><strong>We found earlier tailoring work.</strong><span>${esc(guessedTitle)}${guessedSchool?' — '+esc(guessedSchool):''}</span><br><button class="secondary" id="useTailoring" type="button">Use this information</button></div>`;
    document.getElementById('useTailoring').onclick=()=>{
      state.application.position=t.position||t.jobTitle||t.title||state.application.position||'';
      state.application.school=t.school||t.organization||t.employer||state.application.school||'';
      state.application.district=t.district||state.application.district||'';
      state.application.jobDescription=t.jobDescription||t.posting||t.description||txt;
      save();render();
    };
  }
  document.getElementById('analyzeJob').onclick=()=>{
    state.application={position:document.getElementById('position').value.trim(),school:document.getElementById('school').value.trim(),district:document.getElementById('district').value.trim(),jobDescription:document.getElementById('jobDescription').value.trim()};
    if(!state.application.jobDescription){showError(document.getElementById('analyzeJob'),'Paste at least part of the job description so we can identify what matters.');return;}
    state.priorities=extractPriorities(state.application.jobDescription).slice(0,7).map(p=>p.id);
    save();setStep(2);
  };
}

function extractPriorities(text){
  const lower=text.toLowerCase();
  const scored=PRIORITIES.map(p=>({p,score:p.terms.reduce((s,t)=>s+(lower.includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score);
  const hits=scored.filter(x=>x.score>0).map(x=>x.p);
  const fallback=['relationships','differentiate','collaboration','inclusive','assessment','families','management'].map(id=>PRIORITIES.find(p=>p.id===id));
  return [...hits,...fallback.filter(f=>!hits.some(h=>h.id===f.id))];
}

function render2(){
  const list=document.getElementById('priorityList');
  const options=extractPriorities(state.application.jobDescription).slice(0,7);
  list.innerHTML=options.map(p=>`<label class="choice-card"><input type="checkbox" value="${p.id}" ${state.priorities.includes(p.id)?'checked':''}><span><strong>${esc(p.label)}</strong><small>${esc(PROMPTS[p.id]||'')}</small></span></label>`).join('');
  document.getElementById('savePriorities').onclick=()=>{
    const vals=[...list.querySelectorAll('input:checked')].map(i=>i.value);
    if(vals.length<2||vals.length>3){showError(document.getElementById('savePriorities'),'Choose 2 or 3 priorities.');return;}
    state.priorities=vals; save(); setStep(3);
  };
}

function flattenExperiences(data){
  if(!data) return [];
  let arr=[];
  if(Array.isArray(data)) arr=data;
  else if(Array.isArray(data.experiences)) arr=data.experiences;
  else if(Array.isArray(data.items)) arr=data.items;
  else Object.values(data).forEach(v=>{if(Array.isArray(v)) arr.push(...v)});
  return arr.map((x,i)=>({id:x.id||`exp${i}`,title:x.title||x.role||x.name||x.experience||'Saved experience',org:x.organization||x.school||x.employer||'',details:[x.description,x.bullet,x.bullets,x.tasks,x.notes,x.skills].flat().filter(Boolean).join(' • ')}));
}
function suggestExperiences(priority,experiences){
  const terms=(PRIORITIES.find(p=>p.id===priority)?.terms||[]).concat(priority);
  return experiences.map(e=>({e,score:terms.reduce((s,t)=>s+(e.details.toLowerCase().includes(t.split(' ')[0])?1:0),0)})).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.e);
}

function render3(){
  const area=document.getElementById('evidenceArea');
  const exps=flattenExperiences(getPriorData().experiences);
  area.innerHTML=state.priorities.map(pid=>{
    const p=PRIORITIES.find(x=>x.id===pid); const saved=state.evidence[pid]||{}; const suggestions=suggestExperiences(pid,exps);
    return `<section class="evidence-block" data-pid="${pid}"><h3>${esc(p.label)}</h3><p>${esc(PROMPTS[pid])}</p>
      ${suggestions.length?`<p class="mini"><strong>From work you already completed:</strong></p><div class="chip-row">${suggestions.map(e=>`<button type="button" class="chip ${saved.experienceId===e.id?'selected':''}" data-exp="${esc(e.id)}" data-title="${esc(e.title)}" data-details="${esc(e.details)}">${esc(e.title)}${e.org?' — '+esc(e.org):''}</button>`).join('')}</div>`:''}
      <label>Where did this happen?<select class="where"><option value="">Choose one</option>${['Student teaching','Practicum','Substitute teaching','Classroom/field experience','Job','Volunteer experience','Coaching/leadership','Course/project','Somewhere else'].map(x=>`<option ${saved.where===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label>What did you do?<textarea class="did" rows="4">${esc(saved.did||'')}</textarea></label>
      <label>What happened or what did you learn? <span class="mini">Optional</span><textarea class="result" rows="3">${esc(saved.result||'')}</textarea></label>
    </section>`;
  }).join('');
  area.querySelectorAll('.chip').forEach(btn=>btn.onclick=()=>{
    const block=btn.closest('.evidence-block'); block.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected')); btn.classList.add('selected');
    const did=block.querySelector('.did'); if(!did.value.trim()) did.value=btn.dataset.details||btn.dataset.title;
  });
  document.getElementById('saveEvidence').onclick=()=>{
    let ok=true; area.querySelectorAll('.evidence-block').forEach(block=>{
      const pid=block.dataset.pid; const chip=block.querySelector('.chip.selected');
      const did=block.querySelector('.did').value.trim(); if(!did) ok=false;
      state.evidence[pid]={experienceId:chip?.dataset.exp||'',experienceTitle:chip?.dataset.title||'',where:block.querySelector('.where').value,did,result:block.querySelector('.result').value.trim()};
    });
    if(!ok){showError(document.getElementById('saveEvidence'),'Add a short example for each priority.');return;}
    save();setStep(4);
  };
}

function extractResearchItems(data){
  if(!data) return [];
  let raw=[];
  if(Array.isArray(data)) raw=data; else if(Array.isArray(data.findings)) raw=data.findings; else if(Array.isArray(data.items)) raw=data.items;
  else Object.entries(data).forEach(([k,v])=>{if(typeof v==='string'&&v.trim()) raw.push({category:k,text:v}); else if(Array.isArray(v)) v.forEach(x=>raw.push(typeof x==='string'?{category:k,text:x}:x));});
  return raw.map((x,i)=>({id:x.id||`r${i}`,category:x.category||x.type||'From your research',text:x.text||x.finding||x.value||x.note||x.title||'',why:x.why||x.connection||x.whyItMatters||''})).filter(x=>x.text);
}

function render4(){
  const area=document.getElementById('researchArea'); const items=extractResearchItems(getPriorData().research);
  const r=state.research||{};
  area.innerHTML=`${items.length?`<div class="notice"><strong>You already researched this school.</strong><span>Choose something that genuinely connects with you.</span></div><div class="choice-list">${items.slice(0,6).map(i=>`<label class="choice-card"><input type="radio" name="researchPick" value="${esc(i.id)}" data-text="${esc(i.text)}" ${r.sourceId===i.id?'checked':''}><span><strong>${esc(i.category)}</strong><small>${esc(i.text)}</small></span></label>`).join('')}</div>`:`<div class="notice"><strong>No previous school research found.</strong><span>You only need one meaningful reason this school interests you.</span></div>`}
    <section class="research-card"><h3>${items.length?'Use or add to your research':'Quick school research'}</h3><p class="mini">Good places to look: school website, district website, strategic priorities, programs/student supports, school news, newsletters, or recent social posts.</p>
    <label>What did you notice?<textarea id="researchFinding" rows="4" placeholder="A program, priority, approach, or something distinctive...">${esc(r.finding||'')}</textarea></label>
    <label>Why does it matter to you?<textarea id="researchWhy" rows="4" placeholder="Connect it to something you value, experienced, or want to contribute to...">${esc(r.why||'')}</textarea></label></section>`;
  area.querySelectorAll('input[name=researchPick]').forEach(radio=>radio.onchange=()=>{document.getElementById('researchFinding').value=radio.dataset.text||'';});
  document.getElementById('saveResearch').onclick=()=>{
    const pick=area.querySelector('input[name=researchPick]:checked'); const finding=document.getElementById('researchFinding').value.trim(); const why=document.getElementById('researchWhy').value.trim();
    if(!finding||!why){showError(document.getElementById('saveResearch'),'Add what you noticed and why it matters to you.');return;}
    state.research={sourceId:pick?.value||'',finding,why}; save();setStep(5);
  };
}

function render5(){
  const area=document.getElementById('planArea'); const school=state.application.school||'this school';
  const cards=state.priorities.map(pid=>{const p=PRIORITIES.find(x=>x.id===pid),e=state.evidence[pid];return `<div class="plan-card"><p class="mini">They want</p><h3>${esc(p.label)}</h3><p><strong>You can show:</strong> ${esc(e.did)}</p>${e.result?`<p><strong>What it demonstrates:</strong> ${esc(e.result)}</p>`:''}</div>`}).join('');
  area.innerHTML=`<div class="plan-grid"><div class="plan-card"><p class="mini">Why ${esc(school)}</p><h3>${esc(state.research.finding)}</h3><p>${esc(state.research.why)}</p></div>${cards}</div>
  <div class="flow"><div class="flow-item"><strong>Opening</strong><br><span class="mini">Position + genuine reason you’re interested in this school</span></div><div class="arrow">↓</div><div class="flow-item"><strong>Body paragraph 1</strong><br><span class="mini">What they need → your strongest example → what it demonstrates</span></div><div class="arrow">↓</div><div class="flow-item"><strong>Body paragraph 2</strong><br><span class="mini">Another priority → your example → what it demonstrates</span></div><div class="arrow">↓</div><div class="flow-item"><strong>Closing</strong><br><span class="mini">What you hope to contribute + interest in discussing the position</span></div></div>`;
  document.getElementById('toDraft').onclick=()=>setStep(6);
}

function render6(){
  const area=document.getElementById('draftArea'); const school=state.application.school||'the school'; const position=state.application.position||'the position';
  const p1=PRIORITIES.find(x=>x.id===state.priorities[0]), e1=state.evidence[state.priorities[0]];
  const p2=PRIORITIES.find(x=>x.id===state.priorities[1]), e2=state.evidence[state.priorities[1]];
  area.innerHTML=`<div class="mode-grid"><div class="mode"><h3>Write it myself</h3><p class="mini">Use your plan and optional starters.</p></div><div class="mode"><h3>Help me phrase it</h3><p class="mini">Use the starters below to get moving.</p></div><div class="mode"><h3>Create a draft elsewhere</h3><p class="mini">Copy your plan into an approved AI tool and keep everything accurate.</p></div></div>
  <div class="starter"><strong>Opening starter</strong><br>I am applying for the ${esc(position)} position at ${esc(school)}. I was especially interested in ${esc(state.research.finding.toLowerCase())} because ${esc(state.research.why.charAt(0).toLowerCase()+state.research.why.slice(1))}</div>
  <div class="starter"><strong>Body paragraph starter</strong><br>My experience has helped me develop ${esc(p1.label.toLowerCase())}. ${esc(e1.did)}${e1.result?' This experience '+esc(e1.result.charAt(0).toLowerCase()+e1.result.slice(1)):''}</div>
  <div class="starter"><strong>Second body paragraph starter</strong><br>I would also bring experience related to ${esc(p2.label.toLowerCase())}. ${esc(e2.did)}${e2.result?' This '+esc(e2.result.charAt(0).toLowerCase()+e2.result.slice(1)):''}</div>
  <div class="notice"><strong>Quick check before you send it</strong><span>Correct school and position • specific reason for interest • real examples • adds context beyond your resume • sounds like you • accurate</span></div>`;
  document.getElementById('copyPlan').onclick=async()=>{
    const txt=buildPlanText(); try{await navigator.clipboard.writeText(txt);document.getElementById('copyStatus').textContent='Plan copied.';}catch{document.getElementById('copyStatus').textContent='Copy was blocked by the browser. Select and copy from the plan instead.';}
  };
}

function buildPlanText(){
  let out=`COVER LETTER PLAN\n\nPosition: ${state.application.position||''}\nSchool: ${state.application.school||''}\nDistrict: ${state.application.district||''}\n\nWHY THIS SCHOOL\n${state.research.finding}\nWhy it matters to me: ${state.research.why}\n`;
  state.priorities.forEach((pid,i)=>{const p=PRIORITIES.find(x=>x.id===pid),e=state.evidence[pid];out+=`\nPOINT ${i+1}: ${p.label}\nExample: ${e.did}\n${e.result?'What it shows: '+e.result+'\n':''}`});
  out+='\nLETTER STRUCTURE\nOpening: position + genuine reason for interest\nBody: employer need + evidence + meaning\nBody: second need + evidence + meaning\nClosing: contribution + interest in discussing the role\n';
  return out;
}
function showError(btn,msg){let el=btn.parentElement.querySelector('.error');if(!el){el=document.createElement('p');el.className='error';btn.parentElement.appendChild(el);}el.textContent=msg;}

render();
