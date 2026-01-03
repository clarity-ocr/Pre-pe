import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { ServiceGrid } from '@/components/home/ServiceGrid';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <div className="container py-12">
        <ServiceGrid />
      </div>
    </Layout>
  );
};

export default Index;
