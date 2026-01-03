/**
 * Operator Service - Handles operator and circle detection
 * 
 * PLACEHOLDER: These functions return mock data.
 * Replace with real API calls when connecting to KwikApi.
 */

import type { Operator, Circle, ApiResponse } from '@/types/recharge.types';
import { supabase } from '@/integrations/supabase/client';

// Mock operators data - Replace with real API call
const MOCK_OPERATORS: Operator[] = [
  { id: '1', name: 'Airtel', code: 'AIRTEL', type: 'prepaid', logo: '/operators/airtel.png' },
  { id: '2', name: 'Jio', code: 'JIO', type: 'prepaid', logo: '/operators/jio.png' },
  { id: '3', name: 'Vi', code: 'VI', type: 'prepaid', logo: '/operators/vi.png' },
  { id: '4', name: 'BSNL', code: 'BSNL', type: 'prepaid', logo: '/operators/bsnl.png' },
  { id: '5', name: 'Airtel Postpaid', code: 'AIRTEL_POST', type: 'postpaid' },
  { id: '6', name: 'Jio Postpaid', code: 'JIO_POST', type: 'postpaid' },
  { id: '7', name: 'Tata Play', code: 'TATAPLAY', type: 'dth' },
  { id: '8', name: 'Airtel DTH', code: 'AIRTEL_DTH', type: 'dth' },
  { id: '9', name: 'Dish TV', code: 'DISH', type: 'dth' },
  { id: '10', name: 'Videocon D2H', code: 'D2H', type: 'dth' },
];

// Mock circles data - Replace with real API call
const MOCK_CIRCLES: Circle[] = [
  { id: '1', name: 'Delhi NCR', code: 'DL' },
  { id: '2', name: 'Mumbai', code: 'MH' },
  { id: '3', name: 'Karnataka', code: 'KA' },
  { id: '4', name: 'Tamil Nadu', code: 'TN' },
  { id: '5', name: 'Andhra Pradesh', code: 'AP' },
  { id: '6', name: 'Gujarat', code: 'GJ' },
  { id: '7', name: 'Maharashtra', code: 'MH' },
  { id: '8', name: 'West Bengal', code: 'WB' },
  { id: '9', name: 'Uttar Pradesh East', code: 'UPE' },
  { id: '10', name: 'Uttar Pradesh West', code: 'UPW' },
];

/**
 * Get all operators by type
 */
export async function getOperators(type?: 'prepaid' | 'postpaid' | 'dth'): Promise<Operator[]> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('get-operators', { body: { type } });
  
  if (type) {
    return MOCK_OPERATORS.filter(op => op.type === type);
  }
  return MOCK_OPERATORS;
}

/**
 * Get all circles
 */
export async function getCircles(): Promise<Circle[]> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('get-circles');
  
  return MOCK_CIRCLES;
}

/**
 * Auto-detect operator from mobile number
 * Uses number prefix to determine operator
 */
export async function detectOperator(mobileNumber: string): Promise<ApiResponse<{ operator: Operator; circle: Circle } | null>> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('detect-operator', { body: { mobile_number: mobileNumber } });
  
  // Mock detection logic based on prefix
  const prefix = mobileNumber.substring(0, 4);
  
  let detectedOperator: Operator | undefined;
  
  // Simple prefix-based detection (placeholder logic)
  if (prefix.startsWith('701') || prefix.startsWith('702')) {
    detectedOperator = MOCK_OPERATORS.find(op => op.code === 'AIRTEL');
  } else if (prefix.startsWith('703') || prefix.startsWith('704')) {
    detectedOperator = MOCK_OPERATORS.find(op => op.code === 'JIO');
  } else if (prefix.startsWith('705') || prefix.startsWith('706')) {
    detectedOperator = MOCK_OPERATORS.find(op => op.code === 'VI');
  } else {
    detectedOperator = MOCK_OPERATORS.find(op => op.code === 'BSNL');
  }
  
  if (detectedOperator) {
    return {
      status: 'SUCCESS',
      transaction_id: '',
      message: 'Operator detected successfully',
      data: {
        operator: detectedOperator,
        circle: MOCK_CIRCLES[0], // Default circle
      },
    };
  }
  
  return {
    status: 'FAILED',
    transaction_id: '',
    message: 'Could not detect operator',
    data: null,
  };
}
