import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import prisma from "../utils/prisma.js";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    // Join a personal room for notifications
    socket.join(`user:${userId}`);

    // Update last active
    prisma.user
      .update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      })
      .catch(() => {
        // Silently fail -- non-critical
      });

    // ---- Join chat room ----
    socket.on("chat:join", async (data: { matchId: string }) => {
      try {
        const { matchId } = data;

        if (!matchId) {
          socket.emit("error", { message: "matchId is required" });
          return;
        }

        // Verify user is part of this match
        const match = await prisma.match.findUnique({
          where: { id: matchId },
        });

        if (
          !match ||
          (match.user1Id !== userId && match.user2Id !== userId)
        ) {
          socket.emit("error", {
            message: "Match not found or access denied",
          });
          return;
        }

        if (!match.isActive) {
          socket.emit("error", { message: "Match is no longer active" });
          return;
        }

        socket.join(`match:${matchId}`);
        socket.emit("chat:joined", { matchId });
      } catch (error) {
        socket.emit("error", { message: "Failed to join chat room" });
      }
    });

    // ---- Leave chat room ----
    socket.on("chat:leave", (data: { matchId: string }) => {
      const { matchId } = data;
      if (matchId) {
        socket.leave(`match:${matchId}`);
      }
    });

    // ---- Send message ----
    socket.on(
      "chat:message",
      async (data: { matchId: string; content: string; type?: string }) => {
        try {
          const { matchId, content, type } = data;

          if (!matchId || !content) {
            socket.emit("error", {
              message: "matchId and content are required",
            });
            return;
          }

          // Verify user is part of this match and it's active
          const match = await prisma.match.findUnique({
            where: { id: matchId },
          });

          if (
            !match ||
            (match.user1Id !== userId && match.user2Id !== userId)
          ) {
            socket.emit("error", {
              message: "Match not found or access denied",
            });
            return;
          }

          if (!match.isActive) {
            socket.emit("error", {
              message: "Match is no longer active",
            });
            return;
          }

          // Validate message type
          const validTypes = ["TEXT", "IMAGE", "GIF", "SYSTEM"] as const;
          const messageType =
            type && validTypes.includes(type as (typeof validTypes)[number])
              ? (type as (typeof validTypes)[number])
              : "TEXT";

          // Save message to database
          const message = await prisma.message.create({
            data: {
              matchId,
              senderId: userId,
              content: content.substring(0, 5000), // Enforce max length
              type: messageType,
            },
            include: {
              sender: { select: { firstName: true } },
            },
          });

          const chatMessage = {
            id: message.id,
            senderId: message.senderId,
            senderFirstName: message.sender.firstName,
            content: message.content,
            type: message.type,
            reactions: [],
            readAt: null,
            createdAt: message.createdAt.toISOString(),
            isMine: false, // Will be different for each recipient
          };

          // Broadcast to the match room
          io.to(`match:${matchId}`).emit("chat:message:new", chatMessage);

          // Send notification to the other user's personal room
          const otherUserId =
            match.user1Id === userId ? match.user2Id : match.user1Id;

          // Create notification in DB
          await prisma.notification.create({
            data: {
              userId: otherUserId,
              type: "NEW_MESSAGE",
              title: "New Message",
              body: `${message.sender.firstName}: ${content.substring(0, 100)}`,
              referenceType: "match",
              referenceId: matchId,
            },
          });

          io.to(`user:${otherUserId}`).emit("notification:new", {
            type: "NEW_MESSAGE",
            matchId,
            senderId: userId,
            preview: content.substring(0, 100),
          });
        } catch (error) {
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // ---- Typing indicator ----
    socket.on(
      "chat:typing",
      (data: { matchId: string; isTyping: boolean }) => {
        const { matchId, isTyping } = data;

        if (!matchId) return;

        // Broadcast typing indicator to the match room (except sender)
        socket.to(`match:${matchId}`).emit("chat:typing:update", {
          matchId,
          userId,
          isTyping,
        });
      }
    );

    // ---- Read receipt ----
    socket.on(
      "chat:read",
      async (data: { matchId: string; messageId: string }) => {
        try {
          const { matchId, messageId } = data;

          if (!matchId || !messageId) return;

          // Mark the message as read
          const message = await prisma.message.findUnique({
            where: { id: messageId },
          });

          if (!message || message.matchId !== matchId) return;

          // Only mark as read if the reader is not the sender
          if (message.senderId !== userId && !message.readAt) {
            const updatedMessage = await prisma.message.update({
              where: { id: messageId },
              data: { readAt: new Date() },
            });

            // Broadcast read receipt to the match room
            io.to(`match:${matchId}`).emit("chat:read:update", {
              matchId,
              messageId,
              readAt: updatedMessage.readAt!.toISOString(),
            });
          }
        } catch (error) {
          // Silently fail -- non-critical
        }
      }
    );

    // ---- Message reaction ----
    socket.on(
      "chat:reaction",
      async (data: {
        matchId: string;
        messageId: string;
        emoji: string;
      }) => {
        try {
          const { matchId, messageId, emoji } = data;

          if (!matchId || !messageId || !emoji) return;

          // Verify the message belongs to this match
          const message = await prisma.message.findUnique({
            where: { id: messageId },
          });

          if (!message || message.matchId !== matchId) return;

          // Upsert reaction
          const reaction = await prisma.reaction.upsert({
            where: {
              messageId_userId: {
                messageId,
                userId,
              },
            },
            create: {
              messageId,
              userId,
              emoji,
            },
            update: {
              emoji,
            },
          });

          // Broadcast reaction to the match room
          io.to(`match:${matchId}`).emit("chat:reaction:new", {
            matchId,
            messageId,
            reaction: {
              id: reaction.id,
              userId: reaction.userId,
              emoji: reaction.emoji,
              createdAt: reaction.createdAt.toISOString(),
            },
          });
        } catch (error) {
          // Silently fail
        }
      }
    );

    // ---- Disconnect ----
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);

      // Update last active
      prisma.user
        .update({
          where: { id: userId },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {});
    });
  });

  return io;
}
