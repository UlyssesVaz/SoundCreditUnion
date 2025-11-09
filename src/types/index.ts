export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  segment?: string;
  financial_profile?: {
    annual_income?: number;
    credit_score?: number;
    dti_ratio?: number;
  };
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'savings' | 'spending_limit' | 'debt_payoff';
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  current_spending: number;
  deadline?: string;
  period?: 'monthly' | 'weekly' | 'annual' | 'one_time';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  priority: number;
  created_at: string;
  updated_at: string;
  progress_percentage?: number;
  days_remaining?: number;
}

export interface Product {
  id: string;
  type: string;
  name: string;
  description: string;
  base_rate?: number;
  terms: any;
  benefits: string[];
  application_url?: string;
}

export interface Recommendation {
  id: string;
  type: 'loan' | 'credit_card' | 'alert' | 'cashback';
  priority: number;
  product?: Product;
  message: {
    title: string;
    description: string;
    savings?: string;
    cashback_amount?: number;
    cta_text?: string;
    cta_url?: string;
    alert_type?: 'warning' | 'info' | 'success';
  };
  impact?: {
    goal_id: string;
    goal_name: string;
    percentage: number;
  };
}

export interface PurchaseContext {
  amount: number;
  merchant: string;
  category?: string;
  url?: string;
}

export interface CheckoutDetectionResult {
  isCheckout: boolean;
  purchaseAmount?: number;
  merchant?: string;
  confidence: 'high' | 'medium' | 'low';
}