// background.js - Service Worker for Sound CU Extension
// Handles backend communication, notifications, and cross-tab coordination

const API_BASE_URL = 'https://api.soundcu.org'; // Replace with actual API endpoint

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default values
    await chrome.storage.local.set({
      isOnboarded: false,
      goals: [],
      userPreferences: {
        enableNotifications: true,
        enableCheckoutPrompts: true,
        enableGoalTracking: true
      },
      lastSync: null
    });
    
    // Open onboarding page
    chrome.tabs.create({ url: 'popup.html?onboarding=true' });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkoutDetected') {
    handleCheckoutDetection(request.data, sender.tab.id);
    sendResponse({ success: true });
  } else if (request.action === 'analyzePurchase') {
    analyzePurchaseImpact(request.data).then(sendResponse);
    return true; // Will respond asynchronously
  } else if (request.action === 'getRelevantBenefits') {
    getRelevantBenefits(request.data).then(sendResponse);
    return true;
  } else if (request.action === 'updateGoalProgress') {
    updateGoalProgress(request.data).then(sendResponse);
    return true;
  }
});

// Detect checkout pages and analyze purchase context
async function handleCheckoutDetection(pageData, tabId) {
  console.log('Checkout detected:', pageData);
  
  const preferences = await chrome.storage.local.get('userPreferences');
  if (!preferences.userPreferences?.enableCheckoutPrompts) {
    return;
  }

  // Get user's relevant benefits
  const benefits = await getRelevantBenefits(pageData);
  
  if (benefits && benefits.length > 0) {
    // Inject the overlay with benefit information
    chrome.tabs.sendMessage(tabId, {
      action: 'showBenefitOverlay',
      benefits: benefits,
      purchaseAmount: pageData.amount
    });
  }
}

// Get relevant CU benefits based on purchase context
async function getRelevantBenefits(purchaseData) {
  try {
    // First check local cache
    const cached = await chrome.storage.local.get('cachedBenefits');
    
    // Get user's spending limit goals to calculate percentage
    const { goals } = await chrome.storage.local.get('goals');
    let spendingPercentage = null;
    
    if (goals && goals.length > 0) {
      const spendingGoal = goals.find(g => g.type === 'spending_limit');
      if (spendingGoal) {
        const currentSpending = spendingGoal.currentSpending || 0;
        const newTotal = currentSpending + purchaseData.amount;
        spendingPercentage = Math.round((purchaseData.amount / spendingGoal.targetAmount) * 100);
      }
    }
    
    // In production, make API call to backend
    // const response = await fetch(`${API_BASE_URL}/benefits/relevant`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(purchaseData)
    // });
    // return await response.json();
    
    // Mock data for prototype
    return [
      {
        id: 'cashback',
        type: 'cashback',
        title: '3% Cashback',
        description: 'Use your Chase Amazon Prime credit card',
        savings: `Earn $${(purchaseData.amount * 0.03).toFixed(2)} back`,
        ctaText: 'Use Rewards Card',
        ctaUrl: null,
        spendingPercentage: spendingPercentage
      },
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
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return [];
  }
}

// Analyze how a purchase impacts user's financial goals
async function analyzePurchaseImpact(purchaseData) {
  try {
    const { goals } = await chrome.storage.local.get('goals');
    
    if (!goals || goals.length === 0) {
      return { impact: null, affectedGoals: [] };
    }

    const affectedGoals = goals.map(goal => {
      let impact = 0;
      let impactDescription = '';
      
      if (goal.type === 'savings') {
        // Purchasing reduces available savings
        const currentSavings = goal.currentAmount || 0;
        const afterPurchase = currentSavings - purchaseData.amount;
        impact = ((goal.targetAmount - afterPurchase) / goal.targetAmount) * 100;
        impactDescription = `This purchase would use $${purchaseData.amount.toFixed(2)} from your ${goal.name} savings goal`;
      } else if (goal.type === 'spending_limit') {
        // Check if purchase exceeds spending limit
        const currentSpending = goal.currentSpending || 0;
        const newSpending = currentSpending + purchaseData.amount;
        const remaining = goal.targetAmount - newSpending;
        impact = (newSpending / goal.targetAmount) * 100;
        impactDescription = remaining >= 0 
          ? `You'll have $${remaining.toFixed(2)} left in your monthly budget`
          : `This exceeds your budget by $${Math.abs(remaining).toFixed(2)}`;
      }
      
      return {
        goalId: goal.id,
        goalName: goal.name,
        impact: impact,
        description: impactDescription,
        isWarning: impact > 90 // Flag if approaching/exceeding limit
      };
    });

    return {
      impact: affectedGoals,
      affectedGoals: affectedGoals.filter(g => g.impact > 0)
    };
  } catch (error) {
    console.error('Error analyzing purchase impact:', error);
    return { impact: null, affectedGoals: [] };
  }
}

// Update goal progress after a purchase
async function updateGoalProgress(purchaseData) {
  try {
    const { goals } = await chrome.storage.local.get('goals');
    
    if (!goals) return { success: false };

    const updatedGoals = goals.map(goal => {
      if (goal.type === 'spending_limit') {
        goal.currentSpending = (goal.currentSpending || 0) + purchaseData.amount;
      }
      // Add timestamp
      goal.lastUpdated = new Date().toISOString();
      return goal;
    });

    await chrome.storage.local.set({ goals: updatedGoals });
    
    // Sync with backend if available
    // await syncWithBackend(updatedGoals);
    
    return { success: true, goals: updatedGoals };
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return { success: false, error: error.message };
  }
}

// Periodic sync with backend (optional)
chrome.alarms.create('syncGoals', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncGoals') {
    // Sync goals and benefits with backend
    const data = await chrome.storage.local.get(['goals', 'userPreferences']);
    // await syncWithBackend(data);
  }
});

// Helper function for backend sync
async function syncWithBackend(data) {
  try {
    // In production, implement actual API call
    // const response = await fetch(`${API_BASE_URL}/sync`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    console.log('Syncing with backend:', data);
    return { success: true };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false };
  }
}

console.log('Sound CU Extension Service Worker initialized');
