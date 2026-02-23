import { Router, Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  badRequest,
  notFound,
  forbidden,
  conflict,
} from "../utils/errors.js";
import {
  likeCreateSchema,
  likeRespondSchema,
  RATE_LIMITS,
  COORDINATE_PRECISION,
} from "@hinge-clone/shared";

const router = Router();

// All like routes require authentication
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
  const R = 3959;
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
 * POST /likes
 * Create a like on another user's photo or prompt.
 */
router.post(
  "/",
  rateLimit("likes", RATE_LIMITS.likes.max, RATE_LIMITS.likes.windowMs / 1000),
  validate(likeCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { toUserId, targetType, targetId, comment, isRose } = req.body;

      // Prevent self-like
      if (toUserId === req.userId) {
        throw badRequest("You cannot like yourself");
      }

      // Check if the target user exists and is active
      const targetUser = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { id: true, isActive: true, isPaused: true },
      });

      if (!targetUser || !targetUser.isActive) {
        throw notFound("User not found");
      }

      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: req.userId!,
            toUserId,
          },
        },
      });

      if (existingLike) {
        throw conflict("You have already liked this user");
      }

      // Check if blocked
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: req.userId!, blockedUserId: toUserId },
            { blockerId: toUserId, blockedUserId: req.userId! },
          ],
        },
      });

      if (block) {
        throw forbidden("Cannot interact with this user");
      }

      // Verify the target (photo or prompt) exists and belongs to the target user
      if (targetType === "PHOTO") {
        const photo = await prisma.photo.findUnique({
          where: { id: targetId },
        });
        if (!photo || photo.userId !== toUserId) {
          throw notFound("Photo not found");
        }
      } else if (targetType === "PROMPT") {
        const prompt = await prisma.prompt.findUnique({
          where: { id: targetId },
        });
        if (!prompt || prompt.userId !== toUserId) {
          throw notFound("Prompt not found");
        }
      }

      // Check rose rate limit
      if (isRose) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const rosesUsedToday = await prisma.like.count({
          where: {
            fromUserId: req.userId!,
            isRose: true,
            createdAt: { gte: today },
          },
        });
        if (rosesUsedToday >= RATE_LIMITS.roses.max) {
          throw badRequest("You have already used your daily rose");
        }
      }

      // Check if the other user already liked us (mutual like = match)
      const reverseLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: toUserId,
            toUserId: req.userId!,
          },
        },
      });

      let like;
      let matchCreated = null;

      if (reverseLike && reverseLike.status === "PENDING") {
        // Mutual like! Create a match.
        const [newLike, updatedReverseLike, match] =
          await prisma.$transaction([
            prisma.like.create({
              data: {
                fromUserId: req.userId!,
                toUserId,
                targetType,
                targetId,
                comment: comment || null,
                isRose: isRose || false,
                status: "MATCHED",
              },
            }),
            prisma.like.update({
              where: { id: reverseLike.id },
              data: { status: "MATCHED" },
            }),
            prisma.match.create({
              data: {
                user1Id:
                  req.userId! < toUserId ? req.userId! : toUserId,
                user2Id:
                  req.userId! < toUserId ? toUserId : req.userId!,
              },
            }),
          ]);

        like = newLike;
        matchCreated = match;

        // Create notification for match
        await prisma.notification.createMany({
          data: [
            {
              userId: req.userId!,
              type: "NEW_MATCH",
              title: "New Match!",
              body: "You have a new match!",
              referenceType: "match",
              referenceId: match.id,
            },
            {
              userId: toUserId,
              type: "NEW_MATCH",
              title: "New Match!",
              body: "You have a new match!",
              referenceType: "match",
              referenceId: match.id,
            },
          ],
        });
      } else {
        // One-way like
        like = await prisma.like.create({
          data: {
            fromUserId: req.userId!,
            toUserId,
            targetType,
            targetId,
            comment: comment || null,
            isRose: isRose || false,
            status: "PENDING",
          },
        });

        // Create notification for the liked user
        const notificationType = isRose ? "ROSE_RECEIVED" : "NEW_LIKE";
        await prisma.notification.create({
          data: {
            userId: toUserId,
            type: notificationType,
            title: isRose ? "You received a Rose!" : "Someone liked you!",
            body: isRose
              ? "Someone sent you a rose"
              : "Check your likes to see who",
            referenceType: "like",
            referenceId: like.id,
          },
        });
      }

      res.status(201).json({
        success: true,
        data: {
          like: {
            id: like.id,
            fromUserId: like.fromUserId,
            toUserId: like.toUserId,
            targetType: like.targetType,
            targetId: like.targetId,
            comment: like.comment,
            isRose: like.isRose,
            status: like.status,
            createdAt: like.createdAt.toISOString(),
          },
          match: matchCreated
            ? {
                id: matchCreated.id,
                user1Id: matchCreated.user1Id,
                user2Id: matchCreated.user2Id,
                matchedAt: matchCreated.matchedAt.toISOString(),
                isActive: matchCreated.isActive,
                weMet: matchCreated.weMet,
                weMetFeedback: matchCreated.weMetFeedback,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /likes/received
 * Get likes received by the current user (for the "Likes You" screen).
 */
router.get(
  "/received",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        Math.max(parseInt(req.query.limit as string, 10) || 20, 1),
        100
      );

      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { latitude: true, longitude: true },
      });

      const whereCondition: Record<string, unknown> = {
        toUserId: req.userId!,
        status: "PENDING",
      };

      if (cursor) {
        whereCondition.id = { lt: cursor };
      }

      const likes = await prisma.like.findMany({
        where: whereCondition,
        include: {
          fromUser: {
            include: {
              photos: { orderBy: { position: "asc" } },
              prompts: {
                orderBy: { position: "asc" },
                include: { promptTemplate: true },
              },
            },
          },
        },
        orderBy: [{ isRose: "desc" }, { createdAt: "desc" }],
        take: limit + 1,
      });

      const hasMore = likes.length > limit;
      const results = hasMore ? likes.slice(0, limit) : likes;
      const nextCursor = hasMore ? results[results.length - 1].id : null;

      const items = await Promise.all(
        results.map(async (like) => {
          const fromUser = like.fromUser;
          const age = calculateAge(fromUser.birthday);
          const distanceMiles = calculateDistanceMiles(
            currentUser?.latitude ?? null,
            currentUser?.longitude ?? null,
            fromUser.latitude,
            fromUser.longitude
          );

          // Get the target content (photo or prompt)
          let targetContent: unknown = null;
          if (like.targetType === "PHOTO") {
            const photo = await prisma.photo.findUnique({
              where: { id: like.targetId },
            });
            if (photo) {
              targetContent = {
                id: photo.id,
                url: photo.url,
                position: photo.position,
                isVerification: photo.isVerification,
                createdAt: photo.createdAt.toISOString(),
              };
            }
          } else {
            const prompt = await prisma.prompt.findUnique({
              where: { id: like.targetId },
              include: { promptTemplate: true },
            });
            if (prompt) {
              targetContent = {
                id: prompt.id,
                promptTemplateId: prompt.promptTemplateId,
                promptText: prompt.promptTemplate.text,
                answer: prompt.answer,
                position: prompt.position,
                voiceUrl: prompt.voiceUrl,
              };
            }
          }

          return {
            id: like.id,
            fromUser: {
              id: fromUser.id,
              firstName: fromUser.firstName,
              age,
              gender: fromUser.gender,
              bio: fromUser.bio,
              jobTitle: fromUser.jobTitle,
              company: fromUser.company,
              school: fromUser.school,
              hometown: fromUser.hometown,
              height: fromUser.height,
              religion: fromUser.religion,
              politics: fromUser.politics,
              drinking: fromUser.drinking,
              smoking: fromUser.smoking,
              drugs: fromUser.drugs,
              familyPlans: fromUser.familyPlans,
              ethnicity: fromUser.ethnicity,
              isVerified: fromUser.isVerified,
              distanceMiles,
              photos: fromUser.photos.map((p) => ({
                id: p.id,
                url: p.url,
                position: p.position,
                isVerification: p.isVerification,
                createdAt: p.createdAt.toISOString(),
              })),
              prompts: fromUser.prompts.map((p) => ({
                id: p.id,
                promptTemplateId: p.promptTemplateId,
                promptText: p.promptTemplate.text,
                answer: p.answer,
                position: p.position,
                voiceUrl: p.voiceUrl,
              })),
            },
            targetType: like.targetType,
            targetId: like.targetId,
            targetContent,
            comment: like.comment,
            isRose: like.isRose,
            createdAt: like.createdAt.toISOString(),
          };
        })
      );

      res.json({
        success: true,
        data: {
          items,
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
 * PATCH /likes/:id/respond
 * Respond to a like: LIKE_BACK (creates match) or SKIP.
 */
router.patch(
  "/:id/respond",
  validate(likeRespondSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { action } = req.body as { action: "LIKE_BACK" | "SKIP" };

      // Find the like
      const like = await prisma.like.findUnique({
        where: { id },
      });

      if (!like) {
        throw notFound("Like not found");
      }

      // Verify the like is directed at the current user
      if (like.toUserId !== req.userId) {
        throw forbidden("You can only respond to likes sent to you");
      }

      // Verify the like is pending
      if (like.status !== "PENDING") {
        throw badRequest("This like has already been responded to");
      }

      if (action === "LIKE_BACK") {
        // Create a match
        const user1Id =
          like.fromUserId < req.userId!
            ? like.fromUserId
            : req.userId!;
        const user2Id =
          like.fromUserId < req.userId!
            ? req.userId!
            : like.fromUserId;

        const [updatedLike, match] = await prisma.$transaction([
          prisma.like.update({
            where: { id },
            data: { status: "MATCHED" },
          }),
          prisma.match.create({
            data: {
              user1Id,
              user2Id,
            },
          }),
        ]);

        // Also update any reverse like if it exists
        await prisma.like
          .update({
            where: {
              fromUserId_toUserId: {
                fromUserId: req.userId!,
                toUserId: like.fromUserId,
              },
            },
            data: { status: "MATCHED" },
          })
          .catch(() => {
            // Reverse like may not exist, that's fine
          });

        // Create match notification for the original liker
        await prisma.notification.create({
          data: {
            userId: like.fromUserId,
            type: "NEW_MATCH",
            title: "New Match!",
            body: "Someone liked you back! Start a conversation.",
            referenceType: "match",
            referenceId: match.id,
          },
        });

        res.json({
          success: true,
          data: {
            like: {
              id: updatedLike.id,
              status: updatedLike.status,
            },
            match: {
              id: match.id,
              user1Id: match.user1Id,
              user2Id: match.user2Id,
              matchedAt: match.matchedAt.toISOString(),
              isActive: match.isActive,
              weMet: match.weMet,
              weMetFeedback: match.weMetFeedback,
            },
          },
        });
      } else {
        // SKIP
        const updatedLike = await prisma.like.update({
          where: { id },
          data: { status: "SKIPPED" },
        });

        res.json({
          success: true,
          data: {
            like: {
              id: updatedLike.id,
              status: updatedLike.status,
            },
            match: null,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
