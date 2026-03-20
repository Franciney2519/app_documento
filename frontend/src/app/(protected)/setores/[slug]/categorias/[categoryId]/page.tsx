import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/server-api";
import { IconMap } from "@/components/icon-map";
import { formatDate } from "@/lib/format";
import type { Category, DocumentRecord, Sector } from "@/lib/types";

interface SectorMenuResponse {
  sector: Sector;
  categories: Category[];
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; categoryId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug, categoryId } = await params;
  const { q } = await searchParams;

  const [menu, documentsResponse] = await Promise.all([
    apiFetch<SectorMenuResponse>(`/sectors/${slug}/menu`),
    apiFetch<{ documents: DocumentRecord[] }>(
      `/documents?sectorSlug=${slug}&categoryId=${categoryId}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    )
  ]);

  const category = menu.categories.find((item) => item.id === categoryId);
  if (!category) {
    throw new Error("Categoria nao encontrada para este setor.");
  }

  return (
    <section className="stack-lg">
      <Link href={`/setores/${slug}`} className="back-link">
        <ArrowLeft size={18} />
        Voltar
      </Link>

      <header className="hero-panel">
        <div>
          <span className="eyebrow">{menu.sector.name}</span>
          <h2>{category.name}</h2>
        </div>
        <p className="subtle">
          Filtros por palavra-chave, ordenação e versão podem ser expandidos facilmente no próximo ciclo.
        </p>
      </header>

      {category.children?.length ? (
        <div className="grid-panels subcategory-grid">
          {category.children.map((child) => (
            <article className="category-card" key={child.id}>
              <IconMap name={child.icon ?? category.icon} className="category-icon" />
              <div>
                <strong>{child.name}</strong>
                <p>Subcategoria operacional parametrizável.</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="panel">
        <div className="section-header">
          <h3>Documentos disponíveis</h3>
          <span>{documentsResponse.documents.length} resultados</span>
        </div>

        <form className="search-row" action="">
          <input type="text" name="q" defaultValue={q} placeholder="Buscar por palavra-chave" />
          <button type="submit" className="ghost-button">
            Filtrar
          </button>
        </form>

        <div className="table-grid">
          {documentsResponse.documents.length ? (
            documentsResponse.documents.map((document) => (
              <Link className="table-row" href={`/documentos/${document.id}`} key={document.id}>
                <div>
                  <strong>{document.title}</strong>
                  <p>
                    {document.subcategory?.name ?? document.category.name} • versão {document.versionLabel}
                  </p>
                </div>
                <small>Vigência {formatDate(document.effectiveDate)}</small>
              </Link>
            ))
          ) : (
            <div className="empty-state">Nenhum documento publicado foi encontrado para este filtro.</div>
          )}
        </div>
      </div>
    </section>
  );
}
