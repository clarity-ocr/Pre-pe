/**
 * Wallet Service - Handles wallet operations
 * 
 * This service manages user wallet balance, locking, and transactions.
 * Wallet operations are stored in the database for audit trail.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Wallet, WalletLedger } from '@/types/recharge.types';

/**
 * Get wallet balance for a user
 */
export async function getWalletBalance(userId: string): Promise<{
  balance: number;
  locked_balance: number;
} | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance, locked_balance')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a wallet for a new user
 */
export async function createWallet(userId: string): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      balance: 0,
      locked_balance: 0,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating wallet:', error);
    return null;
  }
  
  return data as Wallet;
}

/**
 * Lock amount for a pending transaction
 */
export async function lockAmount(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  // Get current wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (walletError || !wallet) {
    console.error('Wallet not found:', walletError);
    return false;
  }
  
  const availableBalance = wallet.balance - wallet.locked_balance;
  
  if (availableBalance < amount) {
    console.error('Insufficient balance');
    return false;
  }
  
  // Lock the amount
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      locked_balance: wallet.locked_balance + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error locking amount:', updateError);
    return false;
  }
  
  // Add ledger entry
  await addLedgerEntry(wallet.id, transactionId, 'LOCK', amount, wallet.balance, `Amount locked for transaction ${transactionId}`);
  
  return true;
}

/**
 * Confirm debit after successful transaction
 */
export async function confirmDebit(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (walletError || !wallet) {
    console.error('Wallet not found:', walletError);
    return false;
  }
  
  const newBalance = wallet.balance - amount;
  const newLockedBalance = wallet.locked_balance - amount;
  
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      locked_balance: Math.max(0, newLockedBalance),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error confirming debit:', updateError);
    return false;
  }
  
  // Add ledger entry
  await addLedgerEntry(wallet.id, transactionId, 'DEBIT', amount, newBalance, `Debited for transaction ${transactionId}`);
  
  return true;
}

/**
 * Refund amount for failed transaction
 */
export async function refundAmount(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (walletError || !wallet) {
    console.error('Wallet not found:', walletError);
    return false;
  }
  
  const newLockedBalance = wallet.locked_balance - amount;
  
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      locked_balance: Math.max(0, newLockedBalance),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error refunding amount:', updateError);
    return false;
  }
  
  // Add ledger entry
  await addLedgerEntry(wallet.id, transactionId, 'UNLOCK', amount, wallet.balance, `Amount unlocked/refunded for failed transaction ${transactionId}`);
  
  return true;
}

/**
 * Credit wallet (Admin or payment gateway)
 */
export async function creditWallet(
  userId: string,
  amount: number,
  description: string
): Promise<boolean> {
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (walletError || !wallet) {
    console.error('Wallet not found:', walletError);
    return false;
  }
  
  const newBalance = wallet.balance + amount;
  
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error crediting wallet:', updateError);
    return false;
  }
  
  // Add ledger entry
  await addLedgerEntry(wallet.id, null, 'CREDIT', amount, newBalance, description);
  
  return true;
}

/**
 * Get wallet ledger entries
 */
export async function getWalletLedger(userId: string, limit = 50): Promise<WalletLedger[]> {
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (walletError || !wallet) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('wallet_ledger')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching ledger:', error);
    return [];
  }
  
  return data as WalletLedger[];
}

/**
 * Add ledger entry
 */
async function addLedgerEntry(
  walletId: string,
  transactionId: string | null,
  type: 'CREDIT' | 'DEBIT' | 'LOCK' | 'UNLOCK' | 'REFUND',
  amount: number,
  balanceAfter: number,
  description: string
): Promise<void> {
  const { error } = await supabase
    .from('wallet_ledger')
    .insert({
      wallet_id: walletId,
      transaction_id: transactionId,
      type,
      amount,
      balance_after: balanceAfter,
      description,
    });
  
  if (error) {
    console.error('Error adding ledger entry:', error);
  }
}
