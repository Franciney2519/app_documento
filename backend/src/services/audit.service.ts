import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "../lib/prisma.js";

interface AuditEntryInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export const logAudit = async (request: Request, entry: AuditEntryInput) => {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      actorId: request.user?.id,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      ipAddress: request.ip,
      metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      userAgent: request.headers["user-agent"] ?? null
    }
  });
};
