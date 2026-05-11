import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Megaphone, ShieldAlert, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      const response = await apiClient.get('/api/Advertisements');
      return response.data;
    },
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reportedEntities'],
    queryFn: async () => {
      const response = await apiClient.get('/api/Moderation/reports');
      return response.data;
    },
  });

  const stats = [
    {
      label: 'Active Ads',
      value: ads?.filter((ad: any) => ad.isActive).length || 0,
      icon: Megaphone,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Pending Reports',
      value: reports?.length || 0,
      icon: ShieldAlert,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Total Ads',
      value: ads?.length || 0,
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-gray-400 mt-2">Overview of the DripRate platform moderation status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">
                  {adsLoading || reportsLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Create New Advertisement
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Review Latest Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
