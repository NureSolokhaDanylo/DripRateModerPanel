import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { AdvertisementResponse } from '../types/api';
import { Megaphone, ShieldAlert, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { data: ads, isLoading: adsLoading } = useQuery<AdvertisementResponse[]>({
    queryKey: ['ads'],
    queryFn: async () => {
      const response = await apiClient.get('/api/Advertisements');
      return response.data;
    },
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reportedEntities'],
    queryFn: async () => {
      const response = await apiClient.get('/api/moderation/reports');
      return response.data;
    },
  });

  const stats = [
    {
      label: 'Active Ads',
      value: ads?.filter((ad) => ad.isActive).length || 0,
      icon: Megaphone,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Assigned Tasks',
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-lg font-medium">{stat.label}</p>
                <p className="text-5xl font-bold mt-2">
                  {adsLoading || reportsLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.bg} p-5 rounded-xl`}>
                <stat.icon className={stat.color} size={40} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
