// Mock PrismaClient for development when binary download fails
export interface User {
  id: string;
  username: string;
  email: string;
  hashedPassword?: string;
  oneTimeAccessCode?: string;
  oneTimeAccessCodeExpiry?: Date;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaClient {
  user = {
    findUnique: async (args: any): Promise<User | null> => {
      console.log('Mock: user.findUnique called with', args);
      return null;
    },
    findFirst: async (args: any): Promise<User | null> => {
      console.log('Mock: user.findFirst called with', args);
      return null;
    },
    create: async (args: any): Promise<User> => {
      console.log('Mock: user.create called with', args);
      return {
        id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
        username: args.data.username,
        email: args.data.email,
        role: args.data.role,
        organizationId: args.data.organizationId,
        oneTimeAccessCode: args.data.oneTimeAccessCode,
        oneTimeAccessCodeExpiry: args.data.oneTimeAccessCodeExpiry,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    update: async (args: any): Promise<User> => {
      console.log('Mock: user.update called with', args);
      return {
        id: args.where.id,
        username: 'mock-username',
        email: 'mock@example.com',
        role: 'USER' as const,
        organizationId: 'mock-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  };

  organization = {
    findUnique: async (args: any): Promise<Organization | null> => {
      console.log('Mock: organization.findUnique called with', args);
      if (args.where.name === 'testorg') {
        return {
          id: 'mock-org-id',
          name: 'testorg',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    },
  };
}