import { UserRoleType } from "../users/roles";

export type JWTPayload = {
  id: string;
  organizationId: string;
  role: UserRoleType;
};
