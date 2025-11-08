# Implementation Notes & Technical Considerations

## 🎯 Manifest V3 Compliance - CRITICAL

### What's Different from V2
If you're familiar with Manifest V2 extensions, here are the key changes:

**Service Workers (Not Background Pages)**
```javascript
// ❌ OLD (Manifest V2)
"background": {
  "scripts": ["background.js"],
  "persistent": true
}

// ✅ NEW (Manifest V3)
"background": {
  "service_worker": "background.js",
  "type": "module"
}
```

**No Promises with sendResponse**
```javascript
// ❌ BAD - This won't work
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  fetch(url).then(data => sendResponse(data));
  return true; // This doesn't keep the channel open
});

// ✅ GOOD - Use async/await
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleRequest(request).then(sendResponse);
  return true; // Keeps channel open
});

async function handleRequest(request) {
  const data = await fetch(url);
  return data;
}
```

**Host Permissions**
```javascript
// ❌ OLD
"permissions": ["<all_urls>"]

// ✅ NEW
"host_permissions": ["<all_urls>"]
```

### Service Worker Lifecycle

**IMPORTANT:** Service workers can be terminated by Chrome at any time. Design accordingly:

```javascript
// ❌ BAD - State will be lost
let cachedData = [];

// ✅ GOOD - Use chrome.storage
async function getCachedData() {
  const { cachedData } = await chrome.storage.local.get('cachedData');
  return cachedData || [];
}
```

## 🔍 Checkout Detection Deep Dive

### How It Works

1. **Content Script Injection**: Runs on all pages (`"matches": ["<all_urls>"]`)
2. **Pattern Matching**: Checks URL and DOM for checkout indicators
3. **Purchase Info Extraction**: Finds total amount from common selectors
4. **Background Communication**: Sends data to service worker

### Improving Detection

**For Specific Sites:**
```javascript
// In content.js - Add site-specific patterns
const SITE_PATTERNS = {
  'amazon.com': {
    totalSelector: '#subtotals-marketplace-table .grand-total-price',
    confirmButton: 'input[name="placeYourOrder1"]'
  },
  'shopify-site.com': {
    totalSelector: '.total-line__price',
    confirmButton: 'button[name="checkout"]'
  }
};
```

**For SPAs (Single Page Apps):**
```javascript
// Watch for route changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkForCheckout();
  }
}).observe(document, { subtree: true, childList: true });
```

### Common Pitfalls

**Problem:** Detection fires multiple times
```javascript
// ❌ BAD
function detectCheckout() {
  if (isCheckout) {
    sendMessage(); // Fires every mutation
  }
}

// ✅ GOOD
let hasNotified = false;
function detectCheckout() {
  if (isCheckout && !hasNotified) {
    sendMessage();
    hasNotified = true;
  }
}
```

## 💾 Storage Best Practices

### Size Limits
- `chrome.storage.local`: 10MB per extension
- `chrome.storage.sync`: 100KB total, 8KB per item

### Efficient Storage
```javascript
// ❌ BAD - Stores entire object on every change
await chrome.storage.local.set({ goals: updatedGoals });

// ✅ GOOD - Only update changed fields
await chrome.storage.local.set({ 
  [`goals.${goalId}`]: updatedGoal 
});

// Even better - batch updates
const updates = {
  goals: updatedGoals,
  lastSync: Date.now()
};
await chrome.storage.local.set(updates);
```

### Storage Events
```javascript
// Listen for storage changes across all extension contexts
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.goals) {
    console.log('Goals updated:', changes.goals.newValue);
    updateUI();
  }
});
```

## 🎨 Overlay Injection - Advanced

### Avoiding CSS Conflicts

