export const ModerationAction = {
  DeleteEntity: 'DeleteEntity',
  BanUser: 'BanUser',
  Dismiss: 'Dismiss',
} as const;
export type ModerationAction = typeof ModerationAction[keyof typeof ModerationAction];

export const ReportTargetType = {
  Comment: 'Comment',
  Publication: 'Publication',
  User: 'User',
} as const;
export type ReportTargetType = typeof ReportTargetType[keyof typeof ReportTargetType];

export const ReportCategory = {
  Spam: 'Spam',
  Harassment: 'Harassment',
  InappropriateContent: 'InappropriateContent',
  Copyright: 'Copyright',
  Other: 'Other',
} as const;
export type ReportCategory = typeof ReportCategory[keyof typeof ReportCategory];

export interface AdvertisementResponse {
  id: string;
  text: string | null;
  url: string | null;
  imageUrl: string | null;
  imageUrls: string[] | null;
  maxImpressions: number;
  currentImpressions: number;
  isActive: boolean;
  tagIds: string[] | null;
  createdAt: string;
}

export interface ReportedEntityDto {
  targetType: ReportTargetType;
  targetId: string;
  pendingReportsCount: number;
  mostCommonCategory: ReportCategory;
  firstReportedAt: string;
  lastReportedAt: string;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
}

export interface ReportDto {
  id: string;
  category: ReportCategory;
  text: string | null;
  authorId: string;
  authorDisplayName: string | null;
  createdAt: string;
}

export interface TagResponse {
  id: string;
  name: string | null;
  category: string;
}

export interface PublicationResponse {
  id: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[] | null;
  createdAt: string;
  userId: string;
  userDisplayName: string | null;
  tags: TagResponse[] | null;
  likesCount: number;
  commentsCount: number;
}

export interface UserProfileResponse {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  publicationsCount: number;
  isFollowing: boolean;
}
