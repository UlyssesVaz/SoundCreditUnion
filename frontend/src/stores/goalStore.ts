import { create } from 'zustand';
import { api, handleApiError } from '../utils/api';
import { Goal } from '../types';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchGoals: () => Promise<void>;
  createGoal: (goalData: CreateGoalData) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  analyzeImpact: (amount: number) => Promise<GoalImpact[]>;
  clearError: () => void;
}

interface CreateGoalData {
  type: 'savings' | 'spending_limit' | 'debt_payoff';
  name: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
  period?: 'monthly' | 'weekly' | 'annual' | 'one_time';
  priority?: number;
}

interface GoalImpact {
  goal_id: string;
  goal_name: string;
  impact_percentage: number;
  new_amount: number;
  remaining: number;
  is_warning: boolean;
  description: string;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get('/goals');
      set({ goals: response.data.goals || [], isLoading: false });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  createGoal: async (goalData: CreateGoalData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post('/goals', goalData);
      const newGoal = response.data;

      set(state => ({
        goals: [...state.goals, newGoal],
        isLoading: false,
      }));

      // Notify background script
      chrome.runtime.sendMessage({ type: 'GOAL_CREATED', goal: newGoal });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateGoal: async (goalId: string, updates: Partial<Goal>) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.put(`/goals/${goalId}`, updates);
      const updatedGoal = response.data;

      set(state => ({
        goals: state.goals.map(g => g.id === goalId ? updatedGoal : g),
        isLoading: false,
      }));

      // Notify background script
      chrome.runtime.sendMessage({ type: 'GOAL_UPDATED', goal: updatedGoal });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteGoal: async (goalId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await api.delete(`/goals/${goalId}`);

      set(state => ({
        goals: state.goals.filter(g => g.id !== goalId),
        isLoading: false,
      }));

      // Notify background script
      chrome.runtime.sendMessage({ type: 'GOAL_DELETED', goalId });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  analyzeImpact: async (amount: number) => {
    try {
      const response = await api.post('/goals/impact-analysis', {
        purchase_amount: amount,
      });
      
      return response.data.affected_goals || [];
    } catch (error) {
      console.error('Impact analysis failed:', error);
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));