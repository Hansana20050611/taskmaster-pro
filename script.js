// TaskMaster Pro - Ultra-modern JS
(function(){
  'use strict';

  // Elements
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = {
    tasks: document.getElementById('tasks-section'),
    generator: document.getElementById('generator-section'),
    'ai-chat': document.getElementById('ai-chat-section'),
    timer: document.getElementById('timer-section'),
    stats: document.getElementById('stats-section'),
  };

  const themeToggle = document.getElementById('themeToggle');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');
  const taskCount = document.getElementById('taskCount');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const addTaskModal = document.getElementById('addTaskModal');
  const closeModalBtn = document.getElementById('closeModal');
  const cancelTaskBtn = document.getElementById('cancelTaskBtn');
  const saveTaskBtn = document.getElementById('saveTaskBtn');

  const taskTitle = document.getElementById('taskTitle');
  const taskDescription = document.getElementById('taskDescription');
  const taskCategoryModal = document.getElementById('taskCategoryModal');
  const taskPriorityModal = document.getElementById('taskPriorityModal');
  const taskDueDate = document.getElementById('taskDueDate');

  const generateTasksBtn = document.getElementById('generateTasksBtn');
  const generatedTasks = document.getElementById('generatedTasks');
  const taskCategory = document.getElementById('taskCategory');
  const taskPriority = document.getElementById('taskPriority');
  const numberOfTasks = document.getElementById('numberOfTasks');

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');

  const startTimerBtn = document.getElementById('startTimerBtn');
  const pauseTimerBtn = document.getElementById('pauseTimerBtn');
  const resetTimerBtn = document.getElementById('resetTimerBtn');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerProgress = document.getElementById('timerProgress');
  const sessionsTodayEl = document.getElementById('sessionsToday');

  const totalTasksEl = document.getElementById('totalTasks');
  const completedTasksEl = document.getElementById('completedTasks');
  const pendingTasksEl = document.getElementById('pendingTasks');
  const completionRateEl = document.getElementById('completionRate');
  const activityList = document.getElementById('activityList');

  // State
  let tasks = JSON.parse(localStorage.getItem('tm_tasks')||'[]');
  let filter = 'all';
  let timer = { total: 25*60, remaining: 25*60, running:false, interval:null, sessions: JSON.parse(localStorage.getItem('tm_sessions')||'0') };

  // Utilities
  const uid = () => Math.random().toString(36).slice(2,9);
  const saveTasks = () => localStorage.setItem('tm_tasks', JSON.stringify(tasks));
  const saveSessions = () => localStorage.setItem('tm_sessions', String(timer.sessions));
  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const addActivity = (text) => {
    const el = document.createElement('div');
    el.className = 'activity-item';
    el.textContent = `${new Date().toLocaleTimeString()} • ${text}`;
    activityList?.prepend(el);
  };

  // Tabs
  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelector('.tab-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      Object.values(sections).forEach(s=>s.classList.remove('active'));
      const key = btn.dataset.tab;
      sections[key]?.classList.add('active');
    });
  });

  // Theme
  const theme = localStorage.getItem('tm_theme')||'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle?.addEventListener('click', ()=>{
    const cur = document.documentElement.dataset.theme==='light'?'dark':'light';
    document.documentElement.dataset.theme = cur;
    localStorage.setItem('tm_theme', cur);
  });

  // Tasks UI
  function renderTasks(){
    taskList.innerHTML='';
    const filtered = tasks.filter(t=>filter==='all' || (filter==='active' && !t.completed) || (filter==='completed' && t.completed));
    filtered.forEach(t=>{
      const item = document.createElement('div');
      item.className = `task-item ${t.completed?'completed':''}`;
      item.innerHTML = `
        <input type="checkbox" ${t.completed?'checked':''} aria-label="Mark complete" />
        <div>
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            <span class="badge ${t.priority}">${t.priority}</span>
            <span class="badge">${t.category}</span>
            ${t.dueDate?`<span class="badge">Due ${new Date(t.dueDate).toLocaleDateString()}</span>`:''}
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn" data-action="edit" title="Edit"><i class="fa fa-pen"></i></button>
          <button class="icon-btn" data-action="delete" title="Delete"><i class="fa fa-trash"></i></button>
        </div>`;

      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change',()=>{
        t.completed = checkbox.checked;
        saveTasks();
        updateStats();
        addActivity(`${t.title} marked ${t.completed?'completed':'active'}`);
        renderTasks();
      });

      item.querySelector('[data-action="delete"]').addEventListener('click',()=>{
        tasks = tasks.filter(x=>x.id!==t.id);
        saveTasks();
        updateStats();
        addActivity(`Deleted task: ${t.title}`);
        renderTasks();
      });

      item.querySelector('[data-action="edit"]').addEventListener('click',()=>{
        openModal();
        taskTitle.value = t.title;
        taskDescription.value = t.description||'';
        taskCategoryModal.value = t.category;
        taskPriorityModal.value = t.priority;
        taskDueDate.value = t.dueDate||'';
        saveTaskBtn.dataset.editing = t.id;
      });

      taskList.appendChild(item);
    });

    taskCount.textContent = `${filtered.length} task${filtered.length!==1?'s':''}`;
  }

  filterBtns.forEach(b=>b.addEventListener('click',()=>{
    document.querySelector('.filter-btn.active')?.classList.remove('active');
    b.classList.add('active');
    filter = b.dataset.filter;
    renderTasks();
  }));

  function openModal(){ addTaskModal.classList.add('show'); }
  function closeModal(){ addTaskModal.classList.remove('show'); saveTaskBtn.removeAttribute('data-editing'); }

  addTaskBtn?.addEventListener('click', openModal);
  closeModalBtn?.addEventListener('click', closeModal);
  cancelTaskBtn?.addEventListener('click', closeModal);

  saveTaskBtn?.addEventListener('click',()=>{
    const title = taskTitle.value.trim();
    if(!title){ taskTitle.focus(); return; }
    const data = {
      id: saveTaskBtn.dataset.editing || uid(),
      title,
      description: taskDescription.value.trim(),
      category: taskCategoryModal.value,
      priority: taskPriorityModal.value,
      dueDate: taskDueDate.value || null,
      completed: false
    };

    if(saveTaskBtn.dataset.editing){
      tasks = tasks.map(t=> t.id===data.id ? {...t, ...data} : t);
      addActivity(`Updated task: ${data.title}`);
    } else {
      tasks.unshift(data);
      addActivity(`Added task: ${data.title}`);
    }

    saveTasks();
    updateStats();
    renderTasks();
    closeModal();
    taskTitle.value=''; taskDescription.value=''; taskDueDate.value='';
  });

  // Generator
  const samples = {
    work:["Reply to important emails","Plan sprint tasks","Review pull requests","Prepare meeting agenda","Document API endpoints"],
    personal:["Read 20 pages","Call a friend","Declutter desk","Plan weekly meals","Back up photos"],
    study:["Revise chapter notes","Practice 10 problems","Summarize lecture","Flashcards session","Watch tutorial"],
    health:["30-min workout","10k steps","Meditation 10 min","Prep healthy lunch","Sleep before 11pm"],
    finance:["Review budget","Track expenses","Pay bills","Check investments","Plan savings goals"],
  };

  function generateTasks(){
    const cat = taskCategory.value; const pr = taskPriority.value; const n = Math.max(1, Math.min(10, parseInt(numberOfTasks.value||'3',10)));
    generatedTasks.innerHTML='';
    const picks = [...samples[cat]];
    for(let i=0;i<n;i++){
      const title = picks[i%picks.length];
      const card = document.createElement('div');
      card.className = 'generated-card';
      card.innerHTML = `
        <div class="task-title">${title}</div>
        <div class="task-meta"><span class="badge ${pr}">${pr}</span><span class="badge">${cat}</span></div>
        <div class="task-actions"><button class="btn-primary add-generated">Add to Tasks</button></div>
      `;
      card.querySelector('.add-generated').addEventListener('click',()=>{
        const newTask = { id: uid(), title, description:'', category:cat, priority:pr, dueDate:null, completed:false };
        tasks.unshift(newTask);
        saveTasks(); updateStats(); renderTasks();
        addActivity(`Generated task added: ${title}`);
      });
      generatedTasks.appendChild(card);
    }
  }
  generateTasksBtn?.addEventListener('click', generateTasks);

  // Chat (mock AI)
  function pushMessage(text, role='user'){
    const wrap = document.createElement('div');
    wrap.className = `chat-message ${role==='ai'?'ai-message':'user-message'}`;
    wrap.innerHTML = `
      <div class="message-avatar">${role==='ai'?'<i class="fas fa-robot"></i>':'<i class="fas fa-user"></i>'}</div>
      <div class="message-content"><p>${text}</p></div>
    `;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function aiRespond(input){
    // Simple rule-based helper
    let reply = "Got it. I've updated your productivity feed.";
    if(/add .*task/i.test(input)) reply = "You can use 'Add Task' to quickly insert tasks.";
    else if(/timer|pomodoro/i.test(input)) reply = "Start the timer and choose presets like 25/15/5 minutes.";
    else if(/complete|done/i.test(input)) reply = "Mark tasks complete via the checkbox; stats update instantly.";
    else if(/generate/i.test(input)) reply = "Use the Generator tab to create tasks by category and priority.";
    setTimeout(()=>pushMessage(reply,'ai'), 400);
  }

  function sendChat(){
    const text = chatInput.value.trim();
    if(!text) return;
    pushMessage(text,'user');
    chatInput.value='';
    aiRespond(text);
    addActivity(`Chat: ${text}`);
  }
  sendMessageBtn?.addEventListener('click', sendChat);
  chatInput?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); sendChat(); }});
  clearChatBtn?.addEventListener('click', ()=>{ chatMessages.innerHTML=''; });

  // Timer
  const CIRC = 2*Math.PI*90; // r=90, matches CSS dasharray 565 approx
  function updateTimerUI(){
    timerDisplay.textContent = fmtTime(timer.remaining);
    const progress = 1 - (timer.remaining / timer.total);
    timerProgress.style.strokeDasharray = String(CIRC);
    timerProgress.style.strokeDashoffset = String(progress * CIRC);
  }

  function tick(){
    if(!timer.running) return;
    timer.remaining = Math.max(0, timer.remaining - 1);
    updateTimerUI();
    if(timer.remaining===0){
      stopTimer();
      timer.sessions += 1; saveSessions(); sessionsTodayEl.textContent = String(timer.sessions);
      addActivity('Timer session completed');
      new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=').play().catch(()=>{});
    }
  }

  function startTimer(){
    if(timer.running) return;
    timer.running = true;
    startTimerBtn.setAttribute('disabled','');
    pauseTimerBtn.removeAttribute('disabled');
    timer.interval = setInterval(tick, 1000);
  }
  function pauseTimer(){
    if(!timer.running) return;
    timer.running = false;
    startTimerBtn.removeAttribute('disabled');
    pauseTimerBtn.setAttribute('disabled','');
    clearInterval(timer.interval);
  }
  function stopTimer(){ pauseTimer(); timer.remaining = timer.total; updateTimerUI(); }
  function setPreset(min){ timer.total = min*60; timer.remaining = min*60; updateTimerUI(); }

  startTimerBtn?.addEventListener('click', startTimer);
  pauseTimerBtn?.addEventListener('click', pauseTimer);
  resetTimerBtn?.addEventListener('click', stopTimer);
  presetBtns.forEach(b=> b.addEventListener('click', ()=> setPreset(parseInt(b.dataset.minutes,10))));

  // Stats
  function updateStats(){
    const total = tasks.length;
    const completed = tasks.filter(t=>t.completed).length;
    const pending = total - completed;
    const rate = total? Math.round((completed/total)*100) : 0;
    totalTasksEl.textContent = String(total);
    completedTasksEl.textContent = String(completed);
    pendingTasksEl.textContent = String(pending);
    completionRateEl.textContent = `${rate}%`;
  }

  // Init
  renderTasks();
  updateStats();
  sessionsTodayEl.textContent = String(timer.sessions);
  updateTimerUI();
})();