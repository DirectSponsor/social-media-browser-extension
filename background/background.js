// Background service worker for ClickForCharity Social Media Team Extension

class BackgroundService {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeBadge();
    }

    setupEventListeners() {
        // Extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Tab updates - to detect when user visits target sites
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Messages from content scripts or popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Alarm for periodic tasks
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }

    handleInstallation(details) {
        console.log('ClickForCharity Social Media Team Extension installed:', details.reason);
        
        if (details.reason === 'install') {
            this.showWelcomeNotification();
            this.initializeUserData();
        } else if (details.reason === 'update') {
            this.handleUpdate(details.previousVersion);
        }
    }

    async showWelcomeNotification() {
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icons/icon48.png',
                title: 'Welcome to ClickForCharity Social Media Team!',
                message: 'Thank you for joining our mission. Click the extension icon to start helping!'
            });
        } catch (error) {
            console.log('Notifications not available:', error);
        }
    }

    initializeUserData() {
        // Set default user data
        const defaultData = {
            stats: { tasksCompleted: 0, pointsEarned: 0 },
            settings: {
                notifications: true,
                autoStart: false,
                taskDelay: 5
            },
            lastTaskFetch: 0
        };

        chrome.storage.sync.set(defaultData);
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Only process complete page loads
        if (changeInfo.status !== 'complete' || !tab.url) return;

        // Check if this is a target site for tasks
        const targetSites = [
            'clickforcharity.net',
            'iris.to',
            'lightning.news',
            'google.com'
        ];

        const isTargetSite = targetSites.some(site => tab.url.includes(site));
        
        if (isTargetSite) {
            this.notifyContentScript(tabId, {
                type: 'TARGET_SITE_DETECTED',
                url: tab.url,
                tabId: tabId
            });
        }
    }

    async notifyContentScript(tabId, message) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
        } catch (error) {
            console.log('Could not send message to content script:', error);
        }
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'GET_TASKS':
                this.getTasks().then(sendResponse);
                break;
                
            case 'TASK_COMPLETED':
                this.handleTaskCompletion(message.taskId, message.points);
                sendResponse({ success: true });
                break;
                
            case 'UPDATE_BADGE':
                this.updateBadge(message.count);
                sendResponse({ success: true });
                break;
                
            case 'OPEN_TAB':
                this.openTab(message.url).then(sendResponse);
                break;
                
            default:
                console.log('Unknown message type:', message.type);
                sendResponse({ error: 'Unknown message type' });
        }
    }

    async getTasks() {
        try {
            // For MVP, return hardcoded tasks
            // Later: fetch from ClickForCharity API
            return {
                success: true,
                tasks: this.getHardcodedTasks()
            };
        } catch (error) {
            console.error('Failed to get tasks:', error);
            return {
                success: false,
                error: error.message,
                tasks: this.getHardcodedTasks() // Fallback
            };
        }
    }

    getHardcodedTasks() {
        return [
            {
                id: 'nostr-engagement-' + Date.now(),
                title: "Engage with ClickForCharity on Nostr",
                description: "Visit our latest Nostr post, engage with content, and help spread awareness about cryptocurrency charity.",
                targetUrl: "https://iris.to/note1ktftl9y7arjwrwrckfq2mks0qlzqlhzfsy20nn47p8exh2h3xacslfkzzn",
                duration: 45,
                points: 15,
                type: "social",
                steps: [
                    "Visit the Nostr post",
                    "Like or repost if you have an account",
                    "Read the content for at least 30 seconds",
                    "Follow any links to ClickForCharity"
                ]
            },
            {
                id: 'seo-boost-' + Date.now(),
                title: "Help our SEO with Google Search",
                description: "Search for ClickForCharity on Google and visit our site to improve our search rankings.",
                targetUrl: "https://google.com/search?q=ClickForCharity+cryptocurrency+charity",
                duration: 60,
                points: 20,
                type: "seo",
                steps: [
                    "Search for 'ClickForCharity cryptocurrency charity'",
                    "Find and click our official website",
                    "Browse for at least 45 seconds",
                    "Visit the 'How it Works' page"
                ]
            },
            {
                id: 'partner-support-' + Date.now(),
                title: "Support our Partner Lightning.news",
                description: "Visit Lightning.news, read an article, and help support our media partner.",
                targetUrl: "https://lightning.news",
                duration: 90,
                points: 25,
                type: "partner",
                steps: [
                    "Visit Lightning.news homepage",
                    "Read a featured article for 60+ seconds",
                    "Share on social media if possible",
                    "Return to ClickForCharity via any banner/link"
                ]
            }
        ];
    }

    async openTab(url) {
        try {
            const tab = await chrome.tabs.create({ url });
            return { success: true, tabId: tab.id };
        } catch (error) {
            console.error('Failed to open tab:', error);
            return { success: false, error: error.message };
        }
    }

    handleTaskCompletion(taskId, points) {
        // Update user stats
        chrome.storage.sync.get(['stats'], (result) => {
            const stats = result.stats || { tasksCompleted: 0, pointsEarned: 0 };
            stats.tasksCompleted++;
            stats.pointsEarned += points;
            
            chrome.storage.sync.set({ stats });
            
            // Update badge
            this.updateBadge(stats.tasksCompleted);
            
            // Show completion notification
            this.showTaskCompletionNotification(points);
        });
    }

    async showTaskCompletionNotification(points) {
        try {
            const settings = await chrome.storage.sync.get(['settings']);
            
            if (settings.settings?.notifications) {
                await chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/icon48.png',
                    title: 'Task Completed!',
                    message: `Great work! You earned ${points} points for ClickForCharity.`
                });
            }
        } catch (error) {
            console.log('Could not show notification:', error);
        }
    }

    updateBadge(count) {
        try {
            chrome.action.setBadgeText({ 
                text: count > 0 ? count.toString() : '' 
            });
            chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
        } catch (error) {
            console.log('Could not update badge:', error);
        }
    }

    initializeBadge() {
        chrome.storage.sync.get(['stats'], (result) => {
            const stats = result.stats || { tasksCompleted: 0 };
            this.updateBadge(stats.tasksCompleted);
        });
    }

    handleAlarm(alarm) {
        switch (alarm.name) {
            case 'fetch-new-tasks':
                this.fetchNewTasks();
                break;
            case 'daily-reminder':
                this.showDailyReminder();
                break;
        }
    }

    async fetchNewTasks() {
        // Placeholder for periodic task fetching
        console.log('Fetching new tasks...');
    }

    async showDailyReminder() {
        try {
            const settings = await chrome.storage.sync.get(['settings']);
            
            if (settings.settings?.notifications) {
                await chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/icon48.png',
                    title: 'ClickForCharity Reminder',
                    message: 'Ready to help? New social media tasks are available!'
                });
            }
        } catch (error) {
            console.log('Could not show reminder:', error);
        }
    }

    handleUpdate(previousVersion) {
        console.log(`Extension updated from ${previousVersion}`);
        // Handle any migration logic here
    }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundService;
}

