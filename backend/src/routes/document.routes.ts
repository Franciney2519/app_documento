import fs from "node:fs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { hasPermission } from "../utils/permissions.js";
import { resolveUploadPath } from "../lib/storage.js";

export const documentRouter = Router();

documentRouter.use(authenticate);

const querySchema = z.object({
  q: z.string().optional(),
  sectorSlug: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(["title", "publicationDate", "versionNumber", "effectiveDate"]).optional(),
  order: z.enum(["asc", "desc"]).optional()
});

documentRouter.get("/", async (request, response) => {
  const query = querySchema.parse(request.query);
  const sector = query.sectorSlug
    ? await prisma.sector.findUnique({ where: { slug: query.sectorSlug } })
    : null;

  if (query.sectorSlug && !sector) {
    return response.status(404).json({ message: "Setor nao encontrado." });
  }

  if (sector && !hasPermission(request.user, "admin.access")) {
    const allowed = request.user?.sectors.some(({ sector: item }) => item.id === sector.id);
    if (!allowed) {
      return response.status(403).json({ message: "Acesso negado ao setor informado." });
    }
  }

  const documents = await prisma.document.findMany({
    where: {
      ...(sector ? { sectorId: sector.id } : {}),
      ...(query.categoryId ? { OR: [{ categoryId: query.categoryId }, { subcategoryId: query.categoryId }] } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
              { keywords: { has: query.q } }
            ]
          }
        : {}),
      status: "PUBLISHED"
    },
    include: {
      sector: true,
      category: true,
      subcategory: true
    },
    orderBy: {
      [query.sortBy ?? "title"]: query.order ?? "asc"
    }
  });

  return response.json({ documents });
});

documentRouter.get("/:id", async (request, response) => {
  const document = await prisma.document.findUnique({
    where: { id: request.params.id },
    include: {
      sector: true,
      category: true,
      subcategory: true,
      versions: {
        orderBy: { versionNumber: "desc" }
      },
      approvals: {
        orderBy: { actedAt: "desc" },
        include: {
          actedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  if (!document) {
    return response.status(404).json({ message: "Documento nao encontrado." });
  }

  if (!hasPermission(request.user, "admin.access")) {
    const allowed = request.user?.sectors.some((userSector) => userSector.sector.id === document.sectorId);
    if (!allowed || document.status !== "PUBLISHED") {
      return response.status(403).json({ message: "Acesso negado ao documento." });
    }
  }

  return response.json({ document });
});

documentRouter.get("/:id/download", async (request, response) => {
  const document = await prisma.document.findUnique({
    where: { id: request.params.id }
  });

  if (!document?.filePath) {
    return response.status(404).json({ message: "Arquivo nao disponivel para este documento." });
  }

  if (!hasPermission(request.user, "admin.access")) {
    const allowed = request.user?.sectors.some((userSector) => userSector.sector.id === document.sectorId);
    if (!allowed || document.status !== "PUBLISHED") {
      return response.status(403).json({ message: "Acesso negado ao arquivo." });
    }
  }

  const absolutePath = resolveUploadPath(document.filePath);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    return response.status(404).json({ message: "Arquivo nao encontrado no repositorio." });
  }

  if (document.fileName) {
    return response.download(absolutePath, document.fileName);
  }

  return response.download(absolutePath);
});
