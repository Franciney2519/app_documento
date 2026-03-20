import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();
type CategorySeed = {
  name: string;
  slug: string;
  icon: string;
  kind: "DOCUMENT_LIBRARY" | "SUPPORT_CHANNEL" | "CHECKLIST_HUB";
  sortOrder: number;
};

const permissionSeeds = [
  { code: "admin.access", module: "admin", action: "access", description: "Acessar o painel administrativo" },
  { code: "users.view", module: "users", action: "view", description: "Visualizar usuarios" },
  { code: "users.create", module: "users", action: "create", description: "Criar usuarios" },
  { code: "users.edit", module: "users", action: "edit", description: "Editar usuarios" },
  { code: "users.reset_password", module: "users", action: "reset_password", description: "Resetar senha" },
  { code: "sectors.view", module: "sectors", action: "view", description: "Visualizar setores" },
  { code: "sectors.create", module: "sectors", action: "create", description: "Criar setores" },
  { code: "sectors.edit", module: "sectors", action: "edit", description: "Editar setores" },
  { code: "categories.view", module: "categories", action: "view", description: "Visualizar categorias" },
  { code: "categories.create", module: "categories", action: "create", description: "Criar categorias" },
  { code: "categories.edit", module: "categories", action: "edit", description: "Editar categorias" },
  { code: "documents.view", module: "documents", action: "view", description: "Visualizar documentos administrativos" },
  { code: "documents.create", module: "documents", action: "create", description: "Criar documentos" },
  { code: "documents.edit", module: "documents", action: "edit", description: "Editar documentos" },
  { code: "documents.approve", module: "documents", action: "approve", description: "Aprovar e publicar documentos" },
  { code: "audit.view", module: "audit", action: "view", description: "Visualizar auditoria" },
  { code: "config.view", module: "config", action: "view", description: "Visualizar configuracoes" },
  { code: "config.edit", module: "config", action: "edit", description: "Editar configuracoes" }
];

const sectorSeeds = [
  { name: "Aquaviario", slug: "aquaviario", sortOrder: 1 },
  { name: "Rodoviario", slug: "rodoviario", sortOrder: 2 },
  { name: "Postos", slug: "postos", sortOrder: 3 },
  { name: "Administrativo", slug: "administrativo", sortOrder: 4 }
];

const categorySeeds: CategorySeed[] = [
  { name: "Politicas da Empresa", slug: "politicas-da-empresa", icon: "ShieldCheck", kind: "DOCUMENT_LIBRARY", sortOrder: 1 },
  { name: "Normas Internas", slug: "normas-internas", icon: "FileText", kind: "DOCUMENT_LIBRARY", sortOrder: 2 },
  { name: "Normas Externas", slug: "normas-externas", icon: "BookOpen", kind: "DOCUMENT_LIBRARY", sortOrder: 3 },
  { name: "Fale com o RH", slug: "fale-com-rh", icon: "Users", kind: "SUPPORT_CHANNEL", sortOrder: 4 },
  { name: "Fale com SSMA", slug: "fale-com-ssma", icon: "Shield", kind: "SUPPORT_CHANNEL", sortOrder: 5 },
  { name: "Fale com DP", slug: "fale-com-dp", icon: "Briefcase", kind: "SUPPORT_CHANNEL", sortOrder: 6 },
  { name: "Checklists", slug: "checklists", icon: "ClipboardCheck", kind: "CHECKLIST_HUB", sortOrder: 7 },
  { name: "Procedimentos", slug: "procedimentos", icon: "FolderKanban", kind: "DOCUMENT_LIBRARY", sortOrder: 8 },
  { name: "Instrucoes de Trabalho", slug: "instrucoes-de-trabalho", icon: "FileCog", kind: "DOCUMENT_LIBRARY", sortOrder: 9 }
];

