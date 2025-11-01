// ===== LANGUAGE & TRANSLATION =====
const AI_FAILURE_MSG = 'Respond Failed ( AI සේවා දෝෂයක්. කරුණාකර පසුව නැවත උත්සාහ කරන්න. )';

const LANGUAGE = {
    current: localStorage.getItem('lang') || 'en',

    // The page uses data-en / data-si attributes. UpdateDOM will apply the right text.
    setLanguage(lang) {
        this.current = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.setAttribute('lang', lang);
        this.updateDOM();
        // Apply premium Sinhala font when Sinhala is selected
        if (lang === 'si') {
            document.body.setAttribute('lang', 'si');
            document.body.style.fontFamily = "'Noto Sans Sinhala', 'Noto Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial";
    } else {
            document.body.setAttribute('lang', 'en');
            document.body.style.fontFamily = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial";
        }
    },

    updateDOM() {
        document.querySelectorAll('[data-en]').forEach(el => {
            const en = el.dataset.en;
            const si = el.dataset.si;
            if (this.current === 'si' && si !== undefined) {
                el.textContent = si;
            } else if (en !== undefined) {
                el.textContent = en;
            }
        });

        // placeholders
        document.querySelectorAll('[data-si-placeholder]').forEach(el => {
            const si = el.dataset.siPlaceholder;
            if (this.current === 'si' && si !== undefined) el.placeholder = si;
        });
    },

    init() {
        // Initialize language selector
        const sel = document.getElementById('lang-selector');
        if (sel) {
            sel.value = this.current;
            sel.addEventListener('change', (e) => this.setLanguage(e.target.value));
        }
        // Set initial lang attribute
        document.documentElement.setAttribute('lang', this.current);
        document.body.setAttribute('lang', this.current);
        this.updateDOM();
        // apply font for current language
        if (this.current === 'si') {
            document.body.style.fontFamily = "'Noto Sans Sinhala', 'Noto Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial";
        }
    }
};

// ===== THEME MANAGEMENT =====
const THEME = {
    current: localStorage.getItem('theme') || 'dark',

    toggle() {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        this.apply();
        localStorage.setItem('theme', this.current);
    },

    apply() {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(this.current + '-theme');
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.textContent = this.current === 'dark' ? '🌙' : '☀️';
        }
    },

    init() {
        this.apply();
        document.getElementById('theme-btn')?.addEventListener('click', () => this.toggle());
    }
};

