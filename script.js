// TaskMaster Pro - Backend Integrated Logic
// Backend API base URL (Netlify function or external API)
const API_BASE = (window.NETLIFY_FUNCTIONS_BASE || '/.netlify/functions') + '/tasks';

// DOM Elements
const els = {
  spinner: document.getElementById('loadingSpinner'),
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toastMessage'),
  statusBar: document.getElementById('statusBar'),
  statusMsg: document.getElementById('statusMessage'),
  input: document.getElementById('taskInput'),
  priority: document.getElementById('prioritySelect'),
  category: document.getElementById('categorySelect'),
  addBtn: document.getElementById('addTaskBtn'),
  list: document.getElementById('tasksList'),
  empty: document.getElementById('emptyState'),
  syncBtn: document.getElementById('syncBtn'),
  themeToggle: document.getElementById('themeToggle'),
  sort: document.getElementById('sortSelect'),
  clearCompleted: document.getElementById('clearCompletedBtn'),
  counts: {
    all: document.getElementById('countAll'),
    active: document.getElementById('countActive'),
    completed: document.getElementById('countCompleted'),
  },
  stats: {
    total: document.getElementById('totalTasks'),
    completed: document.getElementById('completedTasks'),
    pending: document.getElementById('pendingTasks'),
    rate: document.getElementById('completionRate'),
  },
  filters: [...document.querySelectorAll('.filter-btn')],
  // Modal
  modal: document.getElementById('editModal'),
  closeModal: document.getElementById('closeModal'),
  saveEdit: document.getElementById('saveEdit'),
  cancelEdit: document.getElementById('cancelEdit'),
  editInput: document.getElementById('editTaskInput'),
  editPriority: document.getElementById('editPrioritySelect'),
  editCategory: document.getElementById('editCategorySelect'),
};

let state = {
  tasks: [],
  filter: 'all',
  editingId: null,
};

// Utilities
const show = (el) => el && el.classList.remove('hidden');
const hide = (el) => el && el.classList.add('hidden');
const withSpinner = async (fn) => { show(els.spinner); try { return await fn(); } finally { hide(els.spinner); } };
const toast = (msg) => { if(!els.toast||!els.toastMsg) return; els.toastMsg.textContent = msg; els.toast.classList.remove('hidden'); setTimeout(()=>els.toast.classList.add('hidden'), 2200); };
const status = (msg, t=2000) => { if(!els.statusBar||!els.statusMsg) return; els.statusMsg.textContent = msg; els.statusBar.classList.remove('hidden'); setTimeout(()=>els.statusBar.classList.add('hidden'), t); };

// Backend API helpers
async function api(path='', options={}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>res.statusText);
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

