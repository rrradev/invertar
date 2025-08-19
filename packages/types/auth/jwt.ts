import { UserRoleType } from "../users/roles.js";

export type JWTPayload = {
  id: string;
  organizationId: string;
  role: UserRoleType;
};
