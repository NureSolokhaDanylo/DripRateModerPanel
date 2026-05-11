import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { AdvertisementResponse } from '../types/api';
import { Plus, Check, X, Edit, Trash2, Megaphone } from 'lucide-react';

const Advertisements: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: ads, isLoading } = useQuery<AdvertisementResponse[]>({
    queryKey: ['ads', searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/api/Advertisements', {
        params: { search: searchTerm || undefined },
      });
      return response.data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      await apiClient.patch(`/api/Advertisements/${id}/active`, isActive, {
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Advertisements</h2>
          <p className="text-gray-400 mt-1">Manage platform ads and their visibility.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus size={20} />
          <span>New Ad</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search ads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700/50 text-gray-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Content</th>
                <th className="px-6 py-4 font-medium">Stats</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading ads...</td>
                </tr>
              ) : ads?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No advertisements found.</td>
                </tr>
              ) : (
                ads?.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        {ad.imageUrl ? (
                          <img src={ad.imageUrl} alt="" className="w-12 h-12 object-cover rounded-md bg-gray-600" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-600 rounded-md flex items-center justify-center">
                            <Megaphone size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium line-clamp-1">{ad.text || 'No text'}</p>
                          <a href={ad.url || '#'} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline line-clamp-1">
                            {ad.url || 'No URL'}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{ad.currentImpressions} / {ad.maxImpressions}</p>
                      <div className="w-32 bg-gray-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${Math.min(100, (ad.currentImpressions / ad.maxImpressions) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: ad.id, isActive: !ad.isActive })}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center space-x-1",
                          ad.isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                        )}
                      >
                        {ad.isActive ? <Check size={12} /> : <X size={12} />}
                        <span>{ad.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 hover:bg-red-600/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper for Tailwind classes (copied from Layout for now)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Advertisements;
