import type { Prisma, UserRole, UserSector } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { upload } from "../lib/storage.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { logAudit } from "../services/audit.service.js";
import { hashPassword } from "../utils/password.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requirePermission("admin.access"));

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE"),
  roleIds: z.array(z.string()).min(1),
  sectorIds: z.array(z.string()).min(1)
});

const userUpdateSchema = userSchema.partial().extend({
  roleIds: z.array(z.string()).optional(),
  sectorIds: z.array(z.string()).optional()
});

const sectorSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true)
});

const categorySchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),
  icon: z.string().optional(),
  kind: z.enum(["DOCUMENT_LIBRARY", "SUPPORT_CHANNEL", "CHECKLIST_HUB"]),
  sortOrder: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
  parentId: z.string().nullable().optional(),
  sectorIds: z.array(z.string()).default([])
});

const documentMetadataSchema = z.object({
  title: z.string().min(3),
  code: z.string().optional(),
  documentType: z.enum([
    "POLICY",
    "INTERNAL_STANDARD",
    "EXTERNAL_STANDARD",
    "PROCEDURE",
    "WORK_INSTRUCTION",
    "CHECKLIST",
    "SUPPORT_MATERIAL",
    "EXTERNAL_DOCUMENT"
  ]),
  description: z.string().optional(),
  sectorId: z.string(),
  categoryId: z.string(),
  subcategoryId: z.string().nullable().optional(),
  reviewDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  visibility: z.enum(["SECTOR", "RESTRICTED", "PUBLIC_INTERNAL"]).default("SECTOR"),
  keywords: z.string().optional(),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  changeSummary: z.string().optional()
});

const workflowSchema = z.object({
  toStatus: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]),
  comment: z.string().optional()
});

const serializeUser = <
  T extends {
    passwordHash: string;
    roles: Array<UserRole & { role: { id: string; name: string; description: string | null; isSystem: boolean; createdAt: Date } }>;
    sectors: Array<UserSector & { sector: { id: string; name: string; slug: string; description: string | null; sortOrder: number; isActive: boolean; createdAt: Date; updatedAt: Date } }>;
  }
>(
  user: T
) => ({
  ...user,
  passwordHash: undefined,
  roles: user.roles.map((userRole) => userRole.role),
  sectors: user.sectors.map((userSector) => userSector.sector)
});

adminRouter.get("/users", requirePermission("users.view"), async (_request, response) => {
  const users = await prisma.user.findMany({
    include: {
      roles: { include: { role: true } },
      sectors: { include: { sector: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json({
    users: users.map(serializeUser)
  });
});

adminRouter.post("/users", requirePermission("users.create"), async (request, response) => {
  const data = userSchema.parse(request.body);
  const passwordHash = await hashPassword(data.password ?? "NeoFala@123");

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      status: data.status,
      roles: {
        createMany: {
          data: data.roleIds.map((roleId) => ({ roleId }))
        }
      },
      sectors: {
        createMany: {
          data: data.sectorIds.map((sectorId) => ({ sectorId }))
        }
      }
    },
    include: {
      roles: { include: { role: true } },
      sectors: { include: { sector: true } }
    }
  });

  await logAudit(request, {
    action: "users.create",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email }
  });

  return response.status(201).json({
    user: serializeUser(user)
  });
});

adminRouter.patch("/users/:id", requirePermission("users.edit"), async (request, response) => {
  const data = userUpdateSchema.parse(request.body);
  const userId = String(request.params.id);

  const user = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    if (data.roleIds) {
      await transaction.userRole.deleteMany({ where: { userId } });
    }

    if (data.sectorIds) {
      await transaction.userSector.deleteMany({ where: { userId } });
    }

    return transaction.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
        ...(data.roleIds
          ? {
              roles: {
                createMany: {
                  data: data.roleIds.map((roleId) => ({ roleId }))
                }
              }
            }
          : {}),
        ...(data.sectorIds
          ? {
              sectors: {
                createMany: {
                  data: data.sectorIds.map((sectorId) => ({ sectorId }))
                }
              }
            }
          : {})
      },
      include: {
        roles: { include: { role: true } },
        sectors: { include: { sector: true } }
      }
    });
  });

  await logAudit(request, {
    action: "users.update",
    entityType: "User",
    entityId: user.id,
    metadata: { status: user.status }
  });

  return response.json({
    user: serializeUser(user)
  });
});

adminRouter.post("/users/:id/reset-password", requirePermission("users.reset_password"), async (request, response) => {
  const schema = z.object({ password: z.string().min(8) });
  const data = schema.parse(request.body);
  const userId = String(request.params.id);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(data.password) }
  });

  await logAudit(request, {
    action: "users.reset_password",
    entityType: "User",
    entityId: userId
  });

  return response.status(204).send();
});

adminRouter.get("/roles", async (_request, response) => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } }
    },
    orderBy: { name: "asc" }
  });

  return response.json({
    roles: roles.map((role) => ({
      ...role,
      permissions: role.permissions.map((rolePermission) => rolePermission.permission)
    }))
  });
});

