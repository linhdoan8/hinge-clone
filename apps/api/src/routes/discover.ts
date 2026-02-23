import { Router, Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { notFound } from "../utils/errors.js";
import {
  COORDINATE_PRECISION,
  DISCOVERY_BATCH_SIZE,
  DEFAULT_AGE_MIN,
  DEFAULT_AGE_MAX,
  DEFAULT_DISTANCE_MAX_MILES,
} from "@hinge-clone/shared";
import { calculateCompatibility } from "../services/matching.js";

const router = Router();

// All discover routes require authentication
router.use(authenticate);

// ============================================================================
// Helpers
// ============================================================================

function calculateAge(birthday: Date | null): number {
  if (!birthday) return 0;
  return Math.floor(
    (Date.now() - birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
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

function birthdayFromAge(age: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d;
}

/**
 * Build a "gender match" filter: given user's genderPreference,
 * return the genders that should appear in discovery.
 */
function genderFilter(genderPreference: string | null): string[] | undefined {
  if (!genderPreference) return undefined;
  switch (genderPreference) {
    case "MEN":
      return ["MAN", "TRANSGENDER_MAN"];
    case "WOMEN":
      return ["WOMAN", "TRANSGENDER_WOMAN"];
    case "EVERYONE":
      return undefined; // no filter
    default:
      return undefined;
  }
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /discover/feed
 * Get paginated discovery feed filtered by user preferences.
 * Excludes already liked, matched, or blocked users.
 */
router.get(
  "/feed",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        Math.max(parseInt(req.query.limit as string, 10) || DISCOVERY_BATCH_SIZE, 1),
        50
      );

      // Get current user with preferences
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { preference: true },
      });

      if (!currentUser) {
        throw notFound("User not found");
      }

      const preference = currentUser.preference;
      const ageMin = preference?.ageMin ?? DEFAULT_AGE_MIN;
      const ageMax = preference?.ageMax ?? DEFAULT_AGE_MAX;
      const distanceMax = preference?.distanceMax ?? DEFAULT_DISTANCE_MAX_MILES;

      // Calculate birthday bounds from age preferences
      const maxBirthday = birthdayFromAge(ageMin); // youngest allowed
      const minBirthday = birthdayFromAge(ageMax + 1); // oldest allowed

      // Get IDs of users to exclude (liked, matched, blocked)
      const [sentLikeIds, matchedIds, blockedIds, blockedByIds] =
        await Promise.all([
          prisma.like.findMany({
            where: { fromUserId: req.userId! },
            select: { toUserId: true },
          }),
          prisma.match.findMany({
            where: {
              OR: [
                { user1Id: req.userId! },
                { user2Id: req.userId! },
              ],
              isActive: true,
            },
            select: { user1Id: true, user2Id: true },
          }),
          prisma.block.findMany({
            where: { blockerId: req.userId! },
            select: { blockedUserId: true },
          }),
          prisma.block.findMany({
            where: { blockedUserId: req.userId! },
            select: { blockerId: true },
          }),
        ]);

      const excludeIds = new Set<string>();
      excludeIds.add(req.userId!); // Exclude self

      for (const like of sentLikeIds) {
        excludeIds.add(like.toUserId);
      }
      for (const match of matchedIds) {
        excludeIds.add(
          match.user1Id === req.userId! ? match.user2Id : match.user1Id
        );
      }
      for (const block of blockedIds) {
        excludeIds.add(block.blockedUserId);
      }
      for (const block of blockedByIds) {
        excludeIds.add(block.blockerId);
      }

      // Build gender filter
      const genders = genderFilter(currentUser.genderPreference);

      // Build the query
      const whereCondition: Record<string, unknown> = {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
        isPaused: false,
        profileComplete: true,
      };

      // Age filter
      if (ageMin > 0 || ageMax < 99) {
        whereCondition.birthday = {
          gte: minBirthday,
          lte: maxBirthday,
        };
      }

      // Gender filter
      if (genders) {
        whereCondition.gender = { in: genders };
      }

      // Cursor pagination
      if (cursor) {
        whereCondition.id = {
          ...(whereCondition.id as object),
          lt: cursor,
        };
      }

      // Fetch candidates
      const candidates = await prisma.user.findMany({
        where: whereCondition,
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
        },
        orderBy: [{ lastActiveAt: "desc" }, { id: "desc" }],
        take: limit + 1, // Take one extra to determine hasMore
      });

      const hasMore = candidates.length > limit;
      const results = hasMore ? candidates.slice(0, limit) : candidates;
      const nextCursor = hasMore ? results[results.length - 1].id : null;

      // Filter by distance (post-query since we don't have PostGIS extension required for spatial query)
      const filteredResults = results.filter((candidate) => {
        if (
          currentUser.latitude === null ||
          currentUser.longitude === null ||
          candidate.latitude === null ||
          candidate.longitude === null
        ) {
          return true; // Include if no location data
        }
        const distance = calculateDistanceMiles(
          currentUser.latitude,
          currentUser.longitude,
          candidate.latitude,
          candidate.longitude
        );
        return distance !== null && distance <= distanceMax;
      });

      // Build discovery cards
      const cards = filteredResults.map((candidate) => {
        const age = calculateAge(candidate.birthday);
        const distanceMiles = calculateDistanceMiles(
          currentUser.latitude,
          currentUser.longitude,
          candidate.latitude,
          candidate.longitude
        );

        const compatibilityScore = calculateCompatibility(
          currentUser,
          candidate
        );

        return {
          id: candidate.id,
          user: {
            id: candidate.id,
            firstName: candidate.firstName,
            age,
            gender: candidate.gender,
            bio: candidate.bio,
            jobTitle: candidate.jobTitle,
            company: candidate.company,
            school: candidate.school,
            hometown: candidate.hometown,
            height: candidate.height,
            religion: candidate.religion,
            politics: candidate.politics,
            drinking: candidate.drinking,
            smoking: candidate.smoking,
            drugs: candidate.drugs,
            familyPlans: candidate.familyPlans,
            ethnicity: candidate.ethnicity,
            isVerified: candidate.isVerified,
            distanceMiles,
            photos: candidate.photos.map((p) => ({
              id: p.id,
              url: p.url,
              position: p.position,
              isVerification: p.isVerification,
              createdAt: p.createdAt.toISOString(),
            })),
            prompts: candidate.prompts.map((p) => ({
              id: p.id,
              promptTemplateId: p.promptTemplateId,
              promptText: p.promptTemplate.text,
              answer: p.answer,
              position: p.position,
              voiceUrl: p.voiceUrl,
            })),
          },
          compatibilityScore,
          isMostCompatible: false,
          isStandout: false,
        };
      });

      res.json({
        success: true,
        data: {
          cards,
          nextCursor,
          hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /discover/standouts
 * Get standout profiles -- top profiles curated for the user.
 */
router.get(
  "/standouts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { preference: true },
      });

      if (!currentUser) {
        throw notFound("User not found");
      }

      // Get IDs to exclude
      const [sentLikeIds, matchedIds, blockedIds, blockedByIds] =
        await Promise.all([
          prisma.like.findMany({
            where: { fromUserId: req.userId! },
            select: { toUserId: true },
          }),
          prisma.match.findMany({
            where: {
              OR: [
                { user1Id: req.userId! },
                { user2Id: req.userId! },
              ],
              isActive: true,
            },
            select: { user1Id: true, user2Id: true },
          }),
          prisma.block.findMany({
            where: { blockerId: req.userId! },
            select: { blockedUserId: true },
          }),
          prisma.block.findMany({
            where: { blockedUserId: req.userId! },
            select: { blockerId: true },
          }),
        ]);

      const excludeIds = new Set<string>();
      excludeIds.add(req.userId!);
      sentLikeIds.forEach((l) => excludeIds.add(l.toUserId));
      matchedIds.forEach((m) =>
        excludeIds.add(
          m.user1Id === req.userId! ? m.user2Id : m.user1Id
        )
      );
      blockedIds.forEach((b) => excludeIds.add(b.blockedUserId));
      blockedByIds.forEach((b) => excludeIds.add(b.blockerId));

      // Find standouts: verified users or users with many received likes
      const standouts = await prisma.user.findMany({
        where: {
          id: { notIn: Array.from(excludeIds) },
          isActive: true,
          isPaused: false,
          profileComplete: true,
        },
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
          receivedLikes: {
            select: { id: true },
          },
        },
        orderBy: [{ isVerified: "desc" }, { lastActiveAt: "desc" }],
        take: 10,
      });

      // Sort by received likes count (standout = popular)
      standouts.sort(
        (a, b) => b.receivedLikes.length - a.receivedLikes.length
      );

      const cards = standouts.map((candidate) => {
        const age = calculateAge(candidate.birthday);
        const distanceMiles = calculateDistanceMiles(
          currentUser.latitude,
          currentUser.longitude,
          candidate.latitude,
          candidate.longitude
        );

        return {
          id: candidate.id,
          user: {
            id: candidate.id,
            firstName: candidate.firstName,
            age,
            gender: candidate.gender,
            bio: candidate.bio,
            jobTitle: candidate.jobTitle,
            company: candidate.company,
            school: candidate.school,
            hometown: candidate.hometown,
            height: candidate.height,
            religion: candidate.religion,
            politics: candidate.politics,
            drinking: candidate.drinking,
            smoking: candidate.smoking,
            drugs: candidate.drugs,
            familyPlans: candidate.familyPlans,
            ethnicity: candidate.ethnicity,
            isVerified: candidate.isVerified,
            distanceMiles,
            photos: candidate.photos.map((p) => ({
              id: p.id,
              url: p.url,
              position: p.position,
              isVerification: p.isVerification,
              createdAt: p.createdAt.toISOString(),
            })),
            prompts: candidate.prompts.map((p) => ({
              id: p.id,
              promptTemplateId: p.promptTemplateId,
              promptText: p.promptTemplate.text,
              answer: p.answer,
              position: p.position,
              voiceUrl: p.voiceUrl,
            })),
          },
          compatibilityScore: calculateCompatibility(currentUser, candidate),
          isMostCompatible: false,
          isStandout: true,
        };
      });

      res.json({
        success: true,
        data: { cards },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /discover/most-compatible
 * Get the daily "Most Compatible" suggestion.
 */
router.get(
  "/most-compatible",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { preference: true },
      });

      if (!currentUser) {
        throw notFound("User not found");
      }

      // Get IDs to exclude
      const [sentLikeIds, matchedIds, blockedIds, blockedByIds] =
        await Promise.all([
          prisma.like.findMany({
            where: { fromUserId: req.userId! },
            select: { toUserId: true },
          }),
          prisma.match.findMany({
            where: {
              OR: [
                { user1Id: req.userId! },
                { user2Id: req.userId! },
              ],
              isActive: true,
            },
            select: { user1Id: true, user2Id: true },
          }),
          prisma.block.findMany({
            where: { blockerId: req.userId! },
            select: { blockedUserId: true },
          }),
          prisma.block.findMany({
            where: { blockedUserId: req.userId! },
            select: { blockerId: true },
          }),
        ]);

      const excludeIds = new Set<string>();
      excludeIds.add(req.userId!);
      sentLikeIds.forEach((l) => excludeIds.add(l.toUserId));
      matchedIds.forEach((m) =>
        excludeIds.add(
          m.user1Id === req.userId! ? m.user2Id : m.user1Id
        )
      );
      blockedIds.forEach((b) => excludeIds.add(b.blockedUserId));
      blockedByIds.forEach((b) => excludeIds.add(b.blockerId));

      // Find a pool of candidates
      const genders = genderFilter(currentUser.genderPreference);
      const whereCondition: Record<string, unknown> = {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
        isPaused: false,
        profileComplete: true,
      };
      if (genders) {
        whereCondition.gender = { in: genders };
      }

      const candidates = await prisma.user.findMany({
        where: whereCondition,
        include: {
          photos: { orderBy: { position: "asc" } },
          prompts: {
            orderBy: { position: "asc" },
            include: { promptTemplate: true },
          },
        },
        take: 50, // Get a pool to score
      });

      if (candidates.length === 0) {
        res.json({
          success: true,
          data: null,
        });
        return;
      }

      // Score all candidates and pick the best
      let bestCandidate = candidates[0];
      let bestScore = -1;

      for (const candidate of candidates) {
        const score = calculateCompatibility(currentUser, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }

      const age = calculateAge(bestCandidate.birthday);
      const distanceMiles = calculateDistanceMiles(
        currentUser.latitude,
        currentUser.longitude,
        bestCandidate.latitude,
        bestCandidate.longitude
      );

      res.json({
        success: true,
        data: {
          id: bestCandidate.id,
          user: {
            id: bestCandidate.id,
            firstName: bestCandidate.firstName,
            age,
            gender: bestCandidate.gender,
            bio: bestCandidate.bio,
            jobTitle: bestCandidate.jobTitle,
            company: bestCandidate.company,
            school: bestCandidate.school,
            hometown: bestCandidate.hometown,
            height: bestCandidate.height,
            religion: bestCandidate.religion,
            politics: bestCandidate.politics,
            drinking: bestCandidate.drinking,
            smoking: bestCandidate.smoking,
            drugs: bestCandidate.drugs,
            familyPlans: bestCandidate.familyPlans,
            ethnicity: bestCandidate.ethnicity,
            isVerified: bestCandidate.isVerified,
            distanceMiles,
            photos: bestCandidate.photos.map((p) => ({
              id: p.id,
              url: p.url,
              position: p.position,
              isVerification: p.isVerification,
              createdAt: p.createdAt.toISOString(),
            })),
            prompts: bestCandidate.prompts.map((p) => ({
              id: p.id,
              promptTemplateId: p.promptTemplateId,
              promptText: p.promptTemplate.text,
              answer: p.answer,
              position: p.position,
              voiceUrl: p.voiceUrl,
            })),
          },
          compatibilityScore: bestScore,
          isMostCompatible: true,
          isStandout: false,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
