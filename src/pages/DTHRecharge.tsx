import { Layout } from '@/components/layout/Layout';
import { DTHRechargeForm } from '@/components/recharge/DTHRechargeForm';

const DTHRechargePage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">DTH Recharge</h1>
          <p className="text-muted-foreground mt-2">
            Recharge your DTH/D2H connection instantly
          </p>
        </div>
        <DTHRechargeForm />
      </div>
    </Layout>
  );
};

export default DTHRechargePage;
