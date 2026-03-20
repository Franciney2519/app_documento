# Arquitetura da Solução

## Visão geral

O `Neo Fala Amazônia` foi estruturado como um monorepo com duas aplicações:

- `frontend`: portal em Next.js responsável pela experiência do colaborador, gestor, aprovador e administrador.
- `backend`: API REST em Express responsável por autenticação, RBAC, workflow documental, auditoria, gestão de arquivos e governança.

## Fluxo principal

1. O usuário acessa o portal e autentica com e-mail e senha.
2. A API valida as credenciais, registra auditoria e grava um JWT em cookie HttpOnly.
3. O front consulta `/auth/me` para obter perfil, setores e permissões.
4. O usuário seleciona um setor autorizado.
5. O portal carrega o menu dinâmico do setor via `/sectors/:slug/menu`.
6. Categorias e subcategorias consultam documentos filtrados via `/documents`.
7. Operações administrativas usam rotas `/admin/*` protegidas por RBAC no backend.

## Decisões técnicas

### Next.js no frontend

- Excelente produtividade para portal interno corporativo.
- Roteamento claro com `App Router`.
- Evolução simples para SSR, cache e middleware de autenticação.

### Express no backend

- Menor atrito para entregar o MVP rapidamente.
- Código simples, fácil de manter por equipes full stack.
- Permite evoluir para módulos mais robustos sem reescrever a camada HTTP.

### Prisma + PostgreSQL

- Forte tipagem e produtividade para CRUD administrativo.
- PostgreSQL suporta bem auditoria, filtros, crescimento e governança documental.
- `Json` e índices ajudam em metadados, trilha de auditoria e parametrizações.

### Autorização baseada em permissões

- Perfis são compostos por permissões granulares.
- Permissões podem ser avaliadas por módulo, ação e escopo de setor.
- Evita hardcode de regras por papel no código.

### Storage por adaptador

- MVP usa disco local para simplificar execução local.
- Interface já preparada para migrar para S3/MinIO/Azure Blob sem acoplamento nas rotas.

## Módulos do sistema

- Autenticação e sessão
- RBAC e perfis
- Gestão de usuários
- Gestão de setores
- Categorias e menus dinâmicos
- Gestão documental
- Workflow de aprovação
- Auditoria e logs
- Configurações gerais do portal

## Segurança

- JWT assinado e armazenado em cookie HttpOnly
- Senhas com `bcrypt`
- Autorização no backend e controle de visibilidade no frontend
- Auditoria de login, bloqueio, documentos e permissões
- Upload com metadados controlados e nomes de arquivos sanitizados

## Evolução futura

- SSO corporativo com Azure AD/Entra ID
- Assinatura eletrônica e aceite de documentos críticos
- Busca full text com PostgreSQL/Elastic
- Expiração automática e alertas de revisão documental
- Storage seguro em nuvem com versionamento nativo
