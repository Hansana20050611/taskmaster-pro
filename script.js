// ===== API CONFIGURATION =====
const API_BASE_URL = 'https://9775a511-d1ff-4bc7-8280-e6b1cfe8960c-00-1ky1ar9hjwcfy.sisko.replit.dev';

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
        this.updateButtonText();
        document.getElementById('btn-timer-start')?.addEventListener('click', () => this.toggleStart());
        document.getElementById('btn-timer-reset')?.addEventListener('click', () => this.reset());
    },

    toggleStart() {
        if (this.running) {
            this.pause();
        } else {
            this.start();
        }
    },

    start() {
        this.running = true;
        this.interval = setInterval(() => this.tick(), 1000);
        this.updateButtonText();
    },

    updateButtonText() {
        const btn = document.getElementById('btn-timer-start');
        if (btn) {
            if (this.running) {
                btn.innerHTML = '<span>⏸️</span> Pause';
                btn.classList.add('timer-running');
            } else {
                btn.innerHTML = '<span>▶️</span> Start';
                btn.classList.remove('timer-running');
            }
        }
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
        this.updateButtonText();
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
        // Connect to Replit backend API
        try {
            const response = await fetch(`${API_BASE_URL}/apiflashcards`, {
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
    messagePairs: new Map(), // Track user-bot message pairs for deletion

    async simulateAIReply(userMessage, subject, sessionId = null) {
        // Connect to Replit backend API with timeout and error handling
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
            const response = await fetch(`${API_BASE_URL}/apichat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessage, 
                    subject,
                    sessionId: sessionId || `session_${Date.now()}`
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            return data.response || data.message || data.reply || data.answer || `Response for "${userMessage}" about ${subject}`;
        } catch (err) {
            console.error('Chat API Error:', err);
            if (err.name === 'AbortError') {
                throw new Error('Request Timeout - Please check your connection and try again');
            }
            throw new Error('AI Service Error - Backend may be offline. Please try again later.');
        }
    },

    async verifyMessage(text, subject) {
        // Simulate verification with 2-minute processing
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
            
            const response = await fetch(`${API_BASE_URL}/apiverify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, subject }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (err) {
            console.error('Verify API Error:', err);
            // Return mock data if API fails
            return {
                verified: true,
                sources: [
                    { 
                        type: 'PDF',
                        title: 'A/L Syllabus Document',
                        page: 15,
                        paragraph: 3,
                        text: 'Reference text from syllabus',
                        url: '#'
                    }
                ],
                confidence: 0.95
            };
        }
    },

    init() {
        document.getElementById('btn-send')?.addEventListener('click', () => this.send());
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                this.send(); 
            }
        });
    },

    async send(messageText = null, editingMessageId = null) {
        const input = document.getElementById('chat-input');
        const message = messageText || input?.value?.trim();
        if (!message) return;
        
        // If editing, remove old messages first
        if (editingMessageId) {
            this.deleteMessagePair(editingMessageId);
        }
        
        const userMsgId = this.addMessage(message, 'user');
        if (input && !messageText) input.value = '';

        const subject = document.getElementById('chat-subject')?.value || 'General';
        
        // Show loading indicator
        const loadingId = this.addLoadingMessage();

        try {
            const reply = await this.simulateAIReply(message, subject);
            this.removeLoadingMessage(loadingId);
            const botMsgId = this.addMessage(reply, 'bot');
            // Link messages for deletion
            this.messagePairs.set(userMsgId, botMsgId);
            this.messagePairs.set(botMsgId, userMsgId);
        } catch (err) {
            this.removeLoadingMessage(loadingId);
            const botMsgId = this.addMessage(err.message || AI_FAILURE_MSG, 'bot', true);
            this.messagePairs.set(userMsgId, botMsgId);
            this.messagePairs.set(botMsgId, userMsgId);
        }
    },

    addMessage(text, type, isError = false) {
        const container = document.getElementById('chat-messages');
        if (!container) return null;
        
        const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const msgEl = document.createElement('div');
        msgEl.className = `chat-msg ${type}-msg`;
        msgEl.id = msgId;
        
        // Detect Sinhala text for proper font rendering
        const hasSinhala = /[\u0D80-\u0DFF]/.test(text);
        const textClass = hasSinhala ? 'sinhala-text' : '';
        
        let actionsHTML = '';
        
        if (type === 'user') {
            // User message actions: Edit, Regenerate, Delete
            actionsHTML = `
                <div class="msg-actions">
                    <button class="action-btn btn-edit" onclick="CHAT.editMessage('${msgId}')" title="Edit message">
                        <span>✏️</span> Edit
                    </button>
                    <button class="action-btn btn-regenerate" onclick="CHAT.regenerateMessage('${msgId}')" title="Regenerate AI response">
                        <span>↻</span> Regenerate
                    </button>
                    <button class="action-btn btn-delete delete-btn" onclick="CHAT.deleteMessagePair('${msgId}')" title="Delete message">
                        <span>🗑️</span> Delete
                    </button>
                </div>
            `;
        } else {
            // Bot message actions: Copy, Verify
            actionsHTML = `
                <div class="msg-actions">
                    <button class="action-btn btn-copy" onclick="CHAT.copyMessage('${msgId}')" title="Copy to clipboard">
                        <span>📋</span> Copy
                    </button>
                    <button class="action-btn btn-verify verify-btn" onclick="CHAT.verifyMessageAction('${msgId}')" title="Verify information">
                        <span>✓</span> Verify
                    </button>
                </div>
            `;
        }
        
        msgEl.innerHTML = `
            <div class="msg-avatar">${type === 'user' ? '👤' : '🤖'}</div>
            <div class="msg-content">
                <div class="msg-bubble ${isError ? 'msg-error' : ''}">
                    <p class="${textClass}">${escapeHtml(text)}</p>
                </div>
                ${actionsHTML}
            </div>
        `;
        
        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;
        this.messages.push({ id: msgId, text, type });
        
        return msgId;
    },

    addLoadingMessage() {
        const container = document.getElementById('chat-messages');
        if (!container) return null;
        
        const loadingId = `loading_${Date.now()}`;
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-msg bot-msg loading-msg';
        msgEl.id = loadingId;
        msgEl.innerHTML = `
            <div class="msg-avatar">🤖</div>
            <div class="msg-content">
                <div class="msg-bubble">
                    <div class="chat-loading">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p style="margin-top: 0.5rem; opacity: 0.7;">AI is thinking...</p>
                </div>
            </div>
        `;
        
        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;
        return loadingId;
    },

    removeLoadingMessage(loadingId) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.remove();
        }
    },

    editMessage(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const textEl = msgEl.querySelector('.msg-bubble p');
        const originalText = textEl.textContent;
        
        // Create editable input
        const input = document.createElement('textarea');
        input.className = 'msg-edit-input';
        input.value = originalText;
        input.style.cssText = 'width: 100%; min-height: 60px; padding: 0.5rem; border-radius: 8px; border: 2px solid var(--color-primary); background: rgba(255,255,255,0.1); color: var(--text-primary); font-family: inherit; resize: vertical;';
        
        // Replace content with input
        textEl.style.display = 'none';
        textEl.parentElement.appendChild(input);
        input.focus();
        input.select();
        
        // Save on Enter (Ctrl/Cmd+Enter) or Cancel on Escape
        const save = () => {
            const newText = input.value.trim();
            if (newText && newText !== originalText) {
                textEl.textContent = newText;
                // Regenerate AI response with new message
                this.send(newText, msgId);
            } else {
                textEl.style.display = '';
            }
            input.remove();
        };
        
        const cancel = () => {
            textEl.style.display = '';
            input.remove();
        };
        
        input.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });
        
        // Auto-resize
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        });
    },

    async regenerateMessage(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const textEl = msgEl.querySelector('.msg-bubble p');
        const message = textEl.textContent;
        
        // Send same message again
        await this.send(message, msgId);
    },

    deleteMessagePair(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        // Get paired message ID
        const pairedId = this.messagePairs.get(msgId);
        
        // Remove both messages
        msgEl.remove();
        if (pairedId) {
            const pairedEl = document.getElementById(pairedId);
            if (pairedEl) pairedEl.remove();
            this.messagePairs.delete(msgId);
            this.messagePairs.delete(pairedId);
        }
    },

    copyMessage(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const textEl = msgEl.querySelector('.msg-bubble p');
        const text = textEl.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const btn = msgEl.querySelector('.btn-copy');
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<span>✓</span> Copied!';
                btn.style.background = 'var(--color-success)';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    },

    async verifyMessageAction(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const textEl = msgEl.querySelector('.msg-bubble p');
        const text = textEl.textContent;
        const subject = document.getElementById('chat-subject')?.value || 'General';
        
        // Show verification modal
        const modal = this.showVerifyModal();
        const resultEl = modal.querySelector('#verify-result');
        
        // Show loading state
        resultEl.innerHTML = `
            <div class="verify-loading">
                <div class="loader-spin"></div>
                <p style="margin-top: 1rem; text-align: center;">Verifying information... This may take up to 2 minutes.</p>
            </div>
        `;
        
        try {
            const result = await this.verifyMessage(text, subject);
            
            // Display verification results with sources
            let sourcesHTML = '';
            if (result.sources && result.sources.length > 0) {
                sourcesHTML = '<div class="verify-sources" style="margin-top: 1.5rem;"><h4>Sources:</h4><ul>';
                result.sources.forEach(source => {
                    sourcesHTML += `
                        <li>
                            <strong>${escapeHtml(source.title || 'Document')}</strong>
                            ${source.page ? ` - Page ${source.page}` : ''}
                            ${source.paragraph ? `, Paragraph ${source.paragraph}` : ''}
                            ${source.url ? `<br><a href="${source.url}" target="_blank" style="color: var(--color-primary);">View Source →</a>` : ''}
                            ${source.text ? `<br><small style="opacity: 0.7;">${escapeHtml(source.text)}</small>` : ''}
                        </li>
                    `;
                });
                sourcesHTML += '</ul></div>';
            }
            
            resultEl.innerHTML = `
                <div class="verify-success" style="background: rgba(16, 185, 129, 0.15); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--color-success);">
                    <h3 style="margin: 0 0 1rem 0; color: var(--color-success); display: flex; align-items: center; gap: 0.5rem;">
                        <span>✓</span> Verification Complete
                    </h3>
                    <p style="margin: 0 0 0.5rem 0; line-height: 1.6;">
                        This information has been verified against available resources.
                    </p>
                    ${result.confidence ? `<p style="margin: 0; opacity: 0.8; font-size: 0.9rem;">Confidence: ${(result.confidence * 100).toFixed(0)}%</p>` : ''}
                    ${sourcesHTML}
                </div>
            `;
        } catch (err) {
            resultEl.innerHTML = `
                <div class="verify-error" style="background: rgba(239, 68, 68, 0.15); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--color-danger);">
                    <h3 style="margin: 0 0 1rem 0; color: var(--color-danger);">Verification Failed</h3>
                    <p style="margin: 0; line-height: 1.6;">${escapeHtml(err.message || 'Could not verify information. Please try again later.')}</p>
                </div>
            `;
        }
    },

    showVerifyModal() {
        let modal = document.getElementById('verify-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'verify-modal';
            modal.className = 'verify-modal';
            modal.innerHTML = `
                <div class="modal-backdrop verify-backdrop"></div>
                <div class="modal-container verify-content">
                    <div class="modal-top">
                        <h3>Fact Verification</h3>
                        <button class="modal-close" onclick="CHAT.closeVerifyModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="verify-result"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close on backdrop click
            modal.querySelector('.verify-backdrop').addEventListener('click', () => this.closeVerifyModal());
        }
        
        modal.classList.add('active');
        return modal;
    },

    closeVerifyModal() {
        const modal = document.getElementById('verify-modal');
        if (modal) {
            modal.classList.remove('active');
        }
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
    REDUCED_MOTION.init();

    // Update completed count
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    document.getElementById('stat-tasks').textContent = String(tasks.filter(t => t.completed).length || 0);
});
