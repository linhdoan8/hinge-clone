import { Router, Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  badRequest,
  notFound,
  forbidden,
} from "../utils/errors.js";
import {
  messageCreateSchema,
  weMetSchema,
  RATE_LIMITS,
} from "@hinge-clone/shared";

const router = Router();

// All match routes require authentication
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
 * GET /matches
 * Get all active matches with last message and unread count.
 */
router.get(
  "/",
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
        OR: [
          { user1Id: req.userId! },
          { user2Id: req.userId! },
        ],
        isActive: true,
      };

      if (cursor) {
        whereCondition.id = { lt: cursor };
      }

      const matches = await prisma.match.findMany({
        where: whereCondition,
        include: {
          user1: {
            include: {
              photos: { orderBy: { position: "asc" } },
              prompts: {
                orderBy: { position: "asc" },
                include: { promptTemplate: true },
              },
            },
          },
          user2: {
            include: {
              photos: { orderBy: { position: "asc" } },
              prompts: {
                orderBy: { position: "asc" },
                include: { promptTemplate: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: { select: { firstName: true } },
            },
          },
        },
        orderBy: { matchedAt: "desc" },
        take: limit + 1,
      });

      const hasMore = matches.length > limit;
      const results = hasMore ? matches.slice(0, limit) : matches;
      const nextCursor = hasMore ? results[results.length - 1].id : null;

      // Get unread counts for each match
      const items = await Promise.all(
        results.map(async (match) => {
          const otherUser =
            match.user1Id === req.userId ? match.user2 : match.user1;

          // Count unread messages
          const unreadCount = await prisma.message.count({
            where: {
              matchId: match.id,
              senderId: { not: req.userId! },
              readAt: null,
            },
          });

          // Determine "your turn"
          const lastMessage = match.messages[0] || null;
          const isYourTurn = lastMessage
            ? lastMessage.senderId !== req.userId
            : match.user1Id !== req.userId; // If no messages, the person who was liked first should go

          const age = calculateAge(otherUser.birthday);
          const distanceMiles = calculateDistanceMiles(
            currentUser?.latitude ?? null,
            currentUser?.longitude ?? null,
            otherUser.latitude,
            otherUser.longitude
          );

          return {
            id: match.id,
            otherUser: {
              id: otherUser.id,
              firstName: otherUser.firstName,
              age,
              gender: otherUser.gender,
              bio: otherUser.bio,
              jobTitle: otherUser.jobTitle,
              company: otherUser.company,
              school: otherUser.school,
              hometown: otherUser.hometown,
              height: otherUser.height,
              religion: otherUser.religion,
              politics: otherUser.politics,
              drinking: otherUser.drinking,
              smoking: otherUser.smoking,
              drugs: otherUser.drugs,
              familyPlans: otherUser.familyPlans,
              ethnicity: otherUser.ethnicity,
              isVerified: otherUser.isVerified,
              distanceMiles,
              photos: otherUser.photos.map((p) => ({
                id: p.id,
                url: p.url,
                position: p.position,
                isVerification: p.isVerification,
                createdAt: p.createdAt.toISOString(),
              })),
              prompts: otherUser.prompts.map((p) => ({
                id: p.id,
                promptTemplateId: p.promptTemplateId,
                promptText: p.promptTemplate.text,
                answer: p.answer,
                position: p.position,
                voiceUrl: p.voiceUrl,
              })),
            },
            matchedAt: match.matchedAt.toISOString(),
            lastMessage: lastMessage
              ? {
                  id: lastMessage.id,
                  senderId: lastMessage.senderId,
                  senderFirstName: lastMessage.sender.firstName,
                  content: lastMessage.content,
                  type: lastMessage.type,
                  reactions: [],
                  readAt: lastMessage.readAt?.toISOString() || null,
                  createdAt: lastMessage.createdAt.toISOString(),
                  isMine: lastMessage.senderId === req.userId,
                }
              : null,
            unreadCount,
            isYourTurn,
          };
        })
      );

      // Sort by most recent activity (last message or match time)
      items.sort((a, b) => {
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.createdAt).getTime()
          : new Date(a.matchedAt).getTime();
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.createdAt).getTime()
          : new Date(b.matchedAt).getTime();
        return bTime - aTime;
      });

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
 * DELETE /matches/:id
 * Unmatch (deactivate a match).
 */
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const match = await prisma.match.findUnique({
        where: { id },
      });

      if (!match) {
        throw notFound("Match not found");
      }

      // Verify user is part of this match
      if (match.user1Id !== req.userId && match.user2Id !== req.userId) {
        throw forbidden("You are not part of this match");
      }

      await prisma.match.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        data: { message: "Unmatched successfully" },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /matches/:id/we-met
 * Record "we met" feedback for a match.
 */
