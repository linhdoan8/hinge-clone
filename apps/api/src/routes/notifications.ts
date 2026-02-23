import { Router, Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { badRequest } from "../utils/errors.js";
import { markNotificationsReadSchema } from "@hinge-clone/shared";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /notifications
 * Get notifications for the current user (paginated, newest first).
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

      const whereCondition: Record<string, unknown> = {
        userId: req.userId!,
      };

      if (cursor) {
        whereCondition.id = { lt: cursor };
      }

      const notifications = await prisma.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      });

      const hasMore = notifications.length > limit;
      const results = hasMore
        ? notifications.slice(0, limit)
        : notifications;
      const nextCursor = hasMore ? results[results.length - 1].id : null;

      // Get unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: req.userId!,
          isRead: false,
        },
      });

      res.json({
        success: true,
        data: {
          items: results.map((n) => ({
            id: n.id,
            userId: n.userId,
            type: n.type,
            title: n.title,
            body: n.body,
            referenceType: n.referenceType,
            referenceId: n.referenceId,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
          })),
          nextCursor,
          hasMore,
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notifications/read
 * Mark specific notifications as read.
 */
router.patch(
  "/read",
  validate(markNotificationsReadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { notificationIds } = req.body as { notificationIds: string[] };

      // Verify all notifications belong to the user
      const notifications = await prisma.notification.findMany({
        where: {
          id: { in: notificationIds },
          userId: req.userId!,
        },
        select: { id: true },
      });

      if (notifications.length !== notificationIds.length) {
        throw badRequest(
          "Some notifications were not found or don't belong to you"
        );
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: req.userId!,
        },
        data: { isRead: true },
      });

      res.json({
        success: true,
        data: { message: "Notifications marked as read" },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