async function main() {
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.userSector.deleteMany();
  await prisma.documentApproval.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.sectorCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.portalConfig.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  const permissionIds = new Map<string, string>();
  for (const permission of permissionSeeds) {
    const created = await prisma.permission.create({ data: permission });
    permissionIds.set(created.code, created.id);
  }

  const roles = [
    { name: "colaborador", permissionCodes: [] },
    { name: "gestor", permissionCodes: ["documents.view"] },
    { name: "aprovador", permissionCodes: ["documents.view", "documents.approve"] },
    { name: "administrador", permissionCodes: permissionSeeds.map((permission) => permission.code) }
  ];

  const roleIds = new Map<string, string>();
  for (const role of roles) {
    const created = await prisma.role.create({
      data: {
        name: role.name,
        description: `Perfil ${role.name}`,
        isSystem: true,
        permissions: {
          createMany: {
            data: role.permissionCodes.map((code) => ({ permissionId: permissionIds.get(code)! }))
          }
        }
      }
    });

    roleIds.set(role.name, created.id);
  }

  const sectorIds = new Map<string, string>();
  for (const sector of sectorSeeds) {
    const created = await prisma.sector.create({ data: sector });
    sectorIds.set(created.slug, created.id);
  }

  const categoryIds = new Map<string, string>();
  for (const category of categorySeeds) {
    const created = await prisma.category.create({ data: category });
    categoryIds.set(created.slug, created.id);

    for (const sectorId of sectorIds.values()) {
      await prisma.sectorCategory.create({
        data: {
          sectorId,
          categoryId: created.id,
          sortOrder: category.sortOrder,
          isVisible: true
        }
      });
    }
  }

  const checklistParentId = categoryIds.get("checklists")!;
  const checklistChildren = [
    { name: "Checklists de Navegacao/Operacao", slug: "checklists-navegacao-operacao", sortOrder: 1 },
    { name: "Checklists de Manutencao", slug: "checklists-manutencao", sortOrder: 2 },
    { name: "Checklists de SSMA", slug: "checklists-ssma", sortOrder: 3 }
  ];

  const checklistChildIds = new Map<string, string>();
  for (const child of checklistChildren) {
    const created = await prisma.category.create({
      data: {
        ...child,
        kind: "CHECKLIST_HUB",
        parentId: checklistParentId,
        isActive: true
      }
    });

    checklistChildIds.set(created.slug, created.id);
  }

  const admin = await prisma.user.create({
    data: {
      email: "admin@neofalaamazonia.local",
      name: "Administrador Neo Fala Amazonia",
      passwordHash: await hashPassword("Admin@123"),
      status: "ACTIVE",
      roles: {
        create: [{ roleId: roleIds.get("administrador")! }]
      },
      sectors: {
        create: Array.from(sectorIds.values()).map((sectorId) => ({ sectorId }))
      }
    }
  });

  const gestor = await prisma.user.create({
    data: {
      email: "gestor.aquaviario@neofalaamazonia.local",
      name: "Gestor Aquaviario",
      passwordHash: await hashPassword("Gestor@123"),
      status: "ACTIVE",
      roles: {
        create: [{ roleId: roleIds.get("gestor")! }, { roleId: roleIds.get("colaborador")! }]
      },
      sectors: {
        create: [{ sectorId: sectorIds.get("aquaviario")! }]
      }
    }
  });

  await prisma.document.create({
    data: {
      title: "Checklist Diario de Navegacao",
      code: "AQ-CHK-001",
      documentType: "CHECKLIST",
      description: "Checklist operacional para embarcacoes e navegacao segura.",
      status: "PUBLISHED",
      publicationDate: new Date(),
      effectiveDate: new Date(),
      visibility: "SECTOR",
      keywords: ["navegacao", "operacao", "seguranca"],
      sectorId: sectorIds.get("aquaviario")!,
      categoryId: checklistParentId,
      subcategoryId: checklistChildIds.get("checklists-navegacao-operacao")!,
      ownerId: gestor.id,
      versions: {
        create: {
          versionLabel: "1.0",
          versionNumber: 1,
          changeSummary: "Documento inicial",
          createdById: admin.id
        }
      },
      approvals: {
        create: {
          fromStatus: "APPROVED",
          toStatus: "PUBLISHED",
          actedById: admin.id,
          comment: "Publicado na carga inicial"
        }
      }
    }
  });

  await prisma.portalConfig.createMany({
    data: [
      {
        key: "portal.identity",
        value: {
          name: "Neo Fala Amazonia",
          subtitle: "Comunicacao Interna"
        }
      },
      {
        key: "support.contacts",
        value: {
          rh: "rh@empresa.local",
          dp: "dp@empresa.local",
          ssma: "ssma@empresa.local"
        }
      },
      {
        key: "home.banner",
        value: {
          title: "Seguranca e comunicacao no mesmo portal",
          description: "Consulte documentos, acompanhe atualizacoes e fale com as areas de apoio."
        }
      }
    ]
  });

  console.log("Seed concluido com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
