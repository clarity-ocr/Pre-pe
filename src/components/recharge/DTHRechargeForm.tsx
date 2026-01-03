import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tv, CheckCircle2 } from 'lucide-react';
import { getOperators } from '@/services/operator.service';
import { getPlans } from '@/services/plans.service';
import { processRecharge } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import type { Operator, RechargePlan } from '@/types/recharge.types';

export function DTHRechargeForm() {
  const { user } = useAuth();
  const { availableBalance, refetch: refetchWallet } = useWallet();
  const { toast } = useToast();

  const [dthId, setDthId] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);

  const [operators, setOperators] = useState<Operator[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load DTH operators
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const ops = await getOperators('dth');
      setOperators(ops);
      setLoading(false);
    };
    loadData();
  }, []);

  // Load plans when operator changes
  useEffect(() => {
    const loadPlans = async () => {
      if (selectedOperator) {
        setLoadingPlans(true);
        const result = await getPlans(selectedOperator);
        if (result.status === 'SUCCESS') {
          setPlans(result.data);
        }
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, [selectedOperator]);

  const handlePlanSelect = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
  };

  const handleRecharge = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to sign in to make a recharge',
        variant: 'destructive',
      });
      return;
    }

    if (!dthId || dthId.length < 8) {
      toast({
        title: 'Invalid DTH ID',
        description: 'Please enter a valid DTH subscriber ID',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedOperator || !amount) {
      toast({
        title: 'Missing details',
        description: 'Please select operator and enter amount',
        variant: 'destructive',
      });
      return;
    }

    const rechargeAmount = parseFloat(amount);
    if (rechargeAmount > availableBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'Please add money to your wallet',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    const result = await processRecharge(user.id, {
      dth_id: dthId,
      operator_id: selectedOperator,
      amount: rechargeAmount,
      plan_id: selectedPlan?.id,
    });

    setProcessing(false);

    if (result.status === 'SUCCESS') {
      toast({
        title: 'Recharge Successful!',
        description: `₹${rechargeAmount} recharge done for DTH ID ${dthId}`,
      });
      refetchWallet();
      setDthId('');
      setAmount('');
      setSelectedPlan(null);
    } else if (result.status === 'PENDING') {
      toast({
        title: 'Recharge Processing',
        description: 'Your recharge is being processed. Check history for status.',
      });
      refetchWallet();
    } else {
      toast({
        title: 'Recharge Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            DTH Recharge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operator */}
            <div className="space-y-2">
              <Label>DTH Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select DTH operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DTH ID */}
            <div className="space-y-2">
              <Label htmlFor="dthId">Subscriber ID / VC Number</Label>
              <Input
                id="dthId"
                type="text"
                placeholder="Enter subscriber ID"
                value={dthId}
                onChange={(e) => setDthId(e.target.value)}
              />
            </div>
          </div>

          {/* Amount & Recharge Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleRecharge} 
              disabled={processing || !dthId || !selectedOperator || !amount}
              className="w-full sm:w-auto px-8"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Recharge ₹${amount || '0'}`
              )}
            </Button>
          </div>

          {user && (
            <p className="text-sm text-muted-foreground">
              Wallet Balance: <span className="font-semibold text-foreground">₹{availableBalance.toFixed(2)}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      {selectedOperator && (
        <Card>
          <CardHeader>
            <CardTitle>Available Packs</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No packs found for this operator
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl font-bold text-primary">₹{plan.amount}</span>
                        <Badge variant="secondary">{plan.validity}</Badge>
                      </div>
                      <p className="text-sm text-foreground">{plan.description}</p>
                      {selectedPlan?.id === plan.id && (
                        <div className="mt-2 flex items-center text-sm text-primary">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Selected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