// ===== NAVIGATION =====
const NAV = {
    switchTab(tabName) {
        document.querySelectorAll('.app-view').forEach(el => el.classList.remove('active-view'));
        document.getElementById(`view-${tabName}`)?.classList.add('active-view');
        document.querySelectorAll('.dock-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
            btn.setAttribute('aria-selected', btn.dataset.tab === tabName ? 'true' : 'false');
        });
    },

    init() {
        document.querySelectorAll('.dock-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }
};

// ===== TIMER =====
const TIMER = {
    duration: 25 * 60,
    remaining: 25 * 60,
    running: false,
    interval: null,
    circle: null,
    circumference: 0,

    init() {
        this.circle = document.getElementById('timer-circle');
        if (this.circle && this.circle.r) {
            const radius = this.circle.r.baseVal.value;
            this.circumference = radius * 2 * Math.PI;
            this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            this.circle.style.strokeDashoffset = this.circumference;
        }
        this.updateDisplay();
        document.getElementById('btn-timer-start')?.addEventListener('click', () => this.start());
        document.getElementById('btn-timer-reset')?.addEventListener('click', () => this.reset());
    },

    start() {
        if (this.running) return this.pause();
        this.running = true;
        this.interval = setInterval(() => this.tick(), 1000);
    },

    tick() {
        this.remaining--;
        this.updateDisplay();
        if (this.remaining <= 0) this.complete();
    },

    updateDisplay() {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const textEl = document.getElementById('timer-text');
        if (textEl) textEl.textContent = display;

        if (this.circle && this.circumference > 0) {
            const progress = 1 - (this.remaining / this.duration);
            const offset = this.circumference - (progress * this.circumference);
            this.circle.style.strokeDashoffset = offset;
        }
    },

    pause() {
        this.running = false;
        if (this.interval) { clearInterval(this.interval); this.interval = null; }
    },

    reset() {
        this.pause();
        this.remaining = this.duration;
        this.updateDisplay();
    },

    complete() {
        this.pause();
        try { window.navigator.vibrate?.(200); } catch (e) {}
        alert('Session Complete!');
        this.reset();
    }
};

// ===== TASKS =====
const TASKS = {
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),

    init() {
        document.getElementById('btn-add-task')?.addEventListener('click', () => {
            document.getElementById('task-modal')?.classList.add('active');
        });

        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => btn?.addEventListener('click', () => {
            document.getElementById('task-modal')?.classList.remove('active');
        }));

        document.getElementById('btn-save-task')?.addEventListener('click', () => this.saveTask());
        this.render();
    },

    saveTask() {
        const titleEl = document.getElementById('inp-task-title');
        const descEl = document.getElementById('inp-task-desc');
        const subjEl = document.getElementById('inp-task-subj');
        const priorityEl = document.getElementById('inp-task-priority');
        const title = titleEl?.value?.trim();
        if (!title) return;

        const task = {
            id: Date.now(),
            title,
            desc: descEl?.value || '',
            subject: subjEl?.value || '',
            priority: priorityEl?.value || 'medium',
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this._save();
        document.getElementById('task-modal')?.classList.remove('active');
        if (titleEl) titleEl.value = '';
        if (descEl) descEl.value = '';
        this.render();
    },

    _save() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    },

    toggleComplete(id) {
        const t = this.tasks.find(x => x.id === id);
        if (!t) return;
        t.completed = !t.completed;
        this._save();
        this.render();
    },

    deleteTask(id) {
        this.tasks = this.tasks.filter(x => x.id !== id);
        this._save();
        this.render();
    },

    render() {
        const container = document.getElementById('tasks-list');
        if (!container) return;
        container.innerHTML = '';

        if (this.tasks.length === 0) {
            container.innerHTML = `<div class="empty-state"><p data-en="No tasks yet. Create one!" data-si="තවමත් කාර්යයක් නොමැත. එකක් නිර්මාණය කරන්න!">No tasks yet. Create one!</p></div>`;
            document.getElementById('stat-tasks').textContent = '0';
        return;
      }
      
        this.tasks.forEach(task => {
      const el = document.createElement('div');
            el.className = 'task-card';
      el.innerHTML = `
                <div class="task-card-main ${task.completed ? 'completed' : ''}">
                    <div class="task-checkbox-wrapper">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
        <div class="task-content">
                            <div class="task-title">${escapeHtml(task.title)}</div>
                            ${task.desc ? `<div class="task-desc">${escapeHtml(task.desc)}</div>` : ''}
          <div class="task-meta">
                                <span class="task-subject">${escapeHtml(task.subject)}</span>
                                <span class="task-priority priority-${task.priority}">${escapeHtml(task.priority)}</span>
          </div>
        </div>
                    </div>
        <div class="task-actions">
                        <button class="btn-task-action btn-complete" data-id="${task.id}" title="${task.completed ? (LANGUAGE.current === 'si' ? 'අහෝසි කරන්න' : 'Undo') : (LANGUAGE.current === 'si' ? 'සම්පූර්ණ කරන්න' : 'Complete')}">
                            ${task.completed ? '↩️' : '✅'}
          </button>
                        <button class="btn-task-action btn-delete" data-id="${task.id}" title="${LANGUAGE.current === 'si' ? 'මකන්න' : 'Delete'}">
                            🗑️
          </button>
        </div>
          </div>
        `;

            container.appendChild(el);
        });

        // attach listeners
        container.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.toggleComplete(Number(cb.dataset.id)));
        });
        container.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', () => this.toggleComplete(Number(btn.dataset.id)));
        });
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm(LANGUAGE.current === 'si' ? 'මෙම කාර්යය මකා දැමීමට අවශ්‍යද?' : 'Are you sure you want to delete this task?')) {
                    this.deleteTask(Number(btn.dataset.id));
                }
      });
    });
    
        const completed = this.tasks.filter(t => t.completed).length;
        document.getElementById('stat-tasks').textContent = String(completed);
    }
};

function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

