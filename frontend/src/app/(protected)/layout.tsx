import Link from "next/link";
import { getSession } from "@/lib/session";
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
          <span className="eyebrow">Neo Fala Amazônia</span>
          <h1>Comunicação Interna</h1>
          <p className="subtle">{session.name}</p>
        </div>

        <nav className="sidebar-nav">
          <Link href="/setores">Setores</Link>
          {canAccessAdmin ? <Link href="/admin">Painel administrativo</Link> : null}
        </nav>

        <LogoutButton />
      </aside>
      <main className="portal-content">{children}</main>
    </div>
  );
}
