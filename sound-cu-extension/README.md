# Sound Credit Union - Financial Co-Pilot Chrome Extension

A Manifest V3 Chrome extension that acts as a member-driven financial assistant, helping users maximize their credit union benefits and achieve their financial goals.

## 🎯 Features

### 1. **Smart Checkout Detection**
- Automatically detects when users are on checkout/payment pages
- Analyzes purchase context (amount, merchant, type)
- Works across major e-commerce platforms (Shopify, Stripe, PayPal, etc.)

### 2. **Benefit Recommendations**
- Shows personalized CU benefit prompts at checkout
- Highlights low-rate loans for large purchases
- Suggests cashback opportunities
- Calculates real-time savings vs. typical credit cards

### 3. **Financial Goal Tracking**
- Create multiple financial goals:
  - **Savings Goals**: Track progress toward savings targets
  - **Spending Limits**: Monitor monthly/periodic spending
- Real-time impact analysis showing how purchases affect goals
- Visual progress tracking with alerts when approaching limits

### 4. **Goal Dashboard**
- Clean, intuitive popup interface
- Quick stats overview (active goals, total savings)
- Edit and manage goals easily
- View recent activity and trends

### 5. **Smart Notifications**
- Non-intrusive overlays at checkout
- Goal impact warnings when purchases affect targets
- Configurable notification preferences

## 🏗️ Architecture

### Manifest V3 Compliance
This extension fully complies with Chrome's Manifest V3 requirements:

- ✅ **Service Worker**: Background processing using `background.js`
- ✅ **Content Scripts**: Page analysis via `content.js`
- ✅ **Secure Communication**: Message passing between components
- ✅ **Local Storage**: Chrome Storage API for user data
- ✅ **No Remote Code**: All code bundled in extension
- ✅ **CSP Compliant**: No inline scripts or eval()

### File Structure
```
sound-cu-extension/
├── manifest.json           # Extension configuration
├── background.js          # Service worker (backend logic)
├── content.js            # Content script (page interaction)
├── content.css           # Overlay styles
├── popup.html            # Dashboard UI
├── popup.css             # Dashboard styles
├── popup.js              # Dashboard logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

### Component Communication Flow

```
┌─────────────┐
│   Popup     │  User manages goals
│ (Dashboard) │  
└──────┬──────┘
       │
       ↓ chrome.storage
┌─────────────────┐
│ chrome.storage  │  Persistent data layer
└────────┬────────┘
         │
         ↓
┌──────────────────┐
│ Service Worker   │  Orchestrates logic
│  (background.js) │  - Benefit matching
└────────┬─────────┘  - Goal analysis
         │            - API communication
         ↓
