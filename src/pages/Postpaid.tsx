import { Layout } from '@/components/layout/Layout';
import { PostpaidBillForm } from '@/components/recharge/PostpaidBillForm';

const PostpaidPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Postpaid Bill Payment</h1>
          <p className="text-muted-foreground mt-2">
            Pay your postpaid mobile bills securely
          </p>
        </div>
        <PostpaidBillForm />
      </div>
    </Layout>
  );
};

export default PostpaidPage;
