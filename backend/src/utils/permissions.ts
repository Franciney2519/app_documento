import type { AuthUser } from "../types/express.js";

export const hasPermission = (user: AuthUser | undefined, permissionCode: string) => {
  if (!user) {
    return false;
  }

  return user.roles.some((role) =>
    role.permissions.some((rolePermission) => rolePermission.permission.code === permissionCode)
  );
};

export const canAccessSector = (user: AuthUser | undefined, sectorId: string) => {
  if (!user) {
    return false;
  }

  if (hasPermission(user, "admin.access")) {
    return true;
  }

  return user.sectors.some((userSector) => userSector.sector.id === sectorId);
};
