import { getSession } from "@/lib/session";
import { LoadingLink } from "@/components/loading-link";
import { LogoutButton } from "@/components/logout-button";

export default async function ProtectedLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) {
    return null;
  }
  const canAccessAdmin = session.permissions.includes("admin.access");

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div>
          <span className="eyebrow">Neo Fala Amazonia</span>
          <h1>Comunicacao Interna</h1>
          <p className="subtle">{session.name}</p>
        </div>

        <nav className="sidebar-nav">
          <LoadingLink href="/setores">Setores</LoadingLink>
          {canAccessAdmin ? <LoadingLink href="/admin">Painel administrativo</LoadingLink> : null}
        </nav>

        <LogoutButton />
      </aside>
      <main className="portal-content">{children}</main>
    </div>
  );
}
