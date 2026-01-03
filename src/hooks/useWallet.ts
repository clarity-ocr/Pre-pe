import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import * as walletService from '@/services/wallet.service';

interface WalletState {
  balance: number;
  lockedBalance: number;
  loading: boolean;
  error: string | null;
}

export function useWallet() {
  const { user } = useAuth();
  const [walletState, setWalletState] = useState<WalletState>({
    balance: 0,
    lockedBalance: 0,
    loading: true,
    error: null,
  });

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWalletState({
        balance: 0,
        lockedBalance: 0,
        loading: false,
        error: null,
      });
      return;
    }

    setWalletState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const wallet = await walletService.getWalletBalance(user.id);
      
      if (wallet) {
        setWalletState({
          balance: wallet.balance,
          lockedBalance: wallet.locked_balance,
          loading: false,
          error: null,
        });
      } else {
        setWalletState({
          balance: 0,
          lockedBalance: 0,
          loading: false,
          error: 'Wallet not found',
        });
      }
    } catch (err) {
      setWalletState({
        balance: 0,
        lockedBalance: 0,
        loading: false,
        error: 'Failed to fetch wallet',
      });
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const availableBalance = walletState.balance - walletState.lockedBalance;

  return {
    balance: walletState.balance,
    lockedBalance: walletState.lockedBalance,
    availableBalance,
    loading: walletState.loading,
    error: walletState.error,
    refetch: fetchWallet,
  };
}
