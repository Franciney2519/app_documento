import { Building2, ShieldCheck, Truck, Waves } from "lucide-react";
import { LoadingLink } from "@/components/loading-link";
import { apiFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import type { Sector } from "@/lib/types";

const sectorIcons = {
  aquaviario: Waves,
  rodoviario: Truck,
  postos: ShieldCheck,
  administrativo: Building2
};

export default async function SectorsPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  const response = await apiFetch<{ sectors: Sector[] }>("/sectors");
  const canAccessAdmin = session.permissions.includes("admin.access");

  return (
    <section className="stack-lg">
      <header className="hero-panel">
        <div>
          <span className="eyebrow">Ola, {session.name}</span>
          <h2>Selecione seu setor</h2>
        </div>
        <p className="subtle">
          Seus acessos sao filtrados por perfil, setor e permissoes operacionais.
        </p>
      </header>

      <div className="grid-panels sector-grid">
        {response.sectors.map((sector) => {
          const Icon = sectorIcons[sector.slug as keyof typeof sectorIcons] ?? Building2;
          return (
            <LoadingLink key={sector.id} href={`/setores/${sector.slug}`} className="sector-card">
              <Icon />
              <div>
                <strong>{sector.name}</strong>
                <p>{sector.description ?? "Acesso ao hub operacional e documental do setor."}</p>
              </div>
            </LoadingLink>
          );
        })}
      </div>

      {canAccessAdmin ? (
        <LoadingLink href="/admin" className="inline-link">
          Acessar painel administrativo
        </LoadingLink>
      ) : null}
    </section>
  );
}
