import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";
import { badRequest, unauthorized, conflict } from "../utils/errors.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { signupSchema, loginSchema } from "@hinge-clone/shared";

const router = Router();

/**
 * POST /auth/signup
 * Create a new user account with email and password.
 */
router.post(
  "/signup",
  validate(signupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if email already exists
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        throw conflict("An account with this email already exists");
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
        },
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
        },
      });

      // Create default preferences
      await prisma.preference.create({
        data: {
          userId: user.id,
        },
      });

      // Generate tokens
      const tokens = generateTokens(user.id);

      // Calculate age
      const age = user.birthday
        ? Math.floor(
            (Date.now() - new Date(user.birthday).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : 0;

      res.status(201).json({
        success: true,
        data: {
          user: {
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
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Log in with email and password.
 */
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
        },
      });

      if (!user || !user.passwordHash) {
        throw unauthorized("Invalid email or password");
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw unauthorized("Invalid email or password");
      }

      // Check if user is active
      if (!user.isActive) {
        throw unauthorized("Account is deactivated");
      }

      // Update last active
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });

      // Generate tokens
      const tokens = generateTokens(user.id);

      // Calculate age
      const age = user.birthday
        ? Math.floor(
            (Date.now() - new Date(user.birthday).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : 0;

      res.json({
        success: true,
        data: {
          user: {
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
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh an access token using a valid refresh token.
 */
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken || typeof refreshToken !== "string") {
        throw badRequest("Refresh token is required");
      }

      const payload = verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw unauthorized("User not found or deactivated");
      }

      // Generate new tokens
      const tokens = generateTokens(user.id);

      res.json({
        success: true,
        data: { tokens },
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        (error as { name: string }).name === "JsonWebTokenError"
      ) {
        next(unauthorized("Invalid refresh token"));
      } else if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        (error as { name: string }).name === "TokenExpiredError"
      ) {
        next(unauthorized("Refresh token expired"));
      } else {
        next(error);
      }
    }
  }
);

/**
 * GET /auth/me
 * Get the current authenticated user's profile.
 */
router.get(
  "/me",
  authenticate,
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
        },
      });

      if (!user) {
        throw unauthorized("User not found");
      }

      const age = user.birthday
        ? Math.floor(
            (Date.now() - new Date(user.birthday).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : 0;

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

export default router;
