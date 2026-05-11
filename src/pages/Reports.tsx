import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ReportedEntityDto, ReportDto, UserProfileResponse, PublicationResponse } from '../types/api';
import { ModerationAction, ReportTargetType } from '../types/api';
import { ShieldAlert, User, MessageSquare, Image, ChevronRight, CheckCircle, Ban, Trash2, Loader2, ExternalLink, Calendar, Heart } from 'lucide-react';

const Reports: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState<ReportedEntityDto | null>(null);

  const { data: reportedEntities, isLoading, refetch } = useQuery<ReportedEntityDto[]>({
    queryKey: ['reportedEntities'],
    queryFn: async () => {
      const response = await apiClient.get('/api/moderation/reports', {
        params: { take: 10 }
      });
      return response.data;
    },
  });

  const { data: entityReports, isLoading: reportsLoading } = useQuery<ReportDto[]>({
    queryKey: ['entityReports', selectedEntity?.targetType, selectedEntity?.targetId],
    queryFn: async () => {
      if (!selectedEntity) return [];
      const response = await apiClient.get(`/api/moderation/reports/${selectedEntity.targetType}/${selectedEntity.targetId}`);
      return response.data;
    },
    enabled: !!selectedEntity,
  });

  // Fetch target details for preview
  const { data: targetUser, isLoading: userLoading } = useQuery<UserProfileResponse>({
    queryKey: ['user', selectedEntity?.targetId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/Users/${selectedEntity?.targetId}`);
      return response.data;
    },
    enabled: !!selectedEntity && selectedEntity.targetType === ReportTargetType.User,
  });

  const { data: targetPublication, isLoading: pubLoading } = useQuery<PublicationResponse>({
    queryKey: ['publication', selectedEntity?.targetId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/Publications/${selectedEntity?.targetId}`);
      return response.data;
    },
    enabled: !!selectedEntity && selectedEntity.targetType === ReportTargetType.Publication,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ action }: { action: ModerationAction }) => {
      if (!selectedEntity) return;
      await apiClient.post('/api/moderation/reports/resolve', {
        targetType: selectedEntity.targetType,
        targetId: selectedEntity.targetId,
        action: action,
      });
    },
    onSuccess: () => {
      setSelectedEntity(null);
      queryClient.invalidateQueries({ queryKey: ['reportedEntities'] });
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.code;
      let message = 'An error occurred while resolving the report.';
      
      switch (errorCode) {
        case 'Report.Unauthorized':
          message = 'This task is already being handled by another moderator.';
          break;
        case 'Report.CannotDeleteUser':
          message = 'Cannot delete a user; they can only be banned.';
          break;
        case 'User.CannotBanModerator':
          message = 'Insufficient permissions to ban this user.';
          break;
        case 'Report.NotFound':
          message = 'Reports have already been processed and closed by another moderator.';
          refetch();
          break;
      }
      
      alert(message); // Or use a nicer toast notification if available
    }
  });

  const getTargetIcon = (type: ReportTargetType) => {
    switch (type) {
      case ReportTargetType.User: return User;
      case ReportTargetType.Comment: return MessageSquare;
      case ReportTargetType.Publication: return Image;
      default: return ShieldAlert;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-160px)]">
      {/* List Column */}
      <div className="flex flex-col space-y-4 h-full overflow-hidden">
        <div>
          <h2 className="text-3xl font-bold">Reports</h2>
          <p className="text-gray-400 mt-1">Review and resolve content reports.</p>
        </div>

        <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading reports...</div>
          ) : reportedEntities?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending reports.</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {reportedEntities?.map((entity) => {
                const Icon = getTargetIcon(entity.targetType);
                const isSelected = selectedEntity?.targetId === entity.targetId;
                return (
                  <button
                    key={`${entity.targetType}-${entity.targetId}`}
                    onClick={() => setSelectedEntity(entity)}
                    className={cn(
                      "w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors text-left",
                      isSelected && "bg-blue-600/10 border-l-4 border-blue-500"
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-700 rounded-lg">
                        <Icon size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {entity.targetType}: {entity.targetId.slice(0, 8)}...
                          <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 uppercase">
                            {entity.mostCommonCategory}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {entity.pendingReportsCount} reports • Last: {new Date(entity.lastReportedAt).toLocaleDateString()}
                        </p>
                        {entity.assignedToUserName && (
                          <p className="text-[10px] text-blue-400 mt-0.5">Assigned to: {entity.assignedToUserName}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-500" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Details Column */}
      <div className="flex flex-col space-y-4 h-full overflow-hidden">
        {selectedEntity ? (
          <>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold">Resolution Details</h3>
                  <p className="text-sm text-gray-400 mt-1">Target ID: {selectedEntity.targetId}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => resolveMutation.mutate({ action: ModerationAction.Dismiss })}
                    disabled={resolveMutation.isPending}
                    className="p-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-all flex items-center space-x-2"
                    title="Dismiss Reports"
                  >
                    {resolveMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                    <span className="text-xs font-bold">Dismiss</span>
                  </button>
                  {selectedEntity.targetType !== ReportTargetType.User && (
                    <button 
                      onClick={() => resolveMutation.mutate({ action: ModerationAction.DeleteEntity })}
                      disabled={resolveMutation.isPending}
                      className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all flex items-center space-x-2"
                      title="Delete Content"
                    >
                      {resolveMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                      <span className="text-xs font-bold">Delete</span>
                    </button>
                  )}
                  <button 
                    onClick={() => resolveMutation.mutate({ action: ModerationAction.BanUser })}
                    disabled={resolveMutation.isPending}
                    className="p-2 bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-all flex items-center space-x-2"
                    title="Ban User"
                  >
                    {resolveMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Ban size={20} />}
                    <span className="text-xs font-bold">Ban</span>
                  </button>
                </div>
              </div>

              {/* Preview Card */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Target Preview</h4>
                {userLoading || pubLoading ? (
                  <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700 flex flex-col items-center justify-center space-y-3">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <span className="text-gray-500 text-sm">Fetching preview data...</span>
                  </div>
                ) : targetUser ? (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 flex items-start space-x-4">
                    <img src={targetUser.avatarUrl || ''} alt="" className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-lg">{targetUser.displayName || 'Unnamed User'}</h4>
                        <button className="text-blue-400 hover:text-blue-300">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{targetUser.bio || 'No bio provided.'}</p>
                      <div className="flex space-x-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <User size={12} />
                          <span>{targetUser.followersCount} followers</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Image size={12} />
                          <span>{targetUser.publicationsCount} posts</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : targetPublication ? (
                  <div className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700 flex">
                    <img src={targetPublication.imageUrl || ''} alt="" className="w-32 h-32 object-cover bg-gray-800" />
                    <div className="p-4 flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-sm line-clamp-2 text-gray-200">"{targetPublication.description || 'No description'}"</h4>
                        <button className="text-blue-400 hover:text-blue-300 ml-2 shrink-0">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                      <div className="mt-auto pt-3 flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center space-x-1">
                            <Heart size={10} className="text-red-500" />
                            <span>{targetPublication.likesCount}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare size={10} className="text-blue-500" />
                            <span>{targetPublication.commentsCount}</span>
                          </span>
                        </div>
                        <span className="flex items-center space-x-1">
                          <Calendar size={10} />
                          <span>{new Date(targetPublication.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-dashed border-gray-700 text-center text-gray-500 text-sm">
                    No preview available for this target type.
                  </div>
                )}
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-540px)]">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Individual Reports</h4>
                {reportsLoading ? (
                  <p className="text-gray-500 text-center py-4">Loading individual reports...</p>
                ) : entityReports?.map((report) => (
                  <div key={report.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-blue-400 px-2 py-0.5 bg-blue-400/10 rounded-full border border-blue-400/20">
                        {report.category}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 italic">"{report.text || 'No description provided.'}"</p>
                    <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                      <User size={12} />
                      <span>By: {report.authorDisplayName || 'Anonymous'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-gray-800/50 rounded-xl border border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
            <ShieldAlert size={48} className="mb-4 opacity-20" />
            <p>Select a reported entity from the list to view details and take action.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for Tailwind classes (re-defined locally to avoid import issues)
function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Reports;
