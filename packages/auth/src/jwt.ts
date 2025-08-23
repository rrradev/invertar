import jwt from "jsonwebtoken";
import { JWTPayload } from "@repo/types/auth";
import { UserRole } from "@repo/types/users";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = "30d"; // 30 days

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Generates an access JWT token for a user (15 minutes)
 * @param payload - The user data to include in the token
 * @returns A signed JWT token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * Generates a refresh JWT token for a user (30 days)
 * @param payload - The user data to include in the token
 * @returns A signed JWT token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Generates a JWT token for a user (backwards compatibility)
 * @param payload - The user data to include in the token
 * @returns A signed JWT token
 */
export function generateJwt(payload: JWTPayload): string {
  return generateAccessToken(payload);
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export function verifyJwt(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") return null;

    if (
      typeof decoded.id === "string"
      && typeof decoded.organizationId === "string"
      && Object.values(UserRole).includes(decoded.role)
    ) {
      return decoded as JWTPayload;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Verifies and decodes an access token
 * @param token - The access JWT token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  return verifyJwt(token);
}

/**
 * Verifies and decodes a refresh token
 * @param token - The refresh JWT token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  return verifyJwt(token);
}
