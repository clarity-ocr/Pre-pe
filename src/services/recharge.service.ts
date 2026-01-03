/**
 * Recharge Service - Core recharge processing logic
 * 
 * IMPORTANT: This service implements the complete recharge flow:
 * 1. Validate input
 * 2. Check wallet balance
 * 3. Lock amount
 * 4. Call Recharge API (placeholder)
 * 5. Handle SUCCESS/FAILED/PENDING
 * 6. Update transaction & wallet
 * 
 * When connecting to KwikApi:
 * - Only update the API call in processRechargeApi()
 * - No changes to business logic required
 */

import { supabase } from '@/integrations/supabase/client';
import type { RechargeRequest, ApiResponse, Transaction, BillDetails } from '@/types/recharge.types';
import * as walletService from './wallet.service';

/**
 * Process a recharge request
 */
export async function processRecharge(
  userId: string,
  request: RechargeRequest
): Promise<ApiResponse<Transaction | null>> {
  // Step 1: Validate input
  if (!request.operator_id || !request.amount) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Invalid request: operator and amount are required',
      data: null,
    };
  }
  
  if (!request.mobile_number && !request.dth_id) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Mobile number or DTH ID is required',
      data: null,
    };
  }
  
  // Step 2: Check wallet balance
  const wallet = await walletService.getWalletBalance(userId);
  if (!wallet) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Wallet not found',
      data: null,
    };
  }
  
  const availableBalance = wallet.balance - wallet.locked_balance;
  if (availableBalance < request.amount) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Insufficient wallet balance',
      data: null,
    };
  }
  
  // Create transaction record
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'RECHARGE',
      service_type: request.dth_id ? 'DTH' : 'MOBILE_PREPAID',
      amount: request.amount,
      status: 'PENDING',
      operator_id: request.operator_id,
      mobile_number: request.mobile_number,
      dth_id: request.dth_id,
      metadata: { plan_id: request.plan_id, offer_code: request.offer_code },
    })
    .select()
    .single();
  
  if (txError || !transaction) {
    console.error('Error creating transaction:', txError);
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Failed to create transaction',
      data: null,
    };
  }
  
  // Step 3: Lock amount in wallet
  const locked = await walletService.lockAmount(userId, request.amount, transaction.id);
  if (!locked) {
    // Update transaction as failed
    await updateTransactionStatus(transaction.id, 'FAILED', 'Failed to lock wallet amount');
    return {
      status: 'FAILED',
      transaction_id: transaction.id,
      message: 'Failed to lock wallet amount',
      data: null,
    };
  }
  
  // Step 4: Call Recharge API (placeholder)
  const apiResponse = await processRechargeApi(request, transaction.id);
  
  // Step 5: Handle response
  if (apiResponse.status === 'SUCCESS') {
    // Confirm wallet debit
    await walletService.confirmDebit(userId, request.amount, transaction.id);
    await updateTransactionStatus(
      transaction.id,
      'SUCCESS',
      apiResponse.message,
      apiResponse.transaction_id
    );
    
    return {
      status: 'SUCCESS',
      transaction_id: transaction.id,
      message: 'Recharge successful',
      data: { ...transaction, status: 'SUCCESS' } as Transaction,
    };
  } else if (apiResponse.status === 'PENDING') {
    // Keep amount locked, mark for polling
    await updateTransactionStatus(
      transaction.id,
      'PENDING',
      'Recharge is being processed',
      apiResponse.transaction_id
    );
    
    return {
      status: 'PENDING',
      transaction_id: transaction.id,
      message: 'Recharge is being processed. Please check status later.',
      data: { ...transaction, status: 'PENDING' } as Transaction,
    };
  } else {
    // Refund locked amount
    await walletService.refundAmount(userId, request.amount, transaction.id);
    await updateTransactionStatus(transaction.id, 'FAILED', apiResponse.message);
    
    return {
      status: 'FAILED',
      transaction_id: transaction.id,
      message: apiResponse.message || 'Recharge failed',
      data: null,
    };
  }
}

/**
 * Process bill payment
 */
