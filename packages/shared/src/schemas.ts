import { z } from "zod";
import {
  GENDER_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  DRUGS_OPTIONS,
  FAMILY_PLANS_OPTIONS,
  ETHNICITY_OPTIONS,
  LIKE_TARGET_TYPES,
  MESSAGE_TYPES,
  REPORT_CATEGORIES,
  WE_MET_OPTIONS,
  NOTIFICATION_TYPES,
  MAX_PROMPT_ANSWER_LENGTH,
  MAX_LIKE_COMMENT_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_BIO_LENGTH,
  MIN_AGE,
  MAX_AGE,
  MAX_DISTANCE_MILES,
  MAX_PHOTOS,
  MIN_PHOTOS,
  MAX_PROMPTS,
} from "./constants";

// ============================================================================
// Helpers
// ============================================================================

const nonEmptyString = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

const optionalString = () => z.string().trim().optional();

// ============================================================================
// Auth Schemas
// ============================================================================

export const signupSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  firstName: nonEmptyString("First name").max(50, "First name is too long"),
  lastName: nonEmptyString("Last name").max(50, "Last name is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number (E.164 format required)"),
});

export const verifyCodeSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number"),
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must be numeric"),
});

// ============================================================================
// Profile Schemas
// ============================================================================

export const profileUpdateSchema = z.object({
  firstName: nonEmptyString("First name").max(50).optional(),
  lastName: nonEmptyString("Last name").max(50).optional(),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthday must be in YYYY-MM-DD format")
    .optional(),
  gender: z.enum(GENDER_OPTIONS).optional(),
  genderPreference: z.enum(GENDER_PREFERENCE_OPTIONS).optional(),
  bio: z.string().max(MAX_BIO_LENGTH, `Bio must be at most ${MAX_BIO_LENGTH} characters`).optional(),
  jobTitle: optionalString(),
  company: optionalString(),
  school: optionalString(),
  hometown: optionalString(),
  height: z.number().int().min(100).max(250).optional(), // in centimeters
  religion: z.enum(RELIGION_OPTIONS).optional(),
  politics: z.enum(POLITICS_OPTIONS).optional(),
  drinking: z.enum(DRINKING_OPTIONS).optional(),
  smoking: z.enum(SMOKING_OPTIONS).optional(),
  drugs: z.enum(DRUGS_OPTIONS).optional(),
  familyPlans: z.enum(FAMILY_PLANS_OPTIONS).optional(),
  ethnicity: z.enum(ETHNICITY_OPTIONS).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const onboardingSchema = z.object({
  firstName: nonEmptyString("First name").max(50),
  lastName: nonEmptyString("Last name").max(50),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthday must be in YYYY-MM-DD format"),
  gender: z.enum(GENDER_OPTIONS),
  genderPreference: z.enum(GENDER_PREFERENCE_OPTIONS),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ============================================================================
// Photo Schemas
// ============================================================================

export const photoUploadSchema = z.object({
  position: z.number().int().min(1).max(MAX_PHOTOS),
});

export const photoReorderSchema = z.object({
  photoIds: z
    .array(z.string().uuid())
    .min(MIN_PHOTOS, `Minimum ${MIN_PHOTOS} photos required`)
    .max(MAX_PHOTOS, `Maximum ${MAX_PHOTOS} photos allowed`),
});

// ============================================================================
// Prompt Schemas
// ============================================================================

export const promptCreateSchema = z.object({
  promptTemplateId: nonEmptyString("Prompt template ID"),
  answer: nonEmptyString("Answer").max(
    MAX_PROMPT_ANSWER_LENGTH,
    `Answer must be at most ${MAX_PROMPT_ANSWER_LENGTH} characters`
  ),
  position: z.number().int().min(1).max(MAX_PROMPTS).optional(),
});

export const promptUpdateSchema = z.object({
  answer: nonEmptyString("Answer").max(
    MAX_PROMPT_ANSWER_LENGTH,
    `Answer must be at most ${MAX_PROMPT_ANSWER_LENGTH} characters`
  ),
});

// ============================================================================
// Like Schemas
// ============================================================================

export const likeCreateSchema = z.object({
  toUserId: z.string().uuid("Invalid user ID"),
  targetType: z.enum(LIKE_TARGET_TYPES),
  targetId: z.string().uuid("Invalid target ID"),
  comment: z
    .string()
    .max(
      MAX_LIKE_COMMENT_LENGTH,
      `Comment must be at most ${MAX_LIKE_COMMENT_LENGTH} characters`
    )
    .optional(),
  isRose: z.boolean().default(false),
});

export const likeRespondSchema = z.object({
  action: z.enum(["LIKE_BACK", "SKIP"]),
});

// ============================================================================
// Message Schemas
// ============================================================================

export const messageCreateSchema = z.object({
  content: nonEmptyString("Message content").max(
    MAX_MESSAGE_LENGTH,
    `Message must be at most ${MAX_MESSAGE_LENGTH} characters`
  ),
  type: z.enum(MESSAGE_TYPES).default("TEXT"),
});

export const messageReactionSchema = z.object({
  emoji: z
    .string()
    .min(1, "Emoji is required")
    .max(8, "Invalid emoji"), // accounts for compound emoji
});

// ============================================================================
// Report Schemas
// ============================================================================

export const reportCreateSchema = z.object({
  reportedUserId: z.string().uuid("Invalid user ID"),
  category: z.enum(REPORT_CATEGORIES),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

// ============================================================================
// Block Schemas
// ============================================================================

export const blockCreateSchema = z.object({
  blockedUserId: z.string().uuid("Invalid user ID"),
});

// ============================================================================
// Preferences Schemas
// ============================================================================

export const preferencesUpdateSchema = z
  .object({
    ageMin: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
    ageMax: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
    distanceMax: z.number().int().min(1).max(MAX_DISTANCE_MILES).optional(),
    heightMin: z.number().int().min(100).max(250).optional(), // cm
    heightMax: z.number().int().min(100).max(250).optional(), // cm
    ethnicity: z.array(z.enum(ETHNICITY_OPTIONS)).optional(),
    religion: z.array(z.enum(RELIGION_OPTIONS)).optional(),
    politics: z.array(z.enum(POLITICS_OPTIONS)).optional(),
    drinking: z.array(z.enum(DRINKING_OPTIONS)).optional(),
    smoking: z.array(z.enum(SMOKING_OPTIONS)).optional(),
    familyPlans: z.array(z.enum(FAMILY_PLANS_OPTIONS)).optional(),
    // Dealbreaker toggles per filter
    ethnicityDealbreaker: z.boolean().optional(),
    religionDealbreaker: z.boolean().optional(),
    politicsDealbreaker: z.boolean().optional(),
    drinkingDealbreaker: z.boolean().optional(),
    smokingDealbreaker: z.boolean().optional(),
    familyPlansDealbreaker: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.ageMin !== undefined && data.ageMax !== undefined) {
        return data.ageMin <= data.ageMax;
      }
      return true;
    },
    { message: "Minimum age must be less than or equal to maximum age", path: ["ageMin"] }
  )
  .refine(
    (data) => {
      if (data.heightMin !== undefined && data.heightMax !== undefined) {
        return data.heightMin <= data.heightMax;
      }
      return true;
    },
    { message: "Minimum height must be less than or equal to maximum height", path: ["heightMin"] }
  );

// ============================================================================
// Match Schemas
// ============================================================================

export const weMetSchema = z.object({
  weMet: z.enum(WE_MET_OPTIONS),
  feedback: z
    .string()
    .max(500, "Feedback must be at most 500 characters")
    .optional(),
});

// ============================================================================
// Notification Schemas
// ============================================================================

export const notificationPreferencesSchema = z.object({
  newLike: z.boolean().optional(),
  newMatch: z.boolean().optional(),
  newMessage: z.boolean().optional(),
  dailyPicks: z.boolean().optional(),
  roseReceived: z.boolean().optional(),
  profileReminder: z.boolean().optional(),
});

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1, "At least one notification ID required"),
});

// ============================================================================
// Discovery / Feed Schemas
// ============================================================================

export const discoveryQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

// ============================================================================
// Pagination
// ============================================================================

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// Socket Event Schemas
// ============================================================================

export const socketJoinRoomSchema = z.object({
  matchId: z.string().uuid(),
});

export const socketSendMessageSchema = z.object({
  matchId: z.string().uuid(),
  content: nonEmptyString("Message content").max(MAX_MESSAGE_LENGTH),
  type: z.enum(MESSAGE_TYPES).default("TEXT"),
});

export const socketTypingSchema = z.object({
  matchId: z.string().uuid(),
  isTyping: z.boolean(),
});

export const socketReadReceiptSchema = z.object({
  matchId: z.string().uuid(),
  messageId: z.string().uuid(),
});
