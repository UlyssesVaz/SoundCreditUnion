// popup.js - Dashboard Logic for Sound CU Extension

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize the dashboard
  await loadDashboard();
  setupEventListeners();
});

// State
let currentGoals = [];
let editingGoalId = null;

// Load Dashboard Data
async function loadDashboard() {
  try {
    const data = await chrome.storage.local.get(['goals', 'userPreferences', 'isOnboarded']);
    
    currentGoals = data.goals || [];
    
    // Hide loading, show dashboard
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Render dashboard
    renderQuickStats();
    renderGoals();
    
    // Load settings
    if (data.userPreferences) {
      loadSettings(data.userPreferences);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Render Quick Stats
function renderQuickStats() {
  const activeGoalsCount = currentGoals.length;
  const totalSavings = currentGoals.reduce((sum, goal) => {
    if (goal.type === 'savings') {
      return sum + (goal.currentAmount || 0);
    }
    return sum;
  }, 0);
  
  document.getElementById('active-goals-count').textContent = activeGoalsCount;
  document.getElementById('total-savings').textContent = `$${totalSavings.toFixed(2)}`;
}

// Render Goals
function renderGoals() {
  const goalsList = document.getElementById('goals-list');
  const emptyState = document.getElementById('empty-state');
  
  if (currentGoals.length === 0) {
    goalsList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  goalsList.classList.remove('hidden');
  
  goalsList.innerHTML = currentGoals.map(goal => {
    const progress = calculateProgress(goal);
    const progressClass = progress >= 90 ? 'danger' : progress >= 70 ? 'warning' : '';
    
    return `
      <div class="goal-card" data-goal-id="${goal.id}">
        <div class="goal-header">
          <div class="goal-info">
            <div class="goal-name">${escapeHtml(goal.name)}</div>
            <div class="goal-type">${goal.type === 'savings' ? '💰 Savings Goal' : '📊 Spending Limit'}</div>
          </div>
          <div class="goal-actions">
            <button class="goal-action-btn edit-goal" title="Edit">✏️</button>
            <button class="goal-action-btn delete-goal" title="Delete">🗑️</button>
          </div>
        </div>
        
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill ${progressClass}" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
          <div class="progress-text">
            <span class="progress-current">$${(goal.currentAmount || goal.currentSpending || 0).toFixed(2)}</span>
            <span class="progress-target">/ $${goal.targetAmount.toFixed(2)}</span>
          </div>
        </div>
        
        ${goal.deadline ? `
          <div class="goal-deadline">
            Target: ${new Date(goal.deadline).toLocaleDateString()}
            ${getRemainingDays(goal.deadline) >= 0 ? 
              `(${getRemainingDays(goal.deadline)} days left)` : 
              '(Past deadline)'}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  // Attach event listeners to goal cards
  attachGoalEventListeners();
}

// Calculate goal progress
function calculateProgress(goal) {
  if (goal.type === 'savings') {
    return ((goal.currentAmount || 0) / goal.targetAmount) * 100;
  } else if (goal.type === 'spending_limit') {
    return ((goal.currentSpending || 0) / goal.targetAmount) * 100;
  }
  return 0;
}

// Get remaining days until deadline
function getRemainingDays(deadline) {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Attach Event Listeners to Goal Cards
function attachGoalEventListeners() {
  document.querySelectorAll('.edit-goal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const goalId = e.target.closest('.goal-card').dataset.goalId;
      openEditGoalModal(goalId);
    });
  });
  
  document.querySelectorAll('.delete-goal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const goalId = e.target.closest('.goal-card').dataset.goalId;
      deleteGoal(goalId);
    });
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Add Goal Button
  document.getElementById('add-goal-btn').addEventListener('click', openAddGoalModal);
  document.getElementById('create-first-goal-btn').addEventListener('click', openAddGoalModal);
  
  // Close Modal Buttons
  document.getElementById('close-modal').addEventListener('click', closeGoalModal);
  document.getElementById('cancel-goal-btn').addEventListener('click', closeGoalModal);
  
  // Goal Form Submit
  document.getElementById('goal-form').addEventListener('submit', handleGoalSubmit);
  
  // Goal Type Change
  document.getElementById('goal-type').addEventListener('change', (e) => {
    const currentAmountGroup = document.getElementById('current-amount-group');
    if (e.target.value === 'savings') {
      currentAmountGroup.classList.remove('hidden');
    } else {
      currentAmountGroup.classList.add('hidden');
    }
  });
  
  // Settings
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('close-settings').addEventListener('click', closeSettings);
  
  // Settings Toggles
  document.getElementById('toggle-checkout-prompts').addEventListener('change', updateSettings);
  document.getElementById('toggle-goal-tracking').addEventListener('change', updateSettings);
  document.getElementById('toggle-notifications').addEventListener('change', updateSettings);
  
  // Settings Actions
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  document.getElementById('reset-btn').addEventListener('click', resetAllData);
  
  // Close modals on backdrop click
  document.getElementById('goal-modal').addEventListener('click', (e) => {
    if (e.target.id === 'goal-modal') closeGoalModal();
  });
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') closeSettings();
  });
}

// Open Add Goal Modal
function openAddGoalModal() {
  editingGoalId = null;
  document.getElementById('modal-title').textContent = 'Create New Goal';
  document.getElementById('goal-form').reset();
  document.getElementById('goal-modal').classList.remove('hidden');
}

// Open Edit Goal Modal
function openEditGoalModal(goalId) {
  editingGoalId = goalId;
  const goal = currentGoals.find(g => g.id === goalId);
  
  if (!goal) return;
  
  document.getElementById('modal-title').textContent = 'Edit Goal';
  document.getElementById('goal-name').value = goal.name;
  document.getElementById('goal-type').value = goal.type;
  document.getElementById('target-amount').value = goal.targetAmount;
  document.getElementById('current-amount').value = goal.currentAmount || '';
  document.getElementById('goal-deadline').value = goal.deadline || '';
  document.getElementById('goal-notes').value = goal.notes || '';
  
  // Show/hide current amount based on type
  if (goal.type === 'savings') {
    document.getElementById('current-amount-group').classList.remove('hidden');
  }
  
  document.getElementById('goal-modal').classList.remove('hidden');
}

// Close Goal Modal
function closeGoalModal() {
  document.getElementById('goal-modal').classList.add('hidden');
  document.getElementById('goal-form').reset();
  editingGoalId = null;
}

// Handle Goal Form Submit
async function handleGoalSubmit(e) {
  e.preventDefault();
  
  const goalData = {
    id: editingGoalId || generateId(),
    name: document.getElementById('goal-name').value,
    type: document.getElementById('goal-type').value,
    targetAmount: parseFloat(document.getElementById('target-amount').value),
    currentAmount: parseFloat(document.getElementById('current-amount').value) || 0,
    currentSpending: 0,
    deadline: document.getElementById('goal-deadline').value || null,
    notes: document.getElementById('goal-notes').value || '',
    createdAt: editingGoalId ? currentGoals.find(g => g.id === editingGoalId).createdAt : new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  if (editingGoalId) {
    // Update existing goal
    currentGoals = currentGoals.map(g => g.id === editingGoalId ? goalData : g);
  } else {
    // Add new goal
    currentGoals.push(goalData);
  }
  
  // Save to storage
  await chrome.storage.local.set({ goals: currentGoals });
  
  // Re-render
  renderQuickStats();
  renderGoals();
  
  closeGoalModal();
}

// Delete Goal
async function deleteGoal(goalId) {
  if (!confirm('Are you sure you want to delete this goal?')) return;
  
  currentGoals = currentGoals.filter(g => g.id !== goalId);
  await chrome.storage.local.set({ goals: currentGoals });
  
  renderQuickStats();
  renderGoals();
}

// Generate Unique ID
function generateId() {
  return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Open Settings
function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
}

// Close Settings
function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

// Load Settings
function loadSettings(preferences) {
  document.getElementById('toggle-checkout-prompts').checked = preferences.enableCheckoutPrompts !== false;
  document.getElementById('toggle-goal-tracking').checked = preferences.enableGoalTracking !== false;
  document.getElementById('toggle-notifications').checked = preferences.enableNotifications !== false;
}

// Update Settings
async function updateSettings() {
  const preferences = {
    enableCheckoutPrompts: document.getElementById('toggle-checkout-prompts').checked,
    enableGoalTracking: document.getElementById('toggle-goal-tracking').checked,
    enableNotifications: document.getElementById('toggle-notifications').checked
  };
  
  await chrome.storage.local.set({ userPreferences: preferences });
}

// Export Data
async function exportData() {
  const data = await chrome.storage.local.get(null);
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `soundcu-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Reset All Data
async function resetAllData() {
  if (!confirm('Are you sure you want to reset all data? This cannot be undone.')) return;
  
  await chrome.storage.local.clear();
  currentGoals = [];
  
  renderQuickStats();
  renderGoals();
  
  alert('All data has been reset.');
  closeSettings();
}
