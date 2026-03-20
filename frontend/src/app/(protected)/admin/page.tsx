import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import { apiFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import type { AdminRole, AdminUser, AuditLog, Category, DocumentRecord, Sector } from "@/lib/types";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  if (!session.permissions.includes("admin.access")) {
    redirect("/setores");
  }

  const [users, roles, sectors, categories, documents, logs] = await Promise.all([
    apiFetch<{ users: AdminUser[] }>("/admin/users"),
    apiFetch<{ roles: AdminRole[] }>("/admin/roles"),
    apiFetch<{ sectors: Sector[] }>("/admin/sectors"),
    apiFetch<{ categories: Category[] }>("/admin/categories"),
    apiFetch<{ documents: DocumentRecord[] }>("/admin/documents"),
    apiFetch<{ logs: AuditLog[] }>("/admin/audit-logs")
  ]);

  return (
    <AdminPanel
      users={users.users}
      roles={roles.roles}
      sectors={sectors.sectors}
      categories={categories.categories}
      documents={documents.documents}
      logs={logs.logs}
    />
  );
}
