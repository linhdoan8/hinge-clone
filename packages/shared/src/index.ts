// Constants
export {
  // Rate limits
  RATE_LIMITS,

  // Photo & Prompt limits
  MAX_PHOTOS,
  MIN_PHOTOS,
  MAX_PROMPTS,
  MIN_PROMPTS,
  MAX_PROMPT_ANSWER_LENGTH,
  MAX_LIKE_COMMENT_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_BIO_LENGTH,

  // Discovery & Matching
  DEFAULT_DISTANCE_MAX_MILES,
  MAX_DISTANCE_MILES,
  DEFAULT_AGE_MIN,
  DEFAULT_AGE_MAX,
  MIN_AGE,
  MAX_AGE,
  DISCOVERY_BATCH_SIZE,

  // Prompt templates
  PROMPT_TEMPLATES,
  PROMPT_CATEGORIES,

  // Option arrays (for enums/select fields)
  REPORT_CATEGORIES,
  GENDER_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  DRUGS_OPTIONS,
  FAMILY_PLANS_OPTIONS,
  ETHNICITY_OPTIONS,
  IDENTITY_OPTIONS,
  LIKE_TARGET_TYPES,
  LIKE_STATUSES,
  MESSAGE_TYPES,
  WE_MET_OPTIONS,
  NOTIFICATION_TYPES,
  REPORT_STATUSES,

  // Privacy & upload
  COORDINATE_PRECISION,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VOICE_PROMPT_DURATION_SECONDS,
  MAX_VOICE_PROMPT_SIZE_BYTES,
} from "./constants";

export type {
  PromptCategory,
  PromptTemplateDefinition,
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

// Schemas
export {
  // Auth
  signupSchema,
  loginSchema,
  phoneLoginSchema,
  verifyCodeSchema,

  // Profile
  profileUpdateSchema,
  onboardingSchema,

  // Photos
  photoUploadSchema,
  photoReorderSchema,

  // Prompts
  promptCreateSchema,
  promptUpdateSchema,

  // Likes
  likeCreateSchema,
  likeRespondSchema,

  // Messages
  messageCreateSchema,
  messageReactionSchema,

  // Reports & Blocks
  reportCreateSchema,
  blockCreateSchema,

  // Preferences
  preferencesUpdateSchema,

  // Match
  weMetSchema,

  // Notifications
  notificationPreferencesSchema,
  markNotificationsReadSchema,

  // Discovery
  discoveryQuerySchema,

  // Pagination
  paginationSchema,

  // Socket events
  socketJoinRoomSchema,
  socketSendMessageSchema,
  socketTypingSchema,
  socketReadReceiptSchema,
} from "./schemas";

// Types
export type {
  // Schema-inferred input types
  SignupInput,
  LoginInput,
  ProfileUpdateInput,
  OnboardingInput,
  LikeCreateInput,
  LikeRespondInput,
  MessageCreateInput,
  MessageReactionInput,
  ReportCreateInput,
  BlockCreateInput,
  PreferencesUpdateInput,
  PromptCreateInput,
  PromptUpdateInput,
  WeMetInput,
  PhotoReorderInput,
  NotificationPreferencesInput,
  DiscoveryQueryInput,
  PaginationInput,

  // Re-exported enum aliases
  Gender,
  GenderPreference,
  Religion,
  Politics,
  Drinking,
  Smoking,
  Drugs,
  FamilyPlans,
  Ethnicity,
  LikeTargetType,
  LikeStatus,
  MessageType,
  NotificationType,
  ReportCategory,
  ReportStatus,
  WeMet,

  // Domain models
  UserProfile,
  PublicUserProfile,
  PhotoSlot,
  PromptResponse,
  PromptTemplate,
  Like,
  LikeReceived,
  Match,
  MatchListItem,
  Message,
  MessageReaction,
  ChatMessage,
  Notification,
  DiscoveryCard,
  DiscoveryFeedResponse,
  UserPreferences,
  Report,
  Block,

  // API wrappers
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginatedResponse,

  // Auth
  AuthTokens,
  AuthResponse,

  // Socket
  SocketEvents,
} from "./types";
