import { z } from "zod";
import {
  signupSchema,
  loginSchema,
  profileUpdateSchema,
  onboardingSchema,
  likeCreateSchema,
  likeRespondSchema,
  messageCreateSchema,
  messageReactionSchema,
  reportCreateSchema,
  blockCreateSchema,
  preferencesUpdateSchema,
  promptCreateSchema,
  promptUpdateSchema,
  weMetSchema,
  photoReorderSchema,
  notificationPreferencesSchema,
  discoveryQuerySchema,
  paginationSchema,
} from "./schemas";

import type {
  GenderValue,
  GenderPreferenceValue,
  ReligionValue,
  PoliticsValue,
  DrinkingValue,
  SmokingValue,
  DrugsValue,
  FamilyPlansValue,
  EthnicityValue,
  LikeTargetTypeValue,
  LikeStatusValue,
  MessageTypeValue,
  NotificationTypeValue,
  ReportCategoryValue,
  ReportStatusValue,
  WeMetValue,
} from "./constants";

// ============================================================================
// Schema-Inferred Types (request payloads)
// ============================================================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type LikeCreateInput = z.infer<typeof likeCreateSchema>;
export type LikeRespondInput = z.infer<typeof likeRespondSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type MessageReactionInput = z.infer<typeof messageReactionSchema>;
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type BlockCreateInput = z.infer<typeof blockCreateSchema>;
export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;
export type PromptCreateInput = z.infer<typeof promptCreateSchema>;
export type PromptUpdateInput = z.infer<typeof promptUpdateSchema>;
export type WeMetInput = z.infer<typeof weMetSchema>;
export type PhotoReorderInput = z.infer<typeof photoReorderSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type DiscoveryQueryInput = z.infer<typeof discoveryQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================================
// Enums (re-exported from constants for convenience)
// ============================================================================

export type {
  GenderValue as Gender,
  GenderPreferenceValue as GenderPreference,
  ReligionValue as Religion,
  PoliticsValue as Politics,
  DrinkingValue as Drinking,
  SmokingValue as Smoking,
  DrugsValue as Drugs,
  FamilyPlansValue as FamilyPlans,
  EthnicityValue as Ethnicity,
  LikeTargetTypeValue as LikeTargetType,
  LikeStatusValue as LikeStatus,
  MessageTypeValue as MessageType,
  NotificationTypeValue as NotificationType,
  ReportCategoryValue as ReportCategory,
  ReportStatusValue as ReportStatus,
  WeMetValue as WeMet,
};

// ============================================================================
// Domain Models (API response shapes)
// ============================================================================

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  birthday: string;
  age: number;
  gender: GenderValue;
  genderPreference: GenderPreferenceValue;
  bio: string | null;
  jobTitle: string | null;
  company: string | null;
  school: string | null;
  hometown: string | null;
  height: number | null;
  religion: ReligionValue | null;
  politics: PoliticsValue | null;
  drinking: DrinkingValue | null;
  smoking: SmokingValue | null;
  drugs: DrugsValue | null;
  familyPlans: FamilyPlansValue | null;
  ethnicity: EthnicityValue | null;
  isVerified: boolean;
  isActive: boolean;
  isPaused: boolean;
  profileComplete: boolean;
  photos: PhotoSlot[];
  prompts: PromptResponse[];
  lastActiveAt: string;
  createdAt: string;
}

/** Reduced profile shown to other users (never includes PII) */
export interface PublicUserProfile {
  id: string;
  firstName: string;
  age: number;
  gender: GenderValue;
  bio: string | null;
  jobTitle: string | null;
  company: string | null;
  school: string | null;
  hometown: string | null;
  height: number | null;
  religion: ReligionValue | null;
  politics: PoliticsValue | null;
  drinking: DrinkingValue | null;
  smoking: SmokingValue | null;
  drugs: DrugsValue | null;
  familyPlans: FamilyPlansValue | null;
  ethnicity: EthnicityValue | null;
  isVerified: boolean;
  distanceMiles: number | null;
  photos: PhotoSlot[];
  prompts: PromptResponse[];
}

