"use client";

import { useMemo, useState, useTransition } from "react";
import { browserApiFetch, publicApiUrl } from "@/lib/api";
import { useAppLoading } from "@/components/loading-provider";
import type { AdminRole, AdminUser, AuditLog, Category, DocumentRecord, Sector } from "@/lib/types";

interface AdminPanelProps {
  users: AdminUser[];
  roles: AdminRole[];
  sectors: Sector[];
  categories: Category[];
  documents: DocumentRecord[];
  logs: AuditLog[];
}

export function AdminPanel({
  users: initialUsers,
  roles,
  sectors,
  categories,
  documents: initialDocuments,
  logs
}: AdminPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [documents, setDocuments] = useState(initialDocuments);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { startLoading, stopLoading } = useAppLoading();

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  async function createUser(formData: FormData) {
    setMessage(null);
    const roleIds = formData.getAll("roleIds").map(String);
    const sectorIds = formData.getAll("sectorIds").map(String);
    startLoading("Salvando...");

    startTransition(async () => {
      try {
        const response = await browserApiFetch<{ user: AdminUser }>("/admin/users", {
          method: "POST",
          body: JSON.stringify({
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            status: String(formData.get("status") ?? "ACTIVE"),
            roleIds,
            sectorIds
          })
        });
        setUsers((current) => [response.user, ...current]);
        setMessage("Usuario criado com sucesso.");
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Falha ao criar usuario.");
      } finally {
        stopLoading();
      }
    });
  }

  async function uploadDocument(formData: FormData) {
    setMessage(null);
    startLoading("Enviando...");

    startTransition(async () => {
      try {
        const response = await browserApiFetch<{ document: DocumentRecord }>("/admin/documents", {
          method: "POST",
          body: formData
        });
        setDocuments((current) => [response.document, ...current]);
        setMessage("Documento salvo com sucesso.");
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Falha ao salvar documento.");
      } finally {
        stopLoading();
      }
    });
  }

  async function changeUserStatus(id: string, status: "ACTIVE" | "INACTIVE" | "BLOCKED") {
    setMessage(null);
    startLoading("Atualizando...");

    startTransition(async () => {
      try {
        const target = users.find((user) => user.id === id);
        if (!target) {
          return;
        }

        await browserApiFetch<{ user: AdminUser }>(`/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status,
            roleIds: target.roles.map((role) => role.id),
            sectorIds: target.sectors.map((sector) => sector.id)
          })
        });

        setUsers((current) =>
          current.map((user) => (user.id === id ? { ...user, status } : user))
        );
        setMessage("Status do usuario atualizado.");
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Falha ao atualizar status.");
      } finally {
        stopLoading();
      }
    });
  }

  return (
    <div className="stack-lg">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">Painel administrativo</span>
          <h2>Governanca de acesso, conteudo e rastreabilidade.</h2>
        </div>
        <p className="subtle">
          O MVP ja entrega gestao de usuarios, upload documental, workflow inicial e leitura de auditoria.
        </p>
      </section>

      {message ? <p className="success-banner">{message}</p> : null}

      <section className="grid-panels admin-grid">
        <article className="panel">
          <h3>Novo usuario</h3>
          <form action={createUser} className="stack-sm">
            <input name="name" placeholder="Nome completo" required />
            <input name="email" type="email" placeholder="email@empresa.com" required />
            <input name="password" type="password" placeholder="Senha inicial" required />
            <select name="status" defaultValue="ACTIVE">
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>

            <label className="field-group">
              <span>Perfis</span>
              <select name="roleIds" multiple required size={Math.min(roles.length, 4)}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Setores</span>
              <select name="sectorIds" multiple required size={Math.min(sectors.length, 4)}>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </label>

            <button className="primary-button" type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Cadastrar usuario"}
            </button>
          </form>
        </article>

        <article className="panel">
          <h3>Novo documento</h3>
          <form action={uploadDocument} className="stack-sm">
            <input name="title" placeholder="Titulo do documento" required />
            <input name="code" placeholder="Codigo do documento" />
            <select name="documentType" defaultValue="PROCEDURE">
              <option value="POLICY">Politica</option>
              <option value="INTERNAL_STANDARD">Norma interna</option>
              <option value="EXTERNAL_STANDARD">Norma externa</option>
              <option value="PROCEDURE">Procedimento</option>
              <option value="WORK_INSTRUCTION">Instrucao de trabalho</option>
              <option value="CHECKLIST">Checklist</option>
              <option value="SUPPORT_MATERIAL">Material de apoio</option>
              <option value="EXTERNAL_DOCUMENT">Documento externo</option>
            </select>
            <select name="sectorId" required>
              <option value="">Selecione o setor</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
            <select name="categoryId" required>
              <option value="">Selecione a categoria</option>
              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <textarea name="description" placeholder="Resumo do documento" rows={4} />
            <input name="keywords" placeholder="Palavras-chave separadas por virgula" />
            <input name="effectiveDate" type="date" />
            <input name="reviewDate" type="date" />
            <select name="status" defaultValue="DRAFT">
              <option value="DRAFT">Rascunho</option>
              <option value="IN_REVIEW">Em revisao</option>
              <option value="APPROVED">Aprovado</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
            <input name="file" type="file" />
            <button className="primary-button" type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Salvar documento"}
            </button>
          </form>
        </article>
      </section>

      <section className="panel">
        <div className="section-header">
          <h3>Usuarios</h3>
          <span>{users.length} registros</span>
        </div>
        <div className="table-grid">
          {users.map((user) => (
            <article key={user.id} className="table-row">
              <div>
                <strong>{user.name}</strong>
                <p>{user.email}</p>
                <small>
                  {user.roles.map((role) => role.name).join(", ")} • {user.sectors.map((sector) => sector.name).join(", ")}
                </small>
              </div>
              <div className="row-actions">
                <span className={`status-pill status-${user.status.toLowerCase()}`}>{user.status}</span>
                <button className="ghost-button" type="button" onClick={() => changeUserStatus(user.id, "ACTIVE")}>
                  Ativar
                </button>
                <button className="ghost-button" type="button" onClick={() => changeUserStatus(user.id, "BLOCKED")}>
                  Bloquear
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h3>Documentos</h3>
          <span>{documents.length} itens</span>
        </div>
        <div className="table-grid">
          {documents.map((document) => (
            <article key={document.id} className="table-row">
              <div>
                <strong>{document.title}</strong>
                <p>
                  {document.sector.name} • {document.category.name}
                </p>
                <small>
                  {document.versionLabel} • {document.status}
                </small>
              </div>
              <div className="row-actions">
                {document.fileName ? (
                  <a
                    className="ghost-button"
                    href={`${publicApiUrl}/documents/${document.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Baixar
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h3>Auditoria recente</h3>
          <span>Ultimos {logs.length} eventos</span>
        </div>
        <div className="table-grid">
          {logs.map((log) => (
            <article key={log.id} className="table-row">
              <div>
                <strong>{log.action}</strong>
                <p>
                  {log.actor?.name ?? "Sistema"} • {log.entityType}
                </p>
              </div>
              <small>{new Date(log.occurredAt).toLocaleString("pt-BR")}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
