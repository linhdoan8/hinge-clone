import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import path from "path";
import fs from "fs";

import { AppError } from "./utils/errors.js";
import redis from "./utils/redis.js";
import { setupSocketIO } from "./socket/index.js";

// Route imports
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import discoverRoutes from "./routes/discover.js";
import likesRoutes from "./routes/likes.js";
import matchesRoutes from "./routes/matches.js";
import notificationsRoutes from "./routes/notifications.js";
import reportsRoutes from "./routes/reports.js";

// ============================================================================
// App Setup
// ============================================================================

const app = express();
const httpServer = createServer(app);

const PORT = parseInt(process.env.PORT || "3001", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const NODE_ENV = process.env.NODE_ENV || "development";

// Parse CORS origins into array
const corsOrigins = CORS_ORIGIN.split(",").map((o) => o.trim());

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ============================================================================
// Middleware
// ============================================================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan(NODE_ENV === "development" ? "dev" : "combined"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(UPLOAD_DIR)));

// ============================================================================
// Health Check
// ============================================================================

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/discover", discoverRoutes);
app.use("/likes", likesRoutes);
app.use("/matches", matchesRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/reports", reportsRoutes);

// ============================================================================
// 404 Handler
// ============================================================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist",
    },
  });
});

// ============================================================================
// Error Handling Middleware
// ============================================================================

app.use(
  (err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
    // Log error
    if (NODE_ENV === "development") {
      console.error("Error:", err);
    } else {
      console.error("Error:", err.message);
    }

    // Handle AppError (known errors)
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      });
      return;
    }

    // Handle Multer errors
    if (err && "code" in err) {
      const multerErr = err as Error & { code: string };
      if (multerErr.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: "File size exceeds the maximum allowed limit",
          },
        });
        return;
      }
      if (multerErr.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({
          success: false,
          error: {
            code: "UNEXPECTED_FILE",
            message: "Unexpected file field",
          },
        });
        return;
      }
    }

    // Handle generic errors
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          NODE_ENV === "development"
            ? err.message
            : "An unexpected error occurred",
      },
    });
  }
);

// ============================================================================
// Socket.IO Setup
// ============================================================================

const io = setupSocketIO(httpServer);

// ============================================================================
// Start Server
// ============================================================================

async function start() {
  try {
    // Connect to Redis (lazy connect, so we trigger it here)
    await redis.connect().catch((err) => {
      console.warn("Redis connection failed (non-fatal):", err.message);
      console.warn("Rate limiting and caching will be unavailable");
    });

    httpServer.listen(PORT, () => {
      console.log(`
========================================
  Hinge Clone API Server
  Port: ${PORT}
  Environment: ${NODE_ENV}
  CORS Origin: ${CORS_ORIGIN}
========================================
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  io.close();
  await redis.quit().catch(() => {});
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("\nSIGTERM received, shutting down...");
  io.close();
  await redis.quit().catch(() => {});
  httpServer.close(() => {
    process.exit(0);
  });
});

start();

export { app, httpServer, io };
