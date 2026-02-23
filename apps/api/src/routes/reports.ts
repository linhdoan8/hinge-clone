import { Router, Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  badRequest,
  notFound,
  conflict,
} from "../utils/errors.js";
import {
  reportCreateSchema,
  blockCreateSchema,
  RATE_LIMITS,
} from "@hinge-clone/shared";

const router = Router();

// All report/block routes require authentication
router.use(authenticate);

/**
 * POST /reports
 * File a report against another user.
 */
router.post(
  "/",
  rateLimit(
    "reports",
    RATE_LIMITS.reports.max,
    RATE_LIMITS.reports.windowMs / 1000
  ),
  validate(reportCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportedUserId, category, description } = req.body;

      // Prevent self-report
      if (reportedUserId === req.userId) {
        throw badRequest("You cannot report yourself");
      }

      // Verify reported user exists
      const reportedUser = await prisma.user.findUnique({
        where: { id: reportedUserId },
        select: { id: true },
      });

      if (!reportedUser) {
        throw notFound("User not found");
      }

      // Check for duplicate report
      const existingReport = await prisma.report.findFirst({
        where: {
          reporterId: req.userId!,
          reportedUserId,
          status: "PENDING",
        },
      });

      if (existingReport) {
        throw conflict(
          "You already have a pending report for this user"
        );
      }

      const report = await prisma.report.create({
        data: {
          reporterId: req.userId!,
          reportedUserId,
          category,
          description: description || null,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: report.id,
          reporterId: report.reporterId,
          reportedUserId: report.reportedUserId,
          category: report.category,
          description: report.description,
          status: report.status,
          createdAt: report.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /reports/block
 * Block another user. Removes any existing match and hides from discovery.
 */
router.post(
  "/block",
  validate(blockCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { blockedUserId } = req.body;

      // Prevent self-block
      if (blockedUserId === req.userId) {
        throw badRequest("You cannot block yourself");
      }

      // Verify user exists
      const blockedUser = await prisma.user.findUnique({
        where: { id: blockedUserId },
        select: { id: true },
      });

      if (!blockedUser) {
        throw notFound("User not found");
      }

      // Check for existing block
      const existingBlock = await prisma.block.findUnique({
        where: {
          blockerId_blockedUserId: {
            blockerId: req.userId!,
            blockedUserId,
          },
        },
      });

      if (existingBlock) {
        throw conflict("You have already blocked this user");
      }

      // Create block and deactivate any matches in a transaction
      const [block] = await prisma.$transaction([
        prisma.block.create({
          data: {
            blockerId: req.userId!,
            blockedUserId,
          },
        }),
        // Deactivate matches between these users
        prisma.match.updateMany({
          where: {
            OR: [
              {
                user1Id: req.userId!,
                user2Id: blockedUserId,
              },
              {
                user1Id: blockedUserId,
                user2Id: req.userId!,
              },
            ],
            isActive: true,
          },
          data: { isActive: false },
        }),
        // Expire pending likes between these users
        prisma.like.updateMany({
          where: {
            OR: [
              {
                fromUserId: req.userId!,
                toUserId: blockedUserId,
              },
              {
                fromUserId: blockedUserId,
                toUserId: req.userId!,
              },
            ],
            status: "PENDING",
          },
          data: { status: "EXPIRED" },
        }),
      ]);

      res.status(201).json({
        success: true,
        data: {
          id: block.id,
          blockerId: block.blockerId,
          blockedUserId: block.blockedUserId,
          createdAt: block.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