export interface PhotoSlot {
  id: string;
  url: string;
  position: number;
  isVerification: boolean;
  createdAt: string;
}

export interface PromptResponse {
  id: string;
  promptTemplateId: string;
  promptText: string;
  answer: string;
  position: number;
  voiceUrl: string | null;
}

export interface PromptTemplate {
  id: string;
  category: string;
  text: string;
}

// ============================================================================
// Like & Match Types
// ============================================================================

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  targetType: LikeTargetTypeValue;
  targetId: string;
  comment: string | null;
  isRose: boolean;
  status: LikeStatusValue;
  createdAt: string;
}

/** Like received, as shown on "Likes You" screen */
export interface LikeReceived {
  id: string;
  fromUser: PublicUserProfile;
  targetType: LikeTargetTypeValue;
  targetId: string;
  /** The specific photo or prompt that was liked */
  targetContent: PhotoSlot | PromptResponse;
  comment: string | null;
  isRose: boolean;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: string;
  isActive: boolean;
  weMet: WeMetValue | null;
  weMetFeedback: string | null;
}

/** Match as shown in the matches list */
export interface MatchListItem {
  id: string;
  otherUser: PublicUserProfile;
  matchedAt: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isYourTurn: boolean;
}

// ============================================================================
// Messaging Types
// ============================================================================

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: MessageTypeValue;
  reactions: MessageReaction[];
  readAt: string | null;
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

/** Chat message as rendered in the chat UI */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderFirstName: string;
  content: string;
  type: MessageTypeValue;
  reactions: MessageReaction[];
  readAt: string | null;
  createdAt: string;
  isMine: boolean;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// Discovery Types
// ============================================================================

/** Full profile card shown in discovery feed */
export interface DiscoveryCard {
  id: string;
  user: PublicUserProfile;
  compatibilityScore: number | null;
  isMostCompatible: boolean;
  isStandout: boolean;
}

export interface DiscoveryFeedResponse {
  cards: DiscoveryCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============================================================================
// Preferences Types
// ============================================================================

export interface UserPreferences {
  id: string;
  userId: string;
  ageMin: number;
  ageMax: number;
  distanceMax: number;
  heightMin: number | null;
  heightMax: number | null;
  ethnicity: EthnicityValue[];
  religion: ReligionValue[];
  politics: PoliticsValue[];
  drinking: DrinkingValue[];
  smoking: SmokingValue[];
  familyPlans: FamilyPlansValue[];
  ethnicityDealbreaker: boolean;
  religionDealbreaker: boolean;
  politicsDealbreaker: boolean;
  drinkingDealbreaker: boolean;
  smokingDealbreaker: boolean;
  familyPlansDealbreaker: boolean;
}

// ============================================================================
// Report & Block Types
// ============================================================================

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  category: ReportCategoryValue;
  description: string | null;
  status: ReportStatusValue;
  createdAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

// ============================================================================
// Auth Response Types
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

// ============================================================================
// Socket Event Types
// ============================================================================

export interface SocketEvents {
  // Client -> Server
  "chat:join": { matchId: string };
  "chat:leave": { matchId: string };
  "chat:message": { matchId: string; content: string; type: MessageTypeValue };
  "chat:typing": { matchId: string; isTyping: boolean };
  "chat:read": { matchId: string; messageId: string };
  "chat:reaction": { matchId: string; messageId: string; emoji: string };

  // Server -> Client
  "chat:message:new": ChatMessage;
  "chat:typing:update": { matchId: string; userId: string; isTyping: boolean };
  "chat:read:update": { matchId: string; messageId: string; readAt: string };
  "chat:reaction:new": { matchId: string; messageId: string; reaction: MessageReaction };

  // Notifications
  "notification:new": Notification;
  "match:new": { match: Match; otherUser: PublicUserProfile };
  "like:new": { likesCount: number };
}
