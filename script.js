// TaskMaster Pro - script.js
(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  // Views
  const views = {
    tasks: $('#tasksView'),
    cards: $('#cardsView'),
    chat: $('#chatView'),
    timer: $('#timerView'),
    stats: $('#statsView')
  };
  const navButtons = $$('.nav-btn');
  function showView(key){
    Object.values(views).forEach(v=>v.classList.remove('active'));
    views[key].classList.add('active');
    navButtons.forEach(b=>b.classList.toggle('active', b.dataset.view===key));
  }

  // Theme
  const themeToggle = $('#themeToggle');
  const savedTheme = localStorage.getItem('tm_theme');
  if(savedTheme==='light') document.body.classList.add('light');
  themeToggle?.addEventListener('click',()=>{
    document.body.classList.toggle('light');
    localStorage.setItem('tm_theme', document.body.classList.contains('light')?'light':'dark');
  });

  // Language button (placeholder)
  $('#langBtn')?.addEventListener('click',()=>{
    alert('Language switching will be available soon.');
  });

  // State
  let tasks = JSON.parse(localStorage.getItem('tm_tasks')||'[]');
  let stats = JSON.parse(localStorage.getItem('tm_stats')||'{"tasksCompleted":0,"studyHours":0,"cardsLearned":0,"streak":0}');

  function save(){
    localStorage.setItem('tm_tasks', JSON.stringify(tasks));
    localStorage.setItem('tm_stats', JSON.stringify(stats));
  }

  // Render tasks
  const tasksContainer = $('#tasksContainer');
  function taskBadge(priority){
    const map={high:'priority-high',medium:'priority-medium',low:'priority-low'};
    return `<span class="badge ${map[priority]||'priority-medium'}">${priority[0].toUpperCase()+priority.slice(1)}</span>`;
  }
  function subjectBadge(subject){
    return `<span class="badge">${subject?subject[0].toUpperCase()+subject.slice(1):'General'}</span>`;
  }
  function renderTasks(filter='all'){
    tasksContainer.innerHTML = '';
    const list = tasks.filter(t=> filter==='all' || t.subject===filter);
    if(list.length===0){
      tasksContainer.innerHTML = `<div class="empty-state"><p>No tasks yet</p><p class="empty-subtitle">Create your first task to get started</p><button class="btn btn-primary" id="addTaskBtnEmpty2">Add Task</button></div>`;
      $('#addTaskBtnEmpty2')?.addEventListener('click', openAddModal);
      return;
    }
    list.forEach((t,i)=>{
      const el = document.createElement('div');
      el.className='task';
      el.innerHTML = `
        <div class="task-row">
          <strong>${t.title}</strong>
          <div style="display:flex;gap:6px;align-items:center">
            ${taskBadge(t.priority)}
            ${subjectBadge(t.subject)}
            ${t.dueDate?`<span class="badge">Due: ${t.dueDate}</span>`:''}
          </div>
        </div>
        <div class="task-row">
          <span style="color:var(--muted)">${t.description||''}</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" data-action="done">${t.done?'Undone':'Done'}</button>
            <button class="btn btn-secondary" data-action="delete">Delete</button>
          </div>
        </div>`;
      el.addEventListener('click',(e)=>{
        const target = e.target;
        if(!(target instanceof HTMLElement)) return;
        if(target.dataset.action==='delete'){
          const idx = tasks.indexOf(t);
          if(idx>-1) tasks.splice(idx,1);
          save();
          renderTasks(currentFilter);
        }
        if(target.dataset.action==='done'){
          t.done = !t.done;
          if(t.done) stats.tasksCompleted = (stats.tasksCompleted||0)+1; else stats.tasksCompleted = Math.max(0,(stats.tasksCompleted||0)-1);
          save();
          renderTasks(currentFilter);
          renderStats();
        }
      });
      tasksContainer.appendChild(el);
    });
  }

  // Filters
  let currentFilter = 'all';
  $$('.filter-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      $$('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentFilter = b.dataset.filter||'all';
      renderTasks(currentFilter);
    })
  });

  // Modal add task
  const addTaskModal = $('#addTaskModal');
  function openAddModal(){ addTaskModal.classList.add('show'); $('#taskTitle').focus(); }
  function closeAddModal(){ addTaskModal.classList.remove('show'); }
  $('#addTaskBtn')?.addEventListener('click', openAddModal);
  $('#addTaskBtnEmpty')?.addEventListener('click', openAddModal);
  $('#cancelTaskBtn')?.addEventListener('click', closeAddModal);
  $('#addTaskForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = $('#taskTitle').value.trim();
    if(!title) return;
    const description = $('#taskDescription').value.trim();
    const subject = $('#taskSubject').value;
    const priority = $('#taskPriority').value||'medium';
    const dueDate = $('#taskDueDate').value;
    tasks.push({title, description, subject, priority, dueDate, done:false, id:crypto.randomUUID?.()||String(Date.now())});
    save();
    closeAddModal();
    renderTasks(currentFilter);
  });

  // Cards - mock AI generation
  $('#generateCardsBtn')?.addEventListener('click', ()=>{
    const subject = $('#cardSubject').value;
    const topic = $('#cardTopic').value.trim();
    const count = parseInt($('#cardCount').value||'5',10);
    const container = $('#cardsContainer');
    if(!topic){ alert('Please enter a topic'); return; }
    const items = Array.from({length:count}, (_,i)=>({q:`${i+1}. ${topic} - key point`, a:`Explanation for ${topic} (${subject||'general'})`}));
    stats.cardsLearned = (stats.cardsLearned||0) + items.length;
    save();
    renderStats();
    container.innerHTML = '';
    items.forEach(it=>{
      const c = document.createElement('div');
      c.className='task';
      c.innerHTML = `<strong>${it.q}</strong><div style="color:var(--muted);margin-top:6px">${it.a}</div>`;
      container.appendChild(c);
    })
  });

  // Chat - mock
  const chatMessages = $('#chatMessages');
  const chatInput = $('#chatInput');
  function pushMessage(role,text){
    const wrap = document.createElement('div');
    wrap.className='task';
    wrap.innerHTML = `<div class="task-row"><strong>${role==='user'?'You':'AI'}</strong></div><div style="color:var(--muted)">${text}</div>`;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  $('#sendChatBtn')?.addEventListener('click',()=>{
    const q = chatInput.value.trim();
    if(!q) return;
    pushMessage('user', q);
    chatInput.value='';
    setTimeout(()=>{
      pushMessage('ai', `Here's a helpful explanation about: ${q}.\n\n• Key idea 1\n• Key idea 2\n• Tip: break complex problems into steps.`);
    }, 400);
  });

  // Timer
  let seconds = 25*60, timerId=null, round=1, completed=0;
  const display = $('#timerDisplay');
  const startBtn = $('#startTimerBtn');
  const resetBtn = $('#resetTimerBtn');
  function fmt(s){ const m=Math.floor(s/60), ss=String(s%60).padStart(2,'0'); return `${String(m).padStart(2,'0')}:${ss}`; }
  function tick(){
    seconds--; display.textContent = fmt(seconds);
    if(seconds<=0){
      clearInterval(timerId); timerId=null; completed++; stats.studyHours=(stats.studyHours||0)+ (25/60); save(); renderStats(); alert('Session complete!');
      seconds = 5*60; // short break
      display.textContent = fmt(seconds);
      round++;
      $('#currentRound').textContent = String(round);
      $('#sessionsCompleted').textContent = String(completed);
    }
  }
  startBtn?.addEventListener('click',()=>{
    if(timerId) return; timerId=setInterval(tick,1000);
  });
  resetBtn?.addEventListener('click',()=>{
    clearInterval(timerId); timerId=null; seconds=25*60; display.textContent=fmt(seconds);
  });
  display.textContent = fmt(seconds);

  // Stats render
  function renderStats(){
    $('#tasksCompletedStat').textContent = String(stats.tasksCompleted||0);
    $('#studyHoursStat').textContent = `${(stats.studyHours||0).toFixed(1)}h`;
    $('#cardsLearnedStat').textContent = String(stats.cardsLearned||0);
    $('#streakStat').textContent = String(stats.streak||0);
  }

  // Navigation
  navButtons.forEach(b=> b.addEventListener('click', ()=> showView(b.dataset.view)) );

  // Import button placeholder
  $('#importBtn')?.addEventListener('click', ()=> alert('Import will be available soon.'));

  // Initial renders
  renderTasks('all');
  renderStats();
  showView('tasks');
})();