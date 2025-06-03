// Content script for ClickForCharity Social Media Team Extension
// Runs on all web pages to detect and verify task completion

class ContentScriptManager {
    constructor() {
        this.isTargetSite = false;
        this.currentTask = null;
        this.pageLoadTime = Date.now();
        this.init();
    }

    init() {
        this.detectTargetSite();
        this.setupMessageListener();
        this.trackPageInteraction();
    }

    detectTargetSite() {
        const targetSites = {
            'clickforcharity.net': 'official',
            'iris.to': 'nostr',
            'lightning.news': 'partner',
            'google.com': 'search',
            'twitter.com': 'social',
            'x.com': 'social'
        };

        const currentDomain = window.location.hostname.toLowerCase();
        
        for (const [domain, type] of Object.entries(targetSites)) {
            if (currentDomain.includes(domain)) {
                this.isTargetSite = true;
                this.siteType = type;
                this.notifyBackgroundScript('TARGET_SITE_VISITED', {
                    domain: currentDomain,
                    type: type,
                    url: window.location.href,
                    timestamp: Date.now()
                });
                break;
            }
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open
        });
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'TARGET_SITE_DETECTED':
                this.handleTargetSiteDetection(message);
                sendResponse({ received: true });
                break;
                
            case 'START_TASK_VERIFICATION':
                this.startTaskVerification(message.task);
                sendResponse({ started: true });
                break;
                
            case 'CHECK_PAGE_INTERACTION':
                sendResponse(this.getPageInteractionData());
                break;
                
