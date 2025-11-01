// TaskMaster Pro - Comprehensive Script with All Fixes
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
      Object.assign(el.style, { 
        position: 'absolute', 
        left: '-9999px', 
        width: '1px', 
        height: '1px', 
        overflow: 'hidden' 
      });
      document.body.appendChild(el);
    }
    return el;
  };

  const announce = (msg) => { 
    const el = ensureLive(); 
    el.textContent = ''; 
    setTimeout(() => el.textContent = msg, 10); 
  };

  // Ensure Ionicons are loaded - ENHANCED
  function ensureIonicons() {
    // Check if already loaded
    const existingScript = qs('script[src*="ionicons.esm.js"],script[src*="ionicons.js"]');
    if (existingScript) {
      return;
    }

    // Load ES module version
    const moduleScript = document.createElement('script'); 
    moduleScript.type = 'module'; 
    moduleScript.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
    moduleScript.onerror = () => {
      console.warn('Ionicons ES module failed, trying fallback');
    };
    document.head.appendChild(moduleScript);

    // Load nomodule fallback
    const nomoduleScript = document.createElement('script'); 
    nomoduleScript.noModule = true; 
    nomoduleScript.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js';
    document.head.appendChild(nomoduleScript);

    // Force define if customElements is available
    if (window.customElements && !window.customElements.get('ion-icon')) {
      // Wait a bit for the script to load
      setTimeout(() => {
        if (window.defineIonIcon) {
          window.defineIonIcon();
        }
      }, 100);
    }
  }

  // Wait for Ionicons to be ready - ENHANCED with better detection
  function waitForIonicons(callback, maxAttempts = 100) {
    // Check multiple ways Ionicons might be ready
    const isReady = () => {
      // Method 1: Check if custom element is defined
      if (window.customElements && window.customElements.get('ion-icon')) {
        return true;
      }
      // Method 2: Check if ion-icon elements have shadowRoot (loaded)
      const testIcon = qs('ion-icon');
      if (testIcon && testIcon.shadowRoot) {
        return true;
      }
      // Method 3: Check if defineIonIcon function exists
      if (window.defineIonIcon && typeof window.defineIonIcon === 'function') {
        return true;
      }
      return false;
    };

    if (isReady()) {
      if (callback) callback();
      return;
    }

    if (maxAttempts > 0) {
      setTimeout(() => waitForIonicons(callback, maxAttempts - 1), 50);
    } else {
      // If still not ready after max attempts, call callback anyway
      console.warn('Ionicons took longer than expected to load');
      if (callback) callback();
    }
  }

  // Force render all icons immediately
  function forceRenderIcons() {
    qsa('ion-icon').forEach(icon => {
      // Ensure each icon has proper attributes
      if (!icon.getAttribute('aria-hidden')) {
        const parent = icon.closest('[aria-label]');
        if (!parent || parent.querySelector('[aria-label]') !== icon) {
          icon.setAttribute('aria-hidden', 'true');
        }
      }
      
      // Ensure icon has name attribute
      if (!icon.getAttribute('name') && icon.textContent) {
        // Try to extract name from class or data attribute
        const name = icon.dataset.icon || icon.className.match(/icon-(\w+)/)?.[1];
        if (name) icon.setAttribute('name', name);
      }
      
      // Force re-render by toggling visibility (triggers browser reflow)
      const originalDisplay = icon.style.display;
      icon.style.display = 'none';
      icon.offsetHeight; // Force reflow
      icon.style.display = originalDisplay || '';
    });
    
    // Log icon status for debugging
    const iconCount = qsa('ion-icon').length;
    const renderedCount = qsa('ion-icon').filter(i => i.shadowRoot || i.querySelector('svg')).length;
    if (iconCount > 0 && renderedCount < iconCount) {
      console.log(`Icons: ${renderedCount}/${iconCount} rendered`);
    }
  }

  // Tab Management - STABLE: Only ONE Tab Visible at a Time
  function initTabs() {
    const tabs = qsa('[role="tab"]');
    const panels = qsa('[role="tabpanel"]');
    let isTransitioning = false;

    // STABLE TAB SWITCHING - ONE ACTIVE AT A TIME
    const switchTab = (tabName) => {
      if (isTransitioning) return;
      isTransitioning = true;

      // Step 1: Hide ALL views - FORCE HIDE
      panels.forEach(view => {
        view.classList.remove('active-view');
        view.style.display = 'none';
        view.setAttribute('aria-hidden', 'true');
        view.hidden = true;
      });

      // Step 2: Show ONLY selected view
      const targetView = document.getElementById(`view-${tabName}`);
      if (targetView) {
        targetView.classList.add('active-view');
        targetView.style.display = 'block';
        targetView.setAttribute('aria-hidden', 'false');
        targetView.hidden = false;
      }

      // Step 3: Update dock buttons
      tabs.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
        btn.tabIndex = -1;
      });

      const activeBtn = document.getElementById(`tab-${tabName}`);
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
        activeBtn.tabIndex = 0;
      }

      // Announce to screen reader
      announce(`Switched to ${tabName} tab`);

      // Final verification - force hide any stray visible panels
      setTimeout(() => {
        panels.forEach(p => {
          if (p.id !== `view-${tabName}` && !p.classList.contains('active-view')) {
            p.style.display = 'none';
            p.hidden = true;
            p.setAttribute('aria-hidden', 'true');
          }
        });
        isTransitioning = false;
      }, 100);
    };

    const selectTab = (tabId, tabElement) => {
      // Extract tab name from ID (view-generator -> generator)
      const tabName = tabId.replace('view-', '');
      switchTab(tabName);
    };

    // ATTACH TAB LISTENERS - ONCE ONLY (prevent duplicates)
    tabs.forEach(t => {
      // Remove any existing listeners by cloning
      const newTab = t.cloneNode(true);
      t.parentNode.replaceChild(newTab, t);
      
      newTab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tabId = newTab.getAttribute('aria-controls');
        if (tabId) {
          // Map aria-controls to view ID correctly
          const tabName = tabId.replace('view-', '');
          switchTab(tabName);
        } else {
          // Fallback: extract from button ID (tab-tasks -> tasks)
          const btnId = newTab.id;
          if (btnId) {
            const tabName = btnId.replace('tab-', '');
            switchTab(tabName);
          }
        }
      });

      // Keyboard navigation
      newTab.addEventListener('keydown', (e) => {
        const allTabs = qsa('[role="tab"]');
        const i = allTabs.indexOf(newTab);
        let nextTab = null;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          nextTab = allTabs[(i + 1) % allTabs.length];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          nextTab = allTabs[(i - 1 + allTabs.length) % allTabs.length];
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextTab = allTabs[0];
        } else if (e.key === 'End') {
          e.preventDefault();
          nextTab = allTabs[allTabs.length - 1];
        }

        if (nextTab) {
          nextTab.focus();
          const tabId = nextTab.getAttribute('aria-controls');
          if (tabId) {
            const tabName = tabId.replace('view-', '');
            switchTab(tabName);
          }
        }
      });
    });

    // Initialize: Start with Generator tab visible (CRITICAL)
    switchTab('generator');
  }

  // Modal with Focus Trapping
  function initModal() {
    const modal = qs('#task-modal');
    const openBtn = qs('#btn-add-task');
    const closeBtn = qs('#modal-close');
    const cancelBtn = qs('.modal-cancel');
    const backdrop = qs('.modal-backdrop');
    const saveBtn = qs('#btn-save-task');
    
    if (!modal) return;

    let previousFocus = null;
    let modalFocusables = null;

    const getFocusables = () => {
      return qsa(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        modal
      ).filter(el => !el.disabled && !el.hidden);
    };

    const trapFocus = (e) => {
      if (!modal.classList.contains('open')) return;

      if (e.key === 'Tab') {
        if (!modalFocusables) modalFocusables = getFocusables();
        if (modalFocusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = modalFocusables[0];
        const last = modalFocusables[modalFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    const open = () => {
      previousFocus = document.activeElement;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      
      // Reset form
      const title = qs('#inp-task-title');
      const desc = qs('#inp-task-desc');
      if (title) title.value = '';
      if (desc) desc.value = '';

      modalFocusables = getFocusables();
      const first = modalFocusables[0];
      if (first) {
        setTimeout(() => first.focus(), 100);
      }

      announce('Task creation dialog opened');
      document.addEventListener('keydown', trapFocus);
    };

    const close = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', trapFocus);
      modalFocusables = null;

      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
      
      announce('Dialog closed');
    };

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    saveBtn?.addEventListener('click', close);

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    // Escape key handler - CRITICAL FIX
    const escapeHandler = (e) => {
      if (modal.classList.contains('open') && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    
    document.addEventListener('keydown', escapeHandler);
    
    // Cleanup on modal close
    const originalClose = close;
    close = () => {
      document.removeEventListener('keydown', escapeHandler);
      originalClose();
    };
  }

  // Theme and Accessibility Toggles
  function initA11yToggles() {
    const root = document.body;
    const themeBtn = qs('#theme-btn');
    const themeIcon = qs('#theme-icon');
    const motionBtn = qs('#reduce-motion-btn');
    const transBtn = qs('#reduce-transparency-btn');

    function syncThemeIcon() {
      if (!themeIcon) return;
      waitForIonicons(() => {
        themeIcon.innerHTML = '';
        const icon = document.createElement('ion-icon');
        icon.name = root.classList.contains('dark-theme') ? 'moon-outline' : 'sunny-outline';
        icon.setAttribute('aria-hidden', 'true');
        themeIcon.appendChild(icon);
      });
    }

    // System-level theme detection FIRST
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Initialize from storage or system preference
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'light') {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      // No saved preference - use system preference
      if (systemPrefersDark) {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
        localStorage.setItem('app-theme', 'dark');
      } else {
        root.classList.remove('dark-theme');
        root.classList.add('light-theme');
        localStorage.setItem('app-theme', 'light');
      }
    }

    const savedMotion = localStorage.getItem('reduce-motion') === 'true';
    const savedTrans = localStorage.getItem('reduce-transparency') === 'true';
    
    if (savedMotion) root.classList.add('reduce-motion');
    if (savedTrans) {
      root.classList.add('reduce-transparency');
      root.setAttribute('data-reduce-transparency', 'true');
    }

    syncThemeIcon();
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('app-theme')) {
          // Only auto-switch if user hasn't manually set a preference
          if (e.matches) {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
            localStorage.setItem('app-theme', 'dark');
          } else {
            root.classList.remove('dark-theme');
            root.classList.add('light-theme');
            localStorage.setItem('app-theme', 'light');
          }
          syncThemeIcon();
          announce('Theme changed to match system preference');
        }
      });
    }

    // STABLE THEME MANAGEMENT - NO LOOPS
    let isTogglingTheme = false;
    
    const toggleTheme = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (isTogglingTheme) return; // Prevent rapid re-triggering
      
      isTogglingTheme = true;
      
      const isDark = root.classList.contains('dark-theme');
      
      if (isDark) {
        root.classList.remove('dark-theme');
        root.classList.add('light-theme');
        localStorage.setItem('app-theme', 'light');
      } else {
        root.classList.remove('light-theme');
        root.classList.add('dark-theme');
        localStorage.setItem('app-theme', 'dark');
      }
      
      // Update icon
      syncThemeIcon();
      
      // Announce to screen reader
      announce(`Theme changed to ${isDark ? 'Light' : 'Dark'} mode`);
      
      // Reset flag after a brief delay
      setTimeout(() => {
        isTogglingTheme = false;
      }, 300);
    };

    // Remove any existing listeners and attach fresh one
    if (themeBtn) {
      const newBtn = themeBtn.cloneNode(true);
      themeBtn.parentNode.replaceChild(newBtn, themeBtn);
      
      // Update reference
      const freshThemeBtn = qs('#theme-btn');
      if (freshThemeBtn) {
        freshThemeBtn.addEventListener('click', toggleTheme);
      }
    }

    // Motion toggle
    motionBtn?.addEventListener('click', () => {
      const on = root.classList.toggle('reduce-motion');
      motionBtn.setAttribute('aria-pressed', String(on));
      localStorage.setItem('reduce-motion', String(on));
      announce(on ? 'Reduced motion enabled' : 'Reduced motion disabled');
    });

    // Transparency toggle
    transBtn?.addEventListener('click', () => {
      const on = root.classList.toggle('reduce-transparency');
      transBtn.setAttribute('aria-pressed', String(on));
      localStorage.setItem('reduce-transparency', String(on));
      announce(on ? 'Reduced transparency enabled' : 'Reduced transparency disabled');
    });

    // Set initial ARIA states
    if (motionBtn) motionBtn.setAttribute('aria-pressed', String(savedMotion));
    if (transBtn) transBtn.setAttribute('aria-pressed', String(savedTrans));
  }

  // Flashcard Generator with Loading States
  function initGenerator() {
    const subj = qs('#fc-subject');
    const topic = qs('#fc-topic');
    const count = qs('#fc-count');
    const btn = qs('#btn-generate');
    const grid = qs('#cards-grid');
    const errorDiv = qs('#generator-error');

    function showError(msg) {
      if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 5000);
      }
      announce(`Error: ${msg}`);
    }

    function hideError() {
      if (errorDiv) errorDiv.classList.remove('show');
    }

    function renderCards(cards) {
      if (!grid) return;
      grid.innerHTML = '';
      hideError();

      if (cards.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <ion-icon name="albums-outline"></ion-icon>
            <p>No flashcards generated. Please try again.</p>
          </div>
        `;
        waitForIonicons(() => replaceIcons());
        return;
      }

      cards.forEach((c, idx) => {
        const card = document.createElement('div');
        card.className = 'flashcard';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Flashcard ${idx + 1}. Click to flip`);
        card.innerHTML = `
          <div class="fc-front">${c.q}</div>
          <div class="fc-back">${c.a}</div>
        `;

        const flip = (e) => {
          if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          card.classList.toggle('flipped');
          const isFlipped = card.classList.contains('flipped');
          card.setAttribute('aria-label', isFlipped ? 
            `Flashcard ${idx + 1}, answer side` : 
            `Flashcard ${idx + 1}, question side`);
        };

        card.addEventListener('click', flip);
        card.addEventListener('keydown', flip);
        grid.appendChild(card);
      });

      announce(`${cards.length} flashcards generated`);
    }

    btn?.addEventListener('click', async () => {
      const topicVal = (topic?.value || '').trim();
      const subjVal = subj?.value || 'General';
      const countVal = parseInt(count?.value || '5', 10);

      if (!topicVal) {
        showError('Please enter a topic');
        topic?.focus();
        return;
      }

      // Disable button and show loading
      btn.disabled = true;
      btn.classList.add('btn-loading');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>Generating...</span>';

      // Show loading indicator
      const loadingIndicator = qs('#loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.classList.add('active');
        loadingIndicator.setAttribute('aria-busy', 'true');
        loadingIndicator.querySelector('p').textContent = 'Generating flashcards with AI...';
      }

      hideError();

      try {
        // Simulate AI generation (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const baseCards = [
          { q: `${subjVal}: ${topicVal} - Key concept?`, a: 'Definition and core idea explaining the fundamental principle.' },
          { q: `${subjVal}: ${topicVal} - Example?`, a: 'Real world application demonstrating practical usage.' },
          { q: `${subjVal}: ${topicVal} - Formula?`, a: 'Important mathematical or scientific relationship.' },
          { q: `${subjVal}: ${topicVal} - Common pitfall?`, a: 'Common mistake students make when learning this topic.' },
          { q: `${subjVal}: ${topicVal} - Memory trick?`, a: 'Mnemonic device to help remember this concept.' },
        ];

        const generatedCards = Array.from({ length: Math.min(countVal, 20) }, (_, i) => {
          const baseCard = baseCards[i % baseCards.length];
          return {
            q: `${baseCard.q}`,
            a: `${baseCard.a}`
          };
        });

        renderCards(generatedCards);

        // Update stats
        const statCards = qs('#stat-cards');
        if (statCards) {
          const current = parseInt(statCards.textContent || '0', 10) || 0;
          const newTotal = current + generatedCards.length;
          statCards.textContent = String(newTotal);
          localStorage.setItem('flashcards-count', String(newTotal));
        }
      } catch (err) {
        showError('Failed to generate flashcards. Please try again.');
        console.error('Generator error:', err);
      } finally {
        btn.disabled = false;
        btn.classList.remove('btn-loading');
        btn.innerHTML = originalText;
        
        // Hide loading indicator
        const loadingIndicator = qs('#loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.classList.remove('active');
          loadingIndicator.setAttribute('aria-busy', 'false');
        }
      }
    });
  }

  // Chat with Loading States
  function initChat() {
    const input = qs('#chat-input');
    const send = qs('#btn-send');
    const messages = qs('#chat-messages');
    let isProcessing = false;

    function addMessage(text, role = 'user') {
      const wrap = document.createElement('div');
      wrap.className = `chat-msg ${role === 'user' ? 'user-msg' : 'bot-msg'}`;
      
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      
      waitForIonicons(() => {
        const icon = document.createElement('ion-icon');
        icon.name = role === 'user' ? 'person-circle-outline' : 'sparkles-outline';
        avatar.appendChild(icon);
      });

      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      bubble.innerHTML = `<p>${text}</p>`;

      wrap.appendChild(avatar);
      wrap.appendChild(bubble);
      messages?.appendChild(wrap);

      // Scroll to bottom
      setTimeout(() => {
        messages?.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
      }, 100);
    }

    function addLoading() {
      const loading = document.createElement('div');
      loading.className = 'chat-msg bot-msg';
      loading.id = 'chat-loading-indicator';
      
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      waitForIonicons(() => {
        const icon = document.createElement('ion-icon');
        icon.name = 'sparkles-outline';
        avatar.appendChild(icon);
      });

      const bubble = document.createElement('div');
      bubble.className = 'chat-loading';
      bubble.innerHTML = '<span></span><span></span><span></span>';

      loading.appendChild(avatar);
      loading.appendChild(bubble);
      messages?.appendChild(loading);
      messages?.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
    }

    function removeLoading() {
      const loading = qs('#chat-loading-indicator');
      if (loading) loading.remove();
    }

    async function sendMessage() {
      const text = (input?.value || '').trim();
      if (!text || isProcessing) return;

      isProcessing = true;
      addMessage(text, 'user');
      input.value = '';
      input.disabled = true;
      send.disabled = true;
      send.classList.add('btn-loading');

      // Show loading indicator
      const loadingIndicator = qs('#loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.classList.add('active');
        loadingIndicator.setAttribute('aria-busy', 'true');
        loadingIndicator.querySelector('p').textContent = 'AI is thinking...';
      }

      addLoading();

      try {
        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        removeLoading();
        const response = `I understand you're asking about: "${text}". Here's a helpful explanation and study tip related to this topic.`;
        addMessage(response, 'bot');
      } catch (err) {
        removeLoading();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        console.error('Chat error:', err);
      } finally {
        isProcessing = false;
        input.disabled = false;
        send.disabled = false;
        send.classList.remove('btn-loading');
        input.focus();
        
        // Hide loading indicator
        const loadingIndicator = qs('#loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.classList.remove('active');
          loadingIndicator.setAttribute('aria-busy', 'false');
        }
      }
    }

    send?.addEventListener('click', sendMessage);
    
    input?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Tasks Management - ENHANCED
  function initTasks() {
    const list = qs('#tasks-list');
    const addBtn = qs('#btn-add-task');
    const saveBtn = qs('#btn-save-task');
    const title = qs('#inp-task-title');
    const desc = qs('#inp-task-desc');
    const subj = qs('#inp-task-subj');
    const prio = qs('#inp-task-priority');

    function updateStats() {
      const items = JSON.parse(localStorage.getItem('app-tasks') || '[]');
      const completedCount = items.filter(t => t.done).length;
      const stat = qs('#stat-tasks');
      if (stat) {
        stat.textContent = String(items.length);
      }
    }

    function render() {
      if (!list) return;
      const items = JSON.parse(localStorage.getItem('app-tasks') || '[]');
      list.innerHTML = '';

      if (items.length === 0) {
        list.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem;">
            <ion-icon name="create-outline" style="font-size: 4rem; width: 4rem; height: 4rem; margin-bottom: 1rem; opacity: 0.5;"></ion-icon>
            <p style="font-size: 1.1rem; color: var(--text-secondary);">No tasks yet.</p>
            <p style="font-size: 0.9rem; color: var(--text-tertiary); margin-top: 0.5rem;">Click "New Task" to get started!</p>
          </div>
        `;
        waitForIonicons(() => {
          replaceIcons();
          forceRenderIcons();
        });
        updateStats();
        return;
      }

      items.forEach((t, idx) => {
        const el = document.createElement('div');
        el.className = 'task-item';
        el.innerHTML = `
          <div style="flex: 1;">
            <div class="task-title">${t.title || 'Untitled Task'}</div>
            <div class="task-meta">${t.subject || 'general'} • ${t.priority || 'medium'} priority</div>
            ${t.desc ? `<div style="font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.25rem;">${t.desc}</div>` : ''}
          </div>
          <button class="btn-secondary task-del" aria-label="Delete task ${t.title}">
            <ion-icon name="trash-outline"></ion-icon>
          </button>
        `;

        const delBtn = el.querySelector('.task-del');
        delBtn?.addEventListener('click', () => {
          const arr = JSON.parse(localStorage.getItem('app-tasks') || '[]');
          arr.splice(idx, 1);
          localStorage.setItem('app-tasks', JSON.stringify(arr));
          render();
          announce('Task deleted');
        });

        list.appendChild(el);
      });

      waitForIonicons(() => {
        replaceIcons();
        forceRenderIcons();
      });
      updateStats();
    }

    saveBtn?.addEventListener('click', () => {
      const titleVal = (title?.value || '').trim();
      if (!titleVal) {
        announce('Please provide a task title');
        title?.focus();
        return;
      }

      const descVal = (desc?.value || '').trim();
      const subjVal = subj?.value || 'general';
      const prioVal = prio?.value || 'medium';

      const arr = JSON.parse(localStorage.getItem('app-tasks') || '[]');
      arr.push({
        title: titleVal,
        desc: descVal,
        subject: subjVal,
        priority: prioVal,
        done: false,
        created: new Date().toISOString()
      });
      
      localStorage.setItem('app-tasks', JSON.stringify(arr));
      render();
      announce('Task saved');

      // Close modal
      const modal = qs('#task-modal');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }

      // Reset form
      if (title) title.value = '';
      if (desc) desc.value = '';
      if (subj) subj.value = 'general';
      if (prio) prio.value = 'medium';
      
      // Re-render to show new task
      render();
    });

    addBtn?.addEventListener('click', () => {
      if (title) title.value = '';
      if (desc) desc.value = '';
      if (subj) subj.value = 'general';
      if (prio) prio.value = 'medium';
    });

    render();
  }

  // Timer
  function initTimer() {
    const circle = qs('#timer-circle');
    const text = qs('#timer-text');
    const start = qs('#btn-timer-start');
    const reset = qs('#btn-timer-reset');
    const btnIcon = qs('#timer-btn-icon');
    const btnText = qs('#timer-btn-text');
    const round = qs('#timer-round');
    const completed = qs('#timer-completed');

    const trackLen = 2 * Math.PI * 85;
    if (circle) circle.style.strokeDasharray = String(trackLen);

    let total = 25 * 60;
    let secs = total;
    let running = false;
    let interval = null;
    let completedCount = parseInt(localStorage.getItem('timer-completed') || '0', 10);

    if (completed) completed.textContent = String(completedCount);

    function setIcon(name) {
      if (btnIcon) {
        waitForIonicons(() => {
          btnIcon.innerHTML = '';
          const icon = document.createElement('ion-icon');
          icon.name = name;
          btnIcon.appendChild(icon);
        });
      }
    }

    function format(s) {
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
    }

    function draw() {
      if (!circle) return;
      const p = 1 - (secs / total);
      circle.style.strokeDashoffset = String(p * trackLen);
    }

    function render() {
      if (text) text.textContent = format(secs);
      draw();
    }

    function tick() {
      secs--;
      render();

      if (secs <= 0) {
        clearInterval(interval);
        interval = null;
        running = false;
        setIcon('play-outline');
        if (btnText) btnText.textContent = 'Start';
        
        completedCount++;
        if (completed) completed.textContent = String(completedCount);
        localStorage.setItem('timer-completed', String(completedCount));
        
        announce('Focus session complete!');
      }
    }

    function toggle() {
      if (running) {
        clearInterval(interval);
        interval = null;
        running = false;
        setIcon('play-outline');
        if (btnText) btnText.textContent = 'Start';
        announce('Timer paused');
      } else {
        running = true;
        setIcon('pause-outline');
        if (btnText) btnText.textContent = 'Pause';
        interval = setInterval(tick, 1000);
        announce('Timer started');
      }
    }

    function resetAll() {
      clearInterval(interval);
      interval = null;
      running = false;
      secs = total;
      setIcon('play-outline');
      if (btnText) btnText.textContent = 'Start';
      render();
      announce('Timer reset');
    }

    start?.addEventListener('click', toggle);
    reset?.addEventListener('click', resetAll);

    // Initialize stats from localStorage
    if (completed) {
      const savedCompleted = parseInt(localStorage.getItem('timer-completed') || '0', 10);
      completed.textContent = String(savedCompleted);
    }

    render();
    setIcon('play-outline');
  }

  // Initialize Stats on Load
  function initStats() {
    // Tasks count
    const tasks = JSON.parse(localStorage.getItem('app-tasks') || '[]');
    const statTasks = qs('#stat-tasks');
    if (statTasks) {
      statTasks.textContent = String(tasks.length);
    }

    // Cards count from localStorage if saved
    const cardsCount = parseInt(localStorage.getItem('flashcards-count') || '0', 10);
    const statCards = qs('#stat-cards');
    if (statCards && cardsCount > 0) {
      statCards.textContent = String(cardsCount);
    }

    // Timer sessions are handled in initTimer()
    // Just ensure the stat display exists
  }

  // Icon Replacement Helper - ENHANCED
  function replaceIcons() {
    waitForIonicons(() => {
      // Force render all icons
      forceRenderIcons();
      
      // Double-check all icons are rendering
      setTimeout(() => {
        qsa('ion-icon').forEach(icon => {
          // If icon still doesn't have shadowRoot, try to refresh it
          if (!icon.shadowRoot && icon.parentElement) {
            const name = icon.getAttribute('name');
            if (name) {
              // Clone and replace to force re-render
              const newIcon = document.createElement('ion-icon');
              newIcon.setAttribute('name', name);
              if (icon.getAttribute('aria-hidden')) {
                newIcon.setAttribute('aria-hidden', 'true');
              }
              icon.parentElement.replaceChild(newIcon, icon);
            }
          }
        });
        forceRenderIcons();
      }, 300);
    }, 200);
  }

  // Initialize everything - STABLE VERSION (No Duplicates)
  function init() {
    // Prevent duplicate initialization
    if (window.appInitialized) {
      console.warn('App already initialized, skipping duplicate call');
      return;
    }
    window.appInitialized = true;
    
    ensureLive();
    
    // Load Ionicons IMMEDIATELY
    ensureIonicons();
    
    // Initialize core functionality first (CRITICAL ORDER)
    initTabs(); // MUST be first - sets initial tab state
    initA11yToggles(); // Theme must be set early
    initModal();
    initGenerator();
    initChat();
    initTasks();
    initTimer();
    initStats();
    
    // Force generator view visible after initialization
    setTimeout(() => {
      const allViews = qsa('.app-view');
      const generatorView = qs('#view-generator');
      
      // Hide ALL views first
      allViews.forEach(v => {
        if (v.id !== 'view-generator') {
          v.classList.remove('active-view');
          v.style.display = 'none';
          v.setAttribute('aria-hidden', 'true');
          v.hidden = true;
        }
      });
      
      // Show ONLY generator
      if (generatorView) {
        generatorView.classList.add('active-view');
        generatorView.style.display = 'block';
        generatorView.setAttribute('aria-hidden', 'false');
        generatorView.hidden = false;
      }
    }, 100);
    
    // Ensure icons render properly
    waitForIonicons(() => {
      replaceIcons();
      forceRenderIcons();
      
      setTimeout(() => {
        forceRenderIcons();
        announce('Application ready');
      }, 500);
    }, 150);
    
    // Final icon check after page fully loads
    if (document.readyState === 'complete') {
      setTimeout(() => {
        waitForIonicons(() => {
          replaceIcons();
          forceRenderIcons();
        }, 50);
      }, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          waitForIonicons(() => {
            replaceIcons();
            forceRenderIcons();
          }, 50);
        }, 500);
      });
    }
  }

  // Verification and Debugging
  function verifyApp() {
    const checks = {
      icons: qsa('ion-icon').length > 0,
      tabs: qsa('[role="tab"]').length === 5,
      panels: qsa('[role="tabpanel"]').length === 5,
      modal: !!qs('#task-modal'),
      ariaLive: !!qs('#aria-live'),
      stats: !!qs('#stat-tasks') && !!qs('#stat-cards'),
    };
    
    const allGood = Object.values(checks).every(v => v === true);
    
    if (allGood) {
      console.log('✅ TaskMaster Pro initialized successfully');
      console.log(`✅ ${qsa('ion-icon').length} icons found`);
    } else {
      console.warn('⚠️ Some components may not be initialized:', checks);
    }
    
    return allGood;
  }

  // Initialize ONCE - prevent duplicates (CRITICAL SAFEGUARD)
  if (window.appInitialized) {
    console.warn('⚠️ Script already initialized - preventing duplicate');
    return;
  }

  // Single initialization wrapper
  const initializeApp = () => {
    if (window.appInitialized) {
      console.warn('⚠️ Duplicate initialization prevented');
      return;
    }
    
    init();
    setTimeout(verifyApp, 1000);
    
    // Final safeguard: Force ONLY generator visible
    setTimeout(() => {
      const allViews = qsa('.app-view');
      allViews.forEach(v => {
        if (v.id !== 'view-generator') {
          v.style.display = 'none';
          v.classList.remove('active-view');
          v.setAttribute('aria-hidden', 'true');
          v.hidden = true;
        }
      });
      
      const genView = qs('#view-generator');
      if (genView) {
        genView.style.display = 'block';
        genView.classList.add('active-view');
        genView.setAttribute('aria-hidden', 'false');
        genView.hidden = false;
      }
      
      // Update dock button
      const genBtn = qs('#tab-generator');
      if (genBtn) {
        qsa('.dock-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        genBtn.classList.add('active');
        genBtn.setAttribute('aria-selected', 'true');
      }
    }, 200);
  };

  // Execute initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
  } else {
    initializeApp();
  }
})();