// ===== LANGUAGE & TRANSLATION =====
const LANGUAGE = {
    current: localStorage.getItem('lang') || 'en',
    
    translations: {
        en: {
            'My Tasks': 'My Tasks',
            'New Task': 'New Task',
            'Flashcard Generator': 'Flashcard Generator',
            'AI Study Assistant': 'AI Study Assistant',
            'Your Progress': 'Your Progress',
            'Tasks': 'Tasks',
            'Generator': 'Generator',
            'Chat': 'Chat',
            'Timer': 'Timer',
            'Stats': 'Stats'
        },
        si: {
            'My Tasks': 'මගේ කාර්යයන්',
            'New Task': 'නව කාර්ය',
            'Flashcard Generator': 'ෆ්ලැෂ්කාඩ් ජනකය',
            'AI Study Assistant': 'AI අධ්‍යාපන ලේකම',
            'Your Progress': 'ඔබගේ ප්‍රගතිය',
            'Tasks': 'කාර්යයන්',
            'Generator': 'ජනකය',
            'Chat': 'සංවාදය',
            'Timer': 'ටයිමර්',
            'Stats': 'සංඛ්‍යාංකන'
        }
    },
    
    translate(key) {
        return this.translations[this.current]?.[key] || key;
    },
    
    setLanguage(lang) {
        this.current = lang;
        localStorage.setItem('lang', lang);
        this.updateDOM();
    },
    
    updateDOM() {
        document.querySelectorAll('[data-en]').forEach(el => {
            if (this.current === 'si' && el.dataset.si) {
                el.textContent = el.dataset.si;
            } else if (el.dataset.en) {
                el.textContent = el.dataset.en;
            }
        });
        
        // Update placeholders
        document.querySelectorAll('[data-si-placeholder]').forEach(el => {
            if (this.current === 'si' && el.dataset.siPlaceholder) {
                el.placeholder = el.dataset.siPlaceholder;
            } else if (el.dataset.enPlaceholder) {
                el.placeholder = el.dataset.enPlaceholder || el.placeholder;
            }
        });
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
        document.body.className = `${this.current}-theme`;
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
        // Hide all views
        document.querySelectorAll('.app-view').forEach(el => {
            el.classList.remove('active-view');
        });
        
        // Show selected view
        document.getElementById(`view-${tabName}`)?.classList.add('active-view');
        
        // Update nav buttons
        document.querySelectorAll('.dock-btn').forEach(btn => {
            btn.classList.remove('active-tab');
            btn.setAttribute('aria-selected', 'false');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active-tab');
                btn.setAttribute('aria-selected', 'true');
            }
        });
    },
    
    init() {
        document.querySelectorAll('.dock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
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
        if (this.circle) {
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
        if (this.running) {
            this.pause();
            return;
        }
        this.running = true;
        this.interval = setInterval(() => this.tick(), 1000);
    },
    
    tick() {
        this.remaining--;
        this.updateDisplay();
        if (this.remaining <= 0) {
            this.complete();
        }
    },
    
    updateDisplay() {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const textEl = document.getElementById('timer-text');
        if (textEl) {
            textEl.textContent = display;
        }
        
        // Update circle
        if (this.circle && this.circumference > 0) {
            const progress = 1 - (this.remaining / this.duration);
            const offset = this.circumference - (progress * this.circumference);
            this.circle.style.strokeDashoffset = offset;
        }
    },
    
    pause() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },
    
    reset() {
        this.pause();
        this.remaining = this.duration;
        this.updateDisplay();
    },
    
    complete() {
        this.pause();
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
        
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            document.getElementById('task-modal')?.classList.remove('active');
        });
        
        document.querySelector('.modal-cancel')?.addEventListener('click', () => {
            document.getElementById('task-modal')?.classList.remove('active');
        });
        
        document.getElementById('btn-save-task')?.addEventListener('click', () => {
            this.saveTask();
        });
        
        this.render();
    },
    
    saveTask() {
        const title = document.getElementById('inp-task-title')?.value;
        const desc = document.getElementById('inp-task-desc')?.value;
        const subject = document.getElementById('inp-task-subj')?.value;
        const priority = document.getElementById('inp-task-priority')?.value;
        
        if (!title) return;
        
        const task = {
            id: Date.now(),
            title,
            desc,
            subject,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.render();
        document.getElementById('task-modal')?.classList.remove('active');
        
        // Reset form
        document.getElementById('inp-task-title').value = '';
        document.getElementById('inp-task-desc').value = '';
    },
    
    render() {
        const container = document.getElementById('tasks-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.tasks.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;opacity:0.7;">No tasks yet. Create one!</p>';
            return;
        }
        
        this.tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            taskEl.innerHTML = `
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
                    <div class="task-meta">
                        <span class="task-subject">${task.subject}</span>
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                </div>
            `;
            container.appendChild(taskEl);
        });
        
        // Update stats
        const completed = this.tasks.filter(t => t.completed).length;
        document.getElementById('stat-tasks').textContent = completed;
    }
};

// ===== FLASHCARDS =====
const FLASHCARDS = {
    cards: [],
    
    init() {
        document.getElementById('btn-generate')?.addEventListener('click', () => {
            this.generate();
        });
    },
    
    generate() {
        const subject = document.getElementById('fc-subject')?.value;
        const topic = document.getElementById('fc-topic')?.value;
        const count = parseInt(document.getElementById('fc-count')?.value || '5');
        
        if (!topic) {
            alert('Please enter a topic');
            return;
        }
        
        // Show loading
        const overlay = document.getElementById('loader-overlay');
        if (overlay) overlay.style.display = 'flex';
        
        // Simulate AI generation (replace with actual API call)
        setTimeout(() => {
            this.cards = [];
            for (let i = 0; i < count; i++) {
                this.cards.push({
                    id: i + 1,
                    front: `${topic} - Concept ${i + 1}`,
                    back: `This is the explanation for concept ${i + 1} in ${subject}`
                });
            }
            this.render();
            if (overlay) overlay.style.display = 'none';
            document.getElementById('stat-cards').textContent = this.cards.length;
        }, 1500);
    },
    
    render() {
        const container = document.getElementById('cards-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'flashcard';
            cardEl.innerHTML = `
                <div class="fc-front">${card.front}</div>
                <div class="fc-back">${card.back}</div>
            `;
            cardEl.addEventListener('click', () => {
                cardEl.classList.toggle('flipped');
            });
            container.appendChild(cardEl);
        });
    }
};

// ===== CHAT =====
const CHAT = {
    messages: [],
    
    init() {
        document.getElementById('btn-send')?.addEventListener('click', () => {
            this.send();
        });
        
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });
    },
    
    send() {
        const input = document.getElementById('chat-input');
        const message = input?.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            this.addMessage('This is a simulated response. Replace with actual AI integration.', 'bot');
        }, 500);
    },
    
    addMessage(text, type) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        const msgEl = document.createElement('div');
        msgEl.className = `chat-msg ${type}-msg`;
        msgEl.innerHTML = `
            <div class="msg-avatar">${type === 'user' ? '👤' : '🤖'}</div>
            <div class="msg-bubble"><p>${text}</p></div>
        `;
        
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
    LANGUAGE.updateDOM();
    NAV.init();
    TIMER.init();
    TASKS.init();
    FLASHCARDS.init();
    CHAT.init();
    REDUCED_MOTION.init();
    
    // Language selector
    document.getElementById('lang-selector')?.addEventListener('change', (e) => {
        LANGUAGE.setLanguage(e.target.value);
    });
    
    // Update stats on load
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    document.getElementById('stat-tasks').textContent = tasks.filter(t => t.completed).length;
});
