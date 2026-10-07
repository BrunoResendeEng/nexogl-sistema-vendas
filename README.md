<p align="center">
  <img src="https://nexogldigital.com.br/logo.png" alt="Nexo GL Digital" width="160"/>
</p>

<h1 align="center">MotoEstoque</h1>
<p align="center">Sistema de gestão de peças desenvolvido por <a href="https://nexogldigital.com.br">Nexo GL Digital</a></p>
<p align="center"><em>Tecnologia sob medida para o seu negócio</em></p>

---

## Stack

| Camada   | Tecnologia                                                    |
| -------- | ------------------------------------------------------------- |
| Monorepo | Turborepo + pnpm workspaces                                   |
| API      | Fastify 4, Prisma 5.22, @fastify/jwt, @fastify/cookie, Zod    |
| Frontend | Next.js 14, React 18, Tailwind CSS 3, shadcn/ui, SWR          |
| Auth     | JWT access (15min) + Refresh Token (7d) via cookie            |
| Banco    | PostgreSQL 18                                                 |

## Estrutura

```
Sistema/
├── apps/
│   ├── api/        # Fastify + Prisma (porta 3001)
│   └── web/        # Next.js 14 + Tailwind + shadcn/ui (porta 3000)
└── packages/
    ├── db/         # Schema Prisma + migrations + seed
    ├── types/      # Tipos compartilhados (Perfil, etc.)
    └── utils/      # Utilitários compartilhados
```

## Pré-requisitos

- Node.js >= 20
- pnpm >= 12
- PostgreSQL 18 rodando na porta `5433`

## Instalação

```bash
git clone <url-do-repositorio>
cd Sistema
pnpm install
```

## Banco de dados

- Host: `localhost`
- Porta: `5433`
- Usuário: `postgres`
- Senha: `postgres`
- Database: `estoque_moto`

Aplicar seed inicial:

```bash
cd packages/db
node "../../node_modules/.pnpm/tsx@4.23.15/node_modules/tsx/dist/cli.mjs" prisma/seed.ts
```

## Rodando o projeto

```bash
pnpm dev
```

Sobe API (3001) e Web (3000) em paralelo. Para encerrar: `Ctrl+C`.

| Serviço  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |

## Credenciais padrão

| Perfil | E-mail         | Senha    |
| ------ | -------------- | -------- |
| MASTER | admin@loja.com | admin123 |

## Perfis de usuário

| Perfil       | Descrição                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------- |
| **MASTER**   | Superusuário. Acesso total. Não pode ser excluído nem desativado. Só MASTER cria outro MASTER. |
| **ADMIN**    | Gerencia produtos, usuários e pode cancelar vendas.                                            |
| **OPERADOR** | Registra vendas e movimentações.                                                               |

## Módulos

- **Autenticação** — login, logout, refresh token, bloqueio por tentativas
- **Usuários** — CRUD completo com proteções por perfil
- **Produtos** — listar, criar, editar, ativar/desativar, badge de estoque, upload de foto
- **Vendas** — nova venda (carrinho), listagem, detalhe, desconto PIX automático (5%)
- **Cancelamento de venda** — ADMIN/MASTER, devolução automática de estoque
- **Recibo** — HTML para impressão via `GET /vendas/:id/recibo`
- **Movimentações** — ENTRADA, SAIDA, AJUSTE, PERDA, DEVOLUCAO; filtro por data
- **Fornecedores** — CRUD completo, validação de CNPJ, soft delete, vínculo na ENTRADA
- **Dashboard** — cards, estoque crítico, últimas vendas, gráfico 7 dias
- **Relatórios** — vendas, mais vendidos, produtos parados, posição de estoque; export CSV
- **Código de barras** — leitor USB HID e webcam integrados em produtos e nova venda

## Regras de negócio

### Estoque
- Nunca alterado diretamente — sempre via `Movimentacao`
- Ao criar produto com `estoqueInicial > 0` → cria movimentação `ENTRADA`
- Ao registrar venda → cria movimentação `SAIDA` por item
- Ao cancelar venda → cria movimentação `DEVOLUCAO` por item

### Status do estoque
| Condição                        | Badge          |
| ------------------------------- | -------------- |
| `estoqueAtual === 0`            | 🔴 SEM ESTOQUE |
| `estoqueAtual <= estoqueMinimo` | 🟠 BAIXO       |
| `estoqueAtual > estoqueMinimo`  | 🟢 OK          |

### SKU
- Gerado automaticamente: `{CATEGORIA}-{NNNNN}` (ex: `MOT-00042`)
- Categoria não pode ser alterada após criação

### Desconto PIX
- 5% automático ao selecionar PIX como forma de pagamento
- Pode ser desmarcado no momento da venda

---

<p align="center">
  Desenvolvido por <a href="https://nexogldigital.com.br"><strong>Nexo GL Digital</strong></a> — Sites · Sistemas · Dados
</p>
