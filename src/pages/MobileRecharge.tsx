import { Layout } from '@/components/layout/Layout';
import { MobileRechargeForm } from '@/components/recharge/MobileRechargeForm';

const MobileRechargePage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mobile Recharge</h1>
          <p className="text-muted-foreground mt-2">
            Instant prepaid recharge for all major operators
          </p>
        </div>
        <MobileRechargeForm />
      </div>
    </Layout>
  );
};

export default MobileRechargePage;