┌──────────────────┐
│ Content Script   │  Page interaction
│   (content.js)   │  - Checkout detection
└──────────────────┘  - Overlay injection
```

## 🚀 Installation & Setup

### For Development

1. **Clone/Download** this extension folder

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** (toggle in top-right)

4. **Load Unpacked Extension**:
   - Click "Load unpacked"
   - Select the `sound-cu-extension` folder
   - Extension should now appear in your extensions list

5. **Pin the Extension**:
   - Click the puzzle icon in Chrome toolbar
   - Find "Sound CU Financial Co-Pilot"
   - Click the pin icon to keep it visible

### For Testing

1. **Create Your First Goal**:
   - Click the extension icon
   - Click "Create Your First Goal"
   - Add a savings goal or spending limit

2. **Test Checkout Detection**:
   - Visit any shopping site (Amazon, eBay, etc.)
   - Add items to cart and go to checkout
   - The extension should detect the checkout page
   - Look for benefit overlays or goal impact notifications

3. **Test Goal Tracking**:
   - Make sure you have an active goal
   - Visit checkout pages with different amounts
   - See how purchases would impact your goals

## 🔧 Configuration

### API Integration

The extension is designed to work with a FastAPI backend. To connect:

1. Open `background.js`
2. Update the `API_BASE_URL` constant:
```javascript
const API_BASE_URL = 'https://your-api.soundcu.org';
```

3. Implement the following endpoints on your backend:
   - `POST /benefits/relevant` - Get relevant benefits for a purchase
   - `POST /sync` - Sync user goals and preferences
   - `GET /user/profile` - Get user account info

### Checkout Detection Customization

To add detection for specific sites, edit `content.js`:

```javascript
const CHECKOUT_PATTERNS = {
  selectors: [
    // Add custom selectors
    '.your-custom-checkout-class',
    '#your-checkout-id'
  ],
  urlPatterns: [
    /your-site-pattern/i
  ]
};
```

### Mock Data (Prototype Mode)

Currently, the extension uses mock benefit data for prototyping. This is defined in `background.js`:

```javascript
// Mock benefits (lines ~60-80)
return [
  {
    id: 'low-rate-loan',
    type: 'loan',
    title: 'Low-Rate Purchase Loan',
    description: 'Get 5.99% APR for purchases over $1,000',
    savings: 'Save $150 vs. typical credit card',
    ctaText: 'Apply Now',
    ctaUrl: 'https://soundcu.org/loans'
  }
];
```

Replace this with actual API calls when ready for production.

## 📊 Data Storage

### Chrome Storage Schema

```javascript
{
  // User onboarding status
  "isOnboarded": boolean,
  
  // Financial goals array
  "goals": [
    {
      "id": "goal_1234567890_abc",
      "name": "Emergency Fund",
      "type": "savings" | "spending_limit",
      "targetAmount": 1000.00,
      "currentAmount": 250.00,  // for savings goals
      "currentSpending": 0,     // for spending limits
      "deadline": "2025-12-31" | null,
      "notes": "Optional notes",
      "createdAt": "2025-01-15T10:30:00Z",
      "lastUpdated": "2025-01-20T15:45:00Z"
    }
  ],
  
  // User preferences
  "userPreferences": {
    "enableNotifications": true,
    "enableCheckoutPrompts": true,
    "enableGoalTracking": true
  },
  
  // Last sync timestamp
  "lastSync": "2025-01-20T15:45:00Z" | null,
  
  // Cached benefits (optional)
  "cachedBenefits": []
}
```

### Privacy & Security

- **All data stored locally** in user's Chrome profile
- No data collected or sent anywhere by default
- Backend integration is opt-in
- Users can export or delete their data anytime

## 🎨 Customization

### Branding

1. **Colors**: Edit CSS variables in `popup.css` and `content.css`
```css
/* Primary color */
background: #0066cc; /* Change to your brand color */
```

2. **Logo**: Replace icon files in `icons/` folder
   - Use PNG format
   - Sizes: 16x16, 32x32, 48x48, 128x128
   - Maintain aspect ratio

3. **Copy**: Update text in `popup.html` and content script overlays

### Adding New Features

#### Add a New Goal Type

1. Update the goal type dropdown in `popup.html`:
```html
<option value="debt_payoff">Debt Payoff</option>
```

2. Add logic in `popup.js` `calculateProgress()`:
```javascript
else if (goal.type === 'debt_payoff') {
  return ((goal.targetAmount - goal.currentAmount) / goal.targetAmount) * 100;
}
```

3. Update impact analysis in `background.js` if needed

## 🐛 Troubleshooting

### Extension Not Loading
- Check Chrome version (requires Chrome 88+)
- Ensure all files are present
- Check Developer Tools console for errors

### Checkout Not Detected
- Open DevTools console and check for "Sound CU: Checkout page detected"
- Verify the page has payment form elements
- Add custom selectors if needed

### Goals Not Saving
- Check Chrome Storage in DevTools:
  - Extensions → Sound CU → Inspect views: service worker
  - Application tab → Storage → Local Storage
- Verify no console errors in popup

### Overlays Not Showing
- Check that `enableCheckoutPrompts` is true in settings
- Verify content.css is loading
- Check for CSS conflicts with host page

## 📈 Future Enhancements

### Planned Features
- [ ] Machine learning for better purchase categorization
- [ ] Integration with bank feeds for automatic tracking
- [ ] Budgeting tools and spending analytics
- [ ] Social features (goal sharing, leaderboards)
- [ ] Mobile app companion
- [ ] Multi-language support

### API Roadmap
- [ ] OAuth authentication
- [ ] Real-time benefit matching
- [ ] Transaction history sync
- [ ] Personalized recommendations engine
- [ ] Webhook notifications

## 📄 License

Copyright © 2025 Sound Credit Union. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 🤝 Support

For technical support or questions:
- Email: support@soundcu.org
- Documentation: https://soundcu.org/extension/docs
- Developer Portal: https://developers.soundcu.org

## 🔒 Security

### Reporting Vulnerabilities
If you discover a security vulnerability, please email security@soundcu.org

### Security Features
- Content Security Policy (CSP) compliant
- No remote code execution
- Secure message passing
- Local data encryption (Chrome handles this)
- No tracking or analytics by default

## 📝 Changelog

### Version 1.0.0 (Current)
- Initial release
- Checkout detection and benefit overlays
- Goal tracking dashboard
- Real-time impact analysis
- Settings and preferences management
- Export/import functionality

---

**Built with ❤️ for Sound Credit Union members**
