import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { getOperators, getCircles, detectOperator } from '@/services/operator.service';
import { getPlans } from '@/services/plans.service';
import { processRecharge } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import type { Operator, Circle, RechargePlan } from '@/types/recharge.types';

export function MobileRechargeForm() {
  const { user } = useAuth();
  const { availableBalance, refetch: refetchWallet } = useWallet();
  const { toast } = useToast();

  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [selectedCircle, setSelectedCircle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [planCategory, setPlanCategory] = useState<string>('all');

  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);

  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load operators and circles
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [ops, circs] = await Promise.all([
        getOperators('prepaid'),
        getCircles(),
      ]);
      setOperators(ops);
      setCircles(circs);
      setLoading(false);
    };
    loadData();
  }, []);

  // Auto-detect operator when mobile number is entered
  useEffect(() => {
    const detect = async () => {
      if (mobileNumber.length === 10) {
        setDetecting(true);
        const result = await detectOperator(mobileNumber);
        if (result.status === 'SUCCESS' && result.data) {
          setSelectedOperator(result.data.operator.id);
          setSelectedCircle(result.data.circle.id);
        }
        setDetecting(false);
      }
    };
    detect();
  }, [mobileNumber]);

  // Load plans when operator changes
  useEffect(() => {
    const loadPlans = async () => {
      if (selectedOperator) {
        setLoadingPlans(true);
        const result = await getPlans(selectedOperator, selectedCircle, planCategory);
        if (result.status === 'SUCCESS') {
          setPlans(result.data);
        }
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, [selectedOperator, selectedCircle, planCategory]);

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

    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: 'Invalid mobile number',
        description: 'Please enter a valid 10-digit mobile number',
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
      mobile_number: mobileNumber,
      operator_id: selectedOperator,
      circle_id: selectedCircle,
      amount: rechargeAmount,
      plan_id: selectedPlan?.id,
    });

    setProcessing(false);

    if (result.status === 'SUCCESS') {
      toast({
        title: 'Recharge Successful!',
        description: `₹${rechargeAmount} recharge done for ${mobileNumber}`,
      });
      refetchWallet();
      // Reset form
      setMobileNumber('');
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
            <Phone className="h-5 w-5" />
            Mobile Recharge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                />
                {detecting && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Operator */}
            <div className="space-y-2">
              <Label>Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
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

            {/* Circle */}
            <div className="space-y-2">
              <Label>Circle</Label>
              <Select value={selectedCircle} onValueChange={setSelectedCircle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select circle" />
                </SelectTrigger>
                <SelectContent>
                  {circles.map((circle) => (
                    <SelectItem key={circle.id} value={circle.id}>
                      {circle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={processing || !mobileNumber || !selectedOperator || !amount}
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
            <CardTitle>Browse Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={planCategory} onValueChange={setPlanCategory}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unlimited">Unlimited</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="combo">Combo</TabsTrigger>
              </TabsList>

              <TabsContent value={planCategory}>
                {loadingPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : plans.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No plans found for this category
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
                          <p className="text-sm text-foreground mb-2">{plan.description}</p>
                          {plan.data && (
                            <p className="text-xs text-muted-foreground">Data: {plan.data}</p>
                          )}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
