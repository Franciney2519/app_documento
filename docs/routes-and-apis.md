# Naming de rotas e APIs

## Rotas web

- `/` -> login
- `/setores` -> seleção de setor
- `/setores/[slug]` -> dashboard do setor
- `/setores/[slug]/categorias/[categoryId]` -> listagem da categoria
- `/documentos/[id]` -> detalhe do documento
- `/admin` -> painel administrativo

## APIs principais

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Portal

- `GET /sectors`
- `GET /sectors/:slug/menu`
- `GET /documents`
- `GET /documents/:id`
- `GET /documents/:id/download`

### Admin

- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `POST /admin/users/:id/reset-password`
- `GET /admin/sectors`
- `POST /admin/sectors`
- `PATCH /admin/sectors/:id`
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `GET /admin/documents`
- `POST /admin/documents`
- `PATCH /admin/documents/:id`
- `POST /admin/documents/:id/workflow`
- `GET /admin/audit-logs`
- `GET /admin/config`
- `PUT /admin/config/:key`

## Boas práticas de versionamento documental

- nunca sobrescrever uma versão publicada sem criar registro em `DocumentVersion`
- manter `versionNumber` incremental e `versionLabel` legível
- exigir resumo de alteração ao substituir arquivo ou revisar metadados críticos
- registrar autor, data e status de cada transição
- separar documento lógico do artefato físico versionado
