import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, History, ArrowUpRight, ArrowDownLeft, Lock } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { getWalletLedger } from '@/services/wallet.service';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export function WalletDashboard() {
  const { user } = useAuth();
  const { balance, lockedBalance, availableBalance, loading, refetch } = useWallet();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    const loadLedger = async () => {
      if (user) {
        setLoadingLedger(true);
        const entries = await getWalletLedger(user.id, 20);
        setLedger(entries);
        setLoadingLedger(false);
      }
    };
    loadLedger();
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return <ArrowDownLeft className="h-4 w-4 text-chart-2" />;
      case 'DEBIT':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'LOCK':
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      case 'UNLOCK':
      case 'REFUND':
        return <ArrowDownLeft className="h-4 w-4 text-chart-3" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'text-chart-2';
      case 'DEBIT':
        return 'text-destructive';
      case 'REFUND':
      case 'UNLOCK':
        return 'text-chart-3';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-5 w-5" />
              <span className="text-sm opacity-90">Total Balance</span>
            </div>
            <p className="text-3xl font-bold">
              {loading ? '...' : `₹${balance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <ArrowUpRight className="h-5 w-5 text-chart-2" />
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? '...' : `₹${availableBalance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Locked</span>
            </div>
            <p className="text-3xl font-bold text-muted-foreground">
              {loading ? '...' : `₹${lockedBalance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Money Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Money to Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-accent/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground mb-2">
              Payment gateway integration coming soon!
            </p>
            <p className="text-sm text-muted-foreground">
              Contact admin to add balance to your wallet.
            </p>
          </div>

          {/* Quick Add Amounts */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[100, 200, 500, 1000].map((amt) => (
              <Button key={amt} variant="outline" disabled>
                ₹{amt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Wallet Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLedger ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : ledger.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No wallet activity yet
            </div>
          ) : (
            <div className="space-y-3">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-card">
                      {getTypeIcon(entry.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTypeColor(entry.type)}`}>
                      {entry.type === 'CREDIT' || entry.type === 'REFUND' || entry.type === 'UNLOCK' ? '+' : '-'}
                      ₹{entry.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bal: ₹{entry.balance_after.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
