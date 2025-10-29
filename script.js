// TaskMaster Pro - Frontend logic
(function(){
  const root = document.documentElement;
  const themeToggle = createEl('#themeToggle');
  const navButtons = qsa('.nav-btn');
  const views = {
    tasks: byId('tasksView'),
    chat: byId('chatView')
  };
  // Elements - Tasks
  const taskInput = byId('taskInput');
  const addTaskBtn = byId('addTaskBtn');
  const tasksList = byId('tasksList');
  const emptyState = byId('emptyState');
  const filters = qsa('.filter-btn');
  const stats = {
    total: byId('totalTasks'),
    active: byId('activeTasks'),
    completed: byId('completedTasks')
  };
  // Elements - Chat
  const chatInput = byId('chatInput');
  const sendChatBtn = byId('sendChatBtn');
  const chatMessages = byId('chatMessages');

  // State
  let state = loadState() || { tasks: [], filter: 'all', theme: loadTheme() };
  applyTheme(state.theme);
  render();

  // Theme
  on('click', '#themeToggle', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(state.theme);
    persist();
  });
  function applyTheme(theme){
    const isLight = theme === 'light';
    root.classList.toggle('light', isLight);
    saveTheme(theme);
  }
  function loadTheme(){
    return localStorage.getItem('tm_theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  function saveTheme(t){ localStorage.setItem('tm_theme', t); }

  // Navigation
  navButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  function switchView(view){
    qsa('.view').forEach(v => v.classList.remove('active'));
    views[view].classList.add('active');
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === view));
  }

  // Tasks
  addTaskBtn?.addEventListener('click', addTaskFromInput);
  taskInput?.addEventListener('keydown', e => { if(e.key === 'Enter') addTaskFromInput(); });
  filters.forEach(f => f.addEventListener('click', () => { state.filter = f.dataset.filter; updateFilters(); renderTasks(); persist(); }));

  function addTaskFromInput(){
    const title = (taskInput.value || '').trim();
    if(!title) return;
    const task = { id: uid(), title, completed: false, createdAt: Date.now() };
    state.tasks.unshift(task);
    taskInput.value = '';
    renderTasks();
    persist();
  }
  function toggleTask(id){
    const t = state.tasks.find(x => x.id === id);
    if(t){ t.completed = !t.completed; renderTasks(); persist(); }
  }
  function deleteTask(id){
    state.tasks = state.tasks.filter(t => t.id !== id);
    renderTasks();
    persist();
  }
  function updateFilters(){
    filters.forEach(f => f.classList.toggle('active', f.dataset.filter === state.filter));
  }
  function filteredTasks(){
    if(state.filter === 'active') return state.tasks.filter(t => !t.completed);
    if(state.filter === 'completed') return state.tasks.filter(t => t.completed);
    return state.tasks;
  }
  function renderTasks(){
    updateFilters();
    const tasks = filteredTasks();
    tasksList.innerHTML = '';
    emptyState.style.display = state.tasks.length ? 'none' : 'flex';

    tasks.forEach(t => {
      const li = document.createElement('div');
      li.className = 'task-item' + (t.completed ? ' completed' : '');
      li.innerHTML = `
        <input type="checkbox" ${t.completed ? 'checked' : ''} aria-label="Toggle task" />
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-actions">
          <button class="btn done" aria-label="Mark done">${t.completed ? 'Undo' : 'Done'}</button>
          <button class="btn delete" aria-label="Delete">Delete</button>
        </div>
      `;
      const [checkbox, , actions] = li.children;
      checkbox.addEventListener('change', () => toggleTask(t.id));
      actions.children[0].addEventListener('click', () => toggleTask(t.id));
      actions.children[1].addEventListener('click', () => deleteTask(t.id));
      tasksList.appendChild(li);
    });

    // Stats
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const active = total - completed;
    stats.total.textContent = total;
    stats.active.textContent = active;
    stats.completed.textContent = completed;
  }

  // Chat
  sendChatBtn?.addEventListener('click', sendChat);
  chatInput?.addEventListener('keydown', e => { if(e.key === 'Enter') sendChat(); });
  function sendChat(){
    const text = (chatInput.value || '').trim();
    if(!text) return;
    appendMessage('user', text);
    chatInput.value = '';
    // Simple local helper responses; no backend dependency
    setTimeout(() => {
      const reply = aiReply(text);
      appendMessage('ai', reply);
    }, 400);
  }
  function appendMessage(sender, text){
    const wrap = document.createElement('div');
    wrap.className = 'message ' + (sender === 'ai' ? 'ai-message' : 'user-message');
    wrap.innerHTML = `
      <div class="message-avatar">${sender === 'ai' ? '🤖' : '🧑'}</div>
      <div class="message-content">${formatMessage(text)}</div>
    `;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function aiReply(input){
    const lower = input.toLowerCase();
    if(/breakdown|steps|how to/.test(lower)){
      return 'Here is a quick breakdown:\n1) Define the goal\n2) List tasks\n3) Prioritize\n4) Schedule\n5) Execute and review';
    }
    if(/tip|productivity|focus/.test(lower)){
      return 'Tip: Use the 25/5 Pomodoro cycle and batch similar tasks to reduce context switching.';
    }
    if(/time|plan|schedule/.test(lower)){
      return 'Try time blocking: group tasks into focused blocks with short breaks between.';
    }
    return 'I can help with task ideas, breakdowns, and productivity tips. Ask me anything!';
  }

  // Persistence
  function persist(){ localStorage.setItem('tm_state', JSON.stringify({ ...state })); }
  function loadState(){ try{ return JSON.parse(localStorage.getItem('tm_state')); } catch{ return null; } }

  // Utils
  function byId(id){ return document.getElementById(id); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function on(ev, sel, fn){ document.addEventListener(ev, e => { if(e.target && (e.target.matches(sel) || e.target.closest(sel))) fn(e); }); }
  function uid(){ return Math.random().toString(36).slice(2, 10); }
  function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
  function createEl(sel){ return document.querySelector(sel); }
  function formatMessage(t){
    // Basic formatting: newline to <br>, bullet points detection
    const esc = escapeHtml(t).replace(/\n/g, '<br>');
    return esc;
  }
})();
