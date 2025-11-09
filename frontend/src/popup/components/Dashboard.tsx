import React from 'react';
import { User } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { logout } = useAuthStore();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary-700 text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="font-bold text-lg">Sound CU</h1>
          <p className="text-primary-100 text-sm">Hello, {user.first_name}</p>
        </div>
        <button
          onClick={() => logout()}
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Status Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Financial Health</h2>
          <div className="mt-3 flex items-center">
            <div className="text-3xl mr-3">👍</div>
            <div>
              <p className="font-semibold text-gray-800">On Track</p>
              <p className="text-sm text-gray-500">You're meeting your goals this month.</p>
            </div>
          </div>
        </div>

        {/* Placeholder for Goals */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
             <h2 className="font-semibold text-gray-800">Your Goals</h2>
             <button className="text-primary-600 text-sm font-medium hover:text-primary-700">+ New</button>
          </div>
          <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
            <p>No active goals yet.</p>
            <p className="text-sm mt-1">Create one to get started!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;