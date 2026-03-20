import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../utils/jwt.js";
import { hasPermission } from "../utils/permissions.js";
import { env } from "../config/env.js";

const userInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  },
  sectors: {
    include: {
      sector: true
    }
  }
} as const;

export const authenticate = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const bearer = request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.replace("Bearer ", "")
      : undefined;
    const token = request.cookies?.[env.cookieName] ?? bearer;

    if (!token) {
      return response.status(401).json({ message: "Autenticacao obrigatoria." });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: userInclude
    });

    if (!user || user.status !== "ACTIVE") {
      return response.status(401).json({ message: "Acesso indisponivel para este usuario." });
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles: user.roles.map((userRole) => userRole.role),
      sectors: user.sectors
    };

    return next();
  } catch (_error) {
    return response.status(401).json({ message: "Sessao invalida ou expirada." });
  }
};

export const requirePermission = (permissionCode: string) => {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!hasPermission(request.user, permissionCode)) {
      return response.status(403).json({ message: "Voce nao possui permissao para esta operacao." });
    }

    return next();
  };
};
