import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Users, Activity, RotateCcw, Share2, DollarSign } from 'lucide-react';

interface AarrrMetrics {
  acquisition_TotalUsers: number;
  activation_ActiveUsers: number;
  retention_UsersReturnedAfter7Days: number;
  referral_TotalFollows: number;
  revenue_AdViews: number;
}

const fetchMetrics = async (): Promise<AarrrMetrics> => {
  const { data } = await apiClient.get('/api/meta/metrics/aarrr');
  return data;
};

const Metrics: React.FC = () => {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['aarrr-metrics'],
    queryFn: fetchMetrics,
  });

  if (isLoading) return <div className="text-gray-300 p-8">Loading metrics...</div>;
  if (isError) return <div className="text-red-500 p-8">Failed to load metrics from the server.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">AARRR Project Metrics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Acquisition (Привлечение)" 
          value={metrics?.acquisition_TotalUsers} 
          icon={<Users size={32} className="text-blue-500" />} 
          description="Загальна кількість зареєстрованих користувачів" 
        />
        <MetricCard 
          title="Activation (Активация)" 
          value={metrics?.activation_ActiveUsers} 
          icon={<Activity size={32} className="text-green-500" />} 
          description="Зробили хоча б одну публікацію або оцінку" 
        />
        <MetricCard 
          title="Retention (Удержание)" 
          value={metrics?.retention_UsersReturnedAfter7Days} 
          icon={<RotateCcw size={32} className="text-yellow-500" />} 
          description="Оцінили публікацію через 7+ днів після реєстрації" 
        />
        <MetricCard 
          title="Referral (Виральность)" 
          value={metrics?.referral_TotalFollows} 
          icon={<Share2 size={32} className="text-purple-500" />} 
          description="Внутрішні підписки (Follows) один на одного" 
        />
        <MetricCard 
          title="Revenue (Монетизация)" 
          value={metrics?.revenue_AdViews} 
          icon={<DollarSign size={32} className="text-emerald-500" />} 
          description="Загальна кількість переглядів рекламних інтеграцій" 
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value?: number;
  icon: React.ReactNode;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, description }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-start space-x-4 hover:border-gray-500 transition-colors">
      <div className="p-3 bg-gray-900 rounded-lg">
        {icon}
      </div>
      <div>
        <h2 className="text-gray-400 font-medium text-sm uppercase tracking-wider">{title}</h2>
        <p className="text-3xl font-bold text-white mt-1">{value !== undefined ? value : '-'}</p>
        <p className="text-gray-500 text-xs mt-2">{description}</p>
      </div>
    </div>
  );
};

export default Metrics;