adminRouter.get("/sectors", requirePermission("sectors.view"), async (_request, response) => {
  const sectors = await prisma.sector.findMany({
    include: {
      categories: {
        include: { category: true }
      }
    },
    orderBy: { sortOrder: "asc" }
  });

  return response.json({ sectors });
});

adminRouter.post("/sectors", requirePermission("sectors.create"), async (request, response) => {
  const data = sectorSchema.parse(request.body);
  const sector = await prisma.sector.create({ data });
  await logAudit(request, {
    action: "sectors.create",
    entityType: "Sector",
    entityId: sector.id
  });
  return response.status(201).json({ sector });
});

adminRouter.patch("/sectors/:id", requirePermission("sectors.edit"), async (request, response) => {
  const data = sectorSchema.partial().parse(request.body);
  const sectorId = String(request.params.id);
  const sector = await prisma.sector.update({
    where: { id: sectorId },
    data
  });
  await logAudit(request, {
    action: "sectors.update",
    entityType: "Sector",
    entityId: sector.id
  });
  return response.json({ sector });
});

adminRouter.get("/categories", requirePermission("categories.view"), async (_request, response) => {
  const categories = await prisma.category.findMany({
    include: {
      children: true,
      sectorBindings: {
        include: {
          sector: true
        }
      }
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }]
  });

  return response.json({ categories });
});

adminRouter.post("/categories", requirePermission("categories.create"), async (request, response) => {
  const data = categorySchema.parse(request.body);
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      kind: data.kind,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      parentId: data.parentId ?? null,
      sectorBindings: {
        createMany: {
          data: data.parentId
            ? []
            : data.sectorIds.map((sectorId, index) => ({
                sectorId,
                sortOrder: index + 1,
                isVisible: true
              }))
        }
      }
    },
    include: {
      children: true,
      sectorBindings: true
    }
  });

  await logAudit(request, {
    action: "categories.create",
    entityType: "Category",
    entityId: category.id
  });

  return response.status(201).json({ category });
});

adminRouter.patch("/categories/:id", requirePermission("categories.edit"), async (request, response) => {
  const data = categorySchema.partial().parse(request.body);
  const categoryId = String(request.params.id);

  const category = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    if (data.sectorIds) {
      await transaction.sectorCategory.deleteMany({ where: { categoryId } });
    }

    return transaction.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.kind ? { kind: data.kind } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        ...(data.sectorIds
          ? {
              sectorBindings: {
                createMany: {
                  data: data.parentId
                    ? []
                    : data.sectorIds.map((sectorId, index) => ({
                        sectorId,
                        sortOrder: index + 1,
                        isVisible: true
                      }))
                }
              }
            }
          : {})
      }
    });
  });

  await logAudit(request, {
    action: "categories.update",
    entityType: "Category",
    entityId: category.id
  });

  return response.json({ category });
});

