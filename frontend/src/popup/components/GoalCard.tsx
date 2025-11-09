import React from 'react';
import { Goal } from '../../types';
import { GOAL_TYPES } from '../../utils/constants';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit }) => {
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const goalType = GOAL_TYPES[goal.type] || { icon: '🎯', label: 'Goal' };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-3 bg-gray-50 p-2 rounded-full">{goalType.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{goal.name}</h3>
            <p className="text-xs text-gray-500">{goalType.label}</p>
          </div>
        </div>
        {onEdit && (
          <button onClick={() => onEdit(goal)} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{formatCurrency(goal.current_amount)}</span>
          <span className="font-medium text-gray-800">{formatCurrency(goal.target_amount)}</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 100 ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default GoalCard;