            case 'VERIFY_TASK_COMPLETION':
                const verification = this.verifyTaskCompletion(message.task);
                sendResponse(verification);
                break;
                
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    }

    handleTargetSiteDetection(message) {
        // Additional setup when background detects this is a target site
        console.log('Target site detected by background:', message);
        
        if (this.siteType === 'nostr') {
            this.setupNostrInteractionTracking();
        } else if (this.siteType === 'search') {
            this.setupSearchInteractionTracking();
        } else if (this.siteType === 'official') {
            this.setupOfficialSiteTracking();
        }
    }

    trackPageInteraction() {
        this.interactions = {
            timeOnPage: 0,
            scrollDepth: 0,
            clickCount: 0,
            linksClicked: [],
            formsInteracted: false
        };

        // Track time on page
        setInterval(() => {
            this.interactions.timeOnPage += 1;
        }, 1000);

        // Track scroll depth
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            this.interactions.scrollDepth = Math.max(this.interactions.scrollDepth, scrollPercent);
        });

        // Track clicks
        document.addEventListener('click', (event) => {
            this.interactions.clickCount++;
            
            if (event.target.tagName === 'A') {
                this.interactions.linksClicked.push({
                    href: event.target.href,
                    text: event.target.textContent.trim(),
                    timestamp: Date.now()
                });
            }
        });

        // Track form interactions
        document.addEventListener('input', () => {
            this.interactions.formsInteracted = true;
        });
    }

    setupNostrInteractionTracking() {
        // Specific tracking for Nostr sites like iris.to
        console.log('Setting up Nostr interaction tracking');
        
        // Look for like/repost buttons
        const checkForInteractionButtons = () => {
            const likeButtons = document.querySelectorAll('[aria-label*="like" i], [title*="like" i], .like-button');
            const repostButtons = document.querySelectorAll('[aria-label*="repost" i], [title*="repost" i], .repost-button');
            
            likeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.notifyBackgroundScript('NOSTR_INTERACTION', {
                        type: 'like',
                        timestamp: Date.now()
                    });
                });
            });
            
            repostButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.notifyBackgroundScript('NOSTR_INTERACTION', {
                        type: 'repost',
                        timestamp: Date.now()
                    });
                });
            });
        };
        
        // Check now and again after DOM changes
        checkForInteractionButtons();
        setTimeout(checkForInteractionButtons, 2000);
    }

    setupSearchInteractionTracking() {
        // Specific tracking for Google search
        console.log('Setting up search interaction tracking');
        
        // Monitor search form submissions
        const searchForms = document.querySelectorAll('form[role="search"], #tsf');
        searchForms.forEach(form => {
            form.addEventListener('submit', () => {
                const query = form.querySelector('input[type="search"], input[name="q"]')?.value;
                this.notifyBackgroundScript('SEARCH_PERFORMED', {
                    query: query,
                    timestamp: Date.now()
                });
            });
        });
        
        // Monitor clicks on search results
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href && link.href.includes('clickforcharity')) {
                this.notifyBackgroundScript('SEARCH_RESULT_CLICKED', {
                    url: link.href,
                    text: link.textContent.trim(),
                    timestamp: Date.now()
                });
            }
        });
    }

    setupOfficialSiteTracking() {
        // Specific tracking for ClickForCharity.net
        console.log('Setting up official site tracking');
        
        // Track navigation to key pages
        const keyPages = ['how-it-works', 'donate', 'recipients', 'about'];
        
        keyPages.forEach(page => {
            if (window.location.href.includes(page)) {
                this.notifyBackgroundScript('KEY_PAGE_VISITED', {
                    page: page,
                    timestamp: Date.now()
                });
            }
        });
    }

    startTaskVerification(task) {
        this.currentTask = task;
        console.log('Starting task verification for:', task.title);
        
        // Set up task-specific verification
        if (task.type === 'visit') {
            this.verifyVisitTask(task);
        } else if (task.type === 'search') {
            this.verifySearchTask(task);
        } else if (task.type === 'social') {
            this.verifySocialTask(task);
        }
    }

    verifyVisitTask(task) {
        // Verify user spent required time and performed actions
        const requiredTime = task.duration || 30;
        
        setTimeout(() => {
            if (this.interactions.timeOnPage >= requiredTime) {
                this.notifyBackgroundScript('TASK_VERIFICATION_PASSED', {
                    taskId: task.id,
                    type: 'time_spent',
                    timeSpent: this.interactions.timeOnPage
                });
            }
        }, requiredTime * 1000);
    }

    verifySearchTask(task) {
        // Verify search was performed and results clicked
        const checkInterval = setInterval(() => {
            const hasSearched = this.interactions.linksClicked.some(link => 
                link.href.includes('clickforcharity')
            );
            
            if (hasSearched && this.interactions.timeOnPage >= 30) {
                this.notifyBackgroundScript('TASK_VERIFICATION_PASSED', {
                    taskId: task.id,
                    type: 'search_and_click'
                });
                clearInterval(checkInterval);
            }
        }, 5000);
    }

    verifySocialTask(task) {
        // Verify social media engagement
        const checkInterval = setInterval(() => {
            if (this.interactions.timeOnPage >= 30 && this.interactions.clickCount >= 1) {
                this.notifyBackgroundScript('TASK_VERIFICATION_PASSED', {
                    taskId: task.id,
                    type: 'social_engagement',
                    interactions: this.interactions.clickCount
                });
                clearInterval(checkInterval);
            }
        }, 10000);
    }

    getPageInteractionData() {
        return {
            isTargetSite: this.isTargetSite,
            siteType: this.siteType,
            interactions: this.interactions,
            url: window.location.href,
            timeOnPage: Math.floor((Date.now() - this.pageLoadTime) / 1000)
        };
    }

    verifyTaskCompletion(task) {
        const data = this.getPageInteractionData();
        
        // Basic verification logic
        const verification = {
            taskId: task.id,
            completed: false,
            score: 0,
            details: {}
        };

        // Time-based verification
        if (data.timeOnPage >= (task.duration || 30)) {
            verification.score += 50;
            verification.details.timeRequirementMet = true;
        }

        // Interaction-based verification
        if (data.interactions.clickCount >= 1) {
            verification.score += 25;
            verification.details.interactionDetected = true;
        }

        // Scroll-based verification (shows engagement)
        if (data.interactions.scrollDepth >= 25) {
            verification.score += 25;
            verification.details.scrollEngagement = true;
        }

        verification.completed = verification.score >= 75;
        
        return verification;
    }

    notifyBackgroundScript(type, data) {
        chrome.runtime.sendMessage({
            type: type,
            data: data,
            timestamp: Date.now(),
            url: window.location.href
        }).catch(error => {
            console.log('Could not send message to background:', error);
        });
    }
}

// Initialize content script only if not already initialized
if (!window.clickForCharityContentScript) {
    window.clickForCharityContentScript = new ContentScriptManager();
}

