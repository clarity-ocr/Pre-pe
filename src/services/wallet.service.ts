/**
 * Wallet Service - Handles wallet operations
 * Uses explicit types since DB types may not be synced yet
 */

import { supabase } from '@/integrations/supabase/client';

interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

interface WalletLedgerRow {
  id: string;
  wallet_id: string;
  transaction_id: string | null;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

/**
 * Get wallet balance for a user
 */
export async function getWalletBalance(userId: string): Promise<{
  balance: number;
  locked_balance: number;
} | null> {
  const { data, error } = await supabase
    .from('wallets' as never)
    .select('balance, locked_balance')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error || !data) {
    console.error('Error fetching wallet:', error);
    return null;
  }
  
  const wallet = data as unknown as WalletRow;
  return { balance: Number(wallet.balance), locked_balance: Number(wallet.locked_balance) };
}

/**
 * Get full wallet for a user
 */
export async function getWallet(userId: string): Promise<WalletRow | null> {
  const { data, error } = await supabase
    .from('wallets' as never)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error || !data) {
    return null;
  }
  
  return data as unknown as WalletRow;
}

/**
 * Lock amount for a pending transaction
 */
export async function lockAmount(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  const wallet = await getWallet(userId);
  
  if (!wallet) {
    console.error('Wallet not found');
    return false;
  }
  
  const availableBalance = Number(wallet.balance) - Number(wallet.locked_balance);
  
  if (availableBalance < amount) {
    console.error('Insufficient balance');
    return false;
  }
  
  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      locked_balance: Number(wallet.locked_balance) + amount,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error locking amount:', updateError);
    return false;
  }
  
  await addLedgerEntry(wallet.id, transactionId, 'LOCK', amount, Number(wallet.balance), `Amount locked for transaction`);
  
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
  const wallet = await getWallet(userId);
  
  if (!wallet) {
    console.error('Wallet not found');
    return false;
  }
  
  const newBalance = Number(wallet.balance) - amount;
  const newLockedBalance = Number(wallet.locked_balance) - amount;
  
  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      balance: newBalance,
      locked_balance: Math.max(0, newLockedBalance),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error confirming debit:', updateError);
    return false;
  }
  
  await addLedgerEntry(wallet.id, transactionId, 'DEBIT', amount, newBalance, `Debited for transaction`);
  
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
  const wallet = await getWallet(userId);
  
  if (!wallet) {
    console.error('Wallet not found');
    return false;
  }
  
  const newLockedBalance = Number(wallet.locked_balance) - amount;
  
  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      locked_balance: Math.max(0, newLockedBalance),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error refunding amount:', updateError);
    return false;
  }
  
  await addLedgerEntry(wallet.id, transactionId, 'UNLOCK', amount, Number(wallet.balance), `Amount unlocked/refunded`);
  
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
  const wallet = await getWallet(userId);
  
  if (!wallet) {
    console.error('Wallet not found');
    return false;
  }
  
  const newBalance = Number(wallet.balance) + amount;
  
  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error crediting wallet:', updateError);
    return false;
  }
  
  await addLedgerEntry(wallet.id, null, 'CREDIT', amount, newBalance, description);
  
  return true;
}

/**
 * Get wallet ledger entries
 */
export async function getWalletLedger(userId: string, limit = 50): Promise<WalletLedgerRow[]> {
  const wallet = await getWallet(userId);
  
  if (!wallet) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('wallet_ledger' as never)
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching ledger:', error);
    return [];
  }
  
  return (data as unknown as WalletLedgerRow[]) || [];
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
    .from('wallet_ledger' as never)
    .insert({
      wallet_id: walletId,
      transaction_id: transactionId,
      type,
      amount,
      balance_after: balanceAfter,
      description,
    } as never);
  
  if (error) {
    console.error('Error adding ledger entry:', error);
  }
}
