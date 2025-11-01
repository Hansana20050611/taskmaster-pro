// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Reinitialize icons when content changes
    const observer = new MutationObserver(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

// Theme Management
const ThemeManager = {
    init() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        
        themeToggle?.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Update icon
            const icon = themeToggle.querySelector('i[data-lucide]');
            if (icon) {
                icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
          }
        }
      });
    }
};

// Tab Navigation
const TabManager = {
    init() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    },
    
    switchTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Show target tab
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        }
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('tab-active');
            btn.classList.add('tab-inactive');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('tab-inactive');
            activeBtn.classList.add('tab-active');
        }
    }
};

// Task Management
const TaskManager = {
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
    
    init() {
        document.getElementById('addTaskBtn')?.addEventListener('click', () => {
            document.getElementById('addTaskModal')?.classList.remove('hidden');
            document.getElementById('addTaskModal')?.classList.add('flex');
        });
        
        document.getElementById('cancelTaskBtn')?.addEventListener('click', () => {
            document.getElementById('addTaskModal')?.classList.add('hidden');
            document.getElementById('addTaskModal')?.classList.remove('flex');
        });
        
        document.getElementById('addTaskForm')?.addEventListener('submit', (e) => {
          e.preventDefault();
            this.addTask();
        });
        
        // Category filtering
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => {
                    b.classList.remove('active');
                    b.classList.remove('bg-primary');
                    b.classList.add('bg-gray-100', 'dark:bg-slate-700');
                });
                btn.classList.add('active', 'bg-primary', 'text-white');
                btn.classList.remove('bg-gray-100', 'dark:bg-slate-700', 'text-gray-700', 'dark:text-gray-300');
                
                const category = btn.getAttribute('data-category');
                this.filterTasks(category);
            });
        });
        
        this.render();
        this.updateStats();
    },
    
    addTask() {
        const title = document.getElementById('taskTitle')?.value;
        const description = document.getElementById('taskDescription')?.value;
        const subject = document.getElementById('taskSubject')?.value;
        const priority = document.getElementById('taskPriority')?.value;
        const dueDate = document.getElementById('taskDueDate')?.value;
        
        if (!title) return;
        
        const task = {
            id: Date.now(),
            title,
            description,
            subject,
            priority,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        
        // Reset form
        document.getElementById('addTaskForm')?.reset();
        document.getElementById('addTaskModal')?.classList.add('hidden');
        document.getElementById('addTaskModal')?.classList.remove('flex');
        
        this.render();
        this.updateStats();
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },
    
    filterTasks(category) {
        let filtered = this.tasks;
        if (category !== 'all') {
            filtered = this.tasks.filter(t => t.subject === category);
        }
        this.render(filtered);
    },
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            this.render();
            this.updateStats();
        }
    },
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.render();
        this.updateStats();
    },
    
    render(tasks = null) {
        const container = document.getElementById('tasksList');
        if (!container) return;
        
        const tasksToRender = tasks || this.tasks;
        
        if (tasksToRender.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i data-lucide="check-square" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p>No tasks yet. Create your first task!</p>
        </div>
      `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        container.innerHTML = tasksToRender.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="flex items-start gap-3">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="TaskManager.toggleTask(${task.id})"
                           class="mt-1 w-5 h-5 rounded border-gray-300">
                    <div class="flex-1">
                        <div class="task-title font-semibold ${task.completed ? 'line-through' : ''}">
                            ${task.title}
            </div>
                        ${task.description ? `<div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${task.description}</div>` : ''}
                        <div class="flex items-center gap-2 mt-2">
                            ${task.subject ? `<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">${task.subject}</span>` : ''}
                            ${task.priority ? `<span class="text-xs px-2 py-1 rounded ${
                                task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }">${task.priority}</span>` : ''}
                        </div>
                    </div>
                    <button onclick="TaskManager.deleteTask(${task.id})" 
                            class="text-red-500 hover:text-red-700">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
          </div>
        `).join('');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },
    
    updateStats() {
        const completed = this.tasks.filter(t => t.completed).length;
        document.getElementById('tasksCompletedStat').textContent = completed;
    }
};

// Flashcard Management
const FlashcardManager = {
    flashcards: JSON.parse(localStorage.getItem('flashcards') || '[]'),
    
    init() {
        document.getElementById('generateFlashcardsBtn')?.addEventListener('click', () => {
            this.generateFlashcards();
        });
        
        this.render();
    },
    
    async generateFlashcards() {
        const subject = document.getElementById('flashcardSubject')?.value;
        const topic = document.getElementById('flashcardTopic')?.value;
        const count = parseInt(document.getElementById('flashcardCount')?.value || '5');
        
        if (!subject || !topic) {
            this.showError('Please select a subject and enter a topic');
              return;
        }
        
        // Show loading
        document.getElementById('loadingModal')?.classList.remove('hidden');
        document.getElementById('loadingModal')?.classList.add('flex');
        
        try {
            const apiBase = window.TASKMASTER_API_BASE || '';
            const response = await fetch(`${apiBase}/api/generate-flashcards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, count })
            });
            
            if (!response.ok) throw new Error('Failed to generate flashcards');
            
            const data = await response.json();
            this.flashcards = data.flashcards || [];
            localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
            this.render();
            
            document.getElementById('flashcardsLearnedStat').textContent = this.flashcards.length;
        } catch (error) {
            // Fallback to mock data
            this.flashcards = Array.from({ length: count }, (_, i) => ({
                id: Date.now() + i,
                front: `${topic} - Concept ${i + 1}`,
                back: `This is the explanation for concept ${i + 1} in ${subject}`,
                subject,
                topic
            }));
            localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
            this.render();
        } finally {
            document.getElementById('loadingModal')?.classList.add('hidden');
            document.getElementById('loadingModal')?.classList.remove('flex');
        }
    },
    
    render() {
        const container = document.getElementById('flashcardsList');
        if (!container) return;
        
        if (this.flashcards.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i data-lucide="credit-card" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p>No flashcards yet. Generate some!</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        container.innerHTML = this.flashcards.map(card => `
            <div class="flashcard" onclick="this.classList.toggle('flipped')">
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <p class="font-semibold text-lg">${card.front}</p>
          </div>
                    <div class="flashcard-back">
                        <p>${card.back}</p>
        </div>
        </div>
          </div>
        `).join('');
    },
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal')?.classList.remove('hidden');
        document.getElementById('errorModal')?.classList.add('flex');
    }
};

