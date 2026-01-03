/**
 * Plans Service - Handles recharge plan fetching
 * 
 * PLACEHOLDER: These functions return mock data.
 * Replace with real API calls when connecting to KwikApi.
 */

import type { RechargePlan, ApiResponse } from '@/types/recharge.types';
import { supabase } from '@/integrations/supabase/client';

// Mock plans data - Replace with real API call
const MOCK_PLANS: RechargePlan[] = [
  { id: '1', operator_id: '1', amount: 199, validity: '28 days', description: 'Unlimited calls + 1.5GB/day', data: '1.5GB/day', category: 'unlimited' },
  { id: '2', operator_id: '1', amount: 299, validity: '28 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '3', operator_id: '1', amount: 449, validity: '56 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '4', operator_id: '1', amount: 599, validity: '84 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '5', operator_id: '1', amount: 49, validity: '3 days', description: '100 mins + 500MB data', data: '500MB', talktime: '100 mins', category: 'combo' },
  { id: '6', operator_id: '1', amount: 99, validity: '14 days', description: 'Data pack - 6GB', data: '6GB', category: 'data' },
  { id: '7', operator_id: '2', amount: 199, validity: '28 days', description: 'Unlimited calls + 1.5GB/day', data: '1.5GB/day', category: 'unlimited' },
  { id: '8', operator_id: '2', amount: 239, validity: '28 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '9', operator_id: '2', amount: 479, validity: '56 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '10', operator_id: '2', amount: 666, validity: '84 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '11', operator_id: '7', amount: 199, validity: '30 days', description: 'HD Pack - 200+ Channels', category: 'combo' },
  { id: '12', operator_id: '7', amount: 349, validity: '30 days', description: 'Premium HD Pack - 300+ Channels', category: 'unlimited' },
  { id: '13', operator_id: '8', amount: 249, validity: '30 days', description: 'Value Pack - 150+ Channels', category: 'combo' },
  { id: '14', operator_id: '9', amount: 175, validity: '30 days', description: 'Basic Pack - 100+ Channels', category: 'topup' },
];

/**
 * Get plans for a specific operator
 */
export async function getPlans(
  operatorId: string,
  circleId?: string,
  category?: string
): Promise<ApiResponse<RechargePlan[]>> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('get-plans', {
  //   body: { operator_id: operatorId, circle_id: circleId, category }
  // });
  
  let plans = MOCK_PLANS.filter(plan => plan.operator_id === operatorId);
  
  if (category && category !== 'all') {
    plans = plans.filter(plan => plan.category === category);
  }
  
  return {
    status: 'SUCCESS',
    transaction_id: '',
    message: 'Plans fetched successfully',
    data: plans,
  };
}

/**
 * Get plan categories for an operator
 */
export async function getPlanCategories(operatorId: string): Promise<string[]> {
  const plans = MOCK_PLANS.filter(plan => plan.operator_id === operatorId);
  const categories = [...new Set(plans.map(plan => plan.category))];
  return categories;
}
