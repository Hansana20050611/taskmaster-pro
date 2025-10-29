// TaskMaster Pro - Complete Backend API Integration
(function(){
  const CONFIG = {
    backendBase: 'https://taskmaster-backend-fixed.hmethmika2023.repl.co',
    endpoints: {
      health: '/health',
      chat: '/apichat',
      flashcards: '/apiflashcards',
    },
    frontendOrigin: 'https://hansanapro.netlify.app',
    requestTimeout: 20000,
  };

  const state = {
    initialized: false,
    backendOk: false,
    theme: localStorage.getItem('theme') || 'light',
    lang: localStorage.getItem('lang') || 'en',
    tasks: JSON.parse(localStorage.getItem('tasks')||'[]'),
  };

  function log(...args){ console.log('[TaskMaster]', ...args); }
  function notify(msg, type='info'){
    // simple toast via alert fallback
    try {
      const toast = document.createElement('div');
      toast.textContent = msg;
      toast.style.position='fixed';toast.style.right='12px';toast.style.bottom='12px';toast.style.background= type==='error'?'#b00020': type==='success'?'#2e7d32':'#333';toast.style.color='#fff';toast.style.padding='8px 12px';toast.style.borderRadius='6px';toast.style.zIndex='9999';toast.style.boxShadow='0 2px 8px rgba(0,0,0,0.2)';
      document.body.appendChild(toast);
      setTimeout(()=>toast.remove(), 2600);
    } catch(e){ console[type==='error'?'error':'log']('Notify:', msg); }
  }

  async function api(path, options={}){
    const url = CONFIG.backendBase + path;
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), CONFIG.requestTimeout);
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers||{});
    try {
      const res = await fetch(url, { ...options, headers, signal: ctrl.signal, mode:'cors', credentials:'omit' });
      clearTimeout(t);
      if(!res.ok){
        const text = await res.text().catch(()=>res.statusText);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const ct = res.headers.get('content-type')||'';
      if(ct.includes('application/json')) return await res.json();
      return await res.text();
    } catch(err){
      clearTimeout(t);
      throw err;
    }
  }

  async function healthCheck(){
    log('🔍 Testing backend connection...');
    try{
      const data = await api(CONFIG.endpoints.health);
      state.backendOk = !!data && (data.ok===true || data.status==='ok');
      if(state.backendOk){ log('✅ Backend connected'); notify('Backend connected', 'success'); }
      else { throw new Error('Health not ok'); }
    }catch(e){
      state.backendOk = false; log('❌ Backend offline:', e.message); notify('Backend offline. Start backend and allow CORS.', 'error');
    }
  }

  // UI bindings
  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

  function applyTheme(){
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem('theme', state.theme);
  }
  function toggleTheme(){ state.theme = state.theme==='light'?'dark':'light'; applyTheme(); }

  function applyLang(){ localStorage.setItem('lang', state.lang); }
  function toggleLang(){ state.lang = state.lang==='en'?'si':'en'; applyLang(); }

  // Chat
  async function sendChat(){
    const subjectSel = qs('#chat-subject');
    const input = qs('#chat-input');
    const out = qs('#chat-output');
    if(!subjectSel||!input||!out) return;
    const subject = subjectSel.value||'General';
    const prompt = input.value.trim();
    if(!prompt){ notify('Enter a question', 'error'); return; }
    out.insertAdjacentHTML('beforeend', `<div class="msg user">${escapeHtml(prompt)}</div>`);
    input.value='';
    try{
      if(!state.backendOk) await healthCheck();
      const res = await api(CONFIG.endpoints.chat, { method:'POST', body: JSON.stringify({ subject, prompt, lang: state.lang }) });
      const text = res && (res.answer||res.response||res.text||JSON.stringify(res));
      out.insertAdjacentHTML('beforeend', `<div class="msg ai">${escapeHtml(text)}</div>`);
      out.scrollTop = out.scrollHeight;
    }catch(e){
      log('Chat error', e); notify('Chat failed: '+e.message, 'error');
      out.insertAdjacentHTML('beforeend', `<div class="msg error">Error: ${escapeHtml(e.message)}</div>`);
    }
  }

  // Flashcards
  async function generateFlashcards(){
    const subjectSel = qs('#cards-subject');
    const topicEl = qs('#cards-topic');
    const list = qs('#cards-list');
    if(!subjectSel||!topicEl||!list) return;
    const subject = subjectSel.value||'General';
    const topic = topicEl.value.trim();
    if(!topic){ notify('Enter topic', 'error'); return; }
    list.innerHTML = '<li>Generating...</li>';
    try{
      if(!state.backendOk) await healthCheck();
      const res = await api(CONFIG.endpoints.flashcards, { method:'POST', body: JSON.stringify({ subject, topic, lang: state.lang }) });
      const cards = Array.isArray(res?.cards)?res.cards: res?.flashcards || [];
      if(!cards.length){ list.innerHTML = '<li>No cards returned</li>'; return; }
      list.innerHTML = '';
      cards.forEach(c=>{
        const li = document.createElement('li');
        li.className='card';
        li.innerHTML = `<div class="q">${escapeHtml(c.q||c.question||'')}</div><div class="a">${escapeHtml(c.a||c.answer||'')}</div>`;
        li.addEventListener('click', ()=> li.classList.toggle('show-answer'));
        list.appendChild(li);
      })
    }catch(e){
      log('Flashcards error', e); notify('Flashcards failed: '+e.message, 'error');
      list.innerHTML = `<li class="error">${escapeHtml(e.message)}</li>`;
    }
  }

  // Tasks basic local features (existing UI expected)
  function saveTasks(){ localStorage.setItem('tasks', JSON.stringify(state.tasks)); }
  function renderTasks(){
    const list = qs('#task-list');
    if(!list) return;
    list.innerHTML='';
    state.tasks.forEach((t,i)=>{
      const li = document.createElement('li');
      li.className = 'task'+(t.done?' done':'');
      li.innerHTML = `<input type="checkbox" ${t.done?'checked':''} data-i="${i}" class="t-toggle"/> <span>${escapeHtml(t.text)}</span> <button class="t-del" data-i="${i}">✕</button>`;
      list.appendChild(li);
    })
  }
  function attachTaskHandlers(){
    const form = qs('#task-form');
    const list = qs('#task-list');
    if(form){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const inp = qs('#task-input');
        const text = (inp?.value||'').trim();
        if(!text){ notify('Enter a task', 'error'); return; }
        state.tasks.push({ text, done:false, ts: Date.now() });
        inp.value=''; saveTasks(); renderTasks(); notify('Task added', 'success');
      });
    }
    if(list){
      list.addEventListener('click', (e)=>{
        const tgt = e.target;
        if(tgt.classList.contains('t-del')){
          const i = +tgt.dataset.i; state.tasks.splice(i,1); saveTasks(); renderTasks();
        } else if(tgt.classList.contains('t-toggle')){
          const i = +tgt.dataset.i; state.tasks[i].done = tgt.checked; saveTasks(); renderTasks();
        }
      })
    }
  }

  // Timer and stats minimal placeholders
  function initTimer(){ /* existing timer in HTML/CSS assumed */ }

  // Helpers
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

  function bindUI(){
    const chatBtn = qs('#chat-send'); if(chatBtn) chatBtn.addEventListener('click', sendChat);
    const chatInput = qs('#chat-input'); if(chatInput) chatInput.addEventListener('keydown', e=>{ if(e.key==='Enter'&& !e.shiftKey){ e.preventDefault(); sendChat(); }});
    const genBtn = qs('#cards-generate'); if(genBtn) genBtn.addEventListener('click', generateFlashcards);
    const themeBtn = qs('#toggle-theme'); if(themeBtn) themeBtn.addEventListener('click', toggleTheme);
    const langBtn = qs('#toggle-lang'); if(langBtn) langBtn.addEventListener('click', toggleLang);
    attachTaskHandlers();
  }

  async function init(){
    log('✅ TaskMaster Pro initializing...');
    applyTheme(); applyLang(); bindUI(); renderTasks(); initTimer();
    await healthCheck();
    state.initialized = true; log('✅ App initialized');
  }

  document.addEventListener('DOMContentLoaded', init);
})();