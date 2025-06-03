class SocialMediaTeamPopup {
    constructor() {
        this.currentTask = null;
        this.taskQueue = [];
        this.currentTaskIndex = 0;
        this.stats = { tasksCompleted: 0, pointsEarned: 0 };
        this.timer = null;
        this.init();
    }

    init() {
        this.loadStats();
        this.setupEventListeners();
        this.checkConnection();
        this.loadTasks();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('start-tasks-btn').addEventListener('click', () => this.showTaskScreen());
        document.getElementById('refresh-tasks-btn').addEventListener('click', () => this.loadTasks());
        document.getElementById('back-btn').addEventListener('click', () => this.showWelcomeScreen());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsScreen());
        document.getElementById('settings-back-btn').addEventListener('click', () => this.showWelcomeScreen());

        // Task actions
        document.getElementById('start-task-btn').addEventListener('click', () => this.startCurrentTask());
        document.getElementById('complete-task-btn').addEventListener('click', () => this.completeCurrentTask());
        document.getElementById('skip-task-btn').addEventListener('click', () => this.skipCurrentTask());

        // Settings
        this.setupSettingsListeners();
    }

    setupSettingsListeners() {
        const settings = ['notifications-toggle', 'auto-start-toggle', 'task-delay'];
        settings.forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('change', () => this.saveSettings());
        });
    }

    // Screen management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    showWelcomeScreen() {
        this.showScreen('welcome-screen');
        this.updateStats();
    }

    showTaskScreen() {
        if (this.taskQueue.length === 0) {
            this.showMessage('No tasks available. Please refresh tasks.', 'error');
            return;
        }
        this.showScreen('task-screen');
        this.displayCurrentTask();
    }

    showSettingsScreen() {
        this.showScreen('settings-screen');
        this.loadSettings();
    }

    // Task management
    async loadTasks() {
        try {
            this.updateConnectionStatus('connecting');
            
            // For MVP, use hardcoded test tasks
            // Later: const tasks = await this.apiClient.getTasks();
            this.taskQueue = this.getTestTasks();
            this.currentTaskIndex = 0;
            
            this.updateConnectionStatus('online');
            this.showMessage(`Loaded ${this.taskQueue.length} tasks`, 'success');
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.updateConnectionStatus('offline');
            this.showMessage('Failed to load tasks. Using offline mode.', 'error');
            this.taskQueue = this.getTestTasks();
        }
    }

    getTestTasks() {
        return [
            {
                id: 1,
                title: "Visit ClickForCharity Nostr Post",
                description: "1. Click the link below to visit our Nostr post\n2. Like or repost if you have an account\n3. Wait 15 seconds on the page\n4. Click 'Learn More' link",
                targetUrl: "https://iris.to/note1ktftl9y7arjwrwrckfq2mks0qlzqlhzfsy20nn47p8exh2h3xacslfkzzn",
                duration: 30,
                points: 10,
                type: "visit"
            },
            {
                id: 2,
                title: "Google Search for ClickForCharity",
                description: "1. Search Google for 'ClickForCharity cryptocurrency charity'\n2. Find and click our official site result\n3. Browse for 20 seconds\n4. Visit the 'How it Works' page",
                targetUrl: "https://google.com/search?q=ClickForCharity+cryptocurrency+charity",
                duration: 45,
                points: 15,
                type: "search"
            },
            {
                id: 3,
                title: "Support Lightning.news",
                description: "1. Visit Lightning.news (our partner)\n2. Read an article for 30 seconds\n3. Share on social media if possible\n4. Return to ClickForCharity via their banner",
                targetUrl: "https://lightning.news",
                duration: 60,
                points: 20,
                type: "partner"
            }
        ];
    }

    displayCurrentTask() {
        if (this.currentTaskIndex >= this.taskQueue.length) {
            this.showAllTasksComplete();
            return;
        }

        this.currentTask = this.taskQueue[this.currentTaskIndex];
        
        document.getElementById('task-title').textContent = this.currentTask.title;
        document.getElementById('task-description').innerHTML = 
            this.currentTask.description.replace(/\n/g, '<br>');
        document.getElementById('task-counter').textContent = 
            `Task ${this.currentTaskIndex + 1} of ${this.taskQueue.length}`;
        
        this.resetTaskButtons();
        this.updateTaskStatus('Ready to start');
    }

    async startCurrentTask() {
        if (!this.currentTask) return;

        try {
            // Open the target URL in a new tab
            await chrome.tabs.create({ url: this.currentTask.targetUrl });
            
            // Start the task timer
            this.startTaskTimer();
            
            // Update UI
            document.getElementById('start-task-btn').classList.add('hidden');
            document.getElementById('complete-task-btn').classList.remove('hidden');
            document.getElementById('task-timer').classList.remove('hidden');
            
            this.updateTaskStatus('Task started! Complete the steps above.');
            
        } catch (error) {
            console.error('Failed to start task:', error);
            this.updateTaskStatus('Error: Could not start task');
        }
    }

    startTaskTimer() {
        let timeLeft = this.currentTask.duration;
        document.getElementById('timer-display').textContent = this.formatTime(timeLeft);
        
        this.timer = setInterval(() => {
            timeLeft--;
            document.getElementById('timer-display').textContent = this.formatTime(timeLeft);
            
            if (timeLeft <= 0) {
                this.completeCurrentTask();
            }
        }, 1000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    completeCurrentTask() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Update stats
        this.stats.tasksCompleted++;
        this.stats.pointsEarned += this.currentTask?.points || 0;
        this.saveStats();
        
        // Move to next task
        this.currentTaskIndex++;
        
        this.updateTaskStatus('Task completed! +' + (this.currentTask?.points || 0) + ' points');
        
        // Auto-advance after 2 seconds
        setTimeout(() => {
            this.displayCurrentTask();
        }, 2000);
    }

    skipCurrentTask() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.currentTaskIndex++;
        this.updateTaskStatus('Task skipped');
        
        setTimeout(() => {
            this.displayCurrentTask();
        }, 1000);
    }

    showAllTasksComplete() {
        document.getElementById('task-title').textContent = 'All Tasks Complete!';
        document.getElementById('task-description').innerHTML = 
            `Congratulations! You've completed all available tasks.<br><br>` +
            `Points earned: ${this.stats.pointsEarned}<br>` +
            `Tasks completed: ${this.stats.tasksCompleted}<br><br>` +
            `Check back later for more tasks.`;
        
        document.getElementById('task-counter').textContent = 'Session complete';
        document.getElementById('task-actions').innerHTML = 
            '<button class="primary-btn" onclick="popup.showWelcomeScreen()">Back to Home</button>';
        
        document.getElementById('task-timer').classList.add('hidden');
        this.updateTaskStatus('Great work! You\'re helping make a difference.');
    }

    resetTaskButtons() {
        document.getElementById('start-task-btn').classList.remove('hidden');
        document.getElementById('complete-task-btn').classList.add('hidden');
        document.getElementById('task-timer').classList.add('hidden');
    }

    updateTaskStatus(message) {
        document.getElementById('status-message').textContent = message;
    }

    // Stats and data management
    updateStats() {
        document.getElementById('tasks-completed').textContent = this.stats.tasksCompleted;
        document.getElementById('points-earned').textContent = this.stats.pointsEarned;
    }

    loadStats() {
        chrome.storage.sync.get(['stats'], (result) => {
            if (result.stats) {
                this.stats = result.stats;
            }
            this.updateStats();
        });
    }

    saveStats() {
        chrome.storage.sync.set({ stats: this.stats });
        this.updateStats();
    }

    // Settings management
    loadSettings() {
        chrome.storage.sync.get(['settings'], (result) => {
            const settings = result.settings || {
                notifications: true,
                autoStart: false,
                taskDelay: 5
            };
            
            document.getElementById('notifications-toggle').checked = settings.notifications;
            document.getElementById('auto-start-toggle').checked = settings.autoStart;
            document.getElementById('task-delay').value = settings.taskDelay;
        });
    }

    saveSettings() {
        const settings = {
            notifications: document.getElementById('notifications-toggle').checked,
            autoStart: document.getElementById('auto-start-toggle').checked,
            taskDelay: parseInt(document.getElementById('task-delay').value)
        };
        
        chrome.storage.sync.set({ settings });
    }

    // Connection status
    updateConnectionStatus(status) {
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        
        indicator.className = `status-dot ${status}`;
        
        switch (status) {
            case 'online':
                text.textContent = 'Online';
                break;
            case 'offline':
                text.textContent = 'Offline';
                break;
            case 'connecting':
                text.textContent = 'Connecting...';
                break;
        }
    }

    async checkConnection() {
        try {
            // For MVP, simulate connection check
            // Later: await fetch('https://clickforcharity.net/api/ping')
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.updateConnectionStatus('online');
        } catch (error) {
            this.updateConnectionStatus('offline');
        }
    }

    showMessage(message, type = 'info') {
        // Simple message display - could be enhanced with toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Update status message temporarily
        const statusEl = document.getElementById('status-message');
        if (statusEl) {
            const originalText = statusEl.textContent;
            statusEl.textContent = message;
            setTimeout(() => {
                statusEl.textContent = originalText;
            }, 3000);
        }
    }
}

// Initialize the popup when DOM is ready
let popup;
document.addEventListener('DOMContentLoaded', () => {
    popup = new SocialMediaTeamPopup();
});

// Make popup globally accessible for button onclick handlers
window.popup = popup;

