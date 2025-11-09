import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return <Dashboard user={user!} />;
};

export default App;