import type { UserRoleType } from "../users/roles.js";

export type JWTPayload = {
  username: string;
  id: string;
  organizationId: string;
  role: UserRoleType;
};
