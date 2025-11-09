// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

// Components
import Dashboard from './components/Dashboard';
import CreateGoalModal from './components/CreateGoalModal';
import GoalCard from './components/GoalCard'; // You had this import
import Settings from './components/Settings';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

// Mock goals for testing (can be moved later)
const MOCK_GOALS = [
 { id: '1', /* ... */ },
 { id: '2', /* ... */ }
];

const App: React.FC = () => {
  // --- REAL AUTH LOGIC ---
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  // --- END REAL AUTH LOGIC ---

  const [view, setView] = useState<'menu' | 'dashboard' | 'goals' | 'settings'>('menu');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 1. SHOW LOADING SPINNER
  if (isLoading) {
    return (
      <div className="w-96 h-[600px] flex items-center justify-center">
        <p>Loading...</p> 
      </div>
    );
  }

  // 2. SHOW LOGIN/REGISTER FORMS
  if (!isAuthenticated || !user) {
    return showRegister ? (
      <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  // 3. SHOW THE MAIN APP (User is Logged In)
  
  // Menu View
  if (view === 'menu') {
    return (
      <div className="w-96 h-[600px] bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏦 Sound CU</h1>
          <p className="text-blue-100">Welcome, {user.first_name}!</p>
        </div>
        
        <div className="space-y-3">
          <button onClick={() => setView('dashboard')} /* ... */>
            📊 Dashboard
          </button>
          <button onClick={() => setView('goals')} /* ... */>
            🎯 View Goals
          </button>
          <button onClick={() => setShowCreateModal(true)} /* ... */>
            ➕ Create New Goal
          </button>
          <button onClick={() => setView('settings')} /* ... */>
            ⚙️ Settings
          </button>
        </div>
        
        {showCreateModal && (
          <CreateGoalModal onClose={() => setShowCreateModal(false)} />
        )}
      </div>
    );
  }

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="w-96 h-[600px] flex flex-col">
        <button onClick={() => setView('menu')} /* ... */>
          ← Back to Menu
        </button>
        <Dashboard user={user} /> {/* Pass the REAL user */}
      </div>
    );
  }

  // Goals List View
  if (view === 'goals') {
    // NOTE: You should fetch goals from your API, not use MOCK_GOALS
    return (
      <div className="w-96 h-[600px] flex flex-col bg-gray-50">
         <button onClick={() => setView('menu')} /* ... */>
          ← Back to Menu
        </button>
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-xl font-bold">Your Goals ({MOCK_GOALS.length})</h2>
          <div className="space-y-3">
            {MOCK_GOALS.map(goal => (
              <GoalCard key={goal.id} goal={goal as any} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Settings View
  if (view === 'settings') {
    return (
      <div className="w-96 h-[600px] flex flex-col">
        <button onClick={() => setView('menu')} /* ... */>
          ← Back to Menu
        </button>
        {/* Pass the REAL user and the logout function! */}
        <Settings user={user} />
      </div>
    );
  }

  return null;
};

export default App;