import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/server-api";
import { IconMap } from "@/components/icon-map";
import type { Category, Sector } from "@/lib/types";

interface SectorMenuResponse {
  sector: Sector;
  categories: Category[];
}

export default async function SectorPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const response = await apiFetch<SectorMenuResponse>(`/sectors/${slug}/menu`);

  return (
    <section className="stack-lg">
      <Link href="/setores" className="back-link">
        <ArrowLeft size={18} />
        Voltar
      </Link>

      <header className="hero-panel">
        <div>
          <span className="eyebrow">Setor ativo</span>
          <h2>{response.sector.name}</h2>
        </div>
        <p className="subtle">
          O menu é parametrizado por setor e controlado pelo painel administrativo.
        </p>
      </header>

      <div className="grid-panels category-grid">
        {response.categories.map((category) => (
          <Link
            key={category.id}
            href={`/setores/${slug}/categorias/${category.id}`}
            className="category-card"
          >
            <IconMap name={category.icon} className="category-icon" />
            <div>
              <strong>{category.name}</strong>
              <p>{category.description ?? "Acesse conteúdos, documentos ou canal de contato."}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
