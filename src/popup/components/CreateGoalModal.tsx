import React, { useState } from 'react';
import { GOAL_TYPES } from '../../utils/constants';
import { useGoalStore } from '../../stores/goalStore';

interface CreateGoalModalProps {
  onClose: () => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [goalType, setGoalType] = useState<keyof typeof GOAL_TYPES | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
  });

  const { createGoal, isLoading } = useGoalStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalType) return;

    try {
      await createGoal({
        type: goalType,
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm mx-4 rounded-t-xl sm:rounded-xl shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Create New Goal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {step === 1 ? (
            // Step 1: Select Type
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">What kind of goal would you like to set?</p>
              {Object.entries(GOAL_TYPES).map(([type, { label, icon }]) => (
                <button
                  key={type}
                  onClick={() => {
                    setGoalType(type as keyof typeof GOAL_TYPES);
                    setStep(2);
                  }}
                  className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-200 transition-colors text-left"
                >
                  <span className="text-2xl mr-3">{icon}</span>
                  <span className="font-medium text-gray-800">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            // Step 2: Goal Details
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Vacation Fund"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount ($)</label>
                <input
                  type="number"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="5000"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date (Optional)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isLoading ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGoalModal;