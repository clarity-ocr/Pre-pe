import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, History, Smartphone, Tv, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTransactionHistory } from '@/services/recharge.service';
import { format } from 'date-fns';
import type { Transaction } from '@/types/recharge.types';

export function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const loadTransactions = async () => {
      if (user) {
        setLoading(true);
        const serviceType = filter === 'all' ? undefined : filter;
        const txns = await getTransactionHistory(user.id, 50, serviceType);
        setTransactions(txns);
        setLoading(false);
      }
    };
    loadTransactions();
  }, [user, filter]);

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'MOBILE_PREPAID':
        return <Smartphone className="h-4 w-4" />;
      case 'DTH':
        return <Tv className="h-4 w-4" />;
      case 'MOBILE_POSTPAID':
        return <FileText className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge className="bg-chart-2/20 text-chart-2 hover:bg-chart-2/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge className="bg-chart-3/20 text-chart-3 hover:bg-chart-3/30">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'MOBILE_PREPAID':
        return 'Mobile Prepaid';
      case 'DTH':
        return 'DTH Recharge';
      case 'MOBILE_POSTPAID':
        return 'Postpaid Bill';
      default:
        return serviceType;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={setFilter} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="MOBILE_PREPAID">Mobile</TabsTrigger>
            <TabsTrigger value="DTH">DTH</TabsTrigger>
            <TabsTrigger value="MOBILE_POSTPAID">Postpaid</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-accent">
                    {getServiceIcon(tx.service_type)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {tx.mobile_number || tx.dth_id || 'N/A'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {getServiceLabel(tx.service_type)}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">₹{Number(tx.amount).toFixed(2)}</p>
                  <div className="mt-1">{getStatusBadge(tx.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
