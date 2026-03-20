# Neo Fala Amazônia

Portal corporativo interno para comunicação, governança documental e abertura de canais com áreas de apoio.

## Stack adotada

- Frontend: Next.js 15 + React 19 + CSS customizado
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL + Prisma ORM
- Auth: JWT em cookie HttpOnly + RBAC por permissões
- Storage: adaptador local com interface preparada para S3

## Estrutura

```text
backend/  -> API, autenticação, RBAC, workflow, auditoria e Prisma
frontend/ -> portal web, telas do MVP e painel administrativo básico
docs/   -> arquitetura, dados, telas, roadmap e critérios de aceite
storage/uploads -> repositório local de arquivos no MVP
```

## Como executar

1. Copie `.env.example` para `.env`
2. Suba o banco:

```bash
docker compose up -d
```

3. Instale dependências:

```bash
npm install
```

4. Gere o client Prisma e sincronize o schema:

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

5. Inicie o ambiente:

```bash
npm run dev
```

## Credenciais iniciais

- E-mail: `admin@neofalaamazonia.local`
- Senha: `Admin@123`

## Entregáveis

- Arquitetura da solução: [docs/architecture.md](/c:/Users/17263/OneDrive%20-%20BEMOL%20S%20A/Documentos/Portal_controleDoc/docs/architecture.md)
- Modelagem de dados: [docs/data-model.md](/c:/Users/17263/OneDrive%20-%20BEMOL%20S%20A/Documentos/Portal_controleDoc/docs/data-model.md)
- Mapa de telas: [docs/screens.md](/c:/Users/17263/OneDrive%20-%20BEMOL%20S%20A/Documentos/Portal_controleDoc/docs/screens.md)
- Plano de fases e roadmap: [docs/implementation-plan.md](/c:/Users/17263/OneDrive%20-%20BEMOL%20S%20A/Documentos/Portal_controleDoc/docs/implementation-plan.md)
- Rotas e APIs: [docs/routes-and-apis.md](/c:/Users/17263/OneDrive%20-%20BEMOL%20S%20A/Documentos/Portal_controleDoc/docs/routes-and-apis.md)
