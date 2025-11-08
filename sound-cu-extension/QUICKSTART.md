# 🚀 Quick Start Guide

## Installation (2 minutes)

### Step 1: Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `sound-cu-extension` folder
5. ✅ Extension is now installed!

### Step 2: Pin the Extension
1. Click the puzzle icon (🧩) in Chrome toolbar
2. Find "Sound CU Financial Co-Pilot"
3. Click the pin icon to keep it visible

### Step 3: Create Your First Goal
1. Click the extension icon
2. Click "Create Your First Goal"
3. Fill in:
   - Goal Name: "Emergency Fund"
   - Goal Type: "Savings Goal"
   - Target Amount: 1000
4. Click "Save Goal"

## Testing (5 minutes)

### Test 1: Checkout Detection
1. Open `test-checkout.html` in Chrome (included in extension folder)
2. Open DevTools Console (F12)
3. Look for: "Sound CU: Checkout page detected"
4. You should see benefit overlays appear!

### Test 2: Goal Impact
1. Make sure you have a goal created
2. On the test checkout page, try different amounts:
   - Click "$500 Test" button
   - Click "$1,000 Test" button
   - Click "$2,500 Test" button
3. Watch for goal impact notifications

### Test 3: Real Websites
Try on actual shopping sites:
- Amazon.com (add to cart, go to checkout)
- eBay.com (bid/buy now pages)
- Any site with payment forms

## Common Issues

### "Extension not detecting checkout"
- ✅ Check DevTools console for errors
- ✅ Verify the page has payment form fields
- ✅ Try refreshing the page

### "Overlays not showing"
- ✅ Check Settings: ensure "Checkout Prompts" is enabled
- ✅ Clear browser cache and reload
- ✅ Check for CSS conflicts in DevTools

### "Goals not saving"
- ✅ Check Chrome Storage in DevTools
- ✅ Verify no console errors
- ✅ Try reopening the extension popup

## Next Steps

### For Developers
1. Read `DEVELOPER_GUIDE.md` for backend integration
2. Configure API endpoints in `background.js`
3. Customize checkout detection patterns in `content.js`
4. Deploy backend API (FastAPI example included)

### For Designers
1. Update colors in `popup.css` and `content.css`
2. Replace icons in `icons/` folder
3. Customize overlay layouts in `content.js`
4. Modify copy/messaging in HTML files

### For Product Managers
1. Review user flow diagrams (Frame 1-7)
2. Test with real member scenarios
3. Gather feedback on benefit prompts
4. Define additional goal types needed

## Key Features to Demo

✨ **Smart Checkout Detection**
- Automatically finds payment pages
- Works on major e-commerce sites
- No user action required

💰 **Benefit Recommendations**
- Shows relevant CU benefits at checkout
- Calculates real savings
- One-click to apply

🎯 **Goal Tracking**
- Create multiple financial goals
- Real-time impact analysis
- Visual progress tracking

⚙️ **User Control**
- Full privacy - data stored locally
- Toggle features on/off
- Export data anytime

## Need Help?

- 📖 Full docs: `README.md`
- 🔧 Developer guide: `DEVELOPER_GUIDE.md`
- 🐛 Found a bug? Check DevTools console first
- 💬 Questions? Contact: developers@soundcu.org

---

**Ready to customize?** Start with `background.js` to connect your API!