**Use Shadow DOM (Optional but Recommended):**
```javascript
// In content.js
function injectOverlay() {
  const container = document.createElement('div');
  const shadow = container.attachShadow({ mode: 'open' });
  
  // Inject styles into shadow DOM
  const style = document.createElement('style');
  style.textContent = /* CSS from content.css */;
  shadow.appendChild(style);
  
  // Inject HTML
  const content = document.createElement('div');
  content.innerHTML = /* your overlay HTML */;
  shadow.appendChild(content);
  
  document.body.appendChild(container);
}
```

**High Z-Index Strategy:**
```css
.soundcu-overlay {
  z-index: 2147483647; /* Max 32-bit integer */
  position: fixed;
  isolation: isolate; /* Create new stacking context */
}
```

### Performance Considerations

```javascript
// ❌ BAD - Creates layout thrashing
function updateOverlay() {
  element.style.width = element.offsetWidth + 10 + 'px';
  element.style.height = element.offsetHeight + 10 + 'px';
}

// ✅ GOOD - Batch reads and writes
function updateOverlay() {
  const width = element.offsetWidth;  // Read
  const height = element.offsetHeight; // Read
  
  requestAnimationFrame(() => {
    element.style.width = width + 10 + 'px';  // Write
    element.style.height = height + 10 + 'px'; // Write
  });
}
```

## 🔒 Security Considerations

### Content Security Policy

**The extension's CSP is very strict:**
- No inline scripts (`onclick` attributes)
- No `eval()` or `new Function()`
- No remote scripts (all code must be bundled)

**Workaround for dynamic content:**
```javascript
// ❌ BAD
element.innerHTML = `<button onclick="handleClick()">Click</button>`;

// ✅ GOOD
const button = document.createElement('button');
button.textContent = 'Click';
button.addEventListener('click', handleClick);
element.appendChild(button);
```

### XSS Prevention

**Always sanitize user input:**
```javascript
// ❌ BAD
goalElement.innerHTML = goal.name;

// ✅ GOOD
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
goalElement.innerHTML = escapeHtml(goal.name);

// Even better - use textContent
goalElement.textContent = goal.name;
```

### API Security

**Never expose sensitive data in content scripts:**
```javascript
// ❌ BAD - API keys visible in content script
const API_KEY = 'sk_live_12345';

// ✅ GOOD - Keep secrets in background script
// background.js only, never in content.js
```

## 🧪 Testing Strategies

### Unit Testing

**Test storage functions:**
```javascript
// Example test (using Jest or similar)
describe('Goal Management', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });
  
  test('should create goal', async () => {
    const goal = {
      name: 'Test Goal',
      type: 'savings',
      targetAmount: 1000
    };
    
    await createGoal(goal);
    const { goals } = await chrome.storage.local.get('goals');
    
    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe('Test Goal');
  });
});
```

### E2E Testing

**Use Puppeteer for automated testing:**
```javascript
const puppeteer = require('puppeteer');

async function testExtension() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-extensions-except=./sound-cu-extension',
      '--load-extension=./sound-cu-extension'
    ]
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com/checkout');
  
  // Wait for extension to detect checkout
  await page.waitForSelector('.soundcu-overlay');
  
  // Test interactions
  await page.click('.soundcu-cta');
  
  await browser.close();
}
```

## 📊 Analytics Implementation

### Privacy-Conscious Tracking

**Use hashed identifiers:**
```javascript
async function getAnonymousId() {
  let { anonymousId } = await chrome.storage.local.get('anonymousId');
  
  if (!anonymousId) {
    // Generate hash of installation timestamp
    anonymousId = await sha256(Date.now().toString());
    await chrome.storage.local.set({ anonymousId });
  }
  
  return anonymousId;
}
```

**Batch events:**
```javascript
let eventQueue = [];

function trackEvent(event) {
  eventQueue.push(event);
  
  // Send every 10 events or every 5 minutes
  if (eventQueue.length >= 10) {
    sendEvents();
  }
}

async function sendEvents() {
  if (eventQueue.length === 0) return;
  
  await fetch(`${API_BASE_URL}/analytics/batch`, {
    method: 'POST',
    body: JSON.stringify({ events: eventQueue })
  });
  
  eventQueue = [];
}

// Set up periodic flush
chrome.alarms.create('flushEvents', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flushEvents') sendEvents();
});
```

