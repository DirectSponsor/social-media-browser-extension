# ClickForCharity Social Media Team Extension - Development Guide

## 🚀 Quick Start for Beta Testing

### Loading the Extension in Chrome (Developer Mode)

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in your address bar
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to and select the `social-media-team-extension` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "ClickForCharity Social Media Team"
   - Click the pin icon to keep it visible

### Testing the Extension

1. **Open the Extension**
   - Click the ClickForCharity extension icon in your toolbar
   - You should see the welcome screen with stats

2. **Start Your First Task**
   - Click "Start Tasks" button
   - Follow the task instructions
   - The extension will track your progress automatically

3. **Test Different Task Types**
   - Visit Nostr posts and engage
   - Perform Google searches for ClickForCharity
   - Browse partner sites like Lightning.news
   - Explore the main ClickForCharity website

### Current MVP Features

✅ **Working Features:**
- Extension popup with clean UI
- Task queue system with 3 test tasks
- Timer tracking and progress monitoring
- Points system and statistics
- Settings panel
- Connection status indicator
- Tab opening for task URLs
- Basic task verification

⚠️ **MVP Limitations:**
- Tasks are hardcoded (not server-fetched)
- Basic verification (time + interaction based)
- No user accounts yet
- Limited task types
- Placeholder icons

## 🛠 Development Details

### Project Structure
```
social-media-team-extension/
├── manifest.json              # Chrome extension configuration
├── popup/
│   ├── popup.html            # Main UI interface
│   ├── popup.css             # Styling
│   └── popup.js              # UI logic and task management
├── content/
│   └── content.js            # Page interaction and verification
├── background/
│   └── background.js         # Background service worker
├── tests/
│   └── test_tasks.json       # Test task definitions
└── docs/
    └── DEVELOPMENT_GUIDE.md   # This file
```

### Key Components

#### 1. Popup Interface (`popup/`)
- **popup.html**: Clean, responsive UI with welcome, task, and settings screens
- **popup.css**: Modern styling with ClickForCharity branding colors
- **popup.js**: Task management, timer functionality, stats tracking

#### 2. Content Script (`content/content.js`)
- Runs on all web pages
- Detects target sites (ClickForCharity, Nostr, Google, etc.)
- Tracks user interactions (time, clicks, scrolling)
- Verifies task completion

#### 3. Background Service (`background/background.js`)
- Manages extension lifecycle
- Handles tab updates and messaging
- Stores user data and statistics
- Shows notifications for task completion

### Extension Permissions

The extension requests these permissions:
- `activeTab`: Access current tab for task verification
- `storage`: Store user stats and settings
- `tabs`: Open new tabs for tasks
- `scripting`: Inject content scripts

Host permissions for:
- ClickForCharity.net
- Google.com
- Nostr sites (iris.to)
- Lightning.news
- Social media (Twitter/X)

### Data Storage

User data is stored locally using Chrome's storage API:
```javascript
{
  stats: { tasksCompleted: 0, pointsEarned: 0 },
  settings: {
    notifications: true,
    autoStart: false,
    taskDelay: 5
  }
}
```

## 🧪 Testing Scenarios

### Test 1: Basic Task Flow
1. Open extension popup
2. Click "Start Tasks"
3. Complete first task (Nostr engagement)
4. Verify timer counts down
5. Mark task complete
6. Check stats updated

### Test 2: Settings Management
1. Open settings screen
2. Toggle notifications
3. Change task delay
4. Verify settings persist

### Test 3: Multi-Tab Workflow
1. Start a task in extension
2. New tab opens with target URL
3. Perform required actions on target site
4. Return to extension
5. Complete task and move to next

### Test 4: Content Script Detection
1. Visit clickforcharity.net manually
2. Check browser console for content script logs
3. Verify target site detection
4. Test interaction tracking

## 🔧 Customization for Beta Testing

### Adding New Tasks

Edit the `getTestTasks()` function in `popup/popup.js`:

```javascript
getTestTasks() {
    return [
        {
            id: 'your-task-id',
            title: "Your Task Title",
            description: "Task instructions...",
            targetUrl: "https://target-site.com",
            duration: 60, // seconds
            points: 20,
            type: "task-type"
        }
        // ... more tasks
    ];
}
```

### Modifying UI Colors

Edit `popup/popup.css` to change the color scheme:

```css
:root {
    --primary-color: #667eea;    /* Main brand color */
    --secondary-color: #764ba2;   /* Gradient color */
    --success-color: #28a745;     /* Success/complete */
    --warning-color: #ffc107;     /* Warnings/pending */
}
```

### Adjusting Task Verification

Modify verification logic in `content/content.js`:

```javascript
verifyTaskCompletion(task) {
    // Customize verification criteria
    const verification = {
        taskId: task.id,
        completed: false,
        score: 0
    };
    
    // Add your verification logic here
    
    return verification;
}
```

## 🐛 Troubleshooting

### Extension Won't Load
- Check manifest.json syntax
- Ensure all files are present
- Check Chrome console for errors
- Try reloading the extension

### Tasks Not Working
- Open Chrome DevTools → Console
- Look for JavaScript errors
- Check if target URLs are accessible
- Verify permissions in manifest.json

### Content Script Issues
- Visit chrome://extensions/
- Check for content script errors
- Ensure host permissions are granted
- Test on different websites

### Storage Problems
- Check chrome://settings/content/all
- Ensure storage permissions granted
- Clear extension data and retry

## 📝 Beta Testing Feedback

When testing, please note:

1. **User Experience**
   - Is the UI intuitive?
   - Are task instructions clear?
   - Does the timer work correctly?

2. **Task Completion**
   - Do tasks open the right URLs?
   - Is verification working?
   - Are points awarded correctly?

3. **Technical Issues**
   - Any console errors?
   - Extension crashes?
   - Performance problems?

4. **Feature Requests**
   - What's missing?
   - What would be helpful?
   - Suggested improvements?

## 🚀 Next Phase Features

Planned for future releases:
- Server-based task management
- User account integration
- Advanced task verification
- Firefox support
- Mobile app companion
- Team leaderboards
- Automated task generation

---

**Ready to test?** Load the extension and start helping ClickForCharity grow its social media presence!

