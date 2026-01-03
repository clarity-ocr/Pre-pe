/**
 * Offers Service - Handles promotional offers and coupons
 * 
 * PLACEHOLDER: These functions return mock data.
 * Replace with real API calls when connecting to KwikApi.
 */

import type { Offer, ApiResponse } from '@/types/recharge.types';
import { supabase } from '@/integrations/supabase/client';

// Mock offers data - Replace with real API call
const MOCK_OFFERS: Offer[] = [
  {
    id: '1',
    title: 'First Recharge Bonus',
    description: 'Get 10% cashback on your first recharge',
    discount_percent: 10,
    code: 'FIRST10',
    valid_until: '2025-02-28',
    min_amount: 100,
  },
  {
    id: '2',
    title: 'Weekend Special',
    description: 'Flat ₹20 off on recharges above ₹199',
    discount_amount: 20,
    code: 'WEEKEND20',
    valid_until: '2025-01-31',
    min_amount: 199,
  },
  {
    id: '3',
    title: 'Jio Special',
    description: '5% cashback on all Jio recharges',
    discount_percent: 5,
    code: 'JIO5',
    valid_until: '2025-02-15',
    min_amount: 149,
    operator_id: '2',
  },
  {
    id: '4',
    title: 'DTH Bonanza',
    description: 'Get ₹50 off on DTH recharges above ₹300',
    discount_amount: 50,
    code: 'DTH50',
    valid_until: '2025-01-25',
    min_amount: 300,
  },
];

/**
 * Get all active offers
 */
export async function getOffers(operatorId?: string): Promise<ApiResponse<Offer[]>> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('get-offers', {
  //   body: { operator_id: operatorId }
  // });
  
  let offers = MOCK_OFFERS;
  
  if (operatorId) {
    offers = offers.filter(offer => !offer.operator_id || offer.operator_id === operatorId);
  }
  
  // Filter expired offers
  const now = new Date();
  offers = offers.filter(offer => new Date(offer.valid_until) > now);
  
  return {
    status: 'SUCCESS',
    transaction_id: '',
    message: 'Offers fetched successfully',
    data: offers,
  };
}

/**
 * Validate and apply an offer code
 */
export async function validateOffer(
  code: string,
  amount: number,
  operatorId?: string
): Promise<ApiResponse<{ offer: Offer; discount: number } | null>> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('validate-offer', {
  //   body: { code, amount, operator_id: operatorId }
  // });
  
  const offer = MOCK_OFFERS.find(
    o => o.code.toLowerCase() === code.toLowerCase()
  );
  
  if (!offer) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Invalid offer code',
      data: null,
    };
  }
  
  // Check expiry
  if (new Date(offer.valid_until) < new Date()) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Offer has expired',
      data: null,
    };
  }
  
  // Check minimum amount
  if (offer.min_amount && amount < offer.min_amount) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: `Minimum recharge amount is ₹${offer.min_amount}`,
      data: null,
    };
  }
  
  // Check operator restriction
  if (offer.operator_id && operatorId && offer.operator_id !== operatorId) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Offer not valid for this operator',
      data: null,
    };
  }
  
  // Calculate discount
  let discount = 0;
  if (offer.discount_amount) {
    discount = offer.discount_amount;
  } else if (offer.discount_percent) {
    discount = (amount * offer.discount_percent) / 100;
  }
  
  return {
    status: 'SUCCESS',
    transaction_id: '',
    message: 'Offer applied successfully',
    data: { offer, discount },
  };
}
