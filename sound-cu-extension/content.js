// content.js - Content Script for Sound CU Extension
// Runs on all pages to detect checkout flows and inject overlays

(function() {
  'use strict';

  // Configuration
  const CHECKOUT_PATTERNS = {
    selectors: [
      // Common checkout page indicators
      'input[type="text"][name*="card"]',
      'input[name*="cc"]',
      'input[name*="credit"]',
      '[class*="checkout"]',
      '[class*="payment"]',
      '[id*="checkout"]',
      '[id*="payment"]',
      // E-commerce platforms
      '.shopify-payment-button',
      '#stripe-card-element',
      '.paypal-button'
    ],
    urlPatterns: [
      /checkout/i,
      /cart/i,
      /payment/i,
      /billing/i
    ]
  };

  let overlayInjected = false;
  let isCheckoutPage = false;

  // Detect if we're on a checkout page
  function detectCheckoutPage() {
    // Check URL
    const url = window.location.href.toLowerCase();
    const urlMatch = CHECKOUT_PATTERNS.urlPatterns.some(pattern => pattern.test(url));
    
    if (urlMatch) {
      return true;
    }

    // Check DOM elements
    const elementMatch = CHECKOUT_PATTERNS.selectors.some(selector => {
      return document.querySelector(selector) !== null;
    });

    return elementMatch;
  }

  // Extract purchase information from the page
  function extractPurchaseInfo() {
    const purchaseInfo = {
      amount: null,
      currency: 'USD',
      merchant: window.location.hostname,
      timestamp: new Date().toISOString()
    };

    // Try to find total amount
    const amountPatterns = [
      { selector: '[class*="total"]', attribute: 'textContent' },
      { selector: '[id*="total"]', attribute: 'textContent' },
      { selector: '.price', attribute: 'textContent' },
      { selector: '[class*="amount"]', attribute: 'textContent' }
    ];

    for (const pattern of amountPatterns) {
      const element = document.querySelector(pattern.selector);
      if (element) {
        const text = element[pattern.attribute];
        const match = text.match(/\$?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
        if (match) {
          purchaseInfo.amount = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
    }

    return purchaseInfo;
  }

  // Inject benefit overlay with new minimal design
  function injectBenefitOverlay(benefits, purchaseAmount) {
    if (overlayInjected) {
      const existing = document.getElementById('soundcu-benefit-overlay');
      if (existing) existing.remove();
      overlayInjected = false;
    }

    const overlay = document.createElement('div');
    overlay.id = 'soundcu-benefit-overlay';
    overlay.className = 'soundcu-overlay-minimal';
    
    // Calculate cashback (assuming 3% from benefits)
    const cashbackBenefit = benefits.find(b => b.type === 'cashback');
    const cashbackAmount = cashbackBenefit ? (purchaseAmount * 0.03).toFixed(2) : '0.00';
    const spendingPercentage = cashbackBenefit && cashbackBenefit.spendingPercentage ? 
      cashbackBenefit.spendingPercentage : 11;
    
    overlay.innerHTML = `
      <div class="soundcu-card">
        <div class="soundcu-card-header">
          <div class="soundcu-logo-text">
            <span class="soundcu-brand">sound credit union</span>
            <img src="${chrome.runtime.getURL('icons/icon16.png')}" alt="" class="soundcu-brand-icon">
          </div>
          <div class="soundcu-header-icons">
            <button class="soundcu-icon-btn" id="soundcu-settings" title="Settings">⚙️</button>
            <button class="soundcu-icon-btn" id="soundcu-close-overlay" title="Close">👤</button>
          </div>
        </div>
        
        <div class="soundcu-alerts">
          <div class="soundcu-alert soundcu-alert-green">
            <span class="soundcu-alert-text">Earn <strong>$${cashbackAmount}</strong> back with your <strong>Chase Amazon Prime</strong> credit card!</span>
          </div>
          
          <div class="soundcu-alert soundcu-alert-yellow">
            <span class="soundcu-alert-text">This purchase adds <strong>${spendingPercentage}%</strong> to your monthly spending</span>
          </div>
        </div>
        
        <div class="soundcu-actions">
          <button class="soundcu-btn soundcu-btn-secondary" id="soundcu-revise-goals">Revise my goals</button>
          <button class="soundcu-btn soundcu-btn-secondary" id="soundcu-see-benefits">See my benefits</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlayInjected = true;

    // Add event listeners
    document.getElementById('soundcu-close-overlay').addEventListener('click', () => {
      overlay.classList.remove('soundcu-show');
      setTimeout(() => overlay.remove(), 300);
      overlayInjected = false;
    });

    document.getElementById('soundcu-revise-goals').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
    });

    document.getElementById('soundcu-see-benefits').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
    });

    document.getElementById('soundcu-settings').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
    });

    // Show overlay with animation
    setTimeout(() => overlay.classList.add('soundcu-show'), 100);
  }

  // Inject goal impact notification
  function showGoalImpact(impactData) {
    if (impactData.affectedGoals.length === 0) return;

    const notification = document.createElement('div');
    notification.id = 'soundcu-goal-notification';
    notification.className = 'soundcu-notification';
    
    const goal = impactData.affectedGoals[0]; // Show primary affected goal
    
    notification.innerHTML = `
      <div class="soundcu-notification-content">
        <div class="soundcu-notification-header">
          <span class="soundcu-notification-icon">${goal.isWarning ? '⚠️' : '📊'}</span>
          <strong>Impact on Your Goal: ${goal.goalName}</strong>
          <button class="soundcu-notification-close">&times;</button>
        </div>
        <p>${goal.description}</p>
        <div class="soundcu-notification-actions">
          <button class="soundcu-btn-primary" id="soundcu-view-goals">View Goals</button>
          <button class="soundcu-btn-tertiary" id="soundcu-dismiss-notification">Got It</button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Event listeners
    notification.querySelector('.soundcu-notification-close').addEventListener('click', () => {
      notification.remove();
    });

    document.getElementById('soundcu-view-goals').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
      notification.remove();
    });

    document.getElementById('soundcu-dismiss-notification').addEventListener('click', () => {
      notification.remove();
    });

    // Show notification
    setTimeout(() => notification.classList.add('soundcu-show'), 100);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('soundcu-show');
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showBenefitOverlay') {
      injectBenefitOverlay(request.benefits, request.purchaseAmount);
      sendResponse({ success: true });
    } else if (request.action === 'showGoalImpact') {
      showGoalImpact(request.impactData);
      sendResponse({ success: true });
    }
  });

  // Initialize checkout detection
  function initialize() {
    isCheckoutPage = detectCheckoutPage();
    
    if (isCheckoutPage) {
      console.log('Sound CU: Checkout page detected');
      
      const purchaseInfo = extractPurchaseInfo();
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'checkoutDetected',
        data: purchaseInfo
      });

      // Check goal impact
      if (purchaseInfo.amount) {
        chrome.runtime.sendMessage({
          action: 'analyzePurchase',
          data: purchaseInfo
        }, (response) => {
          if (response && response.affectedGoals.length > 0) {
            showGoalImpact(response);
          }
        });
      }
    }

    // Re-check periodically in case of SPAs
    const observer = new MutationObserver(() => {
      if (!isCheckoutPage && detectCheckoutPage()) {
        initialize();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
