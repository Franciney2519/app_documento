import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { hasPermission } from "../utils/permissions.js";

export const sectorRouter = Router();

sectorRouter.use(authenticate);

sectorRouter.get("/", async (request, response) => {
  if (hasPermission(request.user, "admin.access")) {
    const sectors = await prisma.sector.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });
    return response.json({ sectors });
  }

  return response.json({
    sectors: request.user?.sectors
      .map((userSector) => userSector.sector)
      .filter((sector) => sector.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  });
});

sectorRouter.get("/:slug/menu", async (request, response) => {
  const sector = await prisma.sector.findUnique({
    where: { slug: request.params.slug }
  });

  if (!sector || !sector.isActive) {
    return response.status(404).json({ message: "Setor nao encontrado." });
  }

  const canSeeAll = hasPermission(request.user, "admin.access");
  const allowed = canSeeAll || request.user?.sectors.some(({ sector: item }) => item.id === sector.id);

  if (!allowed) {
    return response.status(403).json({ message: "Setor nao autorizado para este usuario." });
  }

  const menu = await prisma.sectorCategory.findMany({
    where: {
      sectorId: sector.id,
      isVisible: true,
      category: {
        isActive: true,
        parentId: null
      }
    },
    include: {
      category: {
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    },
    orderBy: { sortOrder: "asc" }
  });

  return response.json({
    sector,
    categories: menu.map((binding) => ({
      ...binding.category,
      sortOrder: binding.sortOrder
    }))
  });
});
