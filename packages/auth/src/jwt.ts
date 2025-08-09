import jwt from "jsonwebtoken";
import { JWTPayload } from "@repo/types/auth/jwt";
import { UserRole } from "@repo/types/users/roles";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "1d";

export function generateJwt(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

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
