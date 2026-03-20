# Deploy na Vercel

Este projeto funciona melhor na Vercel como dois projetos separados apontando para o mesmo repositório:

- `frontend` -> app Next.js
- `backend` -> API Express

## Antes do deploy

1. Garanta que o schema e os dados iniciais existam no Supabase.
2. Rode localmente:

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## Projeto backend na Vercel

- Root Directory: `backend`
- Framework preset: `Other`
- Build/Output: deixar automatico

Variaveis recomendadas:

```env
DATABASE_URL=postgres://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
JWT_SECRET=troque-por-um-segredo-forte
APP_URL=https://seu-frontend.vercel.app
API_URL=https://sua-api.vercel.app
COOKIE_NAME=nfa_token
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
UPLOAD_DIR=/tmp/uploads
```

Observacoes:

- Para Vercel, prefira a connection string do Supabase em transaction mode (`6543`) por ser ambiente serverless.
- Com Prisma em serverless, use `pgbouncer=true&connection_limit=1`.
- `UPLOAD_DIR=/tmp/uploads` serve apenas para teste. Arquivos enviados nao sao persistentes entre execucoes da funcao.
- Para uso real, mova uploads para Supabase Storage ou S3.

## Projeto frontend na Vercel

- Root Directory: `frontend`
- Framework preset: `Next.js`

Variavel necessaria:

```env
BACKEND_API_URL=https://sua-api.vercel.app
```

Observacao:

- O frontend usa um proxy interno em `/api` para manter a sessao no mesmo dominio do app. Por isso, na Vercel o valor necessario no frontend e `BACKEND_API_URL`, nao a URL publica diretamente no navegador.

## Ordem sugerida

1. Publicar o backend.
2. Copiar a URL gerada da API.
3. Publicar o frontend com `NEXT_PUBLIC_API_URL` apontando para a API.
4. Atualizar `APP_URL` do backend com a URL final do frontend.
5. Fazer um redeploy do backend para aplicar o CORS e os cookies com o dominio correto.

## Limites atuais

- O backend usa cookie HttpOnly para login. Em producao, `COOKIE_SAME_SITE=none` e `COOKIE_SECURE=true` sao obrigatorios para frontend e backend em dominios diferentes.
- Upload e download de documentos em disco local nao sao duraveis na Vercel.
- Se quiser um ambiente online mais proximo do definitivo, o proximo passo ideal e trocar o armazenamento local por Supabase Storage.
