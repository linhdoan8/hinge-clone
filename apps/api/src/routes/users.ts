import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import prisma from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  badRequest,
  notFound,
  forbidden,
} from "../utils/errors.js";
import {
  profileUpdateSchema,
  promptCreateSchema,
  promptUpdateSchema,
  photoReorderSchema,
  COORDINATE_PRECISION,
  MAX_PHOTOS,
  MAX_PROMPTS,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@hinge-clone/shared";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ============================================================================
// Multer setup for photo uploads
// ============================================================================

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (
      ALLOWED_IMAGE_TYPES.includes(
        file.mimetype as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed."));
    }
  },
});

// ============================================================================
// Helper: format user to public profile shape
// ============================================================================

function calculateAge(birthday: Date | null): number {
  if (!birthday) return 0;
  return Math.floor(
    (Date.now() - birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

function roundCoordinate(value: number | null): number | null {
  if (value === null) return null;
  const factor = Math.pow(10, COORDINATE_PRECISION);
  return Math.round(value * factor) / factor;
}

function calculateDistanceMiles(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
): number | null {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null;
  }
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /users/me
 * Get the authenticated user's full profile with photos and prompts.
 */
router.get(
  "/me",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
          preference: true,
        },
      });

      if (!user) {
        throw notFound("User not found");
      }

      const age = calculateAge(user.birthday);

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday?.toISOString() || null,
          age,
          gender: user.gender,
          genderPreference: user.genderPreference,
          bio: user.bio,
          jobTitle: user.jobTitle,
          company: user.company,
          school: user.school,
          hometown: user.hometown,
          height: user.height,
          religion: user.religion,
          politics: user.politics,
          drinking: user.drinking,
          smoking: user.smoking,
          drugs: user.drugs,
          familyPlans: user.familyPlans,
          ethnicity: user.ethnicity,
          isVerified: user.isVerified,
          isActive: user.isActive,
          isPaused: user.isPaused,
          profileComplete: user.profileComplete,
          photos: user.photos.map((p) => ({
            id: p.id,
            url: p.url,
            position: p.position,
            isVerification: p.isVerification,
            createdAt: p.createdAt.toISOString(),
          })),
          prompts: user.prompts.map((p) => ({
            id: p.id,
            promptTemplateId: p.promptTemplateId,
            promptText: p.promptTemplate.text,
            answer: p.answer,
            position: p.position,
            voiceUrl: p.voiceUrl,
          })),
          preferences: user.preference,
          lastActiveAt: user.lastActiveAt.toISOString(),
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /users/me
 * Update profile fields. Also accepts optional photos and prompts arrays
 * for onboarding completion.
 */
router.patch(
  "/me",
  // Extract photos/prompts before validation strips them
  (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { _onboardingPhotos?: unknown[]; _onboardingPrompts?: unknown[]; _setProfileComplete?: boolean }).
      _onboardingPhotos = Array.isArray(req.body.photos) ? req.body.photos : undefined;
    (req as Request & { _onboardingPrompts?: unknown[] }).
      _onboardingPrompts = Array.isArray(req.body.prompts) ? req.body.prompts : undefined;
    (req as Request & { _setProfileComplete?: boolean }).
      _setProfileComplete = req.body.profileComplete === true;
    next();
  },
  validate(profileUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateData: Record<string, unknown> = { ...req.body };
      const onboardingPhotos = (req as Request & { _onboardingPhotos?: { url: string; position: number }[] })._onboardingPhotos;
      const onboardingPrompts = (req as Request & { _onboardingPrompts?: { promptTemplateId: string; answer: string; position: number }[] })._onboardingPrompts;
      const setProfileComplete = (req as Request & { _setProfileComplete?: boolean })._setProfileComplete;

      // Parse birthday string to Date if provided
      if (updateData.birthday && typeof updateData.birthday === "string") {
        updateData.birthday = new Date(updateData.birthday as string);
      }

      // Round coordinates for privacy
      if (updateData.latitude !== undefined) {
        updateData.latitude = roundCoordinate(updateData.latitude as number);
      }
      if (updateData.longitude !== undefined) {
        updateData.longitude = roundCoordinate(updateData.longitude as number);
      }

      // Handle onboarding photos (create from URLs)
      if (onboardingPhotos && onboardingPhotos.length > 0) {
        // Delete existing photos first to avoid duplicates
        await prisma.photo.deleteMany({ where: { userId: req.userId! } });
        for (const photo of onboardingPhotos) {
          if (photo.url && photo.position) {
            await prisma.photo.create({
              data: {
                userId: req.userId!,
                url: photo.url,
                position: photo.position,
              },
            });
          }
        }
      }

      // Handle onboarding prompts (create from template IDs + answers)
      if (onboardingPrompts && onboardingPrompts.length > 0) {
        // Delete existing prompts first to avoid duplicates
        await prisma.prompt.deleteMany({ where: { userId: req.userId! } });
        for (const prompt of onboardingPrompts) {
          if (prompt.promptTemplateId && prompt.answer) {
            await prisma.prompt.create({
              data: {
                userId: req.userId!,
                promptTemplateId: prompt.promptTemplateId,
                answer: prompt.answer,
                position: prompt.position || 1,
              },
            });
          }
        }
      }

      // If onboarding explicitly sets profileComplete, include it
      if (setProfileComplete) {
        updateData.profileComplete = true;
      }

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: updateData,
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
        },
      });

      // Check if profile should be marked complete
      const photoCount = user.photos.length;
      const promptCount = user.prompts.length;
      const hasRequiredFields =
        user.firstName &&
        user.lastName &&
        user.birthday &&
        user.gender &&
        user.genderPreference &&
        user.latitude !== null &&
        user.longitude !== null;
      const isComplete =
        hasRequiredFields && photoCount >= 6 && promptCount >= 3;

      if (isComplete && !user.profileComplete) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profileComplete: true },
        });
        user.profileComplete = true;
      }

      const age = calculateAge(user.birthday);

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday?.toISOString() || null,
          age,
          gender: user.gender,
          genderPreference: user.genderPreference,
          bio: user.bio,
          jobTitle: user.jobTitle,
          company: user.company,
          school: user.school,
          hometown: user.hometown,
          height: user.height,
          religion: user.religion,
          politics: user.politics,
          drinking: user.drinking,
          smoking: user.smoking,
          drugs: user.drugs,
          familyPlans: user.familyPlans,
          ethnicity: user.ethnicity,
          isVerified: user.isVerified,
          isActive: user.isActive,
          isPaused: user.isPaused,
          profileComplete: user.profileComplete,
          photos: user.photos.map((p) => ({
            id: p.id,
            url: p.url,
            position: p.position,
            isVerification: p.isVerification,
            createdAt: p.createdAt.toISOString(),
          })),
          prompts: user.prompts.map((p) => ({
            id: p.id,
            promptTemplateId: p.promptTemplateId,
            promptText: p.promptTemplate.text,
            answer: p.answer,
            position: p.position,
            voiceUrl: p.voiceUrl,
          })),
          lastActiveAt: user.lastActiveAt.toISOString(),
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /users/:id
 * Get a public profile of another user (limited fields, no exact location).
 */
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if blocked
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: req.userId!, blockedUserId: id },
            { blockerId: id, blockedUserId: req.userId! },
          ],
        },
      });

      if (block) {
        throw notFound("User not found");
      }

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
        },
      });

      if (!user || !user.isActive) {
        throw notFound("User not found");
      }

      // Get requesting user's location for distance calculation
      const requestingUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { latitude: true, longitude: true },
      });

      const age = calculateAge(user.birthday);
      const distanceMiles = calculateDistanceMiles(
        requestingUser?.latitude ?? null,
        requestingUser?.longitude ?? null,
        user.latitude,
        user.longitude
      );

      res.json({
        success: true,
        data: {
          id: user.id,
          firstName: user.firstName,
          age,
          gender: user.gender,
          bio: user.bio,
          jobTitle: user.jobTitle,
          company: user.company,
          school: user.school,
          hometown: user.hometown,
          height: user.height,
          religion: user.religion,
          politics: user.politics,
          drinking: user.drinking,
          smoking: user.smoking,
          drugs: user.drugs,
          familyPlans: user.familyPlans,
          ethnicity: user.ethnicity,
          isVerified: user.isVerified,
          distanceMiles,
          photos: user.photos.map((p) => ({
            id: p.id,
            url: p.url,
            position: p.position,
            isVerification: p.isVerification,
            createdAt: p.createdAt.toISOString(),
          })),
          prompts: user.prompts.map((p) => ({
            id: p.id,
            promptTemplateId: p.promptTemplateId,
            promptText: p.promptTemplate.text,
            answer: p.answer,
            position: p.position,
            voiceUrl: p.voiceUrl,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /users/me/photos
 * Upload a photo. Expects multipart form with "photo" file field and "position" field.
 */
router.post(
  "/me/photos",
  upload.single("photo"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw badRequest("Photo file is required");
      }

      const position = parseInt(req.body.position, 10);
      if (isNaN(position) || position < 1 || position > MAX_PHOTOS) {
        throw badRequest(`Position must be between 1 and ${MAX_PHOTOS}`);
      }

      // Check total photo count
      const photoCount = await prisma.photo.count({
        where: { userId: req.userId! },
      });

      if (photoCount >= MAX_PHOTOS) {
        throw badRequest(`Maximum ${MAX_PHOTOS} photos allowed`);
      }

      // Check if position is already taken; if so, shift positions
      const existingAtPosition = await prisma.photo.findFirst({
        where: { userId: req.userId!, position },
      });

      if (existingAtPosition) {
        // Shift photos at this position and above
        await prisma.photo.updateMany({
          where: {
            userId: req.userId!,
            position: { gte: position },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      const photo = await prisma.photo.create({
        data: {
          userId: req.userId!,
          url: `/uploads/${req.file.filename}`,
          position,
        },
      });

      // Check if profile should be marked complete
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          photos: true,
          prompts: true,
        },
      });

      if (user) {
        const newPhotoCount = user.photos.length;
        const promptCount = user.prompts.length;
        const hasRequiredFields =
          user.firstName &&
          user.lastName &&
          user.birthday &&
          user.gender &&
          user.genderPreference &&
          user.latitude !== null &&
          user.longitude !== null;
        const isComplete =
          hasRequiredFields && newPhotoCount >= 6 && promptCount >= 3;

        if (isComplete && !user.profileComplete) {
          await prisma.user.update({
            where: { id: user.id },
            data: { profileComplete: true },
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          id: photo.id,
          url: photo.url,
          position: photo.position,
          isVerification: photo.isVerification,
          createdAt: photo.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /users/me/photos/:id
 * Delete a photo by ID.
 */
router.delete(
  "/me/photos/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const photo = await prisma.photo.findUnique({
        where: { id },
      });

      if (!photo) {
        throw notFound("Photo not found");
      }

      if (photo.userId !== req.userId) {
        throw forbidden("Cannot delete another user's photo");
      }

      await prisma.photo.delete({ where: { id } });

      // Re-sequence positions for remaining photos
      const remainingPhotos = await prisma.photo.findMany({
        where: { userId: req.userId! },
        orderBy: { position: "asc" },
      });

      for (let i = 0; i < remainingPhotos.length; i++) {
        if (remainingPhotos[i].position !== i + 1) {
          await prisma.photo.update({
            where: { id: remainingPhotos[i].id },
            data: { position: i + 1 },
          });
        }
      }

      res.json({
        success: true,
        data: { message: "Photo deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /users/me/photos/reorder
 * Reorder photos by providing an ordered array of photo IDs.
 */
router.patch(
  "/me/photos/reorder",
  validate(photoReorderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { photoIds } = req.body as { photoIds: string[] };

      // Verify all photos belong to the user
      const photos = await prisma.photo.findMany({
        where: { userId: req.userId! },
      });

      const userPhotoIds = new Set(photos.map((p) => p.id));

      for (const photoId of photoIds) {
        if (!userPhotoIds.has(photoId)) {
          throw badRequest(`Photo ${photoId} not found or doesn't belong to you`);
        }
      }

      // Update positions
      const updates = photoIds.map((photoId, index) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { position: index + 1 },
        })
      );

      await prisma.$transaction(updates);

      // Return updated photos
      const updatedPhotos = await prisma.photo.findMany({
        where: { userId: req.userId! },
        orderBy: { position: "asc" },
      });

      res.json({
        success: true,
        data: updatedPhotos.map((p) => ({
          id: p.id,
          url: p.url,
          position: p.position,
          isVerification: p.isVerification,
          createdAt: p.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /users/me/prompts
 * Create a prompt response.
 */
router.post(
  "/me/prompts",
  validate(promptCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { promptTemplateId, answer, position } = req.body;

      // Check prompt count
      const promptCount = await prisma.prompt.count({
        where: { userId: req.userId! },
      });

      if (promptCount >= MAX_PROMPTS) {
        throw badRequest(`Maximum ${MAX_PROMPTS} prompts allowed`);
      }

      // Verify prompt template exists
      const template = await prisma.promptTemplate.findUnique({
        where: { id: promptTemplateId },
      });

      if (!template) {
        throw notFound("Prompt template not found");
      }

      // Determine position
      const finalPosition = position || promptCount + 1;

      const prompt = await prisma.prompt.create({
        data: {
          userId: req.userId!,
          promptTemplateId,
          answer,
          position: finalPosition,
        },
        include: { promptTemplate: true },
      });

      // Check if profile should be marked complete
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          photos: true,
          prompts: true,
        },
      });

      if (user) {
        const photoCount = user.photos.length;
        const newPromptCount = user.prompts.length;
        const hasRequiredFields =
          user.firstName &&
          user.lastName &&
          user.birthday &&
          user.gender &&
          user.genderPreference &&
          user.latitude !== null &&
          user.longitude !== null;
        const isComplete =
          hasRequiredFields && photoCount >= 6 && newPromptCount >= 3;

        if (isComplete && !user.profileComplete) {
          await prisma.user.update({
            where: { id: user.id },
            data: { profileComplete: true },
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          id: prompt.id,
          promptTemplateId: prompt.promptTemplateId,
          promptText: prompt.promptTemplate.text,
          answer: prompt.answer,
          position: prompt.position,
          voiceUrl: prompt.voiceUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /users/me/prompts/:id
 * Update a prompt response.
 */
router.patch(
  "/me/prompts/:id",
  validate(promptUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      const existing = await prisma.prompt.findUnique({
        where: { id },
      });

      if (!existing) {
        throw notFound("Prompt not found");
      }

      if (existing.userId !== req.userId) {
        throw forbidden("Cannot update another user's prompt");
      }

      const prompt = await prisma.prompt.update({
        where: { id },
        data: { answer },
        include: { promptTemplate: true },
      });

      res.json({
        success: true,
        data: {
          id: prompt.id,
          promptTemplateId: prompt.promptTemplateId,
          promptText: prompt.promptTemplate.text,
          answer: prompt.answer,
          position: prompt.position,
          voiceUrl: prompt.voiceUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /users/me/prompts/:id
 * Delete a prompt response.
 */
router.delete(
  "/me/prompts/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const existing = await prisma.prompt.findUnique({
        where: { id },
      });

      if (!existing) {
        throw notFound("Prompt not found");
      }

      if (existing.userId !== req.userId) {
        throw forbidden("Cannot delete another user's prompt");
      }

      await prisma.prompt.delete({ where: { id } });

      // Re-sequence positions
      const remainingPrompts = await prisma.prompt.findMany({
        where: { userId: req.userId! },
        orderBy: { position: "asc" },
      });

      for (let i = 0; i < remainingPrompts.length; i++) {
        if (remainingPrompts[i].position !== i + 1) {
          await prisma.prompt.update({
            where: { id: remainingPrompts[i].id },
            data: { position: i + 1 },
          });
        }
      }

      res.json({
        success: true,
        data: { message: "Prompt deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