// CRUD
const fetchTasks = () => api('', { method: 'GET' });
const createTask = (data) => api('', { method: 'POST', body: JSON.stringify(data) });
const updateTask = (id, data) => api(`/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const deleteTask = (id) => api(`/${id}`, { method: 'DELETE' });
const deleteCompleted = () => api('/completed', { method: 'DELETE' });

function computeStats(tasks){
  const total = tasks.length;
  const completed = tasks.filter(t=>t.completed).length;
  const pending = total - completed;
  const rate = total ? Math.round((completed/total)*100) : 0;
  return { total, completed, pending, rate };
}

function updateStats(){
  const s = computeStats(state.tasks);
  if(els.stats.total) els.stats.total.textContent = s.total;
  if(els.stats.completed) els.stats.completed.textContent = s.completed;
  if(els.stats.pending) els.stats.pending.textContent = s.pending;
  if(els.stats.rate) els.stats.rate.textContent = `${s.rate}%`;
  if(els.counts.all) els.counts.all.textContent = s.total;
  if(els.counts.active) els.counts.active.textContent = s.pending;
  if(els.counts.completed) els.counts.completed.textContent = s.completed;
}

function render(){
  if(!els.list) return;
  els.list.innerHTML = '';
  const tasks = getFilteredSortedTasks();
  if(tasks.length===0){
    if(els.empty) els.empty.style.display = 'block';
    return;
  }
  if(els.empty) els.empty.style.display = 'none';

  for(const t of tasks){
    const item = document.createElement('div');
    item.className = 'task-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.className = 'checkbox'; cb.checked = !!t.completed;
    cb.addEventListener('change', async ()=>{
      try {
        await updateTask(t.id, { completed: cb.checked });
        t.completed = cb.checked;
        updateStats(); render();
        toast(cb.checked ? 'Task completed' : 'Task marked active');
      } catch(e){ toast('Failed to update task'); }
    });

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = t.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const tagPri = document.createElement('span');
    tagPri.className = `tag priority-${t.priority}`;
    tagPri.textContent = t.priority;
    const tagCat = document.createElement('span');
    tagCat.className = 'tag'; tagCat.textContent = t.category;
    const tagDate = document.createElement('span');
    tagDate.className = 'tag'; tagDate.textContent = new Date(t.createdAt||Date.now()).toLocaleString();
    meta.append(tagPri, tagCat, tagDate);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn'; editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', ()=>openEdit(t));

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn'; delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async ()=>{
      const prev = item.style.opacity; item.style.opacity = '.6';
      try { await deleteTask(t.id); state.tasks = state.tasks.filter(x=>x.id!==t.id); toast('Task deleted'); }
      catch(e){ toast('Delete failed'); }
      finally { item.style.opacity = prev; updateStats(); render(); }
    });

    const left = document.createElement('div');
    left.style.display='flex'; left.style.alignItems='center'; left.style.gap='10px';
    left.append(cb, title);

    item.append(left, meta, editBtn, delBtn);
    els.list.appendChild(item);
  }
}

function getFilteredSortedTasks(){
  let arr = [...state.tasks];
  if(state.filter==='active') arr = arr.filter(t=>!t.completed);
  if(state.filter==='completed') arr = arr.filter(t=>t.completed);
  const sort = els.sort?.value || 'date-desc';
  switch(sort){
    case 'date-asc': arr.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)); break;
    case 'priority': {
      const order = { high: 0, medium: 1, low: 2 };
      arr.sort((a,b)=> (order[a.priority]??3) - (order[b.priority]??3));
      break;
    }
    case 'name': arr.sort((a,b)=>a.title.localeCompare(b.title)); break;
    default: arr.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  }
  return arr;
}

function bindUI(){
  els.addBtn?.addEventListener('click', onAdd);
  els.input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') onAdd(); });
  els.clearCompleted?.addEventListener('click', async ()=>{
    try { await withSpinner(deleteCompleted); await hydrate(); toast('Cleared completed'); }
    catch(e){ toast('Failed clearing completed'); }
  });
  els.filters.forEach(btn=>btn.addEventListener('click', ()=>{
    els.filters.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    state.filter = btn.dataset.filter; render();
  }));
  els.sort?.addEventListener('change', ()=>render());
  els.syncBtn?.addEventListener('click', async ()=>{ await hydrate(true); });
  els.themeToggle?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('light');
  });
  // Modal
  els.closeModal?.addEventListener('click', closeEdit);
  els.cancelEdit?.addEventListener('click', closeEdit);
  els.saveEdit?.addEventListener('click', saveEditChanges);
}

function openEdit(task){
  state.editingId = task.id;
  if(els.editInput) els.editInput.value = task.title;
  if(els.editPriority) els.editPriority.value = task.priority;
  if(els.editCategory) els.editCategory.value = task.category;
  if(els.modal) els.modal.style.display = 'flex';
}
function closeEdit(){ state.editingId=null; if(els.modal) els.modal.style.display='none'; }

async function saveEditChanges(){
  if(!state.editingId) return closeEdit();
  const payload = {
    title: els.editInput?.value?.trim() || '',
    priority: els.editPriority?.value || 'medium',
    category: els.editCategory?.value || 'general',
  };
  if(!payload.title) { toast('Task title required'); return; }
  try {
    const t = await updateTask(state.editingId, payload);
    const idx = state.tasks.findIndex(x=>x.id===state.editingId);
    if(idx>-1) state.tasks[idx] = { ...state.tasks[idx], ...t };
    toast('Task updated'); closeEdit(); render();
  } catch(e){ toast('Failed to update'); }
}

async function onAdd(){
  const title = (els.input?.value||'').trim();
  if(!title) return toast('Please enter a task');
  const payload = {
    title,
    priority: els.priority?.value || 'medium',
    category: els.category?.value || 'general',
  };
  try {
    const created = await withSpinner(()=>createTask(payload));
    state.tasks.unshift(created);
    els.input.value = '';
    updateStats(); render(); toast('Task added');
  } catch(e){ toast('Failed to add task'); }
}

async function hydrate(showMsg=false){
  try {
    const data = await withSpinner(fetchTasks);
    state.tasks = Array.isArray(data) ? data : (data.tasks || []);
    updateStats(); render();
    if(showMsg) status('Synced with backend');
  } catch(e){
    status('Backend unreachable, using fallback');
    // Fallback to localStorage if backend not ready
    const local = JSON.parse(localStorage.getItem('tasks')||'[]');
    state.tasks = local;
    updateStats(); render();
  }
  // Persist locally for offline continuity
  localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

// Boot
(function init(){
  bindUI();
  hydrate();
})();
