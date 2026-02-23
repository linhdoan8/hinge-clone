import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900 seconds

export interface TokenPayload {
  userId: string;
  type: "access" | "refresh";
}

export function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId, type: "access" } satisfies TokenPayload,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, type: "refresh" } satisfies TokenPayload,
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload;
}
