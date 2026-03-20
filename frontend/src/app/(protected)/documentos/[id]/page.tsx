import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { publicApiUrl } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { apiFetch } from "@/lib/server-api";
import type { DocumentRecord } from "@/lib/types";

interface DocumentDetail extends DocumentRecord {
  versions: Array<{
    id: string;
    versionLabel: string;
    versionNumber: number;
    createdAt: string;
    changeSummary?: string | null;
  }>;
  approvals: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    actedAt: string;
    comment?: string | null;
    actedBy: {
      name: string;
      email: string;
    };
  }>;
}

export default async function DocumentPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await apiFetch<{ document: DocumentDetail }>(`/documents/${id}`);
  const document = response.document;

  return (
    <section className="stack-lg">
      <Link href={`/setores/${document.sector.slug}/categorias/${document.category.id}`} className="back-link">
        <ArrowLeft size={18} />
        Voltar
      </Link>

      <header className="hero-panel">
        <div>
          <span className="eyebrow">{document.sector.name}</span>
          <h2>{document.title}</h2>
        </div>
        <p className="subtle">{document.description ?? "Documento corporativo publicado."}</p>
      </header>

      <div className="grid-panels detail-grid">
        <article className="panel">
          <h3>Metadados</h3>
          <dl className="detail-list">
            <div>
              <dt>Código</dt>
              <dd>{document.code ?? "-"}</dd>
            </div>
            <div>
              <dt>Versão</dt>
              <dd>{document.versionLabel}</dd>
            </div>
            <div>
              <dt>Publicação</dt>
              <dd>{formatDate(document.publicationDate)}</dd>
            </div>
            <div>
              <dt>Revisão</dt>
              <dd>{formatDate(document.reviewDate)}</dd>
            </div>
            <div>
              <dt>Vigência</dt>
              <dd>{formatDate(document.effectiveDate)}</dd>
            </div>
            <div>
              <dt>Palavras-chave</dt>
              <dd>{document.keywords.join(", ") || "-"}</dd>
            </div>
          </dl>

          <a className="primary-button inline-button" href={`${publicApiUrl}/documents/${document.id}/download`}>
            Baixar documento
          </a>
        </article>

        <article className="panel">
          <h3>Histórico de versões</h3>
          <div className="table-grid">
            {document.versions.map((version) => (
              <article className="table-row" key={version.id}>
                <div>
                  <strong>{version.versionLabel}</strong>
                  <p>{version.changeSummary ?? "Sem resumo informado."}</p>
                </div>
                <small>{formatDate(version.createdAt)}</small>
              </article>
            ))}
          </div>
        </article>
      </div>

      <article className="panel">
        <h3>Workflow e aprovação</h3>
        <div className="table-grid">
          {document.approvals.map((approval) => (
            <article className="table-row" key={approval.id}>
              <div>
                <strong>
                  {approval.fromStatus} → {approval.toStatus}
                </strong>
                <p>{approval.comment ?? "Sem comentário."}</p>
              </div>
              <small>
                {approval.actedBy.name} • {formatDate(approval.actedAt)}
              </small>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
