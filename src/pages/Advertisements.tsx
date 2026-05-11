import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { AdvertisementResponse, TagResponse } from '../types/api';
import { Plus, Check, X, Edit, Trash2, Megaphone, Upload, Save, Loader2 } from 'lucide-react';

const Advertisements: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdvertisementResponse | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    text: '',
    url: '',
    maxImpressions: 1000,
    tagIds: [] as string[],
    isActive: true,
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ads, isLoading } = useQuery<AdvertisementResponse[]>({
    queryKey: ['ads', searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/api/Advertisements', {
        params: { search: searchTerm || undefined },
      });
      return response.data;
    },
  });

  const { data: tags } = useQuery<TagResponse[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await apiClient.get('/api/Meta/tags');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiClient.post('/api/Advertisements', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: FormData }) => {
      await apiClient.put(`/api/Advertisements/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      closeModal();
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

  const openModal = (ad?: AdvertisementResponse) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        text: ad.text || '',
        url: ad.url || '',
        maxImpressions: ad.maxImpressions,
        tagIds: ad.tagIds || [],
        isActive: ad.isActive,
      });
    } else {
      setEditingAd(null);
      setFormData({
        text: '',
        url: '',
        maxImpressions: 1000,
        tagIds: [],
        isActive: true,
      });
    }
    setSelectedImages([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAd(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('Text', formData.text);
    data.append('Url', formData.url);
    data.append('MaxImpressions', formData.maxImpressions.toString());
    formData.tagIds.forEach(id => data.append('TagIds', id));

    if (editingAd) {
      data.append('IsActive', formData.isActive.toString());
      if (editingAd.imageUrls) {
        editingAd.imageUrls.forEach(url => data.append('ExistingImages', url));
      }
      selectedImages.forEach(file => data.append('NewImages', file));
      updateMutation.mutate({ id: editingAd.id, data });
    } else {
      selectedImages.forEach(file => data.append('Images', file));
      createMutation.mutate(data);
    }
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Advertisements</h2>
          <p className="text-gray-400 mt-1">Manage platform ads and their visibility.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
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
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 size={24} className="animate-spin text-blue-500" />
                      <span>Loading ads...</span>
                    </div>
                  </td>
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
                        <button 
                          onClick={() => openModal(ad)}
                          className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Ad Text</label>
                  <input
                    type="text"
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Premium Outfit 2026..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Target URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/promo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Max Impressions</label>
                  <input
                    type="number"
                    value={formData.maxImpressions}
                    onChange={(e) => setFormData({ ...formData, maxImpressions: parseInt(e.target.value) })}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Ad Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-2.5 bg-gray-900 border border-dashed border-gray-700 rounded-lg text-gray-400 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {selectedImages.length > 0 ? (
                      <span className="text-white text-sm">{selectedImages[0].name}</span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Upload size={18} />
                        <span className="text-sm">Upload image</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-400">Target Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags?.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        formData.tagIds.includes(tag.id)
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {editingAd && (
                <div className="flex items-center space-x-3 p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-300">Active and visible on platform</label>
                </div>
              )}
            </form>

            <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                <span>{editingAd ? 'Update Ad' : 'Create Ad'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for Tailwind classes (copied from Layout for now)
function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Advertisements;
