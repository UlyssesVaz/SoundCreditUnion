// src/utils/constants.ts

// This constant will be replaced at build time by Vite.
// In development mode (npm run dev), import.meta.env.PROD is false.
// In production mode, import.meta.env.PROD is true.

export const API_BASE_URL = 'http://localhost:8000/v1';
// export const API_BASE_URL = import.meta.env.PROD
//   ? 'https://api.soundcu-copilot.com/v1'
//   : import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1'; // Use the VITE_API_BASE_URL from .env.development

export const CHECKOUT_PATTERNS = {
  selectors: [
    // Payment inputs
    'input[name*="card"]',
    'input[name*="cc"]',
    'input[name*="credit"]',
    'input[type="text"][autocomplete="cc-number"]',
    'input[id*="credit"]',
    'input[id*="card"]',
    
    // Checkout containers
    '[class*="checkout"]',
    '[class*="payment"]',
    '[id*="checkout"]',
    '[id*="payment"]',
    
    // E-commerce platforms
    '.shopify-payment-button',
    '#stripe-card-element',
    '.paypal-button',
    '[data-testid*="checkout"]',
    '[data-testid*="payment"]',
  ],
  
  urlPatterns: [
    /checkout/i,
    /cart/i,
    /payment/i,
    /billing/i,
    /order/i,
  ],

  merchantPatterns: {
    'amazon.com': {
      totalSelector: '.grand-total-price, #subtotals-marketplace-table .a-color-price',
      confirmButton: 'input[name="placeYourOrder"]',
    },
    'ebay.com': {
      totalSelector: '.order-total-value',
      confirmButton: 'button[data-test-id="ADD_TO_CART_BTN"]',
    },
    'walmart.com': {
      totalSelector: '.grand-total',
      confirmButton: 'button[data-automation-id="checkout-button"]',
    },
  },
};

export const GOAL_TYPES = {
  savings: {
    label: 'Savings Goal',
    icon: '💰',
    description: 'Save towards a target amount',
  },
  spending_limit: {
    label: 'Spending Limit',
    icon: '📊',
    description: 'Control spending within a budget',
  },
  debt_payoff: {
    label: 'Debt Payoff',
    icon: '📉',
    description: 'Pay down existing debt',
  },
};