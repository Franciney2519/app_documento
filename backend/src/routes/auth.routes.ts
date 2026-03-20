import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { authenticate } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { logAudit } from "../services/audit.service.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post("/login", async (request, response) => {
  const credentials = loginSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      sectors: { include: { sector: true } }
    }
  });

  if (!user) {
    await logAudit(request, {
      action: "auth.login_denied",
      entityType: "User",
      metadata: { email: credentials.email, reason: "not_found" }
    });
    return response.status(401).json({ message: "Credenciais invalidas." });
  }

  if (user.status !== "ACTIVE") {
    await logAudit(request, {
      action: "auth.login_denied",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, reason: user.status.toLowerCase() }
    });
    return response.status(403).json({ message: "Usuario inativo ou bloqueado." });
  }

  const passwordMatches = await comparePassword(credentials.password, user.passwordHash);

  if (!passwordMatches) {
    await logAudit(request, {
      action: "auth.login_denied",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, reason: "invalid_password" }
    });
    return response.status(401).json({ message: "Credenciais invalidas." });
  }

  const token = signToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  response.cookie(env.cookieName, token, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    maxAge: 1000 * 60 * 60 * 12
  });

  await logAudit(request, {
    action: "auth.login",
    entityType: "User",
    entityId: user.id
  });

  return response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roles: user.roles.map((userRole) => userRole.role.name),
      permissions: user.roles.flatMap((userRole) =>
        userRole.role.permissions.map((rolePermission) => rolePermission.permission.code)
      ),
      sectors: user.sectors.map((userSector) => userSector.sector)
    }
  });
});

authRouter.post("/logout", authenticate, async (request, response) => {
  response.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure
  });
  await logAudit(request, {
    action: "auth.logout",
    entityType: "User",
    entityId: request.user?.id
  });
  return response.status(204).send();
});

authRouter.get("/me", authenticate, async (request, response) => {
  return response.json({
    user: {
      id: request.user!.id,
      name: request.user!.name,
      email: request.user!.email,
      status: request.user!.status,
      roles: request.user!.roles.map((role) => role.name),
      permissions: request.user!.roles.flatMap((role) =>
        role.permissions.map((rolePermission) => rolePermission.permission.code)
      ),
      sectors: request.user!.sectors.map((userSector) => userSector.sector)
    }
  });
});
