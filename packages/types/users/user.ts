import { UserRoleType } from './roles.js';

export interface User {
  id: string;
  username: string;
  role: UserRoleType;
  organizationId: string;
}

export interface Admin {
  username: string;
  id: string;
  email : string;
  createdAt: string;
  oneTimeAccessCode: string;
  organizationName: string;
  oneTimeAccessCodeExpiry: string | null;
  hasInitialPassword: boolean;
}