export async function processPostpaidBill(
  userId: string,
  billDetails: BillDetails
): Promise<ApiResponse<Transaction | null>> {
  // Similar flow to recharge but for postpaid bills
  const wallet = await walletService.getWalletBalance(userId);
  if (!wallet || wallet.balance - wallet.locked_balance < billDetails.amount) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Insufficient wallet balance',
      data: null,
    };
  }
  
  // Create transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'BILL_PAYMENT',
      service_type: 'MOBILE_POSTPAID',
      amount: billDetails.amount,
      status: 'PENDING',
      operator_id: billDetails.operator_id,
      mobile_number: billDetails.mobile_number,
      reference_id: billDetails.bill_number,
    })
    .select()
    .single();
  
  if (error || !transaction) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Failed to create transaction',
      data: null,
    };
  }
  
  // Lock and process
  await walletService.lockAmount(userId, billDetails.amount, transaction.id);
  
  // TODO: Replace with real API call
  // Simulating success for now
  await walletService.confirmDebit(userId, billDetails.amount, transaction.id);
  await updateTransactionStatus(transaction.id, 'SUCCESS', 'Bill paid successfully');
  
  return {
    status: 'SUCCESS',
    transaction_id: transaction.id,
    message: 'Bill paid successfully',
    data: { ...transaction, status: 'SUCCESS' } as Transaction,
  };
}

/**
 * Fetch bill details for postpaid
 */
export async function fetchBillDetails(
  operatorId: string,
  mobileNumber: string
): Promise<ApiResponse<BillDetails | null>> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('fetch-bill', {
  //   body: { operator_id: operatorId, mobile_number: mobileNumber }
  // });
  
  // Mock response
  return {
    status: 'SUCCESS',
    transaction_id: '',
    message: 'Bill fetched successfully',
    data: {
      bill_number: `BILL${Date.now()}`,
      bill_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 500) + 200,
      customer_name: 'John Doe',
      operator_id: operatorId,
      mobile_number: mobileNumber,
    },
  };
}

/**
 * PLACEHOLDER: Call external recharge API
 * 
 * Replace this function body when connecting to KwikApi.
 * The function signature should remain the same.
 */
async function processRechargeApi(
  request: RechargeRequest,
  transactionId: string
): Promise<ApiResponse<{ api_ref: string }>> {
  // TODO: Replace with real API call via edge function
  // const response = await supabase.functions.invoke('process-recharge', {
  //   body: { ...request, transaction_id: transactionId }
  // });
  
  // Simulate random response for demo
  const random = Math.random();
  
  if (random > 0.2) {
    return {
      status: 'SUCCESS',
      transaction_id: `API${Date.now()}`,
      message: 'Recharge processed successfully',
      data: { api_ref: `REF${Date.now()}` },
    };
  } else if (random > 0.1) {
    return {
      status: 'PENDING',
      transaction_id: `API${Date.now()}`,
      message: 'Recharge is being processed',
      data: { api_ref: `REF${Date.now()}` },
    };
  } else {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Operator server error. Please try again.',
      data: { api_ref: '' },
    };
  }
}

/**
 * Update transaction status
 */
async function updateTransactionStatus(
  transactionId: string,
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED',
  message: string,
  apiTransactionId?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (apiTransactionId) {
    updateData.api_transaction_id = apiTransactionId;
  }
  
  const { error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId);
  
  if (error) {
    console.error('Error updating transaction:', error);
  }
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit = 50,
  serviceType?: string
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (serviceType) {
    query = query.eq('service_type', serviceType);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data as Transaction[];
}

/**
 * Check pending transaction status
 */
export async function checkTransactionStatus(
  transactionId: string
): Promise<ApiResponse<Transaction | null>> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();
  
  if (error || !data) {
    return {
      status: 'FAILED',
      transaction_id: transactionId,
      message: 'Transaction not found',
      data: null,
    };
  }
  
  return {
    status: data.status as 'SUCCESS' | 'FAILED' | 'PENDING',
    transaction_id: transactionId,
    message: `Transaction is ${data.status}`,
    data: data as Transaction,
  };
}