// ===== FLASHCARDS =====
const FLASHCARDS = {
    cards: [],

    init() {
        document.getElementById('btn-generate')?.addEventListener('click', () => this.generate());
    },

    async simulateAIRequest({ subject, topic, count }) {
        // Connect to production backend API
        try {
            const response = await fetch('https://taskmaster-backend-fixed.hmethmika2023.repl.co/apiflashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, count })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            if (data.flashcards && Array.isArray(data.flashcards)) {
                return data.flashcards;
            } else if (Array.isArray(data)) {
                return data;
            } else if (data.cards && Array.isArray(data.cards)) {
                return data.cards;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Flashcard API Error:', err);
            // API failed, throw error to show failure message
            throw new Error('AI Service Error');
        }
    },

    async generate() {
        const subject = document.getElementById('fc-subject')?.value || 'General';
        const topic = document.getElementById('fc-topic')?.value?.trim();
        const count = parseInt(document.getElementById('fc-count')?.value || '5');

        const errEl = document.getElementById('generator-error');
        if (errEl) errEl.textContent = '';

        if (!topic) {
            if (errEl) errEl.textContent = (LANGUAGE.current === 'si') ? 'කරුණාකර මාතෘකාවක් ඇතුළත් කරන්න' : 'Please enter a topic';
            return;
        }

        const overlay = document.getElementById('loader-overlay');
        if (overlay) overlay.style.display = 'flex';

        try {
            const cards = await this.simulateAIRequest({ subject, topic, count });
            this.cards = cards;
            this.render();
            document.getElementById('stat-cards').textContent = String(this.cards.length);
            if (errEl) {
                errEl.style.display = 'none';
                errEl.textContent = '';
            }
        } catch (err) {
            if (errEl) {
                errEl.textContent = AI_FAILURE_MSG;
                errEl.style.display = 'block';
            }
        } finally {
            if (overlay) overlay.style.display = 'none';
        }
    },

    render() {
        const container = document.getElementById('cards-grid');
        if (!container) return;
        container.innerHTML = '';
        
        if (this.cards.length === 0) {
            container.innerHTML = '<div class="empty-state"><p data-en="No flashcards yet. Generate some!" data-si="තවමත් ෆ්ලැෂ් කාඩ්පත් නොමැත. එකක් නිර්මාණය කරන්න!">No flashcards yet. Generate some!</p></div>';
            LANGUAGE.updateDOM();
            return;
        }
        
        this.cards.forEach((card, index) => {
            // Handle different card formats from API
            const front = card.front || card.question || card.term || `Card ${index + 1}`;
            const back = card.back || card.answer || card.definition || card.explanation || '';
            
            const cardEl = document.createElement('div');
            cardEl.className = 'flashcard';
            cardEl.innerHTML = `<div class="fc-front">${escapeHtml(front)}</div><div class="fc-back">${escapeHtml(back)}</div>`;
            cardEl.addEventListener('click', () => cardEl.classList.toggle('flipped'));
            container.appendChild(cardEl);
        });
    }
};

// ===== CHAT =====
const CHAT = {
    messages: [],

    async simulateAIReply(userMessage, subject) {
        // Connect to production backend API
        try {
            const response = await fetch('https://taskmaster-backend-fixed.hmethmika2023.repl.co/apichat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, subject })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            return data.response || data.message || data.reply || data.answer || `Response for "${userMessage}" about ${subject}`;
        } catch (err) {
            console.error('Chat API Error:', err);
            // API failed, throw error to show failure message
            throw new Error('AI Service Error');
        }
    },

    init() {
        document.getElementById('btn-send')?.addEventListener('click', () => this.send());
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
        });
    },

    async send() {
        const input = document.getElementById('chat-input');
        const message = input?.value?.trim();
        if (!message) return;
        this.addMessage(message, 'user');
        if (input) input.value = '';

        const subject = document.getElementById('chat-subject')?.value || 'General';

        try {
            const reply = await this.simulateAIReply(message, subject);
            this.addMessage(reply, 'bot');
        } catch (err) {
            this.addMessage(AI_FAILURE_MSG, 'bot');
        }
    },

    addMessage(text, type) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const msgEl = document.createElement('div');
        msgEl.className = `chat-msg ${type}-msg`;
        msgEl.innerHTML = `<div class="msg-avatar">${type === 'user' ? '👤' : '🤖'}</div><div class="msg-bubble"><p>${escapeHtml(text)}</p></div>`;
        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;
        this.messages.push({ text, type });
    }
};

// ===== REDUCED MOTION =====
const REDUCED_MOTION = {
    init() {
        const btn = document.getElementById('reduce-motion-btn');
        btn?.addEventListener('click', () => {
            document.body.classList.toggle('reduce-motion');
            localStorage.setItem('reduceMotion', document.body.classList.contains('reduce-motion'));
        });
        
        if (localStorage.getItem('reduceMotion') === 'true') {
            document.body.classList.add('reduce-motion');
        }
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    THEME.init();
    LANGUAGE.init();
    NAV.init();
    TIMER.init();
    TASKS.init();
    FLASHCARDS.init();
    CHAT.init();

    // Reduced motion
    const rm = localStorage.getItem('reduceMotion') === 'true';
    if (rm) document.body.classList.add('reduce-motion');

    // Update completed count
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    document.getElementById('stat-tasks').textContent = String(tasks.filter(t => t.completed).length || 0);
});