// Chat Management
const ChatManager = {
    messages: JSON.parse(localStorage.getItem('chatMessages') || '[]'),
    
    init() {
        document.getElementById('sendChatBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });
        
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        if (this.messages.length === 0) {
            this.addMessage('Hello! I\'m your AI study assistant. Ask me anything about your subjects!', 'bot');
        }
        
        this.render();
    },
    
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input?.value.trim();
        
        if (!message) return;
        
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show loading
        const loadingMsg = this.addMessage('Thinking...', 'bot');
        
        try {
            const apiBase = window.TASKMASTER_API_BASE || '';
            const response = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) throw new Error('Failed to get response');
            
            const data = await response.json();
            this.removeMessage(loadingMsg);
            this.addMessage(data.response || 'I apologize, but I couldn\'t process your request.', 'bot');
        } catch (error) {
            this.removeMessage(loadingMsg);
            this.addMessage('I apologize, but I\'m having trouble right now. Please try again later.', 'bot');
        }
    },
    
    addMessage(text, type) {
        const id = Date.now();
        const message = { id, text, type, timestamp: new Date().toISOString() };
        this.messages.push(message);
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
        this.render();
        return id;
    },
    
    removeMessage(id) {
        this.messages = this.messages.filter(m => m.id !== id);
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
        this.render();
    },
    
    render() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = this.messages.map(msg => `
            <div class="chat-message ${msg.type}">
                <div class="message-content">
                    <p>${msg.text}</p>
                </div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    }
};

// Timer Management
const TimerManager = {
    duration: 25 * 60, // 25 minutes in seconds
    remaining: 25 * 60,
    isRunning: false,
    interval: null,
    circumference: 283,
    
    init() {
        document.getElementById('startTimerBtn')?.addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('pauseTimerBtn')?.addEventListener('click', () => {
            this.pause();
        });
        
        document.getElementById('resetTimerBtn')?.addEventListener('click', () => {
            this.reset();
        });
        
        this.updateDisplay();
    },
    
    start() {
        if (this.isRunning) {
            this.pause();
            return;
        }
        
        this.isRunning = true;
        document.getElementById('startTimerBtn')?.classList.add('hidden');
        document.getElementById('pauseTimerBtn')?.classList.remove('hidden');
        
        this.interval = setInterval(() => {
            this.remaining--;
            this.updateDisplay();
            
            if (this.remaining <= 0) {
                this.complete();
            }
        }, 1000);
    },
    
    pause() {
        this.isRunning = false;
        document.getElementById('startTimerBtn')?.classList.remove('hidden');
        document.getElementById('pauseTimerBtn')?.classList.add('hidden');
        
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
        alert('Session Complete! Take a break!');
        
        // Update stats
        const completed = parseInt(document.getElementById('sessionsCompleted')?.textContent || '0');
        document.getElementById('sessionsCompleted').textContent = completed + 1;
        
        // Reset for next session
        this.reset();
    },
    
    updateDisplay() {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = display;
        
        // Update progress circle
        const progress = (this.duration - this.remaining) / this.duration;
        const offset = this.circumference - (progress * this.circumference);
        document.getElementById('timerProgress').style.strokeDashoffset = offset;
    }
};

// Language Toggle
const LanguageManager = {
    current: localStorage.getItem('language') || 'en',
    
    init() {
        document.getElementById('languageToggle')?.addEventListener('click', () => {
            this.current = this.current === 'en' ? 'si' : 'en';
            localStorage.setItem('language', this.current);
            document.getElementById('languageToggle').querySelector('span').textContent = 
                this.current === 'en' ? 'EN' : 'SI';
        });
    }
};

// Error Modal
document.getElementById('closeErrorBtn')?.addEventListener('click', () => {
    document.getElementById('errorModal')?.classList.add('hidden');
    document.getElementById('errorModal')?.classList.remove('flex');
});

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    TabManager.init();
    TaskManager.init();
    FlashcardManager.init();
    ChatManager.init();
    TimerManager.init();
    LanguageManager.init();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
