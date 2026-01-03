import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Tv, FileText, Wallet, Gift, Zap } from 'lucide-react';

const services = [
  {
    id: 'mobile',
    title: 'Mobile Recharge',
    description: 'Prepaid mobile recharge for all operators',
    icon: Smartphone,
    path: '/mobile-recharge',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'dth',
    title: 'DTH Recharge',
    description: 'Recharge your DTH/D2H connection',
    icon: Tv,
    path: '/dth-recharge',
    color: 'bg-chart-2/20 text-chart-2',
  },
  {
    id: 'postpaid',
    title: 'Postpaid Bills',
    description: 'Pay your postpaid mobile bills',
    icon: FileText,
    path: '/postpaid',
    color: 'bg-chart-3/20 text-chart-3',
  },
  {
    id: 'wallet',
    title: 'Wallet',
    description: 'Manage your wallet balance',
    icon: Wallet,
    path: '/wallet',
    color: 'bg-chart-4/20 text-chart-4',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Instant Recharge',
    description: 'Get your recharge done in seconds',
  },
  {
    icon: Gift,
    title: 'Exclusive Offers',
    description: 'Avail special discounts and cashback',
  },
  {
    icon: Wallet,
    title: 'Secure Wallet',
    description: 'Safe and secure wallet transactions',
  },
];

export function ServiceGrid() {
  return (
    <div className="space-y-12">
      {/* Services Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Our Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} to={service.path}>
                <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-xl ${service.color} mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="py-8 border-y border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
