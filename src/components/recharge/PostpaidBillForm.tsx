import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Receipt, CheckCircle } from 'lucide-react';
import { getOperators } from '@/services/operator.service';
import { fetchBillDetails, processPostpaidBill } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import type { Operator, BillDetails } from '@/types/recharge.types';

export function PostpaidBillForm() {
  const { user } = useAuth();
  const { availableBalance, refetch: refetchWallet } = useWallet();
  const { toast } = useToast();

  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);

  const [operators, setOperators] = useState<Operator[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load postpaid operators
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const ops = await getOperators('postpaid');
      setOperators(ops);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleFetchBill = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: 'Invalid mobile number',
        description: 'Please enter a valid 10-digit mobile number',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedOperator) {
      toast({
        title: 'Select operator',
        description: 'Please select your postpaid operator',
        variant: 'destructive',
      });
      return;
    }

    setFetchingBill(true);
    const result = await fetchBillDetails(selectedOperator, mobileNumber);
    setFetchingBill(false);

    if (result.status === 'SUCCESS' && result.data) {
      setBillDetails(result.data);
      toast({
        title: 'Bill fetched',
        description: 'Your bill details have been loaded',
      });
    } else {
      toast({
        title: 'Failed to fetch bill',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handlePayBill = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to sign in to pay bills',
        variant: 'destructive',
      });
      return;
    }

    if (!billDetails) {
      toast({
        title: 'Fetch bill first',
        description: 'Please fetch your bill details first',
        variant: 'destructive',
      });
      return;
    }

    if (billDetails.amount > availableBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'Please add money to your wallet',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    const result = await processPostpaidBill(user.id, billDetails);
    setProcessing(false);

    if (result.status === 'SUCCESS') {
      toast({
        title: 'Bill Paid Successfully!',
        description: `₹${billDetails.amount} paid for ${mobileNumber}`,
      });
      refetchWallet();
      setBillDetails(null);
      setMobileNumber('');
    } else {
      toast({
        title: 'Payment Failed',
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
            <FileText className="h-5 w-5" />
            Postpaid Bill Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter 10-digit number"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <Button 
            onClick={handleFetchBill}
            variant="secondary"
            disabled={fetchingBill || !mobileNumber || !selectedOperator}
            className="w-full sm:w-auto"
          >
            {fetchingBill ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Bill...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Fetch Bill
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bill Details */}
      {billDetails && (
        <Card className="border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Receipt className="h-5 w-5" />
              Bill Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Customer Name</p>
                <p className="font-medium">{billDetails.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{billDetails.mobile_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bill Number</p>
                <p className="font-medium">{billDetails.bill_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{billDetails.due_date}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-accent rounded-lg mb-6">
              <span className="text-lg font-medium">Amount Due</span>
              <span className="text-2xl font-bold text-primary">₹{billDetails.amount}</span>
            </div>

            <Button 
              onClick={handlePayBill}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pay ₹{billDetails.amount}
                </>
              )}
            </Button>

            {user && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Wallet Balance: <span className="font-semibold text-foreground">₹{availableBalance.toFixed(2)}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
