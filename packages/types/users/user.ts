import { UserRoleType } from './roles';

export interface User {
  id: string;
  role: UserRoleType;
  organizationId: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  hasInitialPassword: boolean;
}