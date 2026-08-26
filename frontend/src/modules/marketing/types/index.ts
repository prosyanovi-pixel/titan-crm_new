export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  type: 'email' | 'social' | 'event' | 'direct_mail' | 'other';
  budget: number;
  actualCost: number;
  startDate?: string;
  endDate?: string;
  targetAudience?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  payments?: Array<{
    id: string;
    amount: number;
    payment_date: string;
    kind: string;
    comment?: string;
    contractor_name?: string;
    created_at?: string;
  }>;
}
