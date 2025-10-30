// TaskMaster Pro - script.js (Ionicons + accessibility + logic fixes)
(() => {
  'use strict';

  // Helpers
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const ensureLive = () => {
    let el = qs('#aria-live');
    if (!el) {
      el = document.createElement('div');
      el.id = 'aria-live';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      Object.assign(el.style, { position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' });
      document.body.appendChild(el);
    }
    return el;
  };
  const announce = (msg) => { const el = ensureLive(); el.textContent = ''; setTimeout(() => el.textContent = msg, 10); };

  // Ionicons
  function ensureIonicons() {
    if (!qs('script[src*="ionicons.esm.js"],script[src*="ionicons.js"]')) {
      const m = document.createElement('script'); m.type = 'module'; m.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js'; document.head.appendChild(m);
      const n = document.createElement('script'); n.noModule = true; n.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js'; document.head.appendChild(n);
    }
  }
  function replaceIcons() {
    // Dock icons
    qsa('.bottom-dock .dock-btn').forEach(btn => {
      const emoji = btn.querySelector('.dock-emoji'); if (!emoji) return; emoji.textContent = '';
      const ic = document.createElement('ion-icon'); ic.setAttribute('aria-hidden', 'true');
      const map = { tasks: 'list-outline', generator: 'layers-outline', chat: 'chatbubbles-outline', timer: 'time-outline', stats: 'stats-chart-outline' };
      ic.name = map[btn.dataset.tab] || 'apps-outline'; emoji.appendChild(ic);
    });
    // Header + common buttons
    qsa('.header-actions .header-control, .btn-primary, .btn-secondary, .btn-timer, .btn-send-chat').forEach(btn => {
      if (btn.querySelector('ion-icon')) return;
      const ic = document.createElement('ion-icon'); ic.setAttribute('aria-hidden', 'true');
      const al = (btn.getAttribute('aria-label') || btn.title || '').toLowerCase();
      if (btn.id === 'btn-send') ic.name = 'send';
      else if (btn.id === 'btn-generate') ic.name = 'sparkles-outline';
      else if (btn.id === 'btn-add-task') ic.name = 'add-circle';
      else if (btn.id === 'btn-save-task') ic.name = 'save-outline';
      else if (al.includes('reduced motion')) ic.name = 'film-outline';
      else if (al.includes('reduced transparency')) ic.name = 'contrast-outline';
      else if (al.includes('language')) ic.name = 'language-outline';
      else if (al.includes('theme')) ic.name = 'moon';
      else ic.name = 'ellipse-outline';
      btn.prepend(ic);
    });
    // Chat avatar
    qsa('.msg-avatar').forEach(a => { if (!a.querySelector('ion-icon')) { a.textContent = ''; const i = document.createElement('ion-icon'); i.name = 'sparkles-outline'; a.appendChild(i); } });
    // Timer start/play icon
    const host = qs('#timer-btn-icon'); if (host && !host.querySelector('ion-icon')) { host.textContent=''; const i=document.createElement('ion-icon'); i.name='play'; host.appendChild(i); }
    // Modal close X keep text but add icon on cancel button
    qsa('.modal-cancel').forEach(b=>{ if(!b.querySelector('ion-icon')){ const i=document.createElement('ion-icon'); i.name='close-circle'; i.setAttribute('aria-hidden','true'); b.prepend(i);} });
  }

  // Tabs
  function showView(tab) {
    qsa('.app-view').forEach(v => v.classList.remove('active-view'));
    const target = qs('#view-' + tab); if (target) target.classList.add('active-view');
    qsa('.bottom-dock .dock-btn').forEach(b => { const act=b.dataset.tab===tab; b.classList.toggle('active-tab', act); b.setAttribute('aria-selected', String(act)); });
    announce(tab.charAt(0).toUpperCase()+tab.slice(1)+' tab active');
  }
  function initTabs() {
    qsa('.bottom-dock .dock-btn').forEach(btn => {
      btn.addEventListener('click', () => showView(btn.dataset.tab));
      btn.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); showView(btn.dataset.tab); }});
    });
  }

  // Modal
  function initModal() {
    const modal = qs('#task-modal'); if (!modal) return;
    const openBtn = qs('#btn-add-task'); const closeX = qs('#task-modal .modal-x'); const cancel = qs('#task-modal .modal-cancel');
    const backdrop = qs('#task-modal .modal-backdrop'); const container = qs('#task-modal .modal-container');
    const open = ()=>{ modal.classList.add('open'); container?.setAttribute('tabindex','-1'); container?.focus(); announce('Create task dialog opened'); };
    const close = ()=>{ modal.classList.remove('open'); announce('Dialog closed'); openBtn?.focus(); };
    openBtn?.addEventListener('click', open); closeX?.addEventListener('click', close); cancel?.addEventListener('click', close);
    backdrop?.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
    document.addEventListener('keydown', e=>{ if(modal.classList.contains('open') && e.key==='Escape') close(); });
  }

  // Theme/motion/transparency
  function initA11yToggles() {
    const root = document.body; const themeBtn = qs('#theme-btn'); const themeIconHost = qs('#theme-icon');
    const motionBtn = qs('#reduce-motion-btn'); const transBtn = qs('#reduce-transparency-btn');
    function syncThemeIcon(){ if(!themeIconHost) return; themeIconHost.innerHTML=''; const i=document.createElement('ion-icon'); i.name=root.classList.contains('dark-theme')?'moon':'sunny'; i.setAttribute('aria-hidden','true'); themeIconHost.appendChild(i);}    
    // init from storage
    const saved = localStorage.getItem('app-theme');
    if (saved==='light') { root.classList.remove('dark-theme'); root.classList.add('light-theme'); } else { root.classList.add('dark-theme'); root.classList.remove('light-theme'); }
    syncThemeIcon();
    themeBtn?.addEventListener('click', ()=>{ root.classList.toggle('dark-theme'); root.classList.toggle('light-theme'); localStorage.setItem('app-theme', root.classList.contains('dark-theme')?'dark':'light'); syncThemeIcon(); announce('Theme changed'); });
    motionBtn?.addEventListener('click', ()=>{ const on=root.classList.toggle('reduced-motion'); motionBtn.setAttribute('aria-pressed', String(on)); announce(on?'Reduced motion on':'Reduced motion off'); });
    transBtn?.addEventListener('click', ()=>{ const on=root.classList.toggle('reduced-transparency'); transBtn.setAttribute('aria-pressed', String(on)); announce(on?'Reduced transparency on':'Reduced transparency off'); });
  }

  // Flashcards
  function renderCards(cards){ const grid=qs('#cards-grid'); if(!grid) return; grid.innerHTML=''; cards.forEach(c=>{ const d=document.createElement('div'); d.className='flashcard'; d.innerHTML=`<div class="fc-front">${c.q}</div><div class="fc-back">${c.a}</div>`; d.tabIndex=0; const flip=()=>d.classList.toggle('flipped'); d.addEventListener('click',flip); d.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); flip(); }}); grid.appendChild(d); }); }
  function initGenerator(){ const subj=qs('#fc-subject'); const topic=qs('#fc-topic'); const count=qs('#fc-count'); const btn=qs('#btn-generate'); btn?.addEventListener('click',()=>{ const n=parseInt(count?.value||'5',10); const t=(topic?.value||'').trim()||'General'; const s=subj?.value||'General'; const base=[{q:`${s}: ${t} - Key concept?`,a:'Definition and core idea.'},{q:`${s}: ${t} - Example?`,a:'Real world application.'},{q:`${s}: ${t} - Formula?`,a:'Important relationship.'},{q:`${s}: ${t} - Pitfall?`,a:'Common mistake.'},{q:`${s}: ${t} - Memory trick?`,a:'Mnemonic.'},]; const cards=Array.from({length:n},(_,i)=>base[i%base.length]); renderCards(cards); announce(`${n} flashcards generated`); const stat=qs('#stat-cards'); if(stat) stat.textContent=String((parseInt(stat.textContent||'0',10)||0)+n); }); }

  // Chat
  function initChat(){ const input=qs('#chat-input'); const send=qs('#btn-send'); const messages=qs('#chat-messages'); function addMsg(text,role='user'){ const wrap=document.createElement('div'); wrap.className=`chat-msg ${role==='user'?'user-msg':'bot-msg'}`; wrap.innerHTML=`<div class="msg-avatar"><ion-icon name="${role==='user'?'person-circle':'sparkles-outline'}"></ion-icon></div><div class="msg-bubble"><p>${text}</p></div>`; messages?.appendChild(wrap); messages?.scrollTo({top:messages.scrollHeight,behavior:'smooth'}); }
    function reply(t){ addMsg(t,'user'); setTimeout(()=>addMsg('Thanks! I will help with: '+t,'bot'),300); }
    send?.addEventListener('click',()=>{ const v=(input?.value||'').trim(); if(!v) return; input.value=''; reply(v); });
    input?.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); const v=(input?.value||'').trim(); if(!v) return; input.value=''; reply(v);} }); }

  // Tasks
  function initTasks(){ const list=qs('#tasks-list'); const addBtn=qs('#btn-add-task'); const saveBtn=qs('#btn-save-task'); const title=qs('#inp-task-title'); const desc=qs('#inp-task-desc'); const subj=qs('#inp-task-subj'); const prio=qs('#inp-task-priority');
    function render(){ if(!list) return; const items=JSON.parse(localStorage.getItem('app-tasks')||'[]'); list.innerHTML=''; items.forEach((t,idx)=>{ const el=document.createElement('div'); el.className='task-item'; el.innerHTML=`<div class="task-title">${t.title}</div><div class="task-meta">${t.subject} • ${t.priority}</div><button class="btn-secondary task-del" aria-label="Delete task ${t.title}"><ion-icon name="trash-outline"></ion-icon></button>`; el.querySelector('.task-del')?.addEventListener('click',()=>{ const arr=JSON.parse(localStorage.getItem('app-tasks')||'[]'); arr.splice(idx,1); localStorage.setItem('app-tasks',JSON.stringify(arr)); render(); announce('Task deleted'); const stat=qs('#stat-tasks'); if(stat) stat.textContent=String(Math.max(0,(parseInt(stat.textContent||'0',10)||0)-1)); }); list.appendChild(el); }); }
    saveBtn?.addEventListener('click',()=>{ const t=(title?.value||'').trim(); if(!t){ announce('Please provide a task title'); return; } const d=(desc?.value||'').trim(); const s=subj?.value||'general'; const p=prio?.value||'medium'; const arr=JSON.parse(localStorage.getItem('app-tasks')||'[]'); arr.push({title:t,desc:d,subject:s,priority:p,done:false}); localStorage.setItem('app-tasks',JSON.stringify(arr)); render(); announce('Task saved'); qs('#task-modal')?.classList.remove('open'); const stat=qs('#stat-tasks'); if(stat) stat.textContent=String((parseInt(stat.textContent||'0',10)||0)+1); });
    addBtn?.addEventListener('click',()=>{ if(title) title.value=''; if(desc) desc.value=''; });
    render(); }

  // Timer
  function initTimer(){ const circle=qs('#timer-circle'); const text=qs('#timer-text'); const start=qs('#btn-timer-start'); const reset=qs('#btn-timer-reset'); const btnIcon=qs('#timer-btn-icon'); const btnText=qs('#timer-btn-text'); const trackLen=2*Math.PI*85; if(circle) circle.style.strokeDasharray=String(trackLen);
    let total=25*60; let secs=total; let running=false; let loop;
    const setIcon=(name)=>{ if(btnIcon){ btnIcon.innerHTML=''; const i=document.createElement('ion-icon'); i.name=name; btnIcon.appendChild(i);} };
    const fmt=(s)=>{ const m=Math.floor(s/60); const r=s%60; return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; };
    const draw=()=>{ if(!circle) return; const p=1-(secs/total); circle.style.strokeDashoffset=String(p*trackLen); };
    const render=()=>{ if(text) text.textContent=fmt(secs); draw(); };
    const tick=()=>{ secs--; render(); if(secs<=0){ clearInterval(loop); running=false; setIcon('play'); btnText && (btnText.textContent='Start'); announce('Session complete'); } };
    const toggle=()=>{ if(running){ clearInterval(loop); running=false; setIcon('play'); btnText && (btnText.textContent='Start'); announce('Timer paused'); } else { running=true; setIcon('pause'); btnText && (btnText.textContent='Pause'); announce('Timer started'); loop=setInterval(tick,1000);} };
    const resetAll=()=>{ clearInterval(loop); running=false; secs=total; setIcon('play'); btnText&&(btnText.textContent='Start'); render(); announce('Timer reset'); };
    start?.addEventListener('click', toggle); reset?.addEventListener('click', resetAll);
    render(); }

  function init() {
    ensureLive(); ensureIonicons(); replaceIcons(); initTabs(); initModal(); initA11yToggles(); initGenerator(); initChat(); initTasks(); initTimer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
