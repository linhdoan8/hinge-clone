// ============================================================================
// Rate Limits
// ============================================================================

export const RATE_LIMITS = {
  likes: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  messages: { max: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  reports: { max: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
  roses: { max: 1, windowMs: 24 * 60 * 60 * 1000 }, // 1 per day (free tier)
} as const;

// ============================================================================
// Photo & Prompt Limits
// ============================================================================

export const MAX_PHOTOS = 6;
export const MIN_PHOTOS = 6;
export const MAX_PROMPTS = 3;
export const MIN_PROMPTS = 3;
export const MAX_PROMPT_ANSWER_LENGTH = 250;
export const MAX_LIKE_COMMENT_LENGTH = 140;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_BIO_LENGTH = 500;

// ============================================================================
// Discovery & Matching
// ============================================================================

export const DEFAULT_DISTANCE_MAX_MILES = 25;
export const MAX_DISTANCE_MILES = 100;
export const DEFAULT_AGE_MIN = 18;
export const DEFAULT_AGE_MAX = 99;
export const MIN_AGE = 18;
export const MAX_AGE = 99;
export const DISCOVERY_BATCH_SIZE = 10;

// ============================================================================
// Prompt Templates
// ============================================================================

export interface PromptTemplateDefinition {
  id: string;
  category: PromptCategory;
  text: string;
}

export type PromptCategory =
  | "ABOUT_ME"
  | "CREATIVITY"
  | "OPINIONS"
  | "STORYTELLING"
  | "DATING"
  | "LIFESTYLE";

export const PROMPT_CATEGORIES: readonly PromptCategory[] = [
  "ABOUT_ME",
  "CREATIVITY",
  "OPINIONS",
  "STORYTELLING",
  "DATING",
  "LIFESTYLE",
] as const;

export const PROMPT_TEMPLATES: readonly PromptTemplateDefinition[] = [
  // ABOUT_ME
  { id: "pt_01", category: "ABOUT_ME", text: "A shower thought I recently had" },
  { id: "pt_02", category: "ABOUT_ME", text: "My simple pleasures" },
  { id: "pt_03", category: "ABOUT_ME", text: "I geek out on" },
  { id: "pt_04", category: "ABOUT_ME", text: "My most irrational fear" },
  { id: "pt_05", category: "ABOUT_ME", text: "The hallmark of a good relationship is" },
  { id: "pt_06", category: "ABOUT_ME", text: "I'm looking for" },
  { id: "pt_07", category: "ABOUT_ME", text: "I'm known for" },

  // CREATIVITY
  { id: "pt_08", category: "CREATIVITY", text: "Two truths and a lie" },
  { id: "pt_09", category: "CREATIVITY", text: "Typical Sunday" },
  { id: "pt_10", category: "CREATIVITY", text: "My go-to karaoke song" },
  { id: "pt_11", category: "CREATIVITY", text: "A life goal of mine" },

  // OPINIONS
  { id: "pt_12", category: "OPINIONS", text: "A hot take I have" },
  { id: "pt_13", category: "OPINIONS", text: "The best way to ask me out is" },
  { id: "pt_14", category: "OPINIONS", text: "The way to win me over is" },
  { id: "pt_15", category: "OPINIONS", text: "My love language is" },

  // STORYTELLING
  { id: "pt_16", category: "STORYTELLING", text: "My most embarrassing moment" },
  { id: "pt_17", category: "STORYTELLING", text: "The best trip I ever took" },
  { id: "pt_18", category: "STORYTELLING", text: "An unexpected fact about me" },
  { id: "pt_19", category: "STORYTELLING", text: "The last thing I read that I loved" },

  // DATING
  { id: "pt_20", category: "DATING", text: "Together, we could" },
  { id: "pt_21", category: "DATING", text: "I'm convinced that" },
  { id: "pt_22", category: "DATING", text: "Let's debate this topic" },
  { id: "pt_23", category: "DATING", text: "You should leave a comment if" },

  // LIFESTYLE
  { id: "pt_24", category: "LIFESTYLE", text: "My biggest date fail" },
  { id: "pt_25", category: "LIFESTYLE", text: "I recently discovered that" },
  { id: "pt_26", category: "LIFESTYLE", text: "A boundary of mine is" },
  { id: "pt_27", category: "LIFESTYLE", text: "I want someone who" },
  { id: "pt_28", category: "LIFESTYLE", text: "Believe it or not, I" },
] as const;

// ============================================================================
// Report Categories
// ============================================================================

export const REPORT_CATEGORIES = [
  "INAPPROPRIATE_PHOTOS",
  "INAPPROPRIATE_MESSAGES",
  "HARASSMENT",
  "SPAM",
  "FAKE_PROFILE",
  "UNDERAGE",
  "SCAM",
  "HATE_SPEECH",
  "VIOLENCE_THREAT",
  "OTHER",
] as const;

export type ReportCategoryValue = (typeof REPORT_CATEGORIES)[number];

// ============================================================================
// Identity Options
// ============================================================================

export const GENDER_OPTIONS = [
  "MAN",
  "WOMAN",
  "NON_BINARY",
  "TRANSGENDER_MAN",
  "TRANSGENDER_WOMAN",
  "OTHER",
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number];

export const GENDER_PREFERENCE_OPTIONS = [
  "MEN",
  "WOMEN",
  "EVERYONE",
] as const;

export type GenderPreferenceValue = (typeof GENDER_PREFERENCE_OPTIONS)[number];

export const RELIGION_OPTIONS = [
  "AGNOSTIC",
  "ATHEIST",
  "BUDDHIST",
  "CATHOLIC",
  "CHRISTIAN",
  "HINDU",
  "JEWISH",
  "MUSLIM",
  "SPIRITUAL",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

export type ReligionValue = (typeof RELIGION_OPTIONS)[number];

export const POLITICS_OPTIONS = [
  "LIBERAL",
  "MODERATE",
  "CONSERVATIVE",
  "NOT_POLITICAL",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

export type PoliticsValue = (typeof POLITICS_OPTIONS)[number];

export const DRINKING_OPTIONS = [
  "YES",
  "SOMETIMES",
  "NO",
  "SOBER",
  "PREFER_NOT_TO_SAY",
] as const;

export type DrinkingValue = (typeof DRINKING_OPTIONS)[number];

export const SMOKING_OPTIONS = [
  "YES",
  "SOMETIMES",
  "NO",
  "TRYING_TO_QUIT",
  "PREFER_NOT_TO_SAY",
] as const;

export type SmokingValue = (typeof SMOKING_OPTIONS)[number];

export const DRUGS_OPTIONS = [
  "YES",
  "SOMETIMES",
  "NO",
  "PREFER_NOT_TO_SAY",
] as const;

export type DrugsValue = (typeof DRUGS_OPTIONS)[number];

export const FAMILY_PLANS_OPTIONS = [
  "WANT_CHILDREN",
  "DONT_WANT_CHILDREN",
  "HAVE_AND_WANT_MORE",
  "HAVE_AND_DONT_WANT_MORE",
  "NOT_SURE",
  "PREFER_NOT_TO_SAY",
] as const;

export type FamilyPlansValue = (typeof FAMILY_PLANS_OPTIONS)[number];

export const ETHNICITY_OPTIONS = [
  "BLACK",
  "EAST_ASIAN",
  "HISPANIC_LATINO",
  "MIDDLE_EASTERN",
  "NATIVE_AMERICAN",
  "PACIFIC_ISLANDER",
  "SOUTH_ASIAN",
  "SOUTHEAST_ASIAN",
  "WHITE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

export type EthnicityValue = (typeof ETHNICITY_OPTIONS)[number];

// ============================================================================
// Identity Options Map (for UI rendering)
// ============================================================================

export const IDENTITY_OPTIONS = {
  gender: GENDER_OPTIONS,
  genderPreference: GENDER_PREFERENCE_OPTIONS,
  religion: RELIGION_OPTIONS,
  politics: POLITICS_OPTIONS,
  drinking: DRINKING_OPTIONS,
  smoking: SMOKING_OPTIONS,
  drugs: DRUGS_OPTIONS,
  familyPlans: FAMILY_PLANS_OPTIONS,
  ethnicity: ETHNICITY_OPTIONS,
} as const;

// ============================================================================
// Like & Match
// ============================================================================

export const LIKE_TARGET_TYPES = ["PHOTO", "PROMPT"] as const;
export type LikeTargetTypeValue = (typeof LIKE_TARGET_TYPES)[number];

export const LIKE_STATUSES = ["PENDING", "MATCHED", "SKIPPED", "EXPIRED"] as const;
export type LikeStatusValue = (typeof LIKE_STATUSES)[number];

export const MESSAGE_TYPES = ["TEXT", "IMAGE", "GIF", "SYSTEM"] as const;
export type MessageTypeValue = (typeof MESSAGE_TYPES)[number];

export const WE_MET_OPTIONS = ["YES", "NO"] as const;
export type WeMetValue = (typeof WE_MET_OPTIONS)[number];

// ============================================================================
// Notification Types
// ============================================================================

export const NOTIFICATION_TYPES = [
  "NEW_LIKE",
  "NEW_MATCH",
  "NEW_MESSAGE",
  "DAILY_PICKS",
  "ROSE_RECEIVED",
  "PROFILE_REMINDER",
] as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

// ============================================================================
// Report Statuses
// ============================================================================

export const REPORT_STATUSES = [
  "PENDING",
  "REVIEWED",
  "ACTIONED",
  "DISMISSED",
] as const;

export type ReportStatusValue = (typeof REPORT_STATUSES)[number];

// ============================================================================
// Coordinate Rounding (privacy)
// ============================================================================

export const COORDINATE_PRECISION = 2; // ~1.1km precision at equator

// ============================================================================
// File Upload Constraints
// ============================================================================

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VOICE_PROMPT_DURATION_SECONDS = 30;
export const MAX_VOICE_PROMPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
