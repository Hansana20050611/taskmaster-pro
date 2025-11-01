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

  // Tab Management - FIXED: Only ONE Tab Visible at a Time
  function initTabs() {
    const tabs = qsa('[role="tab"]');
    const panels = qsa('[role="tabpanel"]');
    let isTransitioning = false;

    // STABLE TAB SWITCHING - ONE ACTIVE AT A TIME
    const switchTab = (tabName) => {
      if (isTransitioning) return;
      isTransitioning = true;

      // Step 1: Hide ALL views
      panels.forEach(view => {
        view.classList.remove('active-view');
        view.setAttribute('aria-hidden', 'true');
      });

      // Step 2: Show ONLY selected view
      const targetView = document.getElementById(`view-${tabName}`);
      if (targetView) {
        targetView.classList.add('active-view');
        targetView.setAttribute('aria-hidden', 'false');
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

      // Reset transition flag
      setTimeout(() => {
        isTransitioning = false;
      }, 300);
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

    // Initialize: Start with Generator tab visible
    setTimeout(() => {
      switchTab('generator');
    }, 50);
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
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (savedTheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // No saved preference - use system preference
      if (systemPrefersDark) {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
        localStorage.setItem('app-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark-theme');
        root.classList.add('light-theme');
        localStorage.setItem('app-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
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

    // STABLE THEME MANAGEMENT - Updates all surfaces instantly
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
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        root.classList.remove('light-theme');
        root.classList.add('dark-theme');
        localStorage.setItem('app-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      
      // Force update all glass surfaces
      qsa('.glass-surface').forEach(surface => {
        surface.style.transition = 'background-color 0.2s ease, border-color 0.2s ease';
      });
      
      // Update all icons immediately
      syncThemeIcon();
      setTimeout(() => {
        qsa('ion-icon').forEach(icon => {
          // Force icon color update
          if (isDark) {
            icon.style.color = '#000000';
          } else {
            icon.style.color = '#ffffff';
          }
        });
      }, 50);
      
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

    // Motion toggle - FIXED: Visual confirmation
    motionBtn?.addEventListener('click', () => {
      const on = root.classList.toggle('reduce-motion');
      motionBtn.setAttribute('aria-pressed', String(on));
      localStorage.setItem('reduce-motion', String(on));
      
      // Visual confirmation
      if (motionBtn) {
        motionBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          motionBtn.style.transform = '';
        }, 150);
      }
      
      announce(on ? 'Reduced motion enabled' : 'Reduced motion disabled');
    });

    // Transparency toggle - FIXED: Visual confirmation
    transBtn?.addEventListener('click', () => {
      const on = root.classList.toggle('reduce-transparency');
      root.setAttribute('data-reduce-transparency', String(on));
      transBtn.setAttribute('aria-pressed', String(on));
      localStorage.setItem('reduce-transparency', String(on));
      
      // Visual confirmation - update glass surfaces immediately
      qsa('.glass-surface').forEach(surface => {
        if (on) {
          surface.style.backdropFilter = 'none';
          surface.style.webkitBackdropFilter = 'none';
          surface.style.background = root.classList.contains('dark-theme') 
            ? 'rgba(15, 15, 15, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)';
        } else {
          surface.style.backdropFilter = '';
          surface.style.webkitBackdropFilter = '';
          surface.style.background = '';
        }
      });
      
      // Button visual feedback
      if (transBtn) {
        transBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          transBtn.style.transform = '';
        }, 150);
      }
      
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
      if (!grid) {
        console.error('Flashcards grid container not found');
        showError('Flashcards container not available');
        return;
      }
      
      try {
        grid.innerHTML = '';
        hideError();

        if (!Array.isArray(cards)) {
          showError('Invalid flashcard data');
          grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <p>Error: Invalid flashcard data.</p>
            </div>
          `;
          waitForIonicons(() => replaceIcons());
          return;
        }

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
      } catch (err) {
        console.error('Error rendering flashcards:', err);
        showError('Failed to render flashcards. Please try again.');
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <p>Error: ${err.message}</p>
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
        const errorMsg = err.message || 'An unknown error occurred';
        addMessage(`Sorry, I encountered an error: ${errorMsg}. Please try again.`, 'bot');
        console.error('Chat error:', err);
        announce('Error sending message. Please try again.');
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

  // Premium Sinhala Translation System
  const translations = {
    en: {
      tasks: 'My Tasks',
      newTask: 'New Task',
      today: 'Today',
      upcoming: 'Upcoming',
      overdue: 'Overdue',
      all: 'All',
      searchTasks: 'Search tasks...',
      priority: 'Priority',
      urgent: 'Urgent',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      subject: 'Subject',
      allSubjects: 'All Subjects',
      projects: 'Projects',
      noTasks: 'No tasks yet',
      createFirstTask: 'Create your first task to get started'
    },
    si: {
      tasks: 'මගේ කාර්යයන්',
      newTask: 'නව කාර්යය',
      today: 'අද',
      upcoming: 'ඉදිරියට එන',
      overdue: 'ඉකුත් වූ',
      all: 'සියල්ල',
      searchTasks: 'කාර්යයන් සොයන්න...',
      priority: 'අයිතිය',
      urgent: 'හදිසි',
      high: 'ඉහළ',
      medium: 'මධ්‍යම',
      low: 'පහළ',
      subject: 'විෂය',
      allSubjects: 'සියලුම විෂයන්',
      projects: 'ව්‍යාපෘති',
      noTasks: 'තවමත් කාර්යයන් නැත',
      createFirstTask: 'ආරම්භ කිරීමට ඔබේ පළමු කාර්යය සාදන්න'
    }
  };

  // Initialize i18n System
  function initI18n() {
    const lang = localStorage.getItem('app-lang') || 'en';
    document.documentElement.setAttribute('lang', lang);
    updateTranslations(lang);
    
    // Language selector
    const langSelector = qs('#lang-selector');
    if (langSelector) {
      langSelector.value = lang;
      langSelector.addEventListener('change', (e) => {
        const newLang = e.target.value;
        localStorage.setItem('app-lang', newLang);
        document.documentElement.setAttribute('lang', newLang);
        updateTranslations(newLang);
        announce(`Language changed to ${newLang === 'en' ? 'English' : 'Sinhala'}`);
      });
    }
  }

  function updateTranslations(lang) {
    const trans = translations[lang] || translations.en;
    qsa('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (trans[key]) {
        el.textContent = trans[key];
      }
    });
    qsa('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (trans[key]) {
        el.placeholder = trans[key];
      }
    });
  }

  // Font Switcher - FIXED: Updates all text elements with Premium Fonts
  function initFontSwitcher() {
    const fontBtns = qsa('.font-btn');
    const savedFont = localStorage.getItem('fontType') || 'en';
    document.body.setAttribute('data-font', savedFont);
    document.documentElement.setAttribute('data-font', savedFont);
    
    // Apply font immediately to all elements with Premium Font System
    const applyFont = (fontType) => {
      document.body.setAttribute('data-font', fontType);
      document.documentElement.setAttribute('data-font', fontType);
      
      // Premium font application
      const fontFamily = fontType === 'si' 
        ? "'Noto Sans Sinhala', 'Iskoola Pota', 'Malithi Web', sans-serif"
        : "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";
      
      // Force update on all text elements
      qsa('input, textarea, select, button, h1, h2, h3, h4, p, span, div, label').forEach(el => {
        el.style.fontFamily = fontFamily;
      });
      
      // Update font weights for headings in Sinhala
      if (fontType === 'si') {
        qsa('h1, h2, h3, h4, h5, h6').forEach(el => {
          el.style.fontWeight = '600';
        });
      }
    };
    
    fontBtns.forEach(btn => {
      if (btn.getAttribute('data-font') === savedFont) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', function() {
        const fontType = this.getAttribute('data-font');
        applyFont(fontType);
        localStorage.setItem('fontType', fontType);
        
        fontBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const lang = localStorage.getItem('app-lang') || 'en';
        announce(`Font switched to ${fontType === 'en' ? 'English' : 'Sinhala'}`);
      });
    });
    
    // Apply initial font
    applyFont(savedFont);
  }

  // Calendar Functionality
  let currentCalendarMonth = new Date().getMonth();
  let currentCalendarYear = new Date().getFullYear();

  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const today = new Date();
    const tasks = JSON.parse(localStorage.getItem('app-tasks') || '[]');

    let html = '';
    
    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      html += `<div class="calendar-day-header" style="font-weight: 600; text-align: center; padding: 8px;">${day}</div>`;
    });

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const tasksForDay = tasks.filter(t => {
        if (t.date) {
          const taskDate = new Date(t.date).toISOString().split('T')[0];
          return taskDate === dateStr;
        }
        return false;
      }).length;
      
      const isToday = date.toDateString() === today.toDateString();
      const dayClass = `calendar-day ${isToday ? 'today' : ''}`;

      html += `
        <div class="${dayClass}" data-date="${dateStr}">
          <div class="day-number">${day}</div>
          ${tasksForDay > 0 ? `<div class="task-count">${tasksForDay}</div>` : ''}
        </div>
      `;
    }

    return html;
  }

  function renderCalendar() {
    const grid = qs('#calendar-grid');
    const monthHeader = qs('#current-month');
    
    if (grid) {
      grid.innerHTML = generateCalendar(currentCalendarYear, currentCalendarMonth);
      
      // Add click handlers
      qsa('.calendar-day:not(.empty)', grid).forEach(day => {
        day.addEventListener('click', () => {
          const date = day.getAttribute('data-date');
          showTasksForDate(date);
          qsa('.calendar-day', grid).forEach(d => d.classList.remove('selected'));
          day.classList.add('selected');
        });
      });
    }
    
    if (monthHeader) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      monthHeader.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    }
  }

  function showTasksForDate(dateStr) {
    const tasks = JSON.parse(localStorage.getItem('app-tasks') || '[]');
    const dateTasks = tasks.filter(t => {
      if (t.date) {
        const taskDate = new Date(t.date).toISOString().split('T')[0];
        return taskDate === dateStr;
      }
      return false;
    });

    const sidebar = qs('#calendar-selected-date');
    const list = qs('#date-tasks-list');
    
    if (sidebar) {
      const date = new Date(dateStr);
      sidebar.textContent = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    if (list) {
      if (dateTasks.length === 0) {
        list.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">No tasks for this date</p>';
      } else {
        list.innerHTML = dateTasks.map(task => `
          <div class="task-card" style="margin-bottom: 12px;">
            <div class="task-header">
              <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
              <h4 class="task-title">${task.title}</h4>
              ${task.priority ? `<div class="task-priority" data-priority="${task.priority}">${task.priority}</div>` : ''}
            </div>
            ${task.description ? `<p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 8px;">${task.description}</p>` : ''}
          </div>
        `).join('');
      }
    }
  }

  function initCalendar() {
    const prevBtn = qs('#prev-month');
    const nextBtn = qs('#next-month');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentCalendarMonth--;
        if (currentCalendarMonth < 0) {
          currentCalendarMonth = 11;
          currentCalendarYear--;
        }
        renderCalendar();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentCalendarMonth++;
        if (currentCalendarMonth > 11) {
          currentCalendarMonth = 0;
          currentCalendarYear++;
        }
        renderCalendar();
      });
    }
    
    renderCalendar();
  }

  // Task Categories
  function initTaskCategories() {
    const categoryBtns = qsa('.category-btn');
    let activeCategory = localStorage.getItem('activeCategory') || 'today';
    
    categoryBtns.forEach(btn => {
      if (btn.getAttribute('data-category') === activeCategory) {
        btn.classList.add('active');
      }
      
      btn.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        activeCategory = category;
        localStorage.setItem('activeCategory', category);
        
        categoryBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        if (typeof renderTasks === 'function') {
          renderTasks();
        }
        
        announce(`Switched to ${category} tasks`);
      });
    });
  }

  // Layout Switcher
  function initLayoutSwitcher() {
    const layoutBtns = qsa('.layout-btn');
    const tasksList = qs('#tasks-list');
    const tasksWrapper = qs('.tasks-wrapper');
    const calendarView = qs('#view-calendar');
    let currentLayout = localStorage.getItem('taskLayout') || 'list';
    
    layoutBtns.forEach(btn => {
      if (btn.getAttribute('data-layout') === currentLayout) {
        btn.classList.add('active');
      }
      
      btn.addEventListener('click', function() {
        const layout = this.getAttribute('data-layout');
        currentLayout = layout;
        localStorage.setItem('taskLayout', layout);
        
        layoutBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        if (layout === 'calendar') {
          if (tasksList) tasksList.style.display = 'none';
          if (tasksWrapper) tasksWrapper.style.display = 'none';
          if (calendarView) calendarView.style.display = 'block';
          renderCalendar();
        } else {
          if (calendarView) calendarView.style.display = 'none';
          if (tasksList) tasksList.style.display = 'grid';
          if (tasksWrapper) tasksWrapper.style.display = 'block';
          
          // Apply layout styles
          if (layout === 'agenda') {
            if (tasksList) {
              tasksList.style.gridTemplateColumns = '1fr';
              tasksList.style.gap = '12px';
            }
          } else if (layout === '3day') {
            // 3-day view logic
          } else {
            if (tasksList) {
              tasksList.style.gridTemplateColumns = '';
              tasksList.style.gap = '';
            }
          }
        }
        
        announce(`Switched to ${layout} view`);
      });
    });
  }

  // Filters
  function initFilters() {
    const filterBtn = qs('#btn-filter-tasks');
    const filtersPanel = qs('#filters-panel');
    const filterBtns = qsa('.filter-btn');
    
    if (filterBtn && filtersPanel) {
      filterBtn.addEventListener('click', () => {
        const isVisible = filtersPanel.style.display !== 'none';
        filtersPanel.style.display = isVisible ? 'none' : 'block';
        announce(isVisible ? 'Filters hidden' : 'Filters shown');
      });
    }
    
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');
        
        // Remove active from siblings in same group
        const group = this.closest('.filter-options');
        if (group) {
          qsa('.filter-btn', group).forEach(b => b.classList.remove('active'));
        }
        this.classList.add('active');
        
        // Apply filter logic
        if (typeof renderTasks === 'function') {
          renderTasks();
        }
        
        announce(`Filter applied: ${filter}`);
      });
    });
  }

  // Sorting
  function initSorting() {
    const sortBtn = qs('#btn-sort-tasks');
    let sortOrder = localStorage.getItem('taskSortOrder') || 'date';
    
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        const orders = ['date', 'priority', 'title'];
        const currentIndex = orders.indexOf(sortOrder);
        const nextIndex = (currentIndex + 1) % orders.length;
        sortOrder = orders[nextIndex];
        localStorage.setItem('taskSortOrder', sortOrder);
        
        if (typeof renderTasks === 'function') {
          renderTasks();
        }
        
        announce(`Sorted by ${sortOrder}`);
      });
    }
  }

  // Enhanced Task Management with All Features
  let taskEditId = null;

  // Helper functions for task actions (getLabelColor moved to initTasks scope)

  window.toggleTaskComplete = function(taskId) {
    const arr = JSON.parse(localStorage.getItem('app-tasks') || '[]');
    const task = arr.find(t => t.id === taskId || t.id === taskId.toString());
    if (task) {
      task.done = !task.done;
      localStorage.setItem('app-tasks', JSON.stringify(arr));
      if (window.renderTasks) window.renderTasks();
      announce(task.done ? 'Task completed' : 'Task uncompleted');
    }
  };

  window.editTask = function(taskId) {
    const arr = JSON.parse(localStorage.getItem('app-tasks') || '[]');
    const task = arr.find(t => t.id === taskId || t.id === taskId.toString());
    if (!task) return;
    
    taskEditId = taskId;
    qs('#inp-task-title').value = task.title || '';
    qs('#inp-task-desc').value = task.desc || '';
    qs('#inp-task-subj').value = task.subject || 'general';
    qs('#inp-task-priority').value = task.priority || 'medium';
    if (qs('#inp-task-date')) qs('#inp-task-date').value = task.date || '';
    if (qs('#inp-task-time')) qs('#inp-task-time').value = task.time || '';
    if (qs('#inp-task-deadline')) qs('#inp-task-deadline').value = task.deadline || '';
    if (qs('#inp-task-location')) qs('#inp-task-location').value = task.location || '';
    
    // Set labels
    qsa('.label-btn').forEach(btn => {
      btn.classList.toggle('active', task.labels && task.labels.includes(btn.getAttribute('data-label')));
    });
    
    // Open modal
    qs('#task-modal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.duplicateTask = function(taskId) {
    const arr = JSON.parse(localStorage.getItem('app-tasks') || '[]');
    const task = arr.find(t => t.id === taskId || t.id === taskId.toString());
    if (task) {
      const newTask = { ...task, id: Date.now().toString(), done: false, created: new Date().toISOString() };
      arr.push(newTask);
      localStorage.setItem('app-tasks', JSON.stringify(arr));
      if (window.renderTasks) window.renderTasks();
      announce('Task duplicated');
    }
  };

  window.deleteTask = function(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const arr = JSON.parse(localStorage.getItem('app-tasks') || '[]');
    const index = arr.findIndex(t => t.id === taskId || t.id === taskId.toString());
    if (index !== -1) {
      arr.splice(index, 1);
      localStorage.setItem('app-tasks', JSON.stringify(arr));
      if (window.renderTasks) window.renderTasks();
      announce('Task deleted');
    }
  };

  function initTaskModal() {
    const labelBtns = qsa('.label-btn');
    const selectedLabels = new Set();
    
    labelBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const label = this.getAttribute('data-label');
        if (selectedLabels.has(label)) {
          selectedLabels.delete(label);
          this.classList.remove('active');
        } else {
          selectedLabels.add(label);
          this.classList.add('active');
        }
      });
    });

    const addSubtaskBtn = qs('#add-subtask-btn');
    const subtasksList = qs('#subtasks-list');
    
    if (addSubtaskBtn && subtasksList) {
      addSubtaskBtn.addEventListener('click', () => {
        const subtaskDiv = document.createElement('div');
        subtaskDiv.className = 'subtask-item';
        subtaskDiv.innerHTML = `
          <input type="checkbox" class="subtask-checkbox">
          <input type="text" class="input-field" placeholder="Sub-task title" style="flex: 1;">
          <button type="button" class="task-action-btn" onclick="this.parentElement.remove()">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        `;
        subtasksList.appendChild(subtaskDiv);
        waitForIonicons(() => replaceIcons());
      });
    }
  }

  // Premium Task Manager with Grouping & Filtering
  const TaskManager = {
    tasks: [],
    currentFilter: 'today',
    searchQuery: '',
    
    loadTasks() {
      try {
        this.tasks = JSON.parse(localStorage.getItem('app-tasks') || '[]');
        if (!Array.isArray(this.tasks)) {
          this.tasks = [];
        }
      } catch (err) {
        console.error('Error loading tasks:', err);
        this.tasks = [];
      }
    },
    
    saveTasks() {
      localStorage.setItem('app-tasks', JSON.stringify(this.tasks));
    },
    
    groupTasksByDate() {
      const groups = {
        overdue: [],
        today: [],
        upcoming: [],
        projects: []
      };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      this.tasks.forEach(task => {
        // Apply search filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          if (!task.title.toLowerCase().includes(query) && 
              !(task.desc && task.desc.toLowerCase().includes(query))) {
            return;
          }
        }
        
        const taskDate = task.date ? new Date(task.date) : null;
        
        if (!taskDate || isNaN(taskDate.getTime())) {
          groups.projects.push(task);
          return;
        }
        
        taskDate.setHours(0, 0, 0, 0);
        
        if (taskDate < today && !task.done) {
          groups.overdue.push(task);
        } else if (taskDate.getTime() === today.getTime()) {
          groups.today.push(task);
        } else if (taskDate > today) {
          groups.upcoming.push(task);
        }
      });
      
      return groups;
    },
    
    renderTasks() {
      const groups = this.groupTasksByDate();
      const container = qs('#tasks-grouped');
      const emptyState = qs('#tasks-empty');
      
      if (!container) return;
      
      let totalTasks = 0;
      
      Object.keys(groups).forEach(groupName => {
        const groupEl = qs(`#group-${groupName}`);
        if (!groupEl) return;
        
        const contentEl = groupEl.querySelector('.task-group-content');
        const countEl = groupEl.querySelector('.group-count');
        
        const tasks = groups[groupName];
        const count = tasks.length;
        totalTasks += count;
        
        if (countEl) countEl.textContent = String(count);
        if (contentEl) {
          contentEl.innerHTML = '';
          
          if (count === 0) {
            // Hide empty groups
            if (groupName !== 'projects') {
              groupEl.style.display = 'none';
            }
          } else {
            groupEl.style.display = 'block';
            tasks.forEach(task => {
              const taskEl = this.createTaskElement(task);
              contentEl.appendChild(taskEl);
            });
          }
        }
      });
      
      // Show/hide empty state
      if (emptyState) {
        if (totalTasks === 0) {
          emptyState.style.display = 'flex';
          container.style.display = 'none';
        } else {
          emptyState.style.display = 'none';
          container.style.display = 'flex';
        }
      }
      
      waitForIonicons(() => replaceIcons());
    },
    
    createTaskElement(task) {
      const el = document.createElement('div');
      el.className = `task-item ${task.done ? 'completed' : ''}`;
      
      const priority = task.priority || 'medium';
      const priorityClass = `priority-${priority}`;
      
      el.innerHTML = `
        <div class="task-checkbox ${task.done ? 'completed' : ''}" 
             onclick="TaskManager.toggleTask('${task.id}')"
             aria-label="${task.done ? 'Mark as incomplete' : 'Mark as complete'}"></div>
        
        <div class="task-content">
          <div class="task-title">${this.escapeHtml(task.title || 'Untitled Task')}</div>
          ${task.desc ? `<div class="task-desc">${this.escapeHtml(task.desc)}</div>` : ''}
          <div class="task-meta">
            ${task.subject ? `<span class="task-meta-tag"><ion-icon name="school-outline"></ion-icon>${this.escapeHtml(task.subject)}</span>` : ''}
            ${priority ? `<span class="task-meta-tag ${priorityClass}"><ion-icon name="flag-outline"></ion-icon>${this.escapeHtml(priority)}</span>` : ''}
            ${task.date ? `<span class="task-meta-tag"><ion-icon name="calendar-outline"></ion-icon>${new Date(task.date).toLocaleDateString()}</span>` : ''}
          </div>
        </div>
        
        <div class="task-actions">
          <button class="task-action-btn" onclick="TaskManager.editTask('${task.id}')" aria-label="Edit task">
            <ion-icon name="create-outline"></ion-icon>
          </button>
          <button class="task-action-btn" onclick="TaskManager.deleteTask('${task.id}')" aria-label="Delete task">
            <ion-icon name="trash-outline"></ion-icon>
          </button>
        </div>
      `;
      
      return el;
    },
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    toggleTask(id) {
      const task = this.tasks.find(t => t.id === id || t.id === id.toString());
      if (task) {
        task.done = !task.done;
        this.saveTasks();
        this.renderTasks();
        updateStats();
        announce(task.done ? 'Task completed' : 'Task uncompleted');
      }
    },
    
    deleteTask(id) {
      if (!confirm('Are you sure you want to delete this task?')) return;
      this.tasks = this.tasks.filter(t => t.id !== id || t.id !== id.toString());
      this.saveTasks();
      this.renderTasks();
      updateStats();
      announce('Task deleted');
    },
    
    editTask(id) {
      const task = this.tasks.find(t => t.id === id || t.id === id.toString());
      if (!task) return;
      
      taskEditId = id;
      qs('#inp-task-title').value = task.title || '';
      qs('#inp-task-desc').value = task.desc || '';
      qs('#inp-task-subj').value = task.subject || 'general';
      qs('#inp-task-priority').value = task.priority || 'medium';
      if (qs('#inp-task-date')) qs('#inp-task-date').value = task.date || '';
      if (qs('#inp-task-time')) qs('#inp-task-time').value = task.time || '';
      if (qs('#inp-task-deadline')) qs('#inp-task-deadline').value = task.deadline || '';
      
      qs('#task-modal')?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  // Make TaskManager methods global
  window.TaskManager = TaskManager;
  window.toggleTaskComplete = (id) => TaskManager.toggleTask(id);
  window.editTask = (id) => TaskManager.editTask(id);
  window.deleteTask = (id) => TaskManager.deleteTask(id);

  // Tasks Management - ENHANCED with Grouping
  function initTasks() {
    TaskManager.loadTasks();
    
    const addBtn = qs('#btn-add-task');
    const saveBtn = qs('#btn-save-task');
    const title = qs('#inp-task-title');
    const desc = qs('#inp-task-desc');
    const subj = qs('#inp-task-subj');
    const prio = qs('#inp-task-priority');
    const searchInput = qs('#task-search');
    const filterBtns = qsa('.tasks-filter-bar .filter-btn');
    const advancedFiltersBtn = qs('#btn-advanced-filters');
    const filtersPanel = qs('#filters-panel');

    function updateStats() {
      const items = JSON.parse(localStorage.getItem('app-tasks') || '[]');
      const completedCount = items.filter(t => t.done).length;
      const stat = qs('#stat-tasks');
      if (stat) {
        stat.textContent = String(items.length);
      }
    }
    
    // Make updateStats globally accessible
    window.updateStats = updateStats;

    // Helper function for label colors
    function getLabelColor(label) {
      const colors = {
        urgent: '#ef4444',
        important: '#f59e0b',
        work: '#3b82f6',
        personal: '#8b5cf6',
        study: '#10b981'
      };
      return colors[label] || '#667eea';
    }

    // Use TaskManager render instead
    window.renderTasks = () => TaskManager.renderTasks();
    
    // Initialize search
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        TaskManager.searchQuery = e.target.value;
        TaskManager.renderTasks();
      });
    }
    
    // Initialize filter buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        TaskManager.currentFilter = this.getAttribute('data-filter');
        TaskManager.renderTasks();
        announce(`Filtered to ${TaskManager.currentFilter}`);
      });
    });
    
    // Advanced filters toggle
    if (advancedFiltersBtn && filtersPanel) {
      advancedFiltersBtn.addEventListener('click', () => {
        const isVisible = filtersPanel.style.display !== 'none';
        filtersPanel.style.display = isVisible ? 'none' : 'block';
        announce(isVisible ? 'Advanced filters hidden' : 'Advanced filters shown');
      });
    }
    
    // Group toggles
    qsa('.group-toggle').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const group = this.closest('.task-group');
        const isCollapsed = group.getAttribute('data-collapsed') === 'true';
        group.setAttribute('data-collapsed', !isCollapsed);
        this.setAttribute('aria-expanded', !isCollapsed);
        
        // Update icon
        const icon = this.querySelector('ion-icon');
        if (icon) {
          icon.name = isCollapsed ? 'chevron-up-outline' : 'chevron-down-outline';
        }
      });
    });
    
    // Initial render
    TaskManager.renderTasks();

    saveBtn?.addEventListener('click', () => {
      const titleVal = (title?.value || '').trim();
      if (!titleVal) {
        announce('Please provide a task title');
        title?.focus();
        return;
      }

      // Get all form values
      const descVal = (desc?.value || '').trim();
      const subjVal = subj?.value || 'general';
      const prioVal = prio?.value || 'medium';
      const dateVal = qs('#inp-task-date')?.value || '';
      const timeVal = qs('#inp-task-time')?.value || '';
      const deadlineVal = qs('#inp-task-deadline')?.value || '';
      
      const taskData = {
        id: taskEditId || Date.now().toString(),
        title: titleVal,
        desc: descVal,
        subject: subjVal,
        priority: prioVal,
        date: dateVal,
        time: timeVal,
        deadline: deadlineVal,
        done: taskEditId ? TaskManager.tasks.find(t => t.id === taskEditId)?.done || false : false,
        created: taskEditId ? TaskManager.tasks.find(t => t.id === taskEditId)?.created || new Date().toISOString() : new Date().toISOString()
      };

      const isEditing = taskEditId !== null;
      
      if (isEditing) {
        const index = TaskManager.tasks.findIndex(t => t.id === taskEditId);
        if (index !== -1) {
          TaskManager.tasks[index] = { ...TaskManager.tasks[index], ...taskData };
        }
        taskEditId = null;
      } else {
        TaskManager.tasks.push(taskData);
      }
      
      TaskManager.saveTasks();
      TaskManager.renderTasks();
      updateStats();
      announce(isEditing ? 'Task updated' : 'Task saved');

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
      const dateInput = qs('#inp-task-date');
      const timeInput = qs('#inp-task-time');
      const deadlineInput = qs('#inp-task-deadline');
      if (dateInput) dateInput.value = '';
      if (timeInput) timeInput.value = '';
      if (deadlineInput) deadlineInput.value = '';
      
      // Clear labels
      qsa('.label-btn').forEach(btn => btn.classList.remove('active'));
    });

    addBtn?.addEventListener('click', () => {
      taskEditId = null;
      if (title) title.value = '';
      if (desc) desc.value = '';
      if (subj) subj.value = 'general';
      if (prio) prio.value = 'medium';
      const dateInput = qs('#inp-task-date');
      const timeInput = qs('#inp-task-time');
      if (dateInput) dateInput.value = '';
      if (timeInput) timeInput.value = '';
      qsa('.label-btn').forEach(btn => btn.classList.remove('active'));
    });
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

  // Initialize Stats on Load - FIXED: Proper error handling
  function initStats() {
    try {
      // Tasks count
      const tasks = JSON.parse(localStorage.getItem('app-tasks') || '[]');
      const statTasks = qs('#stat-tasks');
      if (statTasks) {
        statTasks.textContent = Array.isArray(tasks) ? String(tasks.length) : '0';
      }

      // Cards count from localStorage if saved
      const cardsCount = parseInt(localStorage.getItem('flashcards-count') || '0', 10);
      const statCards = qs('#stat-cards');
      if (statCards) {
        statCards.textContent = String(cardsCount);
      }

      // Timer sessions count
      const timerCompleted = parseInt(localStorage.getItem('timer-completed') || '0', 10);
      const statHours = qs('#stat-hours');
      if (statHours) {
        // Convert sessions to hours (25 min per session)
        const hours = Math.floor((timerCompleted * 25) / 60);
        statHours.textContent = `${hours}h`;
      }

      // Streak (stored separately or calculated)
      const statStreak = qs('#stat-streak');
      if (statStreak) {
        const streak = parseInt(localStorage.getItem('streak-count') || '0', 10);
        statStreak.textContent = String(streak);
      }
    } catch (err) {
      console.error('Error initializing stats:', err);
      // Set defaults on error
      const statTasks = qs('#stat-tasks');
      const statCards = qs('#stat-cards');
      const statHours = qs('#stat-hours');
      const statStreak = qs('#stat-streak');
      if (statTasks) statTasks.textContent = '0';
      if (statCards) statCards.textContent = '0';
      if (statHours) statHours.textContent = '0h';
      if (statStreak) statStreak.textContent = '0';
    }
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
    
    // Hide loader overlay immediately
    const loaderOverlay = qs('#loader-overlay');
    if (loaderOverlay) {
      loaderOverlay.style.display = 'none';
      loaderOverlay.setAttribute('aria-busy', 'false');
    }
    
    ensureLive();
    
    // Load Ionicons IMMEDIATELY
    ensureIonicons();
    
    // Initialize core functionality first (CRITICAL ORDER)
    initTabs(); // MUST be first - sets initial tab state
    initA11yToggles(); // Theme must be set early
    initI18n(); // Translation system
    initFontSwitcher(); // Font switching
    initModal();
    initTaskModal(); // Enhanced task modal with labels/subtasks
    initTaskCategories(); // Task categories
    initLayoutSwitcher(); // Layout switcher
    initFilters(); // Filters
    initSorting(); // Sorting
    initCalendar(); // Calendar view
    initGenerator();
    initChat();
    initTasks();
    initTimer();
    initStats();
    
    // Ensure generator view is visible after initialization
    setTimeout(() => {
      const generatorView = qs('#view-generator');
      if (generatorView) {
        generatorView.classList.add('active-view');
        generatorView.setAttribute('aria-hidden', 'false');
      }
      
      // Ensure all views have proper initial state
      qsa('.app-view').forEach(view => {
        if (view.id === 'view-generator') {
          view.classList.add('active-view');
          view.setAttribute('aria-hidden', 'false');
        } else {
          view.classList.remove('active-view');
          view.setAttribute('aria-hidden', 'true');
        }
      });
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
    
    // Final safeguard: Ensure generator is visible
    setTimeout(() => {
      const genView = qs('#view-generator');
      if (genView && !genView.classList.contains('active-view')) {
        genView.classList.add('active-view');
        genView.setAttribute('aria-hidden', 'false');
      }
      
      // Update dock button
      const genBtn = qs('#tab-generator');
      if (genBtn && !genBtn.classList.contains('active')) {
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