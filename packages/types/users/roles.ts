export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export type UserRoleType = keyof typeof UserRole;