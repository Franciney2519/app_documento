import type { Permission, Role, Sector, User, UserStatus } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roles: Array<Role & { permissions: Array<{ permission: Permission }> }>;
  sectors: Array<{ sector: Sector }>;
}

export type SafeUser = Pick<User, "id" | "name" | "email" | "status" | "createdAt" | "updatedAt" | "lastLoginAt">;