## 🚀 Performance Optimization

### Lazy Loading

```javascript
// Don't load everything at startup
chrome.runtime.onInstalled.addListener(() => {
  // Minimal setup only
  initializeDefaults();
});

// Load heavy resources on demand
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'needBenefits') {
    import('./benefit-matcher.js').then(module => {
      module.matchBenefits(request.data);
    });
  }
});
```

### Debouncing

```javascript
// For expensive operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Use it
const debouncedSearch = debounce(searchBenefits, 300);
```

## 🔄 Update Strategy

### Versioning

**Update manifest.json version for each release:**
```json
{
  "version": "1.0.0",  // Major.Minor.Patch
  "version_name": "1.0.0 - Beta"  // Optional display name
}
```

### Handling Breaking Changes

```javascript
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    await handleMigration(previousVersion);
  }
});

async function handleMigration(fromVersion) {
  // Example: Migrate old goal format
  if (fromVersion < '2.0.0') {
    const { goals } = await chrome.storage.local.get('goals');
    const migratedGoals = goals.map(migrateGoalFormat);
    await chrome.storage.local.set({ goals: migratedGoals });
  }
}
```

## 🌐 Internationalization (Future)

**Prepare for i18n:**
```javascript
// Use chrome.i18n API
const messages = {
  "appName": {
    "message": "Sound CU Financial Co-Pilot",
    "description": "Extension name"
  },
  "goalCreated": {
    "message": "Goal created successfully!",
    "description": "Success message after creating goal"
  }
};

// In code
const message = chrome.i18n.getMessage('goalCreated');
```

## 📝 Code Style Guidelines

### Naming Conventions
- **Functions**: camelCase (`handleCheckout`, `analyzePurchase`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `CHECKOUT_PATTERNS`)
- **Classes**: PascalCase (if used)
- **File names**: kebab-case or camelCase

### Comments
```javascript
// ✅ Good - Explains WHY
// Use debouncing to avoid excessive API calls during rapid input
const debouncedSearch = debounce(search, 300);

// ❌ Bad - Explains WHAT (obvious from code)
// This function adds two numbers
function add(a, b) { return a + b; }
```

## 🐛 Common Debugging Tips

### Chrome DevTools for Extensions

1. **Service Worker Console**: `chrome://extensions` → Inspect views → service worker
2. **Popup Console**: Right-click extension icon → Inspect popup
3. **Content Script Console**: Regular page DevTools (content scripts appear in page context)

### Useful Logging

```javascript
// Structured logging
function log(level, message, data = {}) {
  console[level](`[Sound CU] ${message}`, {
    timestamp: new Date().toISOString(),
    ...data
  });
}

log('info', 'Checkout detected', { amount: 150, merchant: 'amazon.com' });
log('error', 'API call failed', { endpoint: '/benefits', error: err.message });
```

## ✅ Pre-Launch Checklist

- [ ] Test on Chrome (latest), Edge, Brave
- [ ] Test on 5+ different shopping sites
- [ ] Verify all storage operations work
- [ ] Check extension works after browser restart
- [ ] Test with network offline
- [ ] Verify CSP compliance (no console errors)
- [ ] Test goal creation, editing, deletion
- [ ] Test settings persistence
- [ ] Check data export functionality
- [ ] Review all user-facing text for typos
- [ ] Test on different screen sizes
- [ ] Verify icons display correctly
- [ ] Check memory usage (shouldn't exceed 50MB)
- [ ] Test rapid page navigation (SPAs)
- [ ] Verify no conflicts with ad blockers

---

**Questions?** Refer to official Chrome Extension docs:
https://developer.chrome.com/docs/extensions/mv3/
