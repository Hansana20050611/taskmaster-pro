// Ultra-modern 5-tab JS for TaskMaster Pro
(function(){'use strict';
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const h=(t='light')=>{if('vibrate'in navigator){try{navigator.vibrate(t==='light'?40:t==='medium'?90:t==='success'?[40,40,40]:[120,60,120]);}catch{}}};

// State
const state={tasks:JSON.parse(localStorage.getItem('tasks')||'[]'),focusMin:0,timer:{sec:25*60,run:false,id:null}};

// Tabs
function switchTab(target){$$('.view').forEach(v=>v.classList.remove('active'));$$('.tab').forEach(t=>t.classList.remove('active'));
$('#'+target).classList.add('active');$$('.tab[data-target="'+target+'"]').classList.add('active');h();}
$$('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.target)));

// Tasks
function renderTasks(){const list=$('#task-list');list.innerHTML='';if(state.tasks.length===0){list.innerHTML='<li class="item">No tasks yet</li>';return}
state.tasks.forEach((t,i)=>{const li=document.createElement('li');li.className='item';li.innerHTML=`<div><div>${t.title}</div><div class="meta">${t.detail||''}${t.due?` • ${t.due}`:''}</div></div><div class="actions"><button data-i="${i}" class="edit btn">Edit</button><button data-i="${i}" class="del btn danger">Delete</button></div>`;list.appendChild(li);});}
function saveTasks(){localStorage.setItem('tasks',JSON.stringify(state.tasks));updateStats();}
$('#add-task-btn').addEventListener('click',()=>{$('#task-form').classList.remove('hidden');h('medium');});
$('#task-cancel').addEventListener('click',()=>{$('#task-form').classList.add('hidden');});
$('#task-form').addEventListener('submit',e=>{e.preventDefault();const t={title:$('#task-title').value.trim(),detail:$('#task-detail').value.trim(),due:$('#task-due').value||''};if(!t.title){return}state.tasks.push(t);saveTasks();renderTasks();e.target.reset();$('#task-form').classList.add('hidden');h('success');});
$('#task-list').addEventListener('click',e=>{if(e.target.classList.contains('del')){const i=+e.target.dataset.i;state.tasks.splice(i,1);saveTasks();renderTasks();h('medium');}else if(e.target.classList.contains('edit')){const i=+e.target.dataset.i;const t=state.tasks[i];$('#task-title').value=t.title;$('#task-detail').value=t.detail||'';$('#task-due').value=t.due||'';$('#task-form').classList.remove('hidden');state.tasks.splice(i,1);saveTasks();renderTasks();}});

// Generator (mock/demo): create 5 cards from topic
$('#gen-form').addEventListener('submit',async e=>{e.preventDefault();const topic=$('#gen-topic').value.trim();if(!topic){return}const wrap=$('#gen-results');wrap.innerHTML='';for(let i=1;i<=5;i++){const d=document.createElement('div');d.className='card';d.innerHTML=`<h4>${topic} #${i}</h4><p>${topic} study tip ${i}: ${topic} fundamentals and practice.</p>`;wrap.appendChild(d);}h('success');});

// Chat (local echo)
$('#chat-form').addEventListener('submit',e=>{e.preventDefault();const m=$('#chat-text').value.trim();if(!m)return;const box=$('#chat-box');const u=document.createElement('div');u.className='chat-row user';u.innerHTML=`<div class="chat-bubble">${m}</div>`;box.appendChild(u);const b=document.createElement('div');b.className='chat-row bot';b.innerHTML=`<div class="chat-bubble">You said: ${m}</div>`;box.appendChild(b);$('#chat-text').value='';box.scrollTop=box.scrollHeight;h('light');});

// Timer
function updateTimer(){const m=Math.floor(state.timer.sec/60).toString().padStart(2,'0');const s=(state.timer.sec%60).toString().padStart(2,'0');$('#timer-display').textContent=`${m}:${s}`;}
function startTimer(){if(state.timer.run)return;state.timer.run=true;state.timer.id=setInterval(()=>{state.timer.sec--;updateTimer();if(state.timer.sec<=0){pauseTimer();state.timer.sec=25*60;state.focusMin+=25;updateStats();h('success');}},1000);} 
function pauseTimer(){state.timer.run=false;clearInterval(state.timer.id);} 
function resetTimer(){pauseTimer();state.timer.sec=25*60;updateTimer();}
$('#timer-start').addEventListener('click',()=>{state.timer.run?pauseTimer():startTimer();});
$('#timer-pause').addEventListener('click',pauseTimer);
$('#timer-reset').addEventListener('click',resetTimer);
updateTimer();

// Stats
function updateStats(){$('#stat-completed').textContent=state.tasks.length.toString();$('#stat-focus').textContent=state.focusMin.toString();}
updateStats();renderTasks();
})();
