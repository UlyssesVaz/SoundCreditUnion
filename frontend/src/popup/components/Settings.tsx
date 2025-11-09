import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { api, handleApiError } from '../../utils/api';

// Define the User type based on your MOCK_USER and API schema
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  segment: string;
  financial_profile: {
    annual_income: number;
    credit_score: number;
    dti_ratio: number;
  };
  created_at: string;
  is_verified: boolean;
  is_active: boolean;
  phone: string | null;
  preferences: object;
}

// Define the shape of the UserUpdate payload for the PUT request
interface UserUpdate {
  first_name: string;
  last_name: string;
  phone: string | null;
  financial_profile: {
    annual_income: number;
  };
}

interface SettingsProps {
  user: User;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  // Get actions from the auth store
  const { logout, setUser } = useAuthStore();

  // Local state to manage form edits before saving
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email, // Email is usually not editable, so we'll disable the input
    phone: user.phone || '',
    annual_income: user.financial_profile.annual_income,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null(null);

  // Sync local form state if the user prop changes (e.g., after a save)
  useEffect(() => {
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      annual_income: user.financial_profile.annual_income,
    });
  }, [user]);

  // Handle changes to form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setError(null);
    setSuccess(null);

    if (name === 'annual_income') {
      setFormData((prev) => ({
        ...prev,
        annual_income: type === 'number' ? parseFloat(value) : value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // --- API ACTIONS ---

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Construct the payload based on your `PUT /users/me` endpoint
    const updatePayload: UserUpdate = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || null,
      financial_profile: {
        annual_income: Number(formData.annual_income),
      },
    };

    try {
      // Call the API
      const response = await api.put<User>('/users/me', updatePayload);
      
      // Update the global authStore with the new user data
      setUser(response.data);
      
      setSuccess('Profile saved successfully!');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      // This function comes from useAuthStore and handles
      // calling the API and clearing local storage.
      await logout();
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'ARE YOU SURE?\nThis action is irreversible and will delete your account.'
      )
    ) {
      try {
        // 1. Call the delete endpoint
        await api.delete('/users/me');
        
        // 2. Log the user out locally
        // (The logout() function clears all storage)
        await logout();
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  // --- RENDER ---

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      {/* --- NOTIFICATIONS --- */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* --- PROFILE FORM --- */}
      <form onSubmit={handleSaveChanges} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                id="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                id="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                disabled // Email is not editable
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* --- FINANCIAL FORM --- */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Financial Profile</h3>
          <div>
            <label htmlFor="annual_income" className="block text-sm font-medium text-gray-700">
              Annual Income
            </label>
            <input
              type="number"
              name="annual_income"
              id="annual_income"
              value={formData.annual_income}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Credit Score</label>
              <p className="text-lg font-semibold text-gray-800 mt-1">{user.financial_profile.credit_score || 'N/A'}</p>
              <p className="text-xs text-gray-500">Updated weekly (read-only)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Debt-to-Income (DTI)</label>
              <p className="text-lg font-semibold text-gray-800 mt-1">{(user.financial_profile.dti_ratio * 100).toFixed(1) || 'N/A'}%</p>
               <p className="text-xs text-gray-500">Updated weekly (read-only)</p>
            </div>
          </div>
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* --- DANGER ZONE --- */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Log Out
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;