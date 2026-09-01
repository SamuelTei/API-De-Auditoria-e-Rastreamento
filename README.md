# API de Auditoria e Rastreamento

API REST em **Node.js + TypeScript + PostgreSQL** que mantém um **histórico completo e imutável das ações dos usuários**: quem fez, o quê, quando, de onde (IP/User-Agent) e qual foi o estado do dado antes e depois da alteração.

O diferencial do projeto é a **captura automática de auditoria**: em vez de espalhar `logger.log(...)` pelo código de negócio, uma [extensão do Prisma Client](src/core/audit/auditExtension.ts) intercepta `create`/`update`/`upsert`/`delete` dos modelos marcados como auditáveis e grava o evento sozinha, incluindo o *diff* (`oldValue`/`newValue`). Quem fez a ação chega até essa extensão via `AsyncLocalStorage`, sem precisar passar o usuário manualmente por cada camada.

## Stack

- **Node.js 22** + **TypeScript** (strict mode)
- **Express** para a camada HTTP
- **PostgreSQL** + **Prisma ORM** (schema, migrations, client extensions)
- **Zod** para validação de entrada
- **JWT** (jsonwebtoken + bcryptjs) para autenticação, com papéis `ADMIN`/`USER`
- **Pino** para logging estruturado
- **Jest + Supertest** para testes de integração
- **Docker Compose** para subir Postgres (e a API) localmente
- **Swagger UI** servindo a documentação OpenAPI em `/docs`

## Arquitetura

```
src/
  app.ts                 # montagem do Express (middlewares, rotas, docs)
  server.ts              # bootstrap HTTP + shutdown gracioso
  config/                # env (validado com Zod) e logger
  core/audit/
    auditContext.ts      # AsyncLocalStorage com userId/ip/user-agent da requisição
    auditExtension.ts    # Prisma Client Extension: intercepta e audita mutações
    recordAuditEvent.ts  # registro manual de eventos (login, logout, etc.)
  lib/prisma.ts           # PrismaClient já decorado com a extensão de auditoria
  middlewares/            # auth (JWT), request context, validação, erros
  modules/
    auth/                 # registro/login
    products/              # CRUD de exemplo cujas mutações são auditadas
    audit/                 # consulta ao histórico: filtros, timeline, export CSV
  routes/                 # composição das rotas em /api/v1
```

Cada módulo de negócio segue `routes -> controller -> service -> (repository)`, mantendo a camada HTTP fina e a lógica testável isoladamente.

## Como funciona a auditoria automaticamente

1. `identify` (middleware) decodifica o JWT, se houver, e popula `req.user`.
2. `requestContextMiddleware` abre um contexto (`AsyncLocalStorage`) com `userId`, `ipAddress` e `userAgent` da requisição atual.
3. Qualquer chamada Prisma para um modelo auditável (hoje: `Product`) que passe por `create`, `update`, `upsert` ou `delete` é interceptada pela extensão em [`auditExtension.ts`](src/core/audit/auditExtension.ts):
   - busca o estado anterior (`findUnique`) quando aplicável;
   - executa a operação original;
   - grava um `AuditLog` com ação, tipo/id da entidade, `oldValue`, `newValue`, usuário e IP — lidos do contexto acima.
4. Eventos que não são mutações de modelo (login, tentativa de login falha, logout) são registrados manualmente via [`recordAuditEvent`](src/core/audit/recordAuditEvent.ts).

Para tornar um novo modelo auditável, basta incluir seu nome em `AUDITED_MODELS` em `auditExtension.ts` — nenhuma mudança é necessária nos módulos de negócio.

## Endpoints principais

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Cria usuário | Público |
| POST | `/api/v1/auth/login` | Autentica e retorna JWT | Público |
| GET | `/api/v1/products` | Lista produtos (paginado) | Público |
| POST | `/api/v1/products` | Cria produto (auditado) | Autenticado |
| PATCH | `/api/v1/products/:id` | Atualiza produto (auditado, com diff) | Autenticado |
| DELETE | `/api/v1/products/:id` | Remove produto (auditado) | ADMIN |
| GET | `/api/v1/audit-logs` | Lista histórico com filtros (usuário, ação, entidade, período) | ADMIN |
| GET | `/api/v1/audit-logs/:id` | Detalhe de um registro | ADMIN |
| GET | `/api/v1/audit-logs/entity/:entityType/:entityId` | Linha do tempo completa de um recurso | ADMIN |
| GET | `/api/v1/audit-logs/export` | Exporta o histórico filtrado em CSV | ADMIN |

Documentação interativa completa (OpenAPI/Swagger): `GET /docs` com o servidor rodando.

## Rodando localmente

### Com Docker Compose (Postgres + API)

```bash
cp .env.example .env
docker compose up --build
```

### Local (Node + Postgres já instalados)

```bash
cp .env.example .env    # ajuste DATABASE_URL se necessário
npm install
npm run prisma:migrate  # cria o schema no banco
npm run seed             # cria um usuário admin (admin@example.com / admin12345)
npm run dev
```

A API sobe em `http://localhost:3000`, com Swagger em `http://localhost:3000/docs`.

## Testes

Os testes de integração rodam contra um banco Postgres real (`.env.test`).

```bash
createdb audit_api_test   # ou ajuste DATABASE_URL em .env.test
npm test
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe a API em modo desenvolvimento (hot reload) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a versão compilada |
| `npm test` | Executa os testes de integração |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Cria/aplica migrations em dev |
| `npm run prisma:studio` | Abre o Prisma Studio |
| `npm run seed` | Popula um usuário administrador |

## Licença

MIT
