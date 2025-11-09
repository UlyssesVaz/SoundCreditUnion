import { create } from 'zustand';
import { api, handleApiError } from '../utils/api';
import { Recommendation, PurchaseContext } from '../types';

interface RecommendationState {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  lastPurchaseContext: PurchaseContext | null;
  
  // Actions
  getRecommendations: (context: PurchaseContext) => Promise<void>;
  trackView: (recommendationId: string) => Promise<void>;
  trackClick: (recommendationId: string) => Promise<void>;
  clearRecommendations: () => void;
  clearError: () => void;
}

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  recommendations: [],
  isLoading: false,
  error: null,
  lastPurchaseContext: null,

  getRecommendations: async (context: PurchaseContext) => {
    set({ isLoading: true, error: null, lastPurchaseContext: context });
    
    try {
      const response = await api.post('/recommendations/get', {
        purchase_context: context,
      });

      const recommendations = response.data.recommendations || [];
      set({ recommendations, isLoading: false });

      // Track that recommendations were shown
      recommendations.forEach((rec: Recommendation) => {
        get().trackView(rec.id);
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false, recommendations: [] });
    }
  },

  trackView: async (recommendationId: string) => {
    try {
      await api.post('/recommendations/track', {
        recommendation_id: recommendationId,
        event_type: 'shown',
        context: get().lastPurchaseContext,
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  },

  trackClick: async (recommendationId: string) => {
    try {
      await api.post('/recommendations/track', {
        recommendation_id: recommendationId,
        event_type: 'clicked',
        context: get().lastPurchaseContext,
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  },

  clearRecommendations: () => set({ recommendations: [], lastPurchaseContext: null }),

  clearError: () => set({ error: null }),
}));