router.post(
  "/:id/we-met",
  validate(weMetSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { weMet, feedback } = req.body;

      const match = await prisma.match.findUnique({
        where: { id },
      });

      if (!match) {
        throw notFound("Match not found");
      }

      if (match.user1Id !== req.userId && match.user2Id !== req.userId) {
        throw forbidden("You are not part of this match");
      }

      if (!match.isActive) {
        throw badRequest("Match is no longer active");
      }

      const updatedMatch = await prisma.match.update({
        where: { id },
        data: {
          weMet,
          weMetFeedback: feedback || null,
        },
      });

      res.json({
        success: true,
        data: {
          id: updatedMatch.id,
          user1Id: updatedMatch.user1Id,
          user2Id: updatedMatch.user2Id,
          matchedAt: updatedMatch.matchedAt.toISOString(),
          isActive: updatedMatch.isActive,
          weMet: updatedMatch.weMet,
          weMetFeedback: updatedMatch.weMetFeedback,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /matches/:id/messages
 * Get messages for a match (paginated, newest first).
 */
router.get(
  "/:id/messages",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        Math.max(parseInt(req.query.limit as string, 10) || 50, 1),
        100
      );

      // Verify match exists and user is part of it
      const match = await prisma.match.findUnique({
        where: { id },
      });

      if (!match) {
        throw notFound("Match not found");
      }

      if (match.user1Id !== req.userId && match.user2Id !== req.userId) {
        throw forbidden("You are not part of this match");
      }

      const whereCondition: Record<string, unknown> = {
        matchId: id,
      };

      if (cursor) {
        whereCondition.id = { lt: cursor };
      }

      const messages = await prisma.message.findMany({
        where: whereCondition,
        include: {
          sender: { select: { firstName: true } },
          reactions: {
            include: {
              user: { select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      });

      const hasMore = messages.length > limit;
      const results = hasMore ? messages.slice(0, limit) : messages;
      const nextCursor = hasMore ? results[results.length - 1].id : null;

      const items = results.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderFirstName: msg.sender.firstName,
        content: msg.content,
        type: msg.type,
        reactions: msg.reactions.map((r) => ({
          id: r.id,
          userId: r.userId,
          emoji: r.emoji,
          createdAt: r.createdAt.toISOString(),
        })),
        readAt: msg.readAt?.toISOString() || null,
        createdAt: msg.createdAt.toISOString(),
        isMine: msg.senderId === req.userId,
      }));

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
 * POST /matches/:id/messages
 * Send a message in a match conversation.
 */
router.post(
  "/:id/messages",
  rateLimit(
    "messages",
    RATE_LIMITS.messages.max,
    RATE_LIMITS.messages.windowMs / 1000
  ),
  validate(messageCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { content, type } = req.body;

      // Verify match exists and is active
      const match = await prisma.match.findUnique({
        where: { id },
      });

      if (!match) {
        throw notFound("Match not found");
      }

      if (match.user1Id !== req.userId && match.user2Id !== req.userId) {
        throw forbidden("You are not part of this match");
      }

      if (!match.isActive) {
        throw badRequest("Cannot send messages to an inactive match");
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          matchId: id,
          senderId: req.userId!,
          content,
          type: type || "TEXT",
        },
        include: {
          sender: { select: { firstName: true } },
        },
      });

      // Create notification for the other user
      const otherUserId =
        match.user1Id === req.userId ? match.user2Id : match.user1Id;

      await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: "NEW_MESSAGE",
          title: "New Message",
          body: `${message.sender.firstName}: ${content.substring(0, 100)}`,
          referenceType: "match",
          referenceId: id,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          senderId: message.senderId,
          senderFirstName: message.sender.firstName,
          content: message.content,
          type: message.type,
          reactions: [],
          readAt: null,
          createdAt: message.createdAt.toISOString(),
          isMine: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