adminRouter.get("/documents", requirePermission("documents.view"), async (_request, response) => {
  const documents = await prisma.document.findMany({
    include: {
      sector: true,
      category: true,
      subcategory: true,
      owner: { select: { id: true, name: true, email: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  return response.json({ documents });
});

adminRouter.post(
  "/documents",
  requirePermission("documents.create"),
  upload.single("file"),
  async (request, response) => {
    const body = documentMetadataSchema.parse(request.body);
    const keywords = body.keywords
      ? body.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const file = request.file;

    const document = await prisma.document.create({
      data: {
        title: body.title,
        code: body.code,
        documentType: body.documentType,
        description: body.description,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : null,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        visibility: body.visibility,
        status: body.status,
        keywords,
        sectorId: body.sectorId,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId ?? null,
        ownerId: request.user!.id,
        filePath: file?.filename ?? null,
        fileName: file?.originalname ?? null,
        mimeType: file?.mimetype ?? null,
        fileSize: file?.size ?? null,
        versions: {
          create: {
            versionLabel: "1.0",
            versionNumber: 1,
            filePath: file?.filename ?? null,
            fileName: file?.originalname ?? null,
            mimeType: file?.mimetype ?? null,
            fileSize: file?.size ?? null,
            changeSummary: body.changeSummary ?? "Versao inicial",
                  snapshot: {
                    title: body.title,
                    description: body.description,
                    status: body.status,
                    visibility: body.visibility,
                    keywords
                  } as Prisma.InputJsonValue,
            createdById: request.user!.id
          }
        }
      },
      include: {
        sector: true,
        category: true,
        subcategory: true
      }
    });

    await logAudit(request, {
      action: "documents.create",
      entityType: "Document",
      entityId: document.id,
      metadata: { status: document.status, fileName: file?.originalname ?? null }
    });

    return response.status(201).json({ document });
  }
);

adminRouter.patch(
  "/documents/:id",
  requirePermission("documents.edit"),
  upload.single("file"),
  async (request, response) => {
    const body = documentMetadataSchema.partial().parse(request.body);
    const documentId = String(request.params.id);
    const existing = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!existing) {
      return response.status(404).json({ message: "Documento nao encontrado." });
    }

    const keywords = body.keywords
      ? body.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : existing.keywords;

    const file = request.file;
    const nextVersionNumber = file || existing.status === "PUBLISHED" ? existing.versionNumber + 1 : existing.versionNumber;
    const nextVersionLabel = `${Math.floor(nextVersionNumber)}.0`;

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.documentType ? { documentType: body.documentType } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.reviewDate !== undefined ? { reviewDate: body.reviewDate ? new Date(body.reviewDate) : null } : {}),
        ...(body.effectiveDate !== undefined
          ? { effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null }
          : {}),
        ...(body.visibility ? { visibility: body.visibility } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.sectorId ? { sectorId: body.sectorId } : {}),
        ...(body.categoryId ? { categoryId: body.categoryId } : {}),
        ...(body.subcategoryId !== undefined ? { subcategoryId: body.subcategoryId } : {}),
        keywords,
        ...(file
          ? {
              filePath: file.filename,
              fileName: file.originalname,
              mimeType: file.mimetype,
              fileSize: file.size,
              versionNumber: nextVersionNumber,
              versionLabel: nextVersionLabel
            }
          : {}),
        ...(existing.status === "PUBLISHED" && !file
          ? {
              versionNumber: nextVersionNumber,
              versionLabel: nextVersionLabel
            }
          : {}),
        versions:
          file || existing.status === "PUBLISHED"
            ? {
                create: {
                  versionLabel: nextVersionLabel,
                  versionNumber: nextVersionNumber,
                  filePath: file?.filename ?? existing.filePath,
                  fileName: file?.originalname ?? existing.fileName,
                  mimeType: file?.mimetype ?? existing.mimeType,
                  fileSize: file?.size ?? existing.fileSize,
                  changeSummary: body.changeSummary ?? "Atualizacao do documento",
                  snapshot: {
                    title: body.title ?? existing.title,
                    description: body.description ?? existing.description,
                    status: body.status ?? existing.status,
                    visibility: body.visibility ?? existing.visibility,
                    keywords
                  } as Prisma.InputJsonValue,
                  createdById: request.user!.id
                }
              }
            : undefined
      }
    });

    await logAudit(request, {
      action: "documents.update",
      entityType: "Document",
      entityId: document.id,
      metadata: {
        status: document.status,
        versionNumber: document.versionNumber
      }
    });

    return response.json({ document });
  }
);

adminRouter.post("/documents/:id/workflow", requirePermission("documents.approve"), async (request, response) => {
  const data = workflowSchema.parse(request.body);
  const documentId = String(request.params.id);
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!document) {
    return response.status(404).json({ message: "Documento nao encontrado." });
  }

  const publicationDate = data.toStatus === "PUBLISHED" ? new Date() : document.publicationDate;
  const archivedAt = data.toStatus === "ARCHIVED" ? new Date() : null;

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: data.toStatus,
      publicationDate,
      archivedAt,
      approvals: {
        create: {
          fromStatus: document.status,
          toStatus: data.toStatus,
          comment: data.comment,
          actedById: request.user!.id
        }
      }
    }
  });

  await logAudit(request, {
    action: `documents.${data.toStatus.toLowerCase()}`,
    entityType: "Document",
    entityId: updatedDocument.id,
    metadata: { fromStatus: document.status, toStatus: data.toStatus }
  });

  return response.json({ document: updatedDocument });
});

adminRouter.get("/audit-logs", requirePermission("audit.view"), async (request, response) => {
  const actorId = typeof request.query.actorId === "string" ? request.query.actorId : undefined;
  const action = typeof request.query.action === "string" ? request.query.action : undefined;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(actorId ? { actorId } : {}),
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {})
    },
    include: {
      actor: { select: { id: true, name: true, email: true } }
    },
    orderBy: { occurredAt: "desc" },
    take: 100
  });

  return response.json({ logs });
});

adminRouter.get("/config", requirePermission("config.view"), async (_request, response) => {
  const config = await prisma.portalConfig.findMany({
    orderBy: { key: "asc" }
  });
  return response.json({ config });
});

adminRouter.put("/config/:key", requirePermission("config.edit"), async (request, response) => {
  const schema = z.object({
    value: z.any(),
    description: z.string().optional()
  });
  const data = schema.parse(request.body);
  const key = String(request.params.key);

  const config = await prisma.portalConfig.upsert({
    where: { key },
    create: {
      key,
      value: data.value,
      description: data.description,
      updatedById: request.user!.id
    },
    update: {
      value: data.value,
      description: data.description,
      updatedById: request.user!.id
    }
  });

  await logAudit(request, {
    action: "config.update",
    entityType: "PortalConfig",
    entityId: config.id,
    metadata: { key: config.key }
  });

  return response.json({ config });
});
