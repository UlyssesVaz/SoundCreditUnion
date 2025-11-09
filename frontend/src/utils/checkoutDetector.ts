import { CHECKOUT_PATTERNS } from './constants';
import { CheckoutDetectionResult, PurchaseContext } from '../types';

export class CheckoutDetector {
  /**
   * Detect if current page is a checkout page
   */
  static detectCheckout(): CheckoutDetectionResult {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname;

    // Check URL patterns
    const urlMatch = CHECKOUT_PATTERNS.urlPatterns.some(pattern => pattern.test(url));

    // Check DOM elements
    const elementMatch = CHECKOUT_PATTERNS.selectors.some(selector => {
      return document.querySelector(selector) !== null;
    });

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (urlMatch && elementMatch) {
      confidence = 'high';
    } else if (urlMatch || elementMatch) {
      confidence = 'medium';
    }

    const isCheckout = urlMatch || elementMatch;

    if (isCheckout) {
      const purchaseInfo = this.extractPurchaseInfo(hostname);
      return {
        isCheckout: true,
        ...purchaseInfo,
        confidence,
      };
    }

    return {
      isCheckout: false,
      confidence: 'low',
    };
  }

  /**
   * Extract purchase information from page
   */
  static extractPurchaseInfo(hostname: string): Partial<PurchaseContext> {
    const result: Partial<PurchaseContext> = {
      merchant: hostname.replace('www.', ''),
    };

    // Try site-specific extraction first
    const merchantPattern = Object.entries(CHECKOUT_PATTERNS.merchantPatterns).find(
      ([domain]) => hostname.includes(domain)
    );

    if (merchantPattern) {
      const [, config] = merchantPattern;
      const amount = this.extractAmountFromSelector(config.totalSelector);
      if (amount) {
        result.amount = amount;
      }
    }

    // Fallback: generic amount extraction
    if (!result.amount) {
      result.amount = this.extractAmountGeneric();
    }

    return result;
  }

  /**
   * Extract amount using specific selector
   */
  private static extractAmountFromSelector(selector: string): number | undefined {
    const elements = document.querySelectorAll(selector);
    
    for (const element of Array.from(elements)) {
      const text = element.textContent || '';
      const amount = this.parseAmount(text);
      if (amount && amount > 0) {
        return amount;
      }
    }

    return undefined;
  }

  /**
   * Generic amount extraction from common patterns
   */
  private static extractAmountGeneric(): number | undefined {
    const patterns = [
      { selector: '[class*="total"]', priority: 1 },
      { selector: '[id*="total"]', priority: 1 },
      { selector: '[class*="grand"]', priority: 2 },
      { selector: '.price', priority: 3 },
      { selector: '[class*="amount"]', priority: 4 },
    ];

    for (const pattern of patterns) {
      const elements = document.querySelectorAll(pattern.selector);
      
      for (const element of Array.from(elements)) {
        const text = element.textContent || '';
        if (text.toLowerCase().includes('total') || text.toLowerCase().includes('grand')) {
          const amount = this.parseAmount(text);
          if (amount && amount > 0) {
            return amount;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Parse dollar amount from text
   */
  private static parseAmount(text: string): number | undefined {
    // Match patterns like $1,234.56 or 1234.56
    const match = text.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    
    if (match) {
      const cleanedAmount = match[1].replace(/,/g, '');
      const amount = parseFloat(cleanedAmount);
      
      // Sanity check (between $1 and $100,000)
      if (amount >= 1 && amount <= 100000) {
        return amount;
      }
    }

    return undefined;
  }

  /**
   * Get purchase context for API call
   */
  static getPurchaseContext(): PurchaseContext | null {
    const detection = this.detectCheckout();
    
    if (!detection.isCheckout || !detection.purchaseAmount) {
      return null;
    }

    return {
      amount: detection.purchaseAmount,
      merchant: detection.merchant || window.location.hostname,
      url: window.location.href,
      category: this.categorizemerchant(detection.merchant || ''),
    };
  }

  /**
   * Categorize merchant (simple version)
   */
  private static categorizemerchant(merchant: string): string {
    const categories: Record<string, string> = {
      'amazon.com': 'general_merchandise',
      'ebay.com': 'general_merchandise',
      'walmart.com': 'general_merchandise',
      'target.com': 'general_merchandise',
      'bestbuy.com': 'electronics',
      'homedepot.com': 'home_improvement',
      'lowes.com': 'home_improvement',
      'macys.com': 'clothing',
      'nordstrom.com': 'clothing',
      'wayfair.com': 'furniture',
    };

    for (const [domain, category] of Object.entries(categories)) {
      if (merchant.includes(domain)) {
        return category;
      }
    }

    return 'other';
  